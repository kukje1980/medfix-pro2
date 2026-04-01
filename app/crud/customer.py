from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from app.models.customer import Customer
from app.models.device import Device
from app.schemas.customer import CustomerCreate, CustomerUpdate


def get_customers(db: Session, page: int = 1, size: int = 20, search: str | None = None):
    q = db.query(Customer)
    if search:
        q = q.filter(
            or_(
                Customer.name.ilike(f"%{search}%"),
                Customer.contact_person.ilike(f"%{search}%"),
                Customer.phone.ilike(f"%{search}%"),
            )
        )
    total = q.count()
    items = q.order_by(Customer.name).offset((page - 1) * size).limit(size).all()
    return items, total


def get_customer(db: Session, customer_id: int):
    return db.query(Customer).filter(Customer.id == customer_id).first()


def create_customer(db: Session, data: CustomerCreate):
    obj = Customer(**data.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def update_customer(db: Session, customer_id: int, data: CustomerUpdate):
    obj = get_customer(db, customer_id)
    if not obj:
        return None
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj


def delete_customer(db: Session, customer_id: int):
    obj = get_customer(db, customer_id)
    if not obj:
        return False
    device_count = db.query(Device).filter(Device.customer_id == customer_id).count()
    if device_count > 0:
        return None  # Cannot delete - has devices
    db.delete(obj)
    db.commit()
    return True


def get_customer_device_count(db: Session, customer_id: int) -> int:
    return db.query(Device).filter(Device.customer_id == customer_id).count()
