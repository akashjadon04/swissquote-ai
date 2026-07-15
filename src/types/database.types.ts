// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// AstraQuote (by Green AI Groupe) â€” Type Definitions
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Enums & Constants
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export type QuoteStatus = 'draft' | 'review' | 'finalized' | 'missing_items' | 'sent' | 'accepted' | 'invoiced';

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  draft: 'Brouillon',
  review: 'En rÃ©vision',
  finalized: 'FinalisÃ©',
  missing_items: 'Manque articles',
  sent: 'EnvoyÃ©',
  accepted: 'AcceptÃ©',
  invoiced: 'FacturÃ©',
};

export const CANTONS: Record<string, number> = {
  'Genève': 145,
  'Vaud': 138,
  'Valais': 125,
  'Fribourg': 132,
  'Neuchâtel': 135,
  'Jura': 128,
  'Berne': 140,
  'Zürich': 148,
  'Bâle': 142,
  'Lucerne': 136,
};

export const SUPPLIER_CODES = ['NSB', 'ST', 'GM', 'GEB'] as const;
export type SupplierCode = typeof SUPPLIER_CODES[number];

export const SUPPLIER_NAMES: Record<SupplierCode, string> = {
  NSB: 'Nussbaum',
  ST: 'Sanitas Troesch',
  GM: 'Getaz Miauton',
  GEB: 'Geberit',
};

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Database Models
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface Supplier {
  id: string;
  name: string;
  code: SupplierCode;
  ref_format: string;
  ref_example: string | null;
  active: boolean;
  created_at: string;
}

export interface CatalogueArticle {
  id: string;
  supplier_id: string;
  reference: string;
  description: string;
  specification: string | null;
  category: string | null;
  unit: string;
  unit_price: number;
  active: boolean;
  created_at: string;
  updated_at: string;
  // Structured Attributes for semantic matching
  attributes?: {
    diameter_mm?: number;
    capacity_l?: number;
    power_kw?: number;
    material?: string;
    dn?: number;
  };
  // Joined
  supplier?: Supplier;
}

export interface User {
  id: string;
  email: string;
  name: string;
  initials: string | null;
  role: 'technician' | 'admin';
  active: boolean;
  created_at: string;
}

export interface Client {
  id: string;
  name: string;
  address: string | null;
  postal_code: string | null;
  city: string | null;
  contact: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Configuration {
  id: string;
  key: string;
  value: unknown;
  description: string | null;
  updated_by: string | null;
  updated_at: string;
}

export interface InterventionType {
  id: string;
  code: string;
  label_fr: string;
  default_hours: number;
  description: string | null;
  active: boolean;
}

export interface QuoteTemplate {
  id: string;
  name: string;
  description: string | null;
  template_data: unknown;
  created_by: string | null;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface Quote {
  id: string;
  quote_number: string;
  status: QuoteStatus;
  created_by: string;
  client_id: string | null;
  client_name: string | null;
  client_address: string | null;
  client_postal: string | null;
  client_city: string | null;
  client_contact: string | null;
  building_address: string | null;
  apartment_zone: string | null;
  subject_line: string | null;
  original_description: string;
  ai_extraction: AIExtractionResult | null;
  ai_provider: string | null;
  intervention_type: string | null;
  technical_summary: string | null;
  ai_confidence: number | null;
  preferred_supplier: string | null;
  materials_subtotal: number | null;
  materials_margin_pct: number;
  materials_margin: number | null;
  labour_hours: number | null;
  labour_rate: number | null;
  labour_total: number | null;
  travel_fee: number | null;
  subtotal_excl_vat: number | null;
  vat_rate: number;
  vat_amount: number | null;
  total_incl_vat: number | null;
  canton: string;
  has_missing_items: boolean;
  exclusions: string[] | null;
  company_name: string | null;
  company_address: string | null;
  technician_name: string | null;
  version: number;
  template_id: string | null;
  created_at: string;
  updated_at: string;
  finalized_at: string | null;
  // Relations
  sections?: QuoteSection[];
  items?: QuoteItem[];
}

export interface QuoteSection {
  id: string;
  quote_id: string;
  parent_id: string | null;
  section_code: string | null;
  section_label: string | null;
  description: string | null;
  sort_order: number;
  // Nested
  items?: QuoteItem[];
  children?: QuoteSection[];
}

export interface QuoteItem {
  id: string;
  quote_id: string;
  section_id: string | null;
  catalogue_article_id: string | null;
  supplier_id: string | null;
  reference: string | null;
  description: string;
  specification: string | null;
  quantity: number;
  unit: string;
  unit_price: number | null;
  line_total: number | null;
  ai_label: string | null;
  ai_confidence: number | null;
  matched_text_start: number | null;
  matched_text_end: number | null;
  is_missing: boolean;
  is_manually_added: boolean;
  is_estimate: boolean;
  sort_order: number;
  created_at: string;
  // Joined
  supplier?: Supplier;
  catalogue_article?: CatalogueArticle;
}

export interface QuoteVersion {
  id: string;
  quote_id: string;
  version: number;
  snapshot: unknown;
  created_by: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  entity_type: string;
  entity_id: string | null;
  action: string;
  actor_id: string | null;
  diff: unknown | null;
  meta: unknown | null;
  created_at: string;
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// AI Extraction Types
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface AIArticle {
  label: string;
  category?: string;
  quantity: number | null;
  unit: string | null;
  needs_site_measurement?: boolean;
  is_estimate?: boolean;
  // Category resolved during matching (set by catalogue-matcher)
  resolvedCategory?: string;
}

export interface AISection {
  section_label: string;
  description_verbatim: string;
  articles: AIArticle[];
}

export interface AIExtractionResult {
  sections: AISection[];
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Catalogue Matching Types
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface MatchedArticle {
  aiArticle: AIArticle;
  catalogueArticle: CatalogueArticle;
  matchConfidence: number;
  supplierCode: SupplierCode;
}

export interface MissingArticle {
  aiArticle: AIArticle;
  reason: string;
  suggestions: CatalogueArticle[];
}

export interface MatchResult {
  matched: MatchedArticle[];
  missing: MissingArticle[];
  totalArticles: number;
  matchRate: number;
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Financial Types
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface FinancialSummary {
  materialsSubtotal: number;
  materialsMarginPct: number;
  materialsMargin: number;
  labourHours: number;
  labourRate: number;
  labourTotal: number;
  travelFee: number;
  subtotalExclVat: number;
  vatRate: number;
  vatAmount: number;
  totalInclVat: number;
}

export interface QuoteConfig {
  labourRate: number;
  labourHours: number;
  marginPct: number;
  vatRate: number;
  travelFee: number;
  canton: string;
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// API Request/Response Types
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface AIExtractRequest {
  description: string;
}

export interface AIExtractResponse {
  extraction: AIExtractionResult;
  provider: 'gemini' | 'openrouter';
  processingTimeMs: number;
}

export interface CatalogueMatchRequest {
  articles: AIArticle[];
  preferredSupplier?: SupplierCode;
}

export interface CatalogueMatchResponse {
  result: MatchResult;
}

export interface CreateQuoteRequest {
  description: string;
  clientId?: string;
  clientName?: string;
  clientAddress?: string;
  clientPostal?: string;
  clientCity?: string;
  clientContact?: string;
  buildingAddress?: string;
  apartmentZone?: string;
  subjectLine?: string;
  canton?: string;
  preferredSupplier?: SupplierCode;
}

export interface QuoteListFilters {
  status?: QuoteStatus;
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'created_at' | 'quote_number' | 'total_incl_vat';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

