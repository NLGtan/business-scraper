from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from app.models.search import (
    LocationSuggestionResponse,
    RandomSearchRequest,
    RandomSearchResponse,
    SearchPreset,
    SearchRequest,
    SearchResponse,
)
from app.presets.catalog import (
    get_business_categories,
    get_city_presets,
    get_random_search_preset,
)
from app.services.places_service import PlacesService
from app.services.search_service import SearchService
from app.utils.errors import PlacesAPIError, PlacesAuthError, PlacesQuotaError

router = APIRouter()
search_service = SearchService()
places_service = PlacesService()


@router.get("/presets", response_model=SearchPreset)
async def get_presets() -> SearchPreset:
    return SearchPreset(
        categories=get_business_categories(),
        cities=get_city_presets(),
    )


@router.post("/search", response_model=SearchResponse)
async def search_businesses(payload: SearchRequest) -> SearchResponse:
    try:
        return await search_service.search(payload)
    except PlacesAuthError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc
    except PlacesQuotaError as exc:
        raise HTTPException(status_code=429, detail=str(exc)) from exc
    except PlacesAPIError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"Unexpected search error: {exc}") from exc


@router.post("/random-search", response_model=RandomSearchResponse)
async def random_search(payload: RandomSearchRequest) -> RandomSearchResponse:
    preset = get_random_search_preset()
    request = SearchRequest(
        category_input_mode="list",
        category=preset["category"],
        city=preset["city"],
        max_results=payload.max_results,
    )

    try:
        response = await search_service.search(request)
    except PlacesAuthError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc
    except PlacesQuotaError as exc:
        raise HTTPException(status_code=429, detail=str(exc)) from exc
    except PlacesAPIError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"Unexpected search error: {exc}") from exc

    return RandomSearchResponse(
        random_category=preset["category"],
        random_city=preset["city"],
        search_response=response,
    )


@router.get("/location-suggestions", response_model=LocationSuggestionResponse)
async def location_suggestions(
    q: str = Query(min_length=1, max_length=120),
    limit: int = Query(default=8, ge=1, le=10),
) -> LocationSuggestionResponse:
    warnings: list[str] = []

    try:
        suggestions = await places_service.autocomplete_locations(q, limit)
        return LocationSuggestionResponse(query=q, suggestions=suggestions, warnings=warnings)
    except (PlacesAuthError, PlacesQuotaError, PlacesAPIError) as exc:
        warnings.append(str(exc))
    except Exception as exc:  # noqa: BLE001
        warnings.append(f"Location suggestion lookup failed: {exc}")

    fallback = [city for city in get_city_presets() if q.lower() in city.lower()][:limit]
    return LocationSuggestionResponse(
        query=q,
        suggestions=[{"text": city} for city in fallback],
        warnings=warnings,
    )

