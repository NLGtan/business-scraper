from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.models.enrich import EnrichRequest, EnrichResponse
from app.services.enrichment_service import EnrichmentService

router = APIRouter()
enrichment_service = EnrichmentService()


@router.post("/enrich", response_model=EnrichResponse)
async def enrich_businesses(payload: EnrichRequest) -> EnrichResponse:
    if not payload.records:
        raise HTTPException(status_code=400, detail="At least one business record is required.")

    try:
        return await enrichment_service.enrich(payload)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"Enrichment failed: {exc}") from exc

