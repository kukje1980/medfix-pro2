from datetime import date
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models.service_request import ServiceRequest
from app.models.device import Device
from app.models.customer import Customer
from app.models.technician import Technician
from app.schemas.service_request import (
    ServiceRequestCreate,
    ServiceRequestUpdate,
    ServiceRequestAssign,
    ServiceRequestStatusUpdate,
)


def get_service_requests(
    db: Session,
    page: int = 1,
    size: int = 20,
    status: str | None = None,
    priority: str | None = None,
    technician_id: int | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
):
    q = db.query(ServiceRequest)
    if status:
        q = q.filter(ServiceRequest.status == status)
    if priority:
        q = q.filter(ServiceRequest.priority == priority)
    if technician_id:
        q = q.filter(ServiceRequest.assigned_technician_id == technician_id)
    if date_from:
        q = q.filter(ServiceRequest.scheduled_date >= date_from)
    if date_to:
        q = q.filter(ServiceRequest.scheduled_date <= date_to)
    total = q.count()
    items = q.order_by(ServiceRequest.created_at.desc()).offset((page - 1) * size).limit(size).all()
    return items, total


def get_service_request(db: Session, request_id: int):
    return db.query(ServiceRequest).filter(ServiceRequest.id == request_id).first()


def create_service_request(db: Session, data: ServiceRequestCreate):
    obj = ServiceRequest(**data.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def update_service_request(db: Session, request_id: int, data: ServiceRequestUpdate):
    obj = get_service_request(db, request_id)
    if not obj:
        return None
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj


def assign_technician(db: Session, request_id: int, data: ServiceRequestAssign):
    obj = get_service_request(db, request_id)
    if not obj:
        return None
    obj.assigned_technician_id = data.technician_id
    if obj.status == "접수":
        obj.status = "배정"
    db.commit()
    db.refresh(obj)
    return obj


def update_status(db: Session, request_id: int, data: ServiceRequestStatusUpdate):
    obj = get_service_request(db, request_id)
    if not obj:
        return None
    obj.status = data.status
    db.commit()
    db.refresh(obj)
    return obj


def delete_service_request(db: Session, request_id: int):
    obj = get_service_request(db, request_id)
    if not obj:
        return False
    if obj.status not in ("접수", "취소"):
        return None  # Cannot delete non-initial status
    db.delete(obj)
    db.commit()
    return True


def enrich_request(db: Session, req: ServiceRequest) -> dict:
    data = {c.name: getattr(req, c.name) for c in req.__table__.columns}
    device = db.query(Device).filter(Device.id == req.device_id).first()
    customer = db.query(Customer).filter(Customer.id == req.customer_id).first()
    technician = None
    if req.assigned_technician_id:
        technician = db.query(Technician).filter(Technician.id == req.assigned_technician_id).first()
    data["device_model"] = device.model_name if device else None
    data["device_serial"] = device.serial_number if device else None
    data["customer_name"] = customer.name if customer else None
    data["technician_name"] = technician.name if technician else None
    return data
