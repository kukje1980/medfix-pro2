import math
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.customer import CustomerCreate, CustomerUpdate, CustomerResponse, CustomerListResponse
from app.schemas.device import DeviceResponse
from app.schemas.service_request import ServiceRequestResponse
import app.crud.customer as crud
import app.crud.device as device_crud
import app.crud.service_request as sr_crud

router = APIRouter(prefix="/customers", tags=["고객/병원"])


@router.get("", response_model=CustomerListResponse)
def list_customers(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    search: str | None = None,
    db: Session = Depends(get_db),
):
    items, total = crud.get_customers(db, page=page, size=size, search=search)
    result = []
    for c in items:
        d = {col.name: getattr(c, col.name) for col in c.__table__.columns}
        d["device_count"] = crud.get_customer_device_count(db, c.id)
        result.append(d)
    return {
        "items": result,
        "total": total,
        "page": page,
        "size": size,
        "pages": math.ceil(total / size) if total else 1,
    }


@router.post("", response_model=CustomerResponse, status_code=201)
def create_customer(data: CustomerCreate, db: Session = Depends(get_db)):
    obj = crud.create_customer(db, data)
    d = {col.name: getattr(obj, col.name) for col in obj.__table__.columns}
    d["device_count"] = 0
    return d


@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    obj = crud.get_customer(db, customer_id)
    if not obj:
        raise HTTPException(status_code=404, detail="고객을 찾을 수 없습니다.")
    d = {col.name: getattr(obj, col.name) for col in obj.__table__.columns}
    d["device_count"] = crud.get_customer_device_count(db, customer_id)
    return d


@router.put("/{customer_id}", response_model=CustomerResponse)
def update_customer(customer_id: int, data: CustomerUpdate, db: Session = Depends(get_db)):
    obj = crud.update_customer(db, customer_id, data)
    if not obj:
        raise HTTPException(status_code=404, detail="고객을 찾을 수 없습니다.")
    d = {col.name: getattr(obj, col.name) for col in obj.__table__.columns}
    d["device_count"] = crud.get_customer_device_count(db, customer_id)
    return d


@router.delete("/{customer_id}")
def delete_customer(customer_id: int, db: Session = Depends(get_db)):
    result = crud.delete_customer(db, customer_id)
    if result is False:
        raise HTTPException(status_code=404, detail="고객을 찾을 수 없습니다.")
    if result is None:
        raise HTTPException(status_code=409, detail="등록된 기기가 있는 고객은 삭제할 수 없습니다.")
    return {"message": "삭제되었습니다."}


@router.get("/{customer_id}/devices")
def get_customer_devices(customer_id: int, db: Session = Depends(get_db)):
    customer = crud.get_customer(db, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="고객을 찾을 수 없습니다.")
    items, _ = device_crud.get_devices(db, size=100, customer_id=customer_id)
    result = [device_crud.enrich_device(db, d) for d in items]
    return result


@router.get("/{customer_id}/service-requests")
def get_customer_service_requests(customer_id: int, db: Session = Depends(get_db)):
    customer = crud.get_customer(db, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="고객을 찾을 수 없습니다.")
    from app.models.service_request import ServiceRequest
    from sqlalchemy.orm import Session
    reqs = db.query(ServiceRequest).filter(ServiceRequest.customer_id == customer_id).order_by(ServiceRequest.created_at.desc()).limit(20).all()
    return [sr_crud.enrich_request(db, r) for r in reqs]
