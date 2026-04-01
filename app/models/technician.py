from datetime import datetime
from sqlalchemy import Integer, String, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Technician(Base):
    __tablename__ = "technicians"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    employee_id: Mapped[str | None] = mapped_column(String(50), unique=True)
    phone: Mapped[str | None] = mapped_column(String(30))
    email: Mapped[str | None] = mapped_column(String(150))
    specialization: Mapped[str | None] = mapped_column(String(200))
    status: Mapped[str] = mapped_column(String(20), default="재직중")
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, onupdate=datetime.now)

    service_requests = relationship("ServiceRequest", back_populates="assigned_technician", lazy="dynamic")
    service_histories = relationship("ServiceHistory", back_populates="technician", lazy="dynamic")
