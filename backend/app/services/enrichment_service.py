from __future__ import annotations

import asyncio
from typing import List

import httpx

from app.core.config import get_settings
from app.models.enrich import EnrichRequest, EnrichResponse
from app.models.place import BusinessRecord, EnrichedBusinessRecord, EnrichmentData
from app.utils.web_extract import extract_contact_signals


class EnrichmentService:
    def __init__(self) -> None:
        self.settings = get_settings()

    async def enrich(self, request: EnrichRequest) -> EnrichResponse:
        warnings: List[str] = []
        semaphore = asyncio.Semaphore(5)

        async def enrich_one(record: BusinessRecord) -> EnrichedBusinessRecord:
            async with semaphore:
                return await self._enrich_record(record, request.include_website_scan, warnings)

        enriched = await asyncio.gather(*(enrich_one(record) for record in request.records))

        return EnrichResponse(
            total=len(enriched),
            enriched_records=enriched,
            warnings=warnings,
        )

    async def _enrich_record(
        self,
        record: BusinessRecord,
        include_website_scan: bool,
        warnings: List[str],
    ) -> EnrichedBusinessRecord:
        signals = {
            "emails": [],
            "phones": [],
            "social_links": [],
            "snippet": "",
        }
        website_status = "not_scanned"

        if include_website_scan:
            if record.normalized_website:
                try:
                    async with httpx.AsyncClient(timeout=self.settings.request_timeout_seconds) as client:
                        response = await client.get(record.normalized_website)
                        response.raise_for_status()
                    signals = extract_contact_signals(response.text, record.normalized_website)
                    website_status = "success"
                except Exception as exc:  # noqa: BLE001
                    website_status = "error"
                    warnings.append(f"Website scan failed for {record.name}: {exc}")
            else:
                website_status = "no_website"

        lead_score = self._lead_score(record, signals)
        enrichment = EnrichmentData(
            summary=self._summary(record, signals),
            likely_target_customer=self._target_customer(record),
            lead_quality_score=lead_score,
            outreach_angle=self._outreach_angle(record, signals),
            first_contact_message=self._first_contact_message(record),
            extracted_emails=signals["emails"],
            extracted_social_links=signals["social_links"],
            extracted_phone_numbers=signals["phones"],
            website_scan_status=website_status,
        )

        return EnrichedBusinessRecord(**record.model_dump(), enrichment=enrichment)

    def _lead_score(self, record: BusinessRecord, signals: dict) -> int:
        score = 4

        if record.rating is not None:
            score += 2 if record.rating >= 4.5 else 1 if record.rating >= 4.0 else 0

        if record.review_count is not None:
            score += 2 if record.review_count >= 100 else 1 if record.review_count >= 20 else 0

        if record.has_website:
            score += 1
        if record.has_phone:
            score += 1
        if signals.get("emails"):
            score += 1

        return max(1, min(10, score))

    def _summary(self, record: BusinessRecord, signals: dict) -> str:
        credibility = "strong" if (record.rating or 0) >= 4.3 else "growing"
        web_presence = "active web presence" if record.has_website else "limited web presence"
        snippet = signals.get("snippet", "")
        snippet_phrase = (
            f" Website messaging highlights: {snippet[:140]}..."
            if snippet
            else ""
        )
        return (
            f"{record.name} appears to be a {credibility} {record.category.lower()} in {record.city} "
            f"with {web_presence}.{snippet_phrase}"
        )

    def _target_customer(self, record: BusinessRecord) -> str:
        lower = record.category.lower()
        if any(word in lower for word in ("clinic", "dental", "veterinary", "pharmacy", "spa", "salon")):
            return "Local residents searching for trusted recurring care and convenience."
        if any(word in lower for word in ("law", "accounting", "insurance", "agency")):
            return "Small-to-mid-sized businesses or households looking for professional guidance."
        if any(word in lower for word in ("restaurant", "coffee", "hotel", "resort")):
            return "Nearby consumers and travelers comparing ratings, availability, and service speed."
        return "Neighborhood customers and local businesses seeking reliable service providers."

    def _outreach_angle(self, record: BusinessRecord, signals: dict) -> str:
        if record.has_website and signals.get("emails"):
            return "Lead with conversion-focused website and email workflow optimization."
        if record.has_website:
            return "Lead with local search visibility improvements and conversion tracking setup."
        return "Lead with digital presence setup to capture local demand and improve discoverability."

    def _first_contact_message(self, record: BusinessRecord) -> str:
        return (
            f"Hi {record.name} team, I noticed your {record.category.lower()} presence in {record.city}. "
            "I mapped a few quick opportunities to improve local discovery and inbound lead quality. "
            "Would you be open to a short 15-minute walkthrough this week?"
        )

