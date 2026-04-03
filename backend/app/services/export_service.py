from __future__ import annotations

import json
from datetime import datetime, timezone
from io import StringIO
from typing import Any, Dict, List

import pandas as pd

from app.models.export import ExportJsonResponse, ExportRequest


class ExportService:
    def build_csv(self, request: ExportRequest) -> str:
        frame = pd.DataFrame(self._shape_live_rows(request))

        if frame.empty:
            frame = pd.DataFrame([{"message": "No records selected."}])

        buffer = StringIO()
        frame.to_csv(buffer, index=False)
        return buffer.getvalue()

    def build_json(self, request: ExportRequest) -> ExportJsonResponse:
        exported_at = datetime.now(timezone.utc).isoformat()

        records: List[Dict[str, Any]] = []
        provider_data: List[Dict[str, Any]] = []

        for record in request.records:
            records.append(
                {
                    "place_id": record.get("place_id"),
                    "search_metadata": {
                        "query": request.query,
                        "category": request.category,
                        "city": request.city,
                        "record_rank": record.get("search_metadata", {}).get("rank"),
                    },
                    "user_notes": record.get("user_notes"),
                    "ai_enrichment": record.get("enrichment", {}),
                }
            )
            provider_data.append(
                {
                    "place_id": record.get("place_id"),
                    "provider_data": record.get("provider_data", {}),
                }
            )

        payload: Dict[str, Any] = {
            "query": request.query,
            "category": request.category,
            "city": request.city,
            "records": records,
            "provider_data": provider_data,
        }

        return ExportJsonResponse(
            mode=request.mode,
            total=len(request.records),
            exported_at=exported_at,
            payload=payload,
        )

    def _shape_live_rows(self, request: ExportRequest) -> List[Dict[str, Any]]:
        rows: List[Dict[str, Any]] = []

        for record in request.records:
            enrichment = record.get("enrichment", {})
            rows.append(
                {
                    "place_id": record.get("place_id"),
                    "query": request.query,
                    "category": request.category,
                    "city": request.city,
                    "record_rank": record.get("search_metadata", {}).get("rank"),
                    "user_notes": record.get("user_notes", ""),
                    "enrichment_summary": enrichment.get("summary", ""),
                    "enrichment_target_customer": enrichment.get("likely_target_customer", ""),
                    "enrichment_lead_quality_score": enrichment.get("lead_quality_score", ""),
                    "enrichment_outreach_angle": enrichment.get("outreach_angle", ""),
                    "enrichment_first_contact_message": enrichment.get("first_contact_message", ""),
                    "provider_data": json.dumps(record.get("provider_data", {}), ensure_ascii=True),
                }
            )

        return rows

