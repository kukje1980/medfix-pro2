from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, ConfigDict


class DeviceBase(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    customer_id: Optional[int] = None
    model_name: str
    manufacturer: Optional[str] = None
    serial_number: str
    device_type: Optional[str] = None
    status: str = "정상"
    location: Optional[str] = None
    install_date: Optional[date] = None
    warranty_expiry: Optional[date] = None
    notes: Optional[str] = None


class DeviceCreate(DeviceBase):
    pass


class DeviceUpdate(DeviceBase):
    model_name: Optional[str] = None
    serial_number: Optional[str] = None
    status: Optional[str] = None


class DeviceStatusUpdate(BaseModel):
    status: str


class DeviceResponse(DeviceBase):
    id: int
    last_service_date: Optional[date] = None
    created_at: datetime
    updated_at: datetime
    customer_name: Optional[str] = None

    model_config = {"from_attributes": True}


class DeviceListResponse(BaseModel):
    items: list[DeviceResponse]
    total: int
    page: int
    size: int
    pages: int
