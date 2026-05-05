import math
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from app.models.part import Part, PartDeal, PartMoveLog
from app.schemas.part import PartCreate, PartUpdate, PartDealCreate, SeedData


def get_parts(
    db: Session,
    page: int = 1,
    size: int = 50,
    search: str | None = None,
    company: str | None = None,
    category: str | None = None,
    model: str | None = None,
    sort_by: str = "deal_count",
):
    q = db.query(Part)
    if search:
        q = q.filter(
            or_(
                Part.part_code.ilike(f"%{search}%"),
                Part.part_name.ilike(f"%{search}%"),
                Part.model.ilike(f"%{search}%"),
                Part.company.ilike(f"%{search}%"),
                Part.symptom.ilike(f"%{search}%"),
            )
        )
    if company:
        q = q.filter(Part.company == company)
    if category:
        q = q.filter(Part.category == category)
    if model:
        q = q.filter(Part.model == model)
    total = q.count()
    sort_col = {
        "deal_count": Part.deal_count.desc(),
        "part_code": Part.part_code.asc(),
        "part_name": Part.part_name.asc(),
    }.get(sort_by, Part.deal_count.desc())
    items = q.order_by(sort_col, Part.part_code).offset((page - 1) * size).limit(size).all()
    return items, total


def get_part(db: Session, part_id: int):
    return db.query(Part).filter(Part.id == part_id).first()


def create_part(db: Session, data: PartCreate):
    obj = Part(**data.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def update_part(db: Session, part_id: int, data: PartUpdate):
    obj = get_part(db, part_id)
    if not obj:
        return None
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj


def delete_part(db: Session, part_id: int):
    obj = get_part(db, part_id)
    if not obj:
        return False
    db.delete(obj)
    db.commit()
    return True


def get_tree(db: Session):
    rows = db.query(
        Part.company, Part.category, Part.model,
        func.count(Part.id).label("part_count"),
        func.sum(Part.deal_count).label("deal_sum"),
    ).group_by(Part.company, Part.category, Part.model).all()

    tree: dict = {}
    for company, category, model, part_count, deal_sum in rows:
        ds = deal_sum or 0
        if company not in tree:
            tree[company] = {}
        if category not in tree[company]:
            tree[company][category] = {}
        tree[company][category][model] = ds

    result = []
    for company, cats in tree.items():
        cat_list = []
        for category, models in cats.items():
            model_list = sorted(
                [{"model": m, "count": c} for m, c in models.items()],
                key=lambda x: x["count"], reverse=True
            )
            cat_list.append({
                "category": category,
                "models": model_list,
                "count": sum(m["count"] for m in model_list),
            })
        cat_list.sort(key=lambda x: x["count"], reverse=True)
        result.append({
            "company": company,
            "categories": cat_list,
            "count": sum(c["count"] for c in cat_list),
        })
    result.sort(key=lambda x: x["count"], reverse=True)
    return result


def get_deals(db: Session, part_id: int, hospital: str | None = None):
    q = db.query(PartDeal).filter(PartDeal.part_id == part_id)
    if hospital:
        q = q.filter(PartDeal.hospital.ilike(f"%{hospital}%"))
    return q.order_by(PartDeal.deal_date.desc()).all()


def add_deal(db: Session, part_id: int, data: PartDealCreate):
    part = get_part(db, part_id)
    if not part:
        return None
    deal = PartDeal(
        part_id=part_id,
        company=part.company,
        model=part.model,
        part_code=part.part_code,
        **data.model_dump(),
    )
    db.add(deal)
    _recalc_deal_stats(db, part)
    db.commit()
    db.refresh(deal)
    return deal


def delete_deal(db: Session, deal_id: int):
    deal = db.query(PartDeal).filter(PartDeal.id == deal_id).first()
    if not deal:
        return False
    part_id = deal.part_id
    db.delete(deal)
    part = get_part(db, part_id)
    if part:
        _recalc_deal_stats(db, part)
    db.commit()
    return True


def _recalc_deal_stats(db: Session, part: Part):
    deals = db.query(PartDeal).filter(PartDeal.part_id == part.id, PartDeal.deal_price != None).all()
    prices = [d.deal_price for d in deals if d.deal_price]
    part.deal_count = len(deals)
    if prices:
        part.avg_price = int(sum(prices) / len(prices))
        part.min_price = min(prices)
        part.max_price = max(prices)
    else:
        part.avg_price = None
        part.min_price = None
        part.max_price = None


def seed_parts(db: Session, data: SeedData):
    inserted_parts = 0
    inserted_deals = 0
    skipped = 0

    part_code_map: dict[str, int] = {}

    for row in data.parts:
        existing = db.query(Part).filter(
            Part.part_code == row.part_code,
            Part.company == row.company,
            Part.model == row.model,
        ).first()
        if existing:
            part_code_map[row.part_code] = existing.id
            skipped += 1
            continue
        p = Part(
            company=row.company,
            category=row.category,
            model=row.model,
            part_code=row.part_code,
            part_name=row.part_name,
            cost_avg=row.cost_avg,
            local_price=row.local_price,
            univ_price=row.univ_price,
            symptom=row.symptom,
            symptom_detail=row.symptom_detail,
            symptom_location=row.symptom_location,
            deal_count=row.deal_count or 0,
            avg_price=row.avg_price,
            min_price=row.min_price,
            max_price=row.max_price,
        )
        db.add(p)
        db.flush()
        part_code_map[row.part_code] = p.id
        inserted_parts += 1

    affected_part_ids: set[int] = set()
    if data.deals:
        for d in data.deals:
            pid = part_code_map.get(d.part_code)
            if not pid:
                continue
            deal = PartDeal(
                part_id=pid,
                company=d.company,
                model=d.model,
                part_code=d.part_code,
                hospital=d.hospital,
                deal_date=d.deal_date,
                quantity=d.quantity or 1,
                deal_price=d.deal_price,
                cost_price=d.cost_price,
            )
            db.add(deal)
            inserted_deals += 1
            affected_part_ids.add(pid)

    # 거래가 추가된 부품의 deal_count/avg_price/min_price/max_price 재계산
    if affected_part_ids:
        db.flush()
        for pid in affected_part_ids:
            part = db.query(Part).filter(Part.id == pid).first()
            if part:
                _recalc_deal_stats(db, part)

    db.commit()
    return {"parts": inserted_parts, "deals": inserted_deals, "skipped": skipped}
