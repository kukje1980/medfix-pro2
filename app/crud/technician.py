from sqlalchemy.orm import Session
from app.models.technician import Technician
from app.schemas.technician import TechnicianCreate, TechnicianUpdate


def get_technicians(db: Session, status: str | None = None):
    q = db.query(Technician)
    if status:
        q = q.filter(Technician.status == status)
    return q.order_by(Technician.name).all()


def get_technician(db: Session, technician_id: int):
    return db.query(Technician).filter(Technician.id == technician_id).first()


def create_technician(db: Session, data: TechnicianCreate):
    obj = Technician(**data.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def update_technician(db: Session, technician_id: int, data: TechnicianUpdate):
    obj = get_technician(db, technician_id)
    if not obj:
        return None
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj


def delete_technician(db: Session, technician_id: int):
    obj = get_technician(db, technician_id)
    if not obj:
        return False
    db.delete(obj)
    db.commit()
    return True
