from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from backend.app.database.session import get_db
from backend.app.models.product import Product
from backend.app.models.inspection import Inspection, InspectionReport
from backend.app.models.rule import ComplianceResult
from backend.app.schemas.inspection import DashboardSummaryResponse, DashboardAnalyticsResponse, RecentInspectionItem

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary(db: Session = Depends(get_db)):
    total_scanned = db.query(Inspection).count()
    compliant = db.query(Inspection).filter(Inspection.overall_compliance == "COMPLIANT").count()
    requiring_review = db.query(Inspection).filter(Inspection.overall_compliance == "NEEDS_REVIEW").count()
    violations = db.query(Inspection).filter(Inspection.overall_compliance == "NON_COMPLIANT").count()
    pending = db.query(Inspection).filter(Inspection.status == "pending").count()
    total_reports = db.query(InspectionReport).count()

    return {
        "total_products_scanned": total_scanned,
        "compliant_products": compliant,
        "products_requiring_review": requiring_review,
        "potential_violations_detected": violations,
        "pending_inspections": pending,
        "total_inspection_reports": total_reports
    }

@router.get("/analytics", response_model=DashboardAnalyticsResponse)
def get_dashboard_analytics(db: Session = Depends(get_db)):
    summary = get_dashboard_summary(db)

    # 1. Compliant vs Non-Compliant Distribution
    comp_dist = [
        {"name": "Compliant", "value": summary["compliant_products"], "color": "#16A34A"},
        {"name": "Non-Compliant", "value": summary["potential_violations_detected"], "color": "#DC2626"},
        {"name": "Needs Review", "value": summary["products_requiring_review"], "color": "#F59E0B"},
    ]

    # 2. Product Category Distribution
    category_counts = (
        db.query(Product.category, func.count(Inspection.id))
        .join(Inspection, Inspection.product_id == Product.id)
        .group_by(Product.category)
        .all()
    )
    cat_dist = [{"category": c[0], "count": c[1]} for c in category_counts]

    # 3. Monthly Inspection Trends
    monthly_counts = (
        db.query(
            func.strftime('%Y-%m', Inspection.created_at).label('month'),
            func.count(Inspection.id).label('total'),
            func.sum(case((Inspection.overall_compliance == 'COMPLIANT', 1), else_=0)).label('compliant'),
            func.sum(case((Inspection.overall_compliance == 'NON_COMPLIANT', 1), else_=0)).label('violations')
        )
        .group_by('month')
        .order_by('month')
        .all()
    )
    month_trends = [
        {
            "month": m[0] or "2026-10",
            "total": m[1] or 0,
            "compliant": m[2] or 0,
            "violations": m[3] or 0
        }
        for m in monthly_counts
    ]

    # 4. Most Frequently Detected Violations
    violation_counts = (
        db.query(ComplianceResult.declaration_key, func.count(ComplianceResult.id))
        .filter(ComplianceResult.status == "NON_COMPLIANT")
        .group_by(ComplianceResult.declaration_key)
        .order_by(func.count(ComplianceResult.id).desc())
        .limit(6)
        .all()
    )
    freq_violations = [
        {"declaration": v[0].replace("_", " ").title(), "count": v[1]}
        for v in violation_counts
    ]

    # 5. State-wise Inspection Statistics
    state_counts = (
        db.query(Inspection.location_state, func.count(Inspection.id))
        .filter(Inspection.location_state.isnot(None))
        .group_by(Inspection.location_state)
        .all()
    )
    state_stats = [{"state": s[0], "inspections": s[1]} for s in state_counts]

    # 6. Inspection Status Distribution
    status_counts = (
        db.query(Inspection.status, func.count(Inspection.id))
        .group_by(Inspection.status)
        .all()
    )
    status_dist = [{"status": s[0].title(), "count": s[1]} for s in status_counts]

    # Recent inspections
    recent = get_recent_inspections(db)

    return {
        "summary": summary,
        "compliance_distribution": comp_dist,
        "category_distribution": cat_dist,
        "monthly_trends": month_trends,
        "frequent_violations": freq_violations,
        "state_statistics": state_stats,
        "status_distribution": status_dist,
        "recent_inspections": recent
    }

@router.get("/recent-inspections")
def get_recent_inspections(db: Session = Depends(get_db)):
    inspections = (
        db.query(Inspection)
        .order_by(Inspection.created_at.desc())
        .limit(10)
        .all()
    )

    items = []
    for insp in inspections:
        prod = insp.product
        has_rep = db.query(InspectionReport).filter(InspectionReport.inspection_id == insp.id).first() is not None
        items.append({
            "id": insp.id,
            "product_name": prod.name if prod else "Unknown Product",
            "brand": prod.brand if prod else "Unknown Brand",
            "category": prod.category if prod else "General",
            "inspection_date": insp.created_at.strftime("%Y-%m-%d %H:%M") if insp.created_at else "",
            "compliance_status": insp.overall_compliance,
            "passed_rules": insp.passed_rules,
            "violation_rules": insp.violation_rules,
            "has_report": has_rep
        })
    return items
