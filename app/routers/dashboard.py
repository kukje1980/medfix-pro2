from datetime import date, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.device import Device
from app.models.service_request import ServiceRequest
from app.models.technician import Technician
from app.models.service_history import ServiceHistory
import app.crud.service_request as sr_crud

router = APIRouter(prefix="/dashboard", tags=["대시보드"])


@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    total_devices = db.query(Device).count()
    status_counts = (
        db.query(Device.status, func.count(Device.id).label("cnt"))
        .group_by(Device.status)
        .all()
    )
    device_status = {row.status: row.cnt for row in status_counts}

    open_requests = db.query(ServiceRequest).filter(ServiceRequest.status.in_(["접수", "배정", "진행중"])).count()

    today = date.today()
    month_start = today.replace(day=1)
    completed_this_month = (
        db.query(ServiceRequest)
        .filter(ServiceRequest.status == "완료", ServiceRequest.completed_date >= month_start)
        .count()
    )

    active_technicians = db.query(Technician).filter(Technician.status == "재직중").count()

    return {
        "total_devices": total_devices,
        "device_status": device_status,
        "open_requests": open_requests,
        "completed_this_month": completed_this_month,
        "active_technicians": active_technicians,
    }


@router.get("/recent-requests")
def get_recent_requests(db: Session = Depends(get_db)):
    items, _ = sr_crud.get_service_requests(db, page=1, size=10)
    return [sr_crud.enrich_request(db, r) for r in items]


@router.get("/upcoming-services")
def get_upcoming_services(db: Session = Depends(get_db)):
    today = date.today()
    week_later = today + timedelta(days=7)
    items = (
        db.query(ServiceRequest)
        .filter(
            ServiceRequest.scheduled_date >= today,
            ServiceRequest.scheduled_date <= week_later,
            ServiceRequest.status.in_(["접수", "배정", "진행중"]),
        )
        .order_by(ServiceRequest.scheduled_date)
        .limit(20)
        .all()
    )
    return [sr_crud.enrich_request(db, r) for r in items]
