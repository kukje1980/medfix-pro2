import math
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.device import DeviceCreate, DeviceUpdate, DeviceStatusUpdate, DeviceResponse, DeviceListResponse
import app.crud.device as crud
import app.crud.service_history as sh_crud

router = APIRouter(prefix="/devices", tags=["의료기기"])


@router.get("", response_model=DeviceListResponse)
def list_devices(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    search: str | None = None,
    status: str | None = None,
    customer_id: int | None = None,
    db: Session = Depends(get_db),
):
    items, total = crud.get_devices(db, page=page, size=size, search=search, status=status, customer_id=customer_id)
    result = [crud.enrich_device(db, d) for d in items]
    return {
        "items": result,
        "total": total,
        "page": page,
        "size": size,
        "pages": math.ceil(total / size) if total else 1,
    }


@router.post("", response_model=DeviceResponse, status_code=201)
def create_device(data: DeviceCreate, db: Session = Depends(get_db)):
    existing = crud.get_device_by_serial(db, data.serial_number)
    if existing:
        raise HTTPException(status_code=409, detail=f"시리얼 번호 '{data.serial_number}'가 이미 등록되어 있습니다.")
    obj = crud.create_device(db, data)
    return crud.enrich_device(db, obj)


@router.get("/{device_id}", response_model=DeviceResponse)
def get_device(device_id: int, db: Session = Depends(get_db)):
    obj = crud.get_device(db, device_id)
    if not obj:
        raise HTTPException(status_code=404, detail="기기를 찾을 수 없습니다.")
    return crud.enrich_device(db, obj)


@router.put("/{device_id}", response_model=DeviceResponse)
def update_device(device_id: int, data: DeviceUpdate, db: Session = Depends(get_db)):
    if data.serial_number:
        existing = crud.get_device_by_serial(db, data.serial_number)
        if existing and existing.id != device_id:
            raise HTTPException(status_code=409, detail=f"시리얼 번호 '{data.serial_number}'가 이미 등록되어 있습니다.")
    obj = crud.update_device(db, device_id, data)
    if not obj:
        raise HTTPException(status_code=404, detail="기기를 찾을 수 없습니다.")
    return crud.enrich_device(db, obj)


@router.patch("/{device_id}/status", response_model=DeviceResponse)
def update_device_status(device_id: int, data: DeviceStatusUpdate, db: Session = Depends(get_db)):
    obj = crud.update_device_status(db, device_id, data)
    if not obj:
        raise HTTPException(status_code=404, detail="기기를 찾을 수 없습니다.")
    return crud.enrich_device(db, obj)


@router.delete("/{device_id}")
def delete_device(device_id: int, db: Session = Depends(get_db)):
    result = crud.delete_device(db, device_id)
    if not result:
        raise HTTPException(status_code=404, detail="기기를 찾을 수 없습니다.")
    return {"message": "삭제되었습니다."}


@router.get("/{device_id}/service-history")
def get_device_service_history(device_id: int, db: Session = Depends(get_db)):
    obj = crud.get_device(db, device_id)
    if not obj:
        raise HTTPException(status_code=404, detail="기기를 찾을 수 없습니다.")
    items, _ = sh_crud.get_service_histories(db, size=50, device_id=device_id)
    return [sh_crud.enrich_history(db, h) for h in items]
