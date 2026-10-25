from datetime import datetime, date
from sqlalchemy import Integer, String, Text, DateTime, Date, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Part(Base):
    __tablename__ = "parts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    company: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    category: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    model: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    part_code: Mapped[str] = mapped_column(String(100), nullable=False)
    part_name: Mapped[str] = mapped_column(String(200), nullable=False)
    cost_avg: Mapped[int | None] = mapped_column(Integer)
    local_price: Mapped[int | None] = mapped_column(Integer)
    univ_price: Mapped[int | None] = mapped_column(Integer)
    symptom: Mapped[str | None] = mapped_column(Text)
    symptom_detail: Mapped[str | None] = mapped_column(Text)
    symptom_location: Mapped[str | None] = mapped_column(String(200))
    deal_count: Mapped[int] = mapped_column(Integer, default=0)
    avg_price: Mapped[int | None] = mapped_column(Integer)
    min_price: Mapped[int | None] = mapped_column(Integer)
    max_price: Mapped[int | None] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, onupdate=datetime.now)

    deals = relationship("PartDeal", back_populates="part", cascade="all, delete-orphan")


class PartDeal(Base):
    __tablename__ = "part_deals"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    part_id: Mapped[int] = mapped_column(Integer, ForeignKey("parts.id", ondelete="CASCADE"), nullable=False)
    company: Mapped[str | None] = mapped_column(String(100))
    model: Mapped[str | None] = mapped_column(String(200))
    part_code: Mapped[str | None] = mapped_column(String(100))
    hospital: Mapped[str | None] = mapped_column(String(200))
    deal_date: Mapped[date | None] = mapped_column(Date)
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    deal_price: Mapped[int | None] = mapped_column(Integer)
    cost_price: Mapped[int | None] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)

    part = relationship("Part", back_populates="deals")


class PartMoveLog(Base):
    __tablename__ = "part_move_log"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    move_type: Mapped[str | None] = mapped_column(String(50))
    item_name: Mapped[str | None] = mapped_column(String(200))
    from_company: Mapped[str | None] = mapped_column(String(100))
    from_category: Mapped[str | None] = mapped_column(String(100))
    from_model: Mapped[str | None] = mapped_column(String(200))
    to_company: Mapped[str | None] = mapped_column(String(100))
    to_category: Mapped[str | None] = mapped_column(String(100))
    to_model: Mapped[str | None] = mapped_column(String(200))
    moved_by: Mapped[str | None] = mapped_column(String(100))
    moved_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
