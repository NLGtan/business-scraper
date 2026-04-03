from __future__ import annotations

import asyncio
from typing import List, Tuple

from app.core.config import get_settings
from app.models.place import BusinessRecord, PlaceDetails, PlaceSearchResult
from app.models.search import SearchRequest, SearchResponse
from app.services.places_service import PlacesService
from app.utils.normalization import (
    normalize_name_address,
    normalize_phone,
    normalize_website,
)


class SearchService:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.places_service = PlacesService()

    async def search(self, request: SearchRequest) -> SearchResponse:
        max_results = min(
            request.max_results or self.settings.default_max_results,
            self.settings.max_allowed_results,
        )
        query = f"{request.category} in {request.city}"

        warnings: List[str] = []
        search_hits = await self.places_service.search_text(query, max_results)

        if not search_hits:
            return SearchResponse(
                query=query,
                mode="live",
                category=request.category,
                city=request.city,
                total=0,
                records=[],
                warnings=["No businesses found for this query."],
            )

        details = await self._fetch_details(search_hits, warnings)
        records = self._build_records(details, request)

        return SearchResponse(
            query=query,
            mode="live",
            category=request.category,
            city=request.city,
            total=len(records),
            records=records,
            warnings=warnings,
        )

    async def _fetch_details(
        self,
        search_hits: List[PlaceSearchResult],
        warnings: List[str],
    ) -> List[Tuple[PlaceSearchResult, PlaceDetails]]:
        semaphore = asyncio.Semaphore(6)

        async def fetch_one(hit: PlaceSearchResult) -> Tuple[PlaceSearchResult, PlaceDetails] | None:
            async with semaphore:
                try:
                    detail = await self.places_service.get_place_details(hit.place_id)
                    return hit, detail
                except Exception as exc:  # noqa: BLE001
                    warnings.append(f"Failed to fetch details for {hit.place_id}: {exc}")
                    return None

        fetched = await asyncio.gather(*(fetch_one(hit) for hit in search_hits))
        return [item for item in fetched if item is not None]

    def _build_records(
        self,
        details: List[Tuple[PlaceSearchResult, PlaceDetails]],
        request: SearchRequest,
    ) -> List[BusinessRecord]:
        records: List[BusinessRecord] = []
        seen_place_ids: set[str] = set()
        seen_name_address: set[str] = set()

        for rank, (_, detail) in enumerate(details, start=1):
            place_id = detail.place_id
            name = detail.name
            address = detail.formatted_address
            unique_key = normalize_name_address(name, address)

            if place_id in seen_place_ids or unique_key in seen_name_address:
                continue

            seen_place_ids.add(place_id)
            seen_name_address.add(unique_key)

            website = normalize_website(detail.website)
            phone = normalize_phone(detail.phone or detail.international_phone)

            records.append(
                BusinessRecord(
                    place_id=place_id,
                    mode="live",
                    category=request.category,
                    city=request.city,
                    name=name,
                    address=address,
                    rating=detail.rating,
                    review_count=detail.user_ratings_total,
                    phone=detail.phone or detail.international_phone,
                    normalized_phone=phone,
                    website=detail.website,
                    normalized_website=website,
                    has_phone=bool(phone),
                    has_website=bool(website),
                    latitude=detail.latitude,
                    longitude=detail.longitude,
                    source="google_places_api",
                    search_metadata={
                        "query": f"{request.category} in {request.city}",
                        "rank": rank,
                    },
                    provider_data={
                        "google_maps_uri": str(detail.google_maps_uri) if detail.google_maps_uri else None,
                        "rating": detail.rating,
                        "user_ratings_total": detail.user_ratings_total,
                    },
                )
            )

        return records

