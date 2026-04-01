import math
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.service_request import (
    ServiceRequestCreate,
    ServiceRequestUpdate,
    ServiceRequestAssign,
    ServiceRequestStatusUpdate,
    ServiceRequestComplete,
    ServiceRequestResponse,
    ServiceRequestListResponse,
)
import app.crud.service_request as crud
import app.crud.service_history as sh_crud
from app.schemas.service_history import ServiceHistoryCreate

router = APIRouter(prefix="/service-requests", tags=["서비스 요청"])


@router.get("", response_model=ServiceRequestListResponse)
def list_service_requests(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    status: str | None = None,
    priority: str | None = None,
    technician_id: int | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    db: Session = Depends(get_db),
):
    items, total = crud.get_service_requests(
        db, page=page, size=size, status=status, priority=priority,
        technician_id=technician_id, date_from=date_from, date_to=date_to,
    )
    result = [crud.enrich_request(db, r) for r in items]
    return {
        "items": result,
        "total": total,
        "page": page,
        "size": size,
        "pages": math.ceil(total / size) if total else 1,
    }


@router.post("", response_model=ServiceRequestResponse, status_code=201)
def create_service_request(data: ServiceRequestCreate, db: Session = Depends(get_db)):
    obj = crud.create_service_request(db, data)
    return crud.enrich_request(db, obj)


@router.get("/{request_id}", response_model=ServiceRequestResponse)
def get_service_request(request_id: int, db: Session = Depends(get_db)):
    obj = crud.get_service_request(db, request_id)
    if not obj:
        raise HTTPException(status_code=404, detail="서비스 요청을 찾을 수 없습니다.")
    return crud.enrich_request(db, obj)


@router.put("/{request_id}", response_model=ServiceRequestResponse)
def update_service_request(request_id: int, data: ServiceRequestUpdate, db: Session = Depends(get_db)):
    obj = crud.update_service_request(db, request_id, data)
    if not obj:
        raise HTTPException(status_code=404, detail="서비스 요청을 찾을 수 없습니다.")
    return crud.enrich_request(db, obj)


@router.patch("/{request_id}/assign", response_model=ServiceRequestResponse)
def assign_technician(request_id: int, data: ServiceRequestAssign, db: Session = Depends(get_db)):
    obj = crud.assign_technician(db, request_id, data)
    if not obj:
        raise HTTPException(status_code=404, detail="서비스 요청을 찾을 수 없습니다.")
    return crud.enrich_request(db, obj)


@router.patch("/{request_id}/status", response_model=ServiceRequestResponse)
def update_status(request_id: int, data: ServiceRequestStatusUpdate, db: Session = Depends(get_db)):
    obj = crud.update_status(db, request_id, data)
    if not obj:
        raise HTTPException(status_code=404, detail="서비스 요청을 찾을 수 없습니다.")
    return crud.enrich_request(db, obj)


@router.post("/{request_id}/complete", response_model=ServiceRequestResponse)
def complete_service_request(request_id: int, data: ServiceRequestComplete, db: Session = Depends(get_db)):
    req = crud.get_service_request(db, request_id)
    if not req:
        raise HTTPException(status_code=404, detail="서비스 요청을 찾을 수 없습니다.")
    if req.status == "완료":
        raise HTTPException(status_code=400, detail="이미 완료된 서비스 요청입니다.")
    if not req.assigned_technician_id:
        raise HTTPException(status_code=400, detail="담당 기술자가 배정되지 않았습니다.")

    history_data = ServiceHistoryCreate(
        service_request_id=req.id,
        device_id=req.device_id,
        technician_id=req.assigned_technician_id,
        service_date=date.today(),
        service_type=req.request_type,
        work_performed=data.work_performed,
        parts_replaced=data.parts_replaced,
        labor_hours=data.labor_hours,
        result=data.result,
        next_service_date=data.next_service_date,
        technician_notes=data.technician_notes,
    )
    sh_crud.create_service_history(db, history_data)

    req.status = "완료"
    req.completed_date = date.today()

    from app.models.device import Device
    device = db.query(Device).filter(Device.id == req.device_id).first()
    if device:
        device.last_service_date = date.today()
        if data.result == "정상처리":
            device.status = "정상"

    db.commit()
    db.refresh(req)
    return crud.enrich_request(db, req)


@router.delete("/{request_id}")
def delete_service_request(request_id: int, db: Session = Depends(get_db)):
    result = crud.delete_service_request(db, request_id)
    if result is False:
        raise HTTPException(status_code=404, detail="서비스 요청을 찾을 수 없습니다.")
    if result is None:
        raise HTTPException(status_code=409, detail="접수 또는 취소 상태의 요청만 삭제할 수 있습니다.")
    return {"message": "삭제되었습니다."}
