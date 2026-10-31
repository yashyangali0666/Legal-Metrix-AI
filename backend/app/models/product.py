import datetime
from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime
from sqlalchemy.orm import relationship
from backend.app.database.session import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(200), nullable=False, index=True)
    brand = Column(String(100), nullable=False, index=True)
    category = Column(String(50), nullable=False, index=True) # Food & Beverages, Cosmetics, Edible Oils, Confectionery, etc.
    subcategory = Column(String(50), nullable=True)
    declared_net_quantity = Column(String(50), nullable=True)
    declared_mrp = Column(Float, nullable=True)
    packaging_type = Column(String(50), default="Pouch") # Pouch, Bottle, Can, Carton, Box
    is_imported = Column(Boolean, default=False)
    country_of_origin = Column(String(50), default="India")
    barcode = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    inspections = relationship("Inspection", back_populates="product", cascade="all, delete-orphan")

