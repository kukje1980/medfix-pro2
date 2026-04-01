from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class CustomerBase(BaseModel):
    name: str
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    hospital_type: Optional[str] = None
    notes: Optional[str] = None


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(CustomerBase):
    name: Optional[str] = None


class CustomerResponse(CustomerBase):
    id: int
    created_at: datetime
    updated_at: datetime
    device_count: Optional[int] = 0

    model_config = {"from_attributes": True}


class CustomerListResponse(BaseModel):
    items: list[CustomerResponse]
    total: int
    page: int
    size: int
    pages: int
