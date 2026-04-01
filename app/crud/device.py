from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models.device import Device
from app.models.customer import Customer
from app.schemas.device import DeviceCreate, DeviceUpdate, DeviceStatusUpdate


def get_devices(
    db: Session,
    page: int = 1,
    size: int = 20,
    search: str | None = None,
    status: str | None = None,
    customer_id: int | None = None,
):
    q = db.query(Device)
    if search:
        q = q.filter(
            or_(
                Device.model_name.ilike(f"%{search}%"),
                Device.serial_number.ilike(f"%{search}%"),
                Device.manufacturer.ilike(f"%{search}%"),
                Device.device_type.ilike(f"%{search}%"),
            )
        )
    if status:
        q = q.filter(Device.status == status)
    if customer_id:
        q = q.filter(Device.customer_id == customer_id)
    total = q.count()
    items = q.order_by(Device.model_name).offset((page - 1) * size).limit(size).all()
    return items, total


def get_device(db: Session, device_id: int):
    return db.query(Device).filter(Device.id == device_id).first()


def get_device_by_serial(db: Session, serial_number: str):
    return db.query(Device).filter(Device.serial_number == serial_number).first()


def create_device(db: Session, data: DeviceCreate):
    obj = Device(**data.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def update_device(db: Session, device_id: int, data: DeviceUpdate):
    obj = get_device(db, device_id)
    if not obj:
        return None
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj


def update_device_status(db: Session, device_id: int, data: DeviceStatusUpdate):
    obj = get_device(db, device_id)
    if not obj:
        return None
    obj.status = data.status
    db.commit()
    db.refresh(obj)
    return obj


def delete_device(db: Session, device_id: int):
    obj = get_device(db, device_id)
    if not obj:
        return False
    db.delete(obj)
    db.commit()
    return True


def enrich_device(db: Session, device: Device) -> dict:
    data = {c.name: getattr(device, c.name) for c in device.__table__.columns}
    if device.customer_id:
        customer = db.query(Customer).filter(Customer.id == device.customer_id).first()
        data["customer_name"] = customer.name if customer else None
    else:
        data["customer_name"] = None
    return data
