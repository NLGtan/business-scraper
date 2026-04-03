from app.models.export import ExportRequest
from app.services.export_service import ExportService


def test_live_json_export_separates_provider_data() -> None:
    service = ExportService()
    request = ExportRequest(
        mode="live",
        query="Coffee Shop in Seattle, WA",
        category="Coffee Shop",
        city="Seattle, WA",
        records=[
            {
                "place_id": "abc123",
                "search_metadata": {"rank": 1},
                "user_notes": "Follow up next week",
                "enrichment": {"summary": "Strong storefront", "lead_quality_score": 8},
                "provider_data": {"rating": 4.8},
            }
        ],
    )

    result = service.build_json(request)

    assert result.total == 1
    assert result.payload["records"][0]["place_id"] == "abc123"
    assert result.payload["provider_data"][0]["provider_data"]["rating"] == 4.8

