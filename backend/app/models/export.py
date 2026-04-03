from __future__ import annotations

from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field

ExportMode = Literal["live"]


class ExportRequest(BaseModel):
    mode: ExportMode
    query: str
    category: str
    city: str
    records: List[Dict[str, Any]] = Field(default_factory=list)


class ExportJsonResponse(BaseModel):
    mode: ExportMode
    total: int
    exported_at: str
    payload: Dict[str, Any]


class ExportSheetsRequest(ExportRequest):
    spreadsheet_name: Optional[str] = "Business Discovery Export"
    worksheet_name: Optional[str] = "Leads"


class ExportSheetsResponse(BaseModel):
    success: bool
    message: str
    destination_url: Optional[str] = None

