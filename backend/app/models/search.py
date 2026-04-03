from __future__ import annotations

from typing import List, Literal, Optional

from pydantic import BaseModel, Field

from app.models.place import BusinessRecord

SearchMode = Literal["live"]
CategoryInputMode = Literal["list", "custom"]


class SearchPreset(BaseModel):
    categories: List[str]
    cities: List[str]


class SearchRequest(BaseModel):
    mode: SearchMode = "live"
    category_input_mode: CategoryInputMode = "list"
    category: str = Field(min_length=1, max_length=120)
    city: str = Field(min_length=1, max_length=120)
    max_results: Optional[int] = Field(default=20, ge=1, le=100)


class RandomSearchRequest(BaseModel):
    max_results: Optional[int] = Field(default=20, ge=1, le=100)


class SearchResponse(BaseModel):
    query: str
    mode: SearchMode
    category: str
    city: str
    total: int
    records: List[BusinessRecord]
    warnings: List[str] = Field(default_factory=list)


class RandomSearchResponse(BaseModel):
    random_category: str
    random_city: str
    search_response: SearchResponse


class LocationSuggestion(BaseModel):
    text: str
    place_id: Optional[str] = None


class LocationSuggestionResponse(BaseModel):
    query: str
    suggestions: List[LocationSuggestion] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)

