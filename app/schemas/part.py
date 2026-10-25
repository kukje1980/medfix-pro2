from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel


class PartBase(BaseModel):
    company: str
    category: str
    model: str
    part_code: str
    part_name: str
    cost_avg: Optional[int] = None
    local_price: Optional[int] = None
    univ_price: Optional[int] = None
    symptom: Optional[str] = None
    symptom_detail: Optional[str] = None
    symptom_location: Optional[str] = None


class PartCreate(PartBase):
    pass


class PartUpdate(BaseModel):
    company: Optional[str] = None
    category: Optional[str] = None
    model: Optional[str] = None
    part_code: Optional[str] = None
    part_name: Optional[str] = None
    cost_avg: Optional[int] = None
    local_price: Optional[int] = None
    univ_price: Optional[int] = None
    symptom: Optional[str] = None
    symptom_detail: Optional[str] = None
    symptom_location: Optional[str] = None


class PartResponse(PartBase):
    id: int
    deal_count: int = 0
    avg_price: Optional[int] = None
    min_price: Optional[int] = None
    max_price: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PartListResponse(BaseModel):
    items: List[PartResponse]
    total: int
    page: int
    size: int
    pages: int


class PartDealCreate(BaseModel):
    hospital: Optional[str] = None
    deal_date: Optional[date] = None
    quantity: int = 1
    deal_price: Optional[int] = None
    cost_price: Optional[int] = None


class PartDealResponse(PartDealCreate):
    id: int
    part_id: int
    company: Optional[str] = None
    model: Optional[str] = None
    part_code: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class TreeNode(BaseModel):
    company: str
    categories: List[dict]


class SeedRow(BaseModel):
    company: str
    category: str
    model: str
    part_code: str
    part_name: str
    cost_avg: Optional[int] = None
    local_price: Optional[int] = None
    univ_price: Optional[int] = None
    symptom: Optional[str] = None
    symptom_detail: Optional[str] = None
    symptom_location: Optional[str] = None
    deal_count: Optional[int] = 0
    avg_price: Optional[int] = None
    min_price: Optional[int] = None
    max_price: Optional[int] = None


class SeedDealRow(BaseModel):
    part_code: str
    company: Optional[str] = None
    model: Optional[str] = None
    hospital: Optional[str] = None
    deal_date: Optional[date] = None
    quantity: Optional[int] = 1
    deal_price: Optional[int] = None
    cost_price: Optional[int] = None


class SeedData(BaseModel):
    parts: List[SeedRow]
    deals: Optional[List[SeedDealRow]] = []
