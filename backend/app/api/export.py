from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, HTTPException
from fastapi.responses import Response

from app.models.export import (
    ExportJsonResponse,
    ExportRequest,
    ExportSheetsRequest,
    ExportSheetsResponse,
)
from app.services.export_service import ExportService
from app.services.sheets_service import SheetsService

router = APIRouter()
export_service = ExportService()
sheets_service = SheetsService()


@router.post("/export/json", response_model=ExportJsonResponse)
async def export_json(payload: ExportRequest) -> ExportJsonResponse:
    if not payload.records:
        raise HTTPException(status_code=400, detail="No records were provided for export.")
    return export_service.build_json(payload)


@router.post("/export/csv")
async def export_csv(payload: ExportRequest) -> Response:
    if not payload.records:
        raise HTTPException(status_code=400, detail="No records were provided for export.")

    csv_content = export_service.build_csv(payload)
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    filename = f"business_discovery_{payload.mode}_{timestamp}.csv"

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/export/sheets", response_model=ExportSheetsResponse)
async def export_sheets(payload: ExportSheetsRequest) -> ExportSheetsResponse:
    if not payload.records:
        raise HTTPException(status_code=400, detail="No records were provided for export.")

    return await sheets_service.push(payload)

