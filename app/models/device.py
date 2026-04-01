from datetime import datetime, date
from sqlalchemy import Integer, String, Text, DateTime, Date, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Device(Base):
    __tablename__ = "devices"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    customer_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("customers.id"), nullable=True)
    model_name: Mapped[str] = mapped_column(String(200), nullable=False)
    manufacturer: Mapped[str | None] = mapped_column(String(150))
    serial_number: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    device_type: Mapped[str | None] = mapped_column(String(100))
    status: Mapped[str] = mapped_column(String(30), default="정상")
    location: Mapped[str | None] = mapped_column(String(200))
    install_date: Mapped[date | None] = mapped_column(Date)
    warranty_expiry: Mapped[date | None] = mapped_column(Date)
    last_service_date: Mapped[date | None] = mapped_column(Date)
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, onupdate=datetime.now)

    customer = relationship("Customer", back_populates="devices")
    service_requests = relationship("ServiceRequest", back_populates="device", lazy="dynamic")
    service_histories = relationship("ServiceHistory", back_populates="device", lazy="dynamic")
