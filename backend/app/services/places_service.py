from __future__ import annotations

from typing import List, Optional

import httpx
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from app.core.config import get_settings
from app.models.place import PlaceDetails, PlaceSearchResult
from app.models.search import LocationSuggestion
from app.utils.errors import PlacesAPIError, PlacesAuthError, PlacesQuotaError

PLACES_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText"
PLACES_DETAILS_URL = "https://places.googleapis.com/v1/places/{place_id}"
PLACES_AUTOCOMPLETE_URL = "https://places.googleapis.com/v1/places:autocomplete"
RETRY_ATTEMPTS = get_settings().max_retry_attempts


class PlacesService:
    def __init__(self) -> None:
        self.settings = get_settings()

    @retry(
        stop=stop_after_attempt(RETRY_ATTEMPTS),
        wait=wait_exponential(multiplier=0.5, min=0.5, max=4),
        retry=retry_if_exception_type((httpx.RequestError, httpx.TimeoutException)),
        reraise=True,
    )
    async def _request(
        self,
        method: str,
        url: str,
        *,
        field_mask: str,
        json_payload: Optional[dict] = None,
    ) -> dict:
        api_key = self.settings.google_maps_api_key
        if not api_key:
            raise PlacesAuthError("GOOGLE_MAPS_API_KEY is missing.")

        headers = {
            "X-Goog-Api-Key": api_key,
            "X-Goog-FieldMask": field_mask,
            "Content-Type": "application/json",
        }

        async with httpx.AsyncClient(timeout=self.settings.request_timeout_seconds) as client:
            response = await client.request(
                method,
                url,
                headers=headers,
                json=json_payload,
            )

        if response.status_code in (401, 403):
            raise PlacesAuthError(
                "Google Places API rejected the request. Check API key and permissions."
            )
        if response.status_code == 429:
            raise PlacesQuotaError("Google Places API quota exceeded.")
        if response.status_code >= 400:
            raise PlacesAPIError(
                f"Places API error ({response.status_code}): {response.text[:300]}"
            )

        return response.json()

    async def search_text(self, query: str, max_results: int) -> List[PlaceSearchResult]:
        collected: List[PlaceSearchResult] = []
        next_page_token: Optional[str] = None

        while len(collected) < max_results:
            page_size = min(20, max_results - len(collected))
            payload = {"textQuery": query, "pageSize": page_size}
            if next_page_token:
                payload["pageToken"] = next_page_token

            data = await self._request(
                "POST",
                PLACES_SEARCH_URL,
                field_mask=(
                    "places.id,places.name,places.displayName,places.formattedAddress,"
                    "places.rating,places.userRatingCount,nextPageToken"
                ),
                json_payload=payload,
            )

            places = data.get("places", [])
            if not places:
                break

            for place in places:
                place_id = place.get("id")
                if not place_id:
                    resource_name = place.get("name", "")
                    if resource_name.startswith("places/"):
                        place_id = resource_name.split("/", 1)[1]
                    else:
                        continue

                display_name = place.get("displayName", {})
                name_text = display_name.get("text") if isinstance(display_name, dict) else None

                collected.append(
                    PlaceSearchResult(
                        place_id=place_id,
                        name=name_text or "Unknown",
                        formatted_address=place.get("formattedAddress", ""),
                        rating=place.get("rating"),
                        user_ratings_total=place.get("userRatingCount"),
                    )
                )

                if len(collected) >= max_results:
                    break

            next_page_token = data.get("nextPageToken")
            if not next_page_token:
                break

        return collected[:max_results]

    async def get_place_details(self, place_id: str) -> PlaceDetails:
        data = await self._request(
            "GET",
            PLACES_DETAILS_URL.format(place_id=place_id),
            field_mask=(
                "id,name,displayName,formattedAddress,nationalPhoneNumber,"
                "internationalPhoneNumber,websiteUri,rating,userRatingCount,location,"
                "googleMapsUri"
            ),
        )

        location = data.get("location", {}) if isinstance(data, dict) else {}
        display_name = data.get("displayName", {}) if isinstance(data, dict) else {}

        name_text = display_name.get("text") if isinstance(display_name, dict) else None

        return PlaceDetails(
            place_id=data.get("id", place_id),
            name=name_text or "Unknown",
            formatted_address=data.get("formattedAddress", ""),
            phone=data.get("nationalPhoneNumber"),
            international_phone=data.get("internationalPhoneNumber"),
            website=data.get("websiteUri"),
            rating=data.get("rating"),
            user_ratings_total=data.get("userRatingCount"),
            latitude=location.get("latitude"),
            longitude=location.get("longitude"),
            google_maps_uri=data.get("googleMapsUri"),
        )

    async def autocomplete_locations(self, query: str, max_results: int = 8) -> List[LocationSuggestion]:
        payload = {
            "input": query,
            "includeQueryPredictions": False,
        }

        data = await self._request(
            "POST",
            PLACES_AUTOCOMPLETE_URL,
            field_mask=(
                "suggestions.placePrediction.placeId,"
                "suggestions.placePrediction.text,"
                "suggestions.placePrediction.structuredFormat"
            ),
            json_payload=payload,
        )

        suggestions = data.get("suggestions", [])
        parsed: List[LocationSuggestion] = []
        seen: set[str] = set()

        for item in suggestions:
            prediction = item.get("placePrediction", {})
            if not isinstance(prediction, dict):
                continue

            text_value = prediction.get("text", {})
            main_text = text_value.get("text") if isinstance(text_value, dict) else None
            if not main_text:
                structured = prediction.get("structuredFormat", {})
                if isinstance(structured, dict):
                    primary = structured.get("mainText", {})
                    secondary = structured.get("secondaryText", {})
                    primary_text = primary.get("text") if isinstance(primary, dict) else ""
                    secondary_text = secondary.get("text") if isinstance(secondary, dict) else ""
                    if primary_text and secondary_text:
                        main_text = f"{primary_text}, {secondary_text}"
                    else:
                        main_text = primary_text or secondary_text

            if not main_text:
                continue

            normalized = main_text.strip().lower()
            if not normalized or normalized in seen:
                continue

            seen.add(normalized)
            parsed.append(
                LocationSuggestion(
                    text=main_text.strip(),
                    place_id=prediction.get("placeId"),
                )
            )

            if len(parsed) >= max_results:
                break

        return parsed

