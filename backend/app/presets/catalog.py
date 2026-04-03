from __future__ import annotations

import random
from typing import Dict, List

BUSINESS_CATEGORIES: List[str] = [
    "Dental Clinic",
    "Restaurant",
    "Coffee Shop",
    "Gym",
    "Real Estate Agency",
    "Salon",
    "Spa",
    "Veterinary Clinic",
    "Car Repair Shop",
    "Law Firm",
    "Accounting Firm",
    "Marketing Agency",
    "Insurance Agency",
    "Pharmacy",
    "Hotel",
    "Resort",
    "Coworking Space",
    "Printing Shop",
    "Hardware Store",
    "Construction Company",
    "Laundry Service",
]

CITY_PRESETS: List[str] = [
    "New York, NY",
    "Los Angeles, CA",
    "Chicago, IL",
    "Houston, TX",
    "Miami, FL",
    "Seattle, WA",
    "Austin, TX",
    "Denver, CO",
    "Phoenix, AZ",
    "San Diego, CA",
    "Boston, MA",
    "Atlanta, GA",
    "Dallas, TX",
    "Portland, OR",
    "San Francisco, CA",
]


def get_business_categories() -> List[str]:
    return BUSINESS_CATEGORIES.copy()


def get_city_presets() -> List[str]:
    return CITY_PRESETS.copy()


def get_random_search_preset() -> Dict[str, str]:
    return {
        "category": random.choice(BUSINESS_CATEGORIES),
        "city": random.choice(CITY_PRESETS),
    }

