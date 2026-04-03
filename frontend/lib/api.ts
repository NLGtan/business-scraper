import {
  type BusinessRecord,
  type EnrichResponse,
  type ExportJsonResponse,
  type LocationSuggestionResponse,
  type RandomSearchResponse,
  type SearchPreset,
  type SearchRequest,
  type SearchResponse,
} from "@/types/business";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const fallback = `Request failed (${response.status})`;
    let detail = fallback;
    try {
      const payload = (await response.json()) as { detail?: string };
      detail = payload.detail ?? fallback;
    } catch {
      detail = fallback;
    }
    throw new Error(detail);
  }

  return (await response.json()) as T;
}

export function getPresets() {
  return request<SearchPreset>("/api/presets", { method: "GET" });
}

export function getLocationSuggestions(query: string, limit = 8) {
  const params = new URLSearchParams({
    q: query,
    limit: String(limit),
  });
  return request<LocationSuggestionResponse>(`/api/location-suggestions?${params.toString()}`, {
    method: "GET",
  });
}

export function searchBusinesses(payload: SearchRequest) {
  return request<SearchResponse>("/api/search", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function randomSearch(maxResults: number) {
  return request<RandomSearchResponse>("/api/random-search", {
    method: "POST",
    body: JSON.stringify({ max_results: maxResults }),
  });
}

export function enrichBusinesses(records: BusinessRecord[], includeWebsiteScan = true) {
  return request<EnrichResponse>("/api/enrich", {
    method: "POST",
    body: JSON.stringify({ records, include_website_scan: includeWebsiteScan }),
  });
}

export function exportJson(
  query: string,
  category: string,
  city: string,
  records: (BusinessRecord | Record<string, unknown>)[],
) {
  return request<ExportJsonResponse>("/api/export/json", {
    method: "POST",
    body: JSON.stringify({ mode: "live", query, category, city, records }),
  });
}

export async function exportCsv(
  query: string,
  category: string,
  city: string,
  records: (BusinessRecord | Record<string, unknown>)[],
) {
  const response = await fetch(`${API_BASE}/api/export/csv`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ mode: "live", query, category, city, records }),
  });

  if (!response.ok) {
    throw new Error(`CSV export failed (${response.status})`);
  }

  const blob = await response.blob();
  const contentDisposition = response.headers.get("content-disposition") ?? "";
  const filenameMatch = contentDisposition.match(/filename=\"([^\"]+)\"/);

  return {
    blob,
    filename: filenameMatch?.[1] ?? "business_discovery_export.csv",
  };
}

export async function pushToSheets(
  query: string,
  category: string,
  city: string,
  records: (BusinessRecord | Record<string, unknown>)[],
) {
  return request<{ success: boolean; message: string; destination_url?: string }>(
    "/api/export/sheets",
    {
      method: "POST",
      body: JSON.stringify({ mode: "live", query, category, city, records }),
    },
  );
}
