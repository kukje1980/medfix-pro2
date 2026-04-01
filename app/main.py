import sys
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse

from app.database import engine, Base, SessionLocal
from app.models import Customer, Device, Technician, ServiceRequest, ServiceHistory
from app.routers import customers, devices, technicians, service_requests, service_history, dashboard

logging.basicConfig(stream=sys.stdout, level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        from app.seed import seed_data
        seed_data(db)
        logger.info("Database initialized.")
    except Exception as e:
        logger.error(f"Seed error: {e}")
    finally:
        db.close()
    yield


app = FastAPI(
    title="MedFix Pro - 의료기기 서비스 관리",
    description="의료기기 서비스 관리 시스템 API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# API Routers
app.include_router(dashboard.router, prefix="/api/v1")
app.include_router(customers.router, prefix="/api/v1")
app.include_router(devices.router, prefix="/api/v1")
app.include_router(technicians.router, prefix="/api/v1")
app.include_router(service_requests.router, prefix="/api/v1")
app.include_router(service_history.router, prefix="/api/v1")


# Page Routes
@app.get("/", response_class=HTMLResponse)
async def page_dashboard(request: Request):
    return templates.TemplateResponse("dashboard.html", {"request": request})


@app.get("/customers", response_class=HTMLResponse)
async def page_customers(request: Request):
    return templates.TemplateResponse("customers.html", {"request": request})


@app.get("/devices", response_class=HTMLResponse)
async def page_devices(request: Request):
    return templates.TemplateResponse("devices.html", {"request": request})


@app.get("/technicians", response_class=HTMLResponse)
async def page_technicians(request: Request):
    return templates.TemplateResponse("technicians.html", {"request": request})


@app.get("/service-requests", response_class=HTMLResponse)
async def page_service_requests(request: Request):
    return templates.TemplateResponse("service-requests.html", {"request": request})


@app.get("/service-history", response_class=HTMLResponse)
async def page_service_history(request: Request):
    return templates.TemplateResponse("service-history.html", {"request": request})
