export type SearchMode = "live";
export type CategoryInputMode = "list" | "custom";

export interface BusinessRecord {
  place_id: string;
  mode: SearchMode;
  category: string;
  city: string;
  name: string;
  address: string;
  rating?: number | null;
  review_count?: number | null;
  phone?: string | null;
  normalized_phone?: string | null;
  website?: string | null;
  normalized_website?: string | null;
  has_phone: boolean;
  has_website: boolean;
  latitude?: number | null;
  longitude?: number | null;
  source: string;
  search_metadata: Record<string, unknown>;
  provider_data: Record<string, unknown>;
  user_notes?: string | null;
}

export interface EnrichmentData {
  summary: string;
  likely_target_customer: string;
  lead_quality_score: number;
  outreach_angle: string;
  first_contact_message: string;
  extracted_emails: string[];
  extracted_social_links: string[];
  extracted_phone_numbers: string[];
  website_scan_status: string;
}

export interface EnrichedBusinessRecord extends BusinessRecord {
  enrichment: EnrichmentData;
}

export interface SearchPreset {
  categories: string[];
  cities: string[];
}

export interface LocationSuggestion {
  text: string;
  place_id?: string | null;
}

export interface LocationSuggestionResponse {
  query: string;
  suggestions: LocationSuggestion[];
  warnings: string[];
}

export interface SearchRequest {
  category_input_mode: CategoryInputMode;
  category: string;
  city: string;
  max_results?: number;
}

export interface SearchResponse {
  query: string;
  mode: SearchMode;
  category: string;
  city: string;
  total: number;
  records: BusinessRecord[];
  warnings: string[];
}

export interface RandomSearchResponse {
  random_category: string;
  random_city: string;
  search_response: SearchResponse;
}

export interface EnrichResponse {
  total: number;
  enriched_records: EnrichedBusinessRecord[];
  warnings: string[];
}

export interface ExportJsonResponse {
  mode: SearchMode;
  total: number;
  exported_at: string;
  payload: Record<string, unknown>;
}
