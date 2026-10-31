from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from backend.app.database.session import get_db
from backend.app.models.product import Product
from backend.app.models.inspection import Inspection

router = APIRouter(prefix="/products", tags=["Product Repository"])

@router.get("")
def list_products(
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(Product)
    if search:
        s = f"%{search}%"
        query = query.filter(or_(Product.name.ilike(s), Product.brand.ilike(s)))
    if category and category != "ALL":
        query = query.filter(Product.category == category)

    total = query.count()
    prods = query.order_by(Product.created_at.desc()).offset((page - 1) * limit).limit(limit).all()

    items = []
    for p in prods:
        insp_count = db.query(Inspection).filter(Inspection.product_id == p.id).count()
        latest_insp = db.query(Inspection).filter(Inspection.product_id == p.id).order_by(Inspection.created_at.desc()).first()
        items.append({
            "id": p.id,
            "name": p.name,
            "brand": p.brand,
            "category": p.category,
            "declared_net_quantity": p.declared_net_quantity,
            "declared_mrp": p.declared_mrp,
            "country_of_origin": p.country_of_origin,
            "inspections_count": insp_count,
            "latest_inspection_id": latest_insp.id if latest_insp else None,
            "latest_status": latest_insp.overall_compliance if latest_insp else "UNINSPECTED",
            "created_at": p.created_at.strftime("%Y-%m-%d %H:%M") if p.created_at else ""
        })

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "items": items
    }

