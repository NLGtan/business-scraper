from app.presets.catalog import (
    BUSINESS_CATEGORIES,
    CITY_PRESETS,
    get_business_categories,
    get_city_presets,
    get_random_search_preset,
)


def test_presets_return_expected_collections() -> None:
    categories = get_business_categories()
    cities = get_city_presets()

    assert categories == BUSINESS_CATEGORIES
    assert cities == CITY_PRESETS


def test_random_search_preset_uses_known_values() -> None:
    preset = get_random_search_preset()
    assert preset["category"] in BUSINESS_CATEGORIES
    assert preset["city"] in CITY_PRESETS

