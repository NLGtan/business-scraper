from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, HttpUrl


class PlaceSearchResult(BaseModel):
    place_id: str
    name: str
    formatted_address: str
    rating: Optional[float] = None
    user_ratings_total: Optional[int] = None


class PlaceDetails(BaseModel):
    place_id: str
    name: str
    formatted_address: str
    phone: Optional[str] = None
    international_phone: Optional[str] = None
    website: Optional[str] = None
    rating: Optional[float] = None
    user_ratings_total: Optional[int] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    google_maps_uri: Optional[HttpUrl] = None


class BusinessRecord(BaseModel):
    place_id: str
    mode: str
    category: str
    city: str
    name: str
    address: str
    rating: Optional[float] = None
    review_count: Optional[int] = None
    phone: Optional[str] = None
    normalized_phone: Optional[str] = None
    website: Optional[str] = None
    normalized_website: Optional[str] = None
    has_phone: bool = False
    has_website: bool = False
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    source: str = "google_places_api"
    search_metadata: Dict[str, Any] = Field(default_factory=dict)
    provider_data: Dict[str, Any] = Field(default_factory=dict)
    user_notes: Optional[str] = None


class EnrichmentData(BaseModel):
    summary: str
    likely_target_customer: str
    lead_quality_score: int = Field(ge=1, le=10)
    outreach_angle: str
    first_contact_message: str
    extracted_emails: List[str] = Field(default_factory=list)
    extracted_social_links: List[str] = Field(default_factory=list)
    extracted_phone_numbers: List[str] = Field(default_factory=list)
    website_scan_status: str = "not_scanned"


class EnrichedBusinessRecord(BusinessRecord):
    enrichment: EnrichmentData

