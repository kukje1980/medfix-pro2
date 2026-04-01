import math
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.service_history import (
    ServiceHistoryCreate,
    ServiceHistoryUpdate,
    ServiceHistoryResponse,
    ServiceHistoryListResponse,
)
import app.crud.service_history as crud

router = APIRouter(prefix="/service-history", tags=["서비스 이력"])


@router.get("", response_model=ServiceHistoryListResponse)
def list_service_history(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    device_id: int | None = None,
    technician_id: int | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    db: Session = Depends(get_db),
):
    items, total = crud.get_service_histories(
        db, page=page, size=size, device_id=device_id,
        technician_id=technician_id, date_from=date_from, date_to=date_to,
    )
    result = [crud.enrich_history(db, h) for h in items]
    return {
        "items": result,
        "total": total,
        "page": page,
        "size": size,
        "pages": math.ceil(total / size) if total else 1,
    }


@router.post("", response_model=ServiceHistoryResponse, status_code=201)
def create_service_history(data: ServiceHistoryCreate, db: Session = Depends(get_db)):
    obj = crud.create_service_history(db, data)
    db.commit()
    db.refresh(obj)
    return crud.enrich_history(db, obj)


@router.get("/report/monthly")
def monthly_report(year: int = Query(...), month: int = Query(..., ge=1, le=12), db: Session = Depends(get_db)):
    items = crud.get_monthly_report(db, year=year, month=month)
    enriched = [crud.enrich_history(db, h) for h in items]
    by_technician: dict = {}
    by_type: dict = {}
    total_hours = 0.0
    for h in enriched:
        tech = h.get("technician_name") or "미지정"
        by_technician.setdefault(tech, {"count": 0, "hours": 0.0})
        by_technician[tech]["count"] += 1
        by_technician[tech]["hours"] += h.get("labor_hours") or 0
        stype = h.get("service_type") or "기타"
        by_type[stype] = by_type.get(stype, 0) + 1
        total_hours += h.get("labor_hours") or 0
    return {
        "year": year,
        "month": month,
        "total_count": len(items),
        "total_hours": round(total_hours, 1),
        "by_technician": by_technician,
        "by_type": by_type,
    }


@router.get("/report/by-device")
def by_device_report(db: Session = Depends(get_db)):
    from app.models.service_history import ServiceHistory
    from app.models.device import Device
    from sqlalchemy import func
    rows = (
        db.query(Device.id, Device.model_name, Device.serial_number, func.count(ServiceHistory.id).label("count"))
        .join(ServiceHistory, ServiceHistory.device_id == Device.id, isouter=True)
        .group_by(Device.id)
        .order_by(func.count(ServiceHistory.id).desc())
        .all()
    )
    return [{"device_id": r.id, "model_name": r.model_name, "serial_number": r.serial_number, "count": r.count} for r in rows]


@router.get("/{history_id}", response_model=ServiceHistoryResponse)
def get_service_history(history_id: int, db: Session = Depends(get_db)):
    obj = crud.get_service_history(db, history_id)
    if not obj:
        raise HTTPException(status_code=404, detail="서비스 이력을 찾을 수 없습니다.")
    return crud.enrich_history(db, obj)


@router.put("/{history_id}", response_model=ServiceHistoryResponse)
def update_service_history(history_id: int, data: ServiceHistoryUpdate, db: Session = Depends(get_db)):
    obj = crud.update_service_history(db, history_id, data)
    if not obj:
        raise HTTPException(status_code=404, detail="서비스 이력을 찾을 수 없습니다.")
    return crud.enrich_history(db, obj)


@router.delete("/{history_id}")
def delete_service_history(history_id: int, db: Session = Depends(get_db)):
    result = crud.delete_service_history(db, history_id)
    if not result:
        raise HTTPException(status_code=404, detail="서비스 이력을 찾을 수 없습니다.")
    return {"message": "삭제되었습니다."}
