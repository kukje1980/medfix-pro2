from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel


class ServiceHistoryBase(BaseModel):
    device_id: int
    technician_id: int
    service_date: date
    service_type: Optional[str] = None
    work_performed: Optional[str] = None
    parts_replaced: Optional[str] = None
    labor_hours: Optional[float] = None
    result: Optional[str] = None
    next_service_date: Optional[date] = None
    technician_notes: Optional[str] = None


class ServiceHistoryCreate(ServiceHistoryBase):
    service_request_id: Optional[int] = None


class ServiceHistoryUpdate(BaseModel):
    service_date: Optional[date] = None
    service_type: Optional[str] = None
    work_performed: Optional[str] = None
    parts_replaced: Optional[str] = None
    labor_hours: Optional[float] = None
    result: Optional[str] = None
    next_service_date: Optional[date] = None
    technician_notes: Optional[str] = None


class ServiceHistoryResponse(ServiceHistoryBase):
    id: int
    service_request_id: Optional[int] = None
    created_at: datetime
    device_model: Optional[str] = None
    device_serial: Optional[str] = None
    customer_name: Optional[str] = None
    technician_name: Optional[str] = None
    request_number: Optional[str] = None

    model_config = {"from_attributes": True}


class ServiceHistoryListResponse(BaseModel):
    items: list[ServiceHistoryResponse]
    total: int
    page: int
    size: int
    pages: int
