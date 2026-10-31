export type UserRole = 'admin' | 'inspector' | 'reviewer';

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: UserRole;
  department?: string;
  badge_number?: string;
  is_active: boolean;
  created_at?: string;
}

export type ComplianceStatus = 'COMPLIANT' | 'NON_COMPLIANT' | 'NEEDS_REVIEW' | 'NOT_APPLICABLE';

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  char_height_px?: number;
  readability_score?: string;
}

export interface OCRWord {
  text: string;
  confidence: number;
  bounding_box?: BoundingBox;
}

export interface OCRLine {
  text: string;
  confidence: number;
  bounding_box?: BoundingBox;
  words?: OCRWord[];
}

export interface DeclarationItem {
  id?: number;
  declaration_key: string;
  label: string;
  raw_value?: string | null;
  normalized_value?: string | null;
  confidence: number;
  bounding_box?: BoundingBox | null;
  readability_score?: string;
  is_manually_corrected?: boolean;
  corrected_value?: string | null;
  corrected_by?: string | null;
  corrected_at?: string | null;
}

export interface ComplianceResultItem {
  id?: number;
  rule_id: string;
  rule_name: string;
  legal_reference: string;
  required_declaration: string;
  extracted_value?: string | null;
  status: ComplianceStatus;
  evidence_reason: string;
  confidence: number;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  requires_human_review: boolean;
  evidence_bounding_box?: BoundingBox | null;
}

export interface Product {
  id?: number;
  name: string;
  brand: string;
  category: string;
  subcategory?: string;
  declared_net_quantity?: string | null;
  declared_mrp?: number | null;
  country_of_origin?: string;
  inspections_count?: number;
  latest_inspection_id?: string;
  latest_status?: ComplianceStatus | string;
  created_at?: string;
}

export interface UploadedImage {
  id: number;
  file_path: string;
  preprocessed_path?: string | null;
  label_type: string;
  width: number;
  height: number;
  file_size_bytes: number;
}

export interface InspectionDetail {
  id: string;
  product: Product;
  inspector_name?: string;
  reviewer_name?: string | null;
  status: string;
  overall_compliance: ComplianceStatus;
  ocr_confidence_avg: number;
  total_rules: number;
  passed_rules: number;
  violation_rules: number;
  review_rules: number;
  location_state?: string;
  created_at: string;
  images: UploadedImage[];
  declarations: DeclarationItem[];
  compliance_results: ComplianceResultItem[];
  report?: {
    report_number?: string;
    download_url?: string;
  } | null;
}

export interface DashboardSummary {
  total_products_scanned: number;
  compliant_products: number;
  products_requiring_review: number;
  potential_violations_detected: number;
  pending_inspections: number;
  total_inspection_reports: number;
}

export interface RecentInspection {
  id: string;
  product_name: string;
  brand: string;
  category: string;
  inspection_date: string;
  compliance_status: ComplianceStatus;
  passed_rules: number;
  violation_rules: number;
  has_report: boolean;
}

export interface DashboardAnalytics {
  summary: DashboardSummary;
  compliance_distribution: { name: string; value: number; color: string }[];
  category_distribution: { category: string; count: number }[];
  monthly_trends: { month: string; total: number; compliant: number; violations: number }[];
  frequent_violations: { declaration: string; count: number }[];
  state_statistics: { state: string; inspections: number }[];
  status_distribution: { status: string; count: number }[];
  recent_inspections: RecentInspection[];
}

export interface ComplianceRule {
  id: string;
  rule_number: string;
  name: string;
  description: string;
  legal_reference: string;
  category_filter: string;
  required_declaration: string;
  validation_type: string;
  severity: string;
  is_active: boolean;
  effective_date: string;
  version: number;
  created_by: string;
  updated_at: string;
}

export interface VerificationItem {
  id: number;
  inspection_id: string;
  product_name: string;
  brand: string;
  category: string;
  declaration_key: string;
  declaration_label: string;
  raw_value?: string;
  normalized_value?: string;
  confidence: number;
  readability_score: string;
  bounding_box?: BoundingBox;
  image_url?: string;
  review_reason: string;
  created_at: string;
}

export interface AuditLog {
  id: number;
  user_name: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details?: string;
  ip_address: string;
  created_at: string;
}

