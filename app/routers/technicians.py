from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.technician import TechnicianCreate, TechnicianUpdate, TechnicianResponse, TechnicianListResponse
import app.crud.technician as crud
import app.crud.service_history as sh_crud

router = APIRouter(prefix="/technicians", tags=["기술자"])


@router.get("", response_model=TechnicianListResponse)
def list_technicians(status: str | None = None, db: Session = Depends(get_db)):
    items = crud.get_technicians(db, status=status)
    return {"items": items, "total": len(items)}


@router.post("", response_model=TechnicianResponse, status_code=201)
def create_technician(data: TechnicianCreate, db: Session = Depends(get_db)):
    return crud.create_technician(db, data)


@router.get("/{technician_id}", response_model=TechnicianResponse)
def get_technician(technician_id: int, db: Session = Depends(get_db)):
    obj = crud.get_technician(db, technician_id)
    if not obj:
        raise HTTPException(status_code=404, detail="기술자를 찾을 수 없습니다.")
    return obj


@router.put("/{technician_id}", response_model=TechnicianResponse)
def update_technician(technician_id: int, data: TechnicianUpdate, db: Session = Depends(get_db)):
    obj = crud.update_technician(db, technician_id, data)
    if not obj:
        raise HTTPException(status_code=404, detail="기술자를 찾을 수 없습니다.")
    return obj


@router.delete("/{technician_id}")
def delete_technician(technician_id: int, db: Session = Depends(get_db)):
    result = crud.delete_technician(db, technician_id)
    if not result:
        raise HTTPException(status_code=404, detail="기술자를 찾을 수 없습니다.")
    return {"message": "삭제되었습니다."}


@router.get("/{technician_id}/service-history")
def get_technician_service_history(technician_id: int, db: Session = Depends(get_db)):
    obj = crud.get_technician(db, technician_id)
    if not obj:
        raise HTTPException(status_code=404, detail="기술자를 찾을 수 없습니다.")
    items, _ = sh_crud.get_service_histories(db, size=50, technician_id=technician_id)
    return [sh_crud.enrich_history(db, h) for h in items]


@router.get("/{technician_id}/active-requests")
def get_technician_active_requests(technician_id: int, db: Session = Depends(get_db)):
    obj = crud.get_technician(db, technician_id)
    if not obj:
        raise HTTPException(status_code=404, detail="기술자를 찾을 수 없습니다.")
    from app.models.service_request import ServiceRequest
    import app.crud.service_request as sr_crud
    reqs = (
        db.query(ServiceRequest)
        .filter(
            ServiceRequest.assigned_technician_id == technician_id,
            ServiceRequest.status.in_(["배정", "진행중"]),
        )
        .all()
    )
    return [sr_crud.enrich_request(db, r) for r in reqs]
