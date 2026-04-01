from datetime import datetime, date
from sqlalchemy import Integer, String, Text, DateTime, Date, ForeignKey, event
from sqlalchemy.orm import Mapped, mapped_column, relationship, Session
from app.database import Base


class ServiceRequest(Base):
    __tablename__ = "service_requests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    request_number: Mapped[str | None] = mapped_column(String(30), unique=True)
    device_id: Mapped[int] = mapped_column(Integer, ForeignKey("devices.id"), nullable=False)
    customer_id: Mapped[int] = mapped_column(Integer, ForeignKey("customers.id"), nullable=False)
    assigned_technician_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("technicians.id"), nullable=True)
    request_type: Mapped[str] = mapped_column(String(50), default="정기점검")
    priority: Mapped[str] = mapped_column(String(20), default="보통")
    status: Mapped[str] = mapped_column(String(30), default="접수")
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    scheduled_date: Mapped[date | None] = mapped_column(Date)
    completed_date: Mapped[date | None] = mapped_column(Date)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, onupdate=datetime.now)

    device = relationship("Device", back_populates="service_requests")
    customer = relationship("Customer", back_populates="service_requests")
    assigned_technician = relationship("Technician", back_populates="service_requests")
    service_history = relationship("ServiceHistory", back_populates="service_request", uselist=False)


@event.listens_for(ServiceRequest, "before_insert")
def generate_request_number(mapper, connection, target):
    if target.request_number:
        return
    today = datetime.now().strftime("%Y%m%d")
    prefix = f"SR-{today}-"
    result = connection.execute(
        ServiceRequest.__table__.select()
        .where(ServiceRequest.__table__.c.request_number.like(f"{prefix}%"))
        .order_by(ServiceRequest.__table__.c.request_number.desc())
        .limit(1)
    ).fetchone()
    if result and result.request_number:
        last_num = int(result.request_number.split("-")[-1])
        target.request_number = f"{prefix}{last_num + 1:03d}"
    else:
        target.request_number = f"{prefix}001"
