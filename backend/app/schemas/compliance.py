from typing import List, Optional, Dict, Any
from pydantic import BaseModel

class ComplianceRuleBase(BaseModel):
    id: str
    rule_number: str
    name: str
    description: str
    legal_reference: str
    category_filter: str = "ALL"
    required_declaration: str
    validation_type: str = "presence"
    severity: str = "HIGH"
    is_active: bool = True
    effective_date: str = "2011-11-01"

class ComplianceRuleCreate(ComplianceRuleBase):
    pass

class ComplianceRuleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    legal_reference: Optional[str] = None
    category_filter: Optional[str] = None
    required_declaration: Optional[str] = None
    validation_type: Optional[str] = None
    severity: Optional[str] = None
    is_active: Optional[bool] = None
    effective_date: Optional[str] = None

class ComplianceRuleResponse(ComplianceRuleBase):
    version: int
    created_by: str

    class Config:
        from_attributes = True

class RuleHistoryResponse(BaseModel):
    id: int
    rule_id: str
    version: int
    modified_by: str
    changes_summary: str
    created_at: str

class ComplianceResultItem(BaseModel):
    id: Optional[int] = None
    rule_id: str
    rule_name: str
    legal_reference: str
    required_declaration: str
    extracted_value: Optional[str] = None
    status: str # COMPLIANT, NON_COMPLIANT, NEEDS_REVIEW, NOT_APPLICABLE
    evidence_reason: str
    confidence: int
    severity: str
    requires_human_review: bool
    evidence_bounding_box: Optional[Dict[str, Any]] = None

class ComplianceAnalysisResponse(BaseModel):
    inspection_id: str
    overall_compliance: str
    total_rules: int
    passed_rules: int
    violation_rules: int
    review_rules: int
    not_applicable_rules: int
    ocr_confidence_avg: float
    results: List[ComplianceResultItem]
    inspection_scope_disclaimer: str

