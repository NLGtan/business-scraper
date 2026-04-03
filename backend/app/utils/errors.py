from __future__ import annotations


class PlacesAPIError(Exception):
    """Raised when Google Places API calls fail."""


class PlacesQuotaError(PlacesAPIError):
    """Raised when API quota is exceeded."""


class PlacesAuthError(PlacesAPIError):
    """Raised when API key is invalid or missing."""

