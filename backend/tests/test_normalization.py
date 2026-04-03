from app.utils.normalization import normalize_name_address, normalize_phone, normalize_website


def test_normalize_phone() -> None:
    assert normalize_phone("+1 (415) 555-1212") == "+14155551212"


def test_normalize_website() -> None:
    assert normalize_website("Example.com/") == "https://example.com"


def test_normalize_name_address() -> None:
    assert (
        normalize_name_address("  Demo Business ", " 123 Main St, City ")
        == "demo business|123 main st, city"
    )

