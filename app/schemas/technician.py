from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class TechnicianBase(BaseModel):
    name: str
    employee_id: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    specialization: Optional[str] = None
    status: str = "재직중"
    notes: Optional[str] = None


class TechnicianCreate(TechnicianBase):
    pass


class TechnicianUpdate(TechnicianBase):
    name: Optional[str] = None
    status: Optional[str] = None


class TechnicianResponse(TechnicianBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class TechnicianListResponse(BaseModel):
    items: list[TechnicianResponse]
    total: int
