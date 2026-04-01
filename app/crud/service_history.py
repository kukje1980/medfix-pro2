from datetime import date
from sqlalchemy.orm import Session
from app.models.service_history import ServiceHistory
from app.models.device import Device
from app.models.customer import Customer
from app.models.technician import Technician
from app.models.service_request import ServiceRequest
from app.schemas.service_history import ServiceHistoryCreate, ServiceHistoryUpdate


def get_service_histories(
    db: Session,
    page: int = 1,
    size: int = 20,
    device_id: int | None = None,
    technician_id: int | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
):
    q = db.query(ServiceHistory)
    if device_id:
        q = q.filter(ServiceHistory.device_id == device_id)
    if technician_id:
        q = q.filter(ServiceHistory.technician_id == technician_id)
    if date_from:
        q = q.filter(ServiceHistory.service_date >= date_from)
    if date_to:
        q = q.filter(ServiceHistory.service_date <= date_to)
    total = q.count()
    items = q.order_by(ServiceHistory.service_date.desc()).offset((page - 1) * size).limit(size).all()
    return items, total


def get_service_history(db: Session, history_id: int):
    return db.query(ServiceHistory).filter(ServiceHistory.id == history_id).first()


def create_service_history(db: Session, data: ServiceHistoryCreate):
    obj = ServiceHistory(**data.model_dump())
    db.add(obj)
    db.flush()
    return obj


def update_service_history(db: Session, history_id: int, data: ServiceHistoryUpdate):
    obj = get_service_history(db, history_id)
    if not obj:
        return None
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj


def delete_service_history(db: Session, history_id: int):
    obj = get_service_history(db, history_id)
    if not obj:
        return False
    db.delete(obj)
    db.commit()
    return True


def enrich_history(db: Session, h: ServiceHistory) -> dict:
    data = {c.name: getattr(h, c.name) for c in h.__table__.columns}
    device = db.query(Device).filter(Device.id == h.device_id).first()
    technician = db.query(Technician).filter(Technician.id == h.technician_id).first()
    data["device_model"] = device.model_name if device else None
    data["device_serial"] = device.serial_number if device else None
    if device and device.customer_id:
        customer = db.query(Customer).filter(Customer.id == device.customer_id).first()
        data["customer_name"] = customer.name if customer else None
    else:
        data["customer_name"] = None
    data["technician_name"] = technician.name if technician else None
    if h.service_request_id:
        sr = db.query(ServiceRequest).filter(ServiceRequest.id == h.service_request_id).first()
        data["request_number"] = sr.request_number if sr else None
    else:
        data["request_number"] = None
    return data


def get_monthly_report(db: Session, year: int, month: int):
    from sqlalchemy import extract, func
    q = (
        db.query(ServiceHistory)
        .filter(
            extract("year", ServiceHistory.service_date) == year,
            extract("month", ServiceHistory.service_date) == month,
        )
        .all()
    )
    return q
