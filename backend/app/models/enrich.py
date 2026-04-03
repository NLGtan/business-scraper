from __future__ import annotations

from typing import List

from pydantic import BaseModel, Field

from app.models.place import BusinessRecord, EnrichedBusinessRecord


class EnrichRequest(BaseModel):
    records: List[BusinessRecord] = Field(default_factory=list)
    include_website_scan: bool = True


class EnrichResponse(BaseModel):
    total: int
    enriched_records: List[EnrichedBusinessRecord]
    warnings: List[str] = Field(default_factory=list)

