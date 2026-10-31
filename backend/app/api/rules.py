from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.models.user import User
from backend.app.models.rule import ComplianceRule, RuleHistory
from backend.app.models.audit import AuditLog
from backend.app.api.auth import get_current_user, require_admin

router = APIRouter(prefix="/rules", tags=["Rule Management"])

class RuleCreate(BaseModel):
    id: str
    rule_number: str
    name: str
    description: str
    legal_reference: str
    category_filter: Optional[str] = "ALL"
    required_declaration: str
    validation_type: Optional[str] = "presence"
    severity: Optional[str] = "HIGH"
    effective_date: Optional[str] = "2026-01-01"

class RuleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    legal_reference: Optional[str] = None
    category_filter: Optional[str] = None
    required_declaration: Optional[str] = None
    validation_type: Optional[str] = None
    severity: Optional[str] = None
    is_active: Optional[bool] = None
    effective_date: Optional[str] = None
    modification_reason: Optional[str] = "Administrative amendment update"

@router.get("")
def list_rules(db: Session = Depends(get_db)):
    rules = db.query(ComplianceRule).order_by(ComplianceRule.id).all()
    return [
        {
            "id": r.id,
            "rule_number": r.rule_number,
            "name": r.name,
            "description": r.description,
            "legal_reference": r.legal_reference,
            "category_filter": r.category_filter,
            "required_declaration": r.required_declaration,
            "validation_type": r.validation_type,
            "severity": r.severity,
            "is_active": r.is_active,
            "effective_date": r.effective_date,
            "version": r.version,
            "created_by": r.created_by,
            "updated_at": r.updated_at.strftime("%Y-%m-%d %H:%M") if r.updated_at else ""
        }
        for r in rules
    ]

@router.post("")
def create_rule(
    rule_in: RuleCreate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    existing = db.query(ComplianceRule).filter(ComplianceRule.id == rule_in.id).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Rule ID '{rule_in.id}' already exists")

    new_rule = ComplianceRule(
        id=rule_in.id,
        rule_number=rule_in.rule_number,
        name=rule_in.name,
        description=rule_in.description,
        legal_reference=rule_in.legal_reference,
        category_filter=rule_in.category_filter or "ALL",
        required_declaration=rule_in.required_declaration,
        validation_type=rule_in.validation_type or "presence",
        severity=rule_in.severity or "HIGH",
        is_active=True,
        effective_date=rule_in.effective_date or datetime.utcnow().strftime("%Y-%m-%d"),
        version=1,
        created_by=admin.full_name
    )
    db.add(new_rule)

    # Initial history
    history = RuleHistory(
        rule_id=new_rule.id,
        version=1,
        modified_by=admin.full_name,
        changes_summary="Initial promulgation and rule creation"
    )
    db.add(history)

    audit = AuditLog(
        user_id=admin.id,
        user_name=admin.username,
        action="RULE_CREATED",
        entity_type="rule",
        entity_id=new_rule.id,
        details=f"Created statutory rule {new_rule.id}: {new_rule.name}"
    )
    db.add(audit)
    db.commit()

    return {"message": "Rule created successfully", "rule_id": new_rule.id}

@router.put("/{rule_id}")
def update_rule(
    rule_id: str,
    update_data: RuleUpdate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    rule = db.query(ComplianceRule).filter(ComplianceRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")

    changes = []
    if update_data.name and update_data.name != rule.name:
        changes.append(f"Name changed to '{update_data.name}'")
        rule.name = update_data.name
    if update_data.description and update_data.description != rule.description:
        changes.append("Description amended")
        rule.description = update_data.description
    if update_data.legal_reference and update_data.legal_reference != rule.legal_reference:
        changes.append(f"Legal ref changed to '{update_data.legal_reference}'")
        rule.legal_reference = update_data.legal_reference
    if update_data.category_filter and update_data.category_filter != rule.category_filter:
        changes.append(f"Category filter changed to '{update_data.category_filter}'")
        rule.category_filter = update_data.category_filter
    if update_data.severity and update_data.severity != rule.severity:
        changes.append(f"Severity adjusted to {update_data.severity}")
        rule.severity = update_data.severity
    if update_data.is_active is not None and update_data.is_active != rule.is_active:
        action_word = "Activated" if update_data.is_active else "Deactivated"
        changes.append(f"Status changed to {action_word}")
        rule.is_active = update_data.is_active

    if changes:
        rule.version += 1
        rule.updated_at = datetime.utcnow()
        summary_str = "; ".join(changes) + f" (Reason: {update_data.modification_reason})"

        hist = RuleHistory(
            rule_id=rule.id,
            version=rule.version,
            modified_by=admin.full_name,
            changes_summary=summary_str
        )
        db.add(hist)

        audit = AuditLog(
            user_id=admin.id,
            user_name=admin.username,
            action="RULE_MODIFIED",
            entity_type="rule",
            entity_id=rule.id,
            details=f"Updated rule {rule.id} to version {rule.version}: {summary_str}"
        )
        db.add(audit)
        db.commit()

    return {"message": "Rule updated successfully", "rule_id": rule.id, "version": rule.version}

@router.get("/{rule_id}/history")
def get_rule_history(rule_id: str, db: Session = Depends(get_db)):
    rule = db.query(ComplianceRule).filter(ComplianceRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")

    histories = db.query(RuleHistory).filter(RuleHistory.rule_id == rule_id).order_by(RuleHistory.version.desc()).all()
    return [
        {
            "id": h.id,
            "rule_id": h.rule_id,
            "version": h.version,
            "modified_by": h.modified_by,
            "changes_summary": h.changes_summary,
            "created_at": h.created_at.strftime("%Y-%m-%d %H:%M") if h.created_at else ""
        }
        for h in histories
    ]

