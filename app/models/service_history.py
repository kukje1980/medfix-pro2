from datetime import datetime, date
from sqlalchemy import Integer, String, Text, DateTime, Date, Float, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class ServiceHistory(Base):
    __tablename__ = "service_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    service_request_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("service_requests.id"), nullable=True)
    device_id: Mapped[int] = mapped_column(Integer, ForeignKey("devices.id"), nullable=False)
    technician_id: Mapped[int] = mapped_column(Integer, ForeignKey("technicians.id"), nullable=False)
    service_date: Mapped[date] = mapped_column(Date, nullable=False)
    service_type: Mapped[str | None] = mapped_column(String(50))
    work_performed: Mapped[str | None] = mapped_column(Text)
    parts_replaced: Mapped[str | None] = mapped_column(Text)
    labor_hours: Mapped[float | None] = mapped_column(Float)
    result: Mapped[str | None] = mapped_column(String(50))
    next_service_date: Mapped[date | None] = mapped_column(Date)
    technician_notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)

    device = relationship("Device", back_populates="service_histories")
    technician = relationship("Technician", back_populates="service_histories")
    service_request = relationship("ServiceRequest", back_populates="service_history")
