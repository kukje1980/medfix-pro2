from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel


class ServiceRequestBase(BaseModel):
    device_id: int
    customer_id: int
    assigned_technician_id: Optional[int] = None
    request_type: str = "정기점검"
    priority: str = "보통"
    title: str
    description: Optional[str] = None
    scheduled_date: Optional[date] = None


class ServiceRequestCreate(ServiceRequestBase):
    pass


class ServiceRequestUpdate(BaseModel):
    assigned_technician_id: Optional[int] = None
    request_type: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    scheduled_date: Optional[date] = None


class ServiceRequestAssign(BaseModel):
    technician_id: int


class ServiceRequestStatusUpdate(BaseModel):
    status: str


class ServiceRequestComplete(BaseModel):
    work_performed: str
    parts_replaced: Optional[str] = None
    labor_hours: Optional[float] = None
    result: str = "정상처리"
    next_service_date: Optional[date] = None
    technician_notes: Optional[str] = None


class ServiceRequestResponse(ServiceRequestBase):
    id: int
    request_number: Optional[str] = None
    status: str
    completed_date: Optional[date] = None
    created_at: datetime
    updated_at: datetime
    device_model: Optional[str] = None
    device_serial: Optional[str] = None
    customer_name: Optional[str] = None
    technician_name: Optional[str] = None

    model_config = {"from_attributes": True}


class ServiceRequestListResponse(BaseModel):
    items: list[ServiceRequestResponse]
    total: int
    page: int
    size: int
    pages: int
