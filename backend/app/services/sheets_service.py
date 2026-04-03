from __future__ import annotations

from typing import Any, Dict

import httpx

from app.core.config import get_settings
from app.models.export import ExportSheetsRequest, ExportSheetsResponse


class SheetsService:
    def __init__(self) -> None:
        self.settings = get_settings()

    async def push(self, request: ExportSheetsRequest) -> ExportSheetsResponse:
        webhook_url = self.settings.google_sheets_webhook_url
        if not webhook_url:
            return ExportSheetsResponse(
                success=False,
                message=(
                    "Google Sheets export is not configured. Set GOOGLE_SHEETS_WEBHOOK_URL "
                    "to an Apps Script webhook URL."
                ),
            )

        payload: Dict[str, Any] = {
            "spreadsheet_name": request.spreadsheet_name,
            "worksheet_name": request.worksheet_name,
            "mode": request.mode,
            "query": request.query,
            "category": request.category,
            "city": request.city,
            "records": request.records,
        }

        async with httpx.AsyncClient(timeout=self.settings.request_timeout_seconds) as client:
            response = await client.post(webhook_url, json=payload)

        if response.status_code >= 400:
            return ExportSheetsResponse(
                success=False,
                message=f"Sheets webhook returned {response.status_code}.",
            )

        destination_url = None
        try:
            body = response.json()
            destination_url = body.get("spreadsheet_url")
        except Exception:  # noqa: BLE001
            destination_url = None

        return ExportSheetsResponse(
            success=True,
            message="Rows sent to Google Sheets webhook successfully.",
            destination_url=destination_url,
        )

