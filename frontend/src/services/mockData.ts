import {
  User,
  DashboardSummary,
  DashboardAnalytics,
  ComplianceRule,
  VerificationItem,
  RecentInspection
} from '../types';

export const MOCK_USERS: Record<string, { user: User; passwords: string[] }> = {
  inspector: {
    user: {
      id: 1,
      username: 'inspector',
      email: 'inspector@legalmetrix.gov.in',
      full_name: 'Rajesh Kumar',
      role: 'inspector',
      department: 'Delhi North District Inspection Unit',
      badge_number: 'LM-DL-N-42',
      is_active: true,
      created_at: '2026-01-15T10:00:00Z'
    },
    passwords: ['inspector@123', 'password123', 'inspector', 'inspector123']
  },
  inspector_rajesh: {
    user: {
      id: 1,
      username: 'inspector_rajesh',
      email: 'rajesh.kumar@legalmetrix.gov.in',
      full_name: 'Rajesh Kumar',
      role: 'inspector',
      department: 'Delhi North District Inspection Unit',
      badge_number: 'LM-DL-N-42',
      is_active: true,
      created_at: '2026-01-15T10:00:00Z'
    },
    passwords: ['inspector@123', 'password123', 'inspector', 'inspector123']
  },
  admin: {
    user: {
      id: 2,
      username: 'admin',
      email: 'admin@legalmetrix.gov.in',
      full_name: 'Chief Legal Metrology Controller',
      role: 'admin',
      department: 'Headquarters Enforcement Cell',
      badge_number: 'LM-DL-HQ-01',
      is_active: true,
      created_at: '2026-01-01T09:00:00Z'
    },
    passwords: ['admin@123', 'admin', 'admin123', 'password']
  },
  reviewer: {
    user: {
      id: 3,
      username: 'reviewer',
      email: 'reviewer@legalmetrix.gov.in',
      full_name: 'Anita Sharma',
      role: 'reviewer',
      department: 'Statutory Standards Review Board',
      badge_number: 'LM-REV-07',
      is_active: true,
      created_at: '2026-01-20T11:30:00Z'
    },
    passwords: ['reviewer@123', 'reviewer', 'reviewer123', 'password']
  },
  reviewer_anita: {
    user: {
      id: 3,
      username: 'reviewer_anita',
      email: 'anita.sharma@legalmetrix.gov.in',
      full_name: 'Anita Sharma',
      role: 'reviewer',
      department: 'Statutory Standards Review Board',
      badge_number: 'LM-REV-07',
      is_active: true,
      created_at: '2026-01-20T11:30:00Z'
    },
    passwords: ['reviewer@123', 'reviewer', 'reviewer123', 'password']
  }
};

export const MOCK_DASHBOARD_SUMMARY: DashboardSummary = {
  total_products_scanned: 148,
  compliant_products: 96,
  products_requiring_review: 31,
  potential_violations_detected: 21,
  pending_inspections: 8,
  total_inspection_reports: 140
};

export const MOCK_RECENT_INSPECTIONS: RecentInspection[] = [
  {
    id: 'INSP-2026-CHIPS-01',
    product_name: 'Original Real Chocolate Chip Cookies',
    brand: 'Chips Ahoy / Mondelēz',
    category: 'Food & Beverages',
    inspection_date: '2026-10-31 18:40',
    compliance_status: 'COMPLIANT',
    passed_rules: 6,
    violation_rules: 0,
    has_report: true
  },
  {
    id: 'INSP-2026-COCA-02',
    product_name: 'Coca-Cola 12 fl oz can',
    brand: 'The Coca-Cola Company',
    category: 'Food & Beverages',
    inspection_date: '2026-10-31 18:42',
    compliance_status: 'NON_COMPLIANT',
    passed_rules: 4,
    violation_rules: 3,
    has_report: true
  },
  {
    id: 'INSP-2026-SKINNY-03',
    product_name: 'Divines Caramel Filled Chocolate Squares',
    brand: 'Nestlé Skinny Cow',
    category: 'Food & Beverages',
    inspection_date: '2026-10-31 18:45',
    compliance_status: 'NON_COMPLIANT',
    passed_rules: 4,
    violation_rules: 3,
    has_report: true
  },
  {
    id: 'INSP-2026-HALD-04',
    product_name: 'Aloo Bhujia Crispy Snacks 150g',
    brand: "Haldiram's",
    category: 'Food & Beverages',
    inspection_date: '2026-10-30 14:15',
    compliance_status: 'COMPLIANT',
    passed_rules: 7,
    violation_rules: 0,
    has_report: true
  },
  {
    id: 'INSP-2026-PARLE-05',
    product_name: 'Glucose Milk Biscuits 250g',
    brand: 'Parle-G',
    category: 'Food & Beverages',
    inspection_date: '2026-10-30 11:20',
    compliance_status: 'NON_COMPLIANT',
    passed_rules: 5,
    violation_rules: 1,
    has_report: true
  }
];

export const MOCK_DASHBOARD_ANALYTICS: DashboardAnalytics = {
  summary: MOCK_DASHBOARD_SUMMARY,
  monthly_trends: [
    { month: 'May 2026', total: 18, compliant: 12, violations: 4 },
    { month: 'Jun 2026', total: 24, compliant: 16, violations: 5 },
    { month: 'Jul 2026', total: 29, compliant: 19, violations: 6 },
    { month: 'Aug 2026', total: 32, compliant: 21, violations: 7 },
    { month: 'Sep 2026', total: 38, compliant: 25, violations: 8 },
    { month: 'Oct 2026', total: 45, compliant: 30, violations: 9 }
  ],
  category_distribution: [
    { category: 'Food & Beverages', count: 68 },
    { category: 'Edible Oils', count: 28 },
    { category: 'Personal Care & Cosmetics', count: 24 },
    { category: 'Confectionery', count: 16 },
    { category: 'Household Goods', count: 12 }
  ],
  compliance_distribution: [
    { name: 'Compliant', value: 96, color: '#16A34A' },
    { name: 'Non-Compliant', value: 21, color: '#DC2626' },
    { name: 'Requires Human Review', value: 31, color: '#F59E0B' }
  ],
  frequent_violations: [
    { declaration: 'Unit Sale Price (USP) Missing', count: 18 },
    { declaration: 'Consumer Care Helpline Deficient', count: 14 },
    { declaration: 'Incomplete Manufacturer Address', count: 11 },
    { declaration: 'Country of Origin Missing on Import', count: 8 },
    { declaration: 'MRP Not Inclusive of All Taxes', count: 6 }
  ],
  state_statistics: [
    { state: 'Delhi NCT', inspections: 48 },
    { state: 'Maharashtra', inspections: 42 },
    { state: 'Karnataka', inspections: 28 },
    { state: 'Tamil Nadu', inspections: 18 },
    { state: 'Gujarat', inspections: 12 }
  ],
  status_distribution: [
    { status: 'Completed', count: 124 },
    { status: 'Pending Review', count: 16 },
    { status: 'Under Inspection', count: 8 }
  ],
  recent_inspections: MOCK_RECENT_INSPECTIONS
};

export const MOCK_RULES: ComplianceRule[] = [
  {
    id: 'R01_MRP',
    rule_number: 'Rule 6(1)(e)',
    name: 'Maximum Retail Price (MRP) Declaration',
    description: 'Statutory declaration of retail price in Indian Rupees inclusive of all taxes.',
    legal_reference: 'Rule 6(1)(e) & Rule 2(m), Packaged Commodities Rules 2011',
    category_filter: 'ALL',
    required_declaration: 'mrp',
    validation_type: 'FORMAT_AND_TAX_INCLUSION',
    severity: 'CRITICAL',
    is_active: true,
    effective_date: '2011-04-01',
    version: 1,
    created_by: 'Ministry of Consumer Affairs',
    updated_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'R02_NET_QTY',
    rule_number: 'Rule 6(1)(c)',
    name: 'Standard Unit Net Quantity',
    description: 'Declaration of net weight or measure in standard metric units (g, kg, ml, l).',
    legal_reference: 'Rule 6(1)(c) & Rule 11, Packaged Commodities Rules 2011',
    category_filter: 'ALL',
    required_declaration: 'net_quantity',
    validation_type: 'METRIC_UNIT_AND_QUANTITY',
    severity: 'CRITICAL',
    is_active: true,
    effective_date: '2011-04-01',
    version: 1,
    created_by: 'Ministry of Consumer Affairs',
    updated_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'R03_USP',
    rule_number: 'Rule 6(1)(e) Amend.',
    name: 'Unit Sale Price (USP)',
    description: 'Mandatory declaration of per-gram or per-milliliter unit price on prepackaged commodities.',
    legal_reference: 'Rule 6(1)(e) First Proviso (Amendment Act 2021)',
    category_filter: 'ALL',
    required_declaration: 'unit_sale_price',
    validation_type: 'UNIT_PRICE_CALCULATION',
    severity: 'HIGH',
    is_active: true,
    effective_date: '2022-12-01',
    version: 2,
    created_by: 'Ministry of Consumer Affairs',
    updated_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'R04_MFG_DATE',
    rule_number: 'Rule 6(1)(d)',
    name: 'Date of Manufacture / Packing',
    description: 'Month and year of manufacture or pre-packaging of commodity.',
    legal_reference: 'Rule 6(1)(d), Packaged Commodities Rules 2011',
    category_filter: 'ALL',
    required_declaration: 'date_of_manufacture',
    validation_type: 'DATE_FORMAT',
    severity: 'HIGH',
    is_active: true,
    effective_date: '2011-04-01',
    version: 1,
    created_by: 'Ministry of Consumer Affairs',
    updated_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'R05_MFG_DETAILS',
    rule_number: 'Rule 6(1)(b)',
    name: 'Manufacturer / Packer Name & Postal Address',
    description: 'Complete commercial name and physical postal address of manufacturing establishment.',
    legal_reference: 'Rule 6(1)(b), Packaged Commodities Rules 2011',
    category_filter: 'ALL',
    required_declaration: 'manufacturer',
    validation_type: 'POSTAL_ADDRESS_AND_NAME',
    severity: 'CRITICAL',
    is_active: true,
    effective_date: '2011-04-01',
    version: 1,
    created_by: 'Ministry of Consumer Affairs',
    updated_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'R06_CONSUMER_CARE',
    rule_number: 'Rule 6(1)(f)',
    name: 'Consumer Grievance Care Redressal Details',
    description: 'Name, address, telephone number and official email address for consumer grievance redressal.',
    legal_reference: 'Rule 6(1)(f), Packaged Commodities Rules 2011',
    category_filter: 'ALL',
    required_declaration: 'consumer_care',
    validation_type: 'CONTACT_CHANNELS',
    severity: 'CRITICAL',
    is_active: true,
    effective_date: '2011-04-01',
    version: 1,
    created_by: 'Ministry of Consumer Affairs',
    updated_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'R07_COUNTRY_ORIGIN',
    rule_number: 'Rule 6(1)(a)',
    name: 'Country of Origin / Import Declarations',
    description: 'Mandatory country of origin declaration for imported packages.',
    legal_reference: 'Rule 6(1)(a) & Rule 23, Packaged Commodities Rules 2011',
    category_filter: 'IMPORTED',
    required_declaration: 'country_of_origin',
    validation_type: 'ORIGIN_DECLARATION',
    severity: 'CRITICAL',
    is_active: true,
    effective_date: '2011-04-01',
    version: 1,
    created_by: 'Ministry of Consumer Affairs',
    updated_at: '2026-01-01T00:00:00Z'
  }
];

export const MOCK_VERIFICATION_ITEMS: VerificationItem[] = [
  {
    id: 101,
    inspection_id: 'INSP-2026-SKINNY-03',
    product_name: 'Divines Caramel Filled Chocolate Squares',
    brand: 'Nestlé Skinny Cow',
    category: 'Food & Beverages',
    declaration_key: 'manufacturer',
    declaration_label: 'Manufacturer Address',
    raw_value: 'r.EStl',
    normalized_value: 'Nestlé USA / Imported',
    confidence: 0.58,
    readability_score: 'FAIR',
    bounding_box: { x: 0.45, y: 0.9, width: 0.15, height: 0.04 },
    image_url: '/sample_images/skinny_cow_caramel.jpg',
    review_reason: 'Manufacturer brand logo detected with low OCR confidence (0.58). Human inspection required.',
    created_at: '2026-10-31 18:45'
  },
  {
    id: 102,
    inspection_id: 'INSP-2026-COCA-02',
    product_name: 'Coca-Cola 12 fl oz can',
    brand: 'The Coca-Cola Company',
    category: 'Food & Beverages',
    declaration_key: 'unit_sale_price',
    declaration_label: 'Unit Sale Price (USP)',
    confidence: 0.0,
    readability_score: 'POOR',
    image_url: '/sample_images/coca_cola_12oz.jpg',
    review_reason: 'Unit sale price declaration not detected on imported beverage can specimen.',
    created_at: '2026-10-31 18:42'
  }
];
