"""
Excel 파일 파서 — parts / part_deals 데이터 추출

지원 형식:
  1. JSON seed 형식과 동일한 구조를 가진 Excel (parts 시트 + deals 시트)
  2. 납품내역 중심 단일 시트 (행마다 부품+납품 정보)
  3. 부품 마스터 단일 시트
"""
from __future__ import annotations
import io
from datetime import date, datetime
from openpyxl import load_workbook
from app.schemas.part import SeedData, SeedRow, SeedDealRow

# ── 컬럼명 매핑 (한글/영문 모두 지원) ──────────────────────────────
PART_COL = {
    "회사": "company", "제조사": "company", "company": "company",
    "형명": "category", "분류": "category", "카테고리": "category", "category": "category",
    "모델": "model", "모델명": "model", "model": "model",
    "품번": "part_code", "부품코드": "part_code", "품목코드": "part_code",
    "파트번호": "part_code", "part_code": "part_code", "part code": "part_code",
    "품명": "part_name", "부품명": "part_name", "part_name": "part_name", "part name": "part_name",
    "원가": "cost_avg", "원가(원)": "cost_avg", "cost_avg": "cost_avg",
    "로컬가": "local_price", "로컬": "local_price", "로컬(만)": "local_price",
    "local_price": "local_price",
    "대학가": "univ_price", "종병가": "univ_price", "대학(만)": "univ_price",
    "univ_price": "univ_price",
    "증상": "symptom", "교체증상": "symptom", "symptom": "symptom",
    "증상상세": "symptom_detail", "증상설명": "symptom_detail",
    "symptom_detail": "symptom_detail",
    "위치": "symptom_location", "교체위치": "symptom_location",
    "납품건수": "deal_count", "거래수": "deal_count", "deal_count": "deal_count",
    "평균단가": "avg_price", "avg_price": "avg_price",
    "최저단가": "min_price", "min_price": "min_price",
    "최고단가": "max_price", "max_price": "max_price",
}

DEAL_COL = {
    "병원": "hospital", "병원명": "hospital", "거래처": "hospital", "hospital": "hospital",
    "납품일": "deal_date", "날짜": "deal_date", "deal_date": "deal_date",
    "수량": "quantity", "quantity": "quantity",
    "납품가": "deal_price", "납품단가": "deal_price", "deal_price": "deal_price",
    "실원가": "cost_price", "원가_납품": "cost_price", "cost_price": "cost_price",
    "품번": "part_code", "부품코드": "part_code", "품목코드": "part_code",
    "파트번호": "part_code", "part_code": "part_code",
    # 복합 시트용 (부품 컬럼과 중복될 수 있어 alias 사용)
    "회사": "company", "company": "company",
    "모델": "model", "모델명": "model", "model": "model",
}


def _norm(v) -> str:
    return str(v).strip().lower() if v is not None else ""


def _to_int(v) -> int | None:
    if v is None:
        return None
    try:
        return int(float(str(v).replace(",", "").strip()))
    except (ValueError, TypeError):
        return None


def _to_date(v) -> date | None:
    if v is None:
        return None
    if isinstance(v, (date, datetime)):
        return v.date() if isinstance(v, datetime) else v
    s = str(v).strip()
    for fmt in ("%Y-%m-%d", "%Y.%m.%d", "%Y/%m/%d", "%m/%d/%Y"):
        try:
            return datetime.strptime(s, fmt).date()
        except ValueError:
            continue
    return None


def _sheet_col_map(sheet, col_defs: dict) -> dict[str, int]:
    """첫 행을 헤더로 읽어 컬럼명 → 인덱스 매핑 반환"""
    header = [_norm(cell.value) for cell in next(sheet.iter_rows(min_row=1, max_row=1))]
    mapping: dict[str, int] = {}
    for idx, h in enumerate(header):
        if h in col_defs:
            field = col_defs[h]
            if field not in mapping:  # 처음 만난 컬럼 우선
                mapping[field] = idx
    return mapping


def _rows_to_parts(sheet) -> list[SeedRow]:
    col = _sheet_col_map(sheet, PART_COL)
    parts: list[SeedRow] = []
    for row in sheet.iter_rows(min_row=2, values_only=True):
        if all(v is None for v in row):
            continue
        get = lambda f: row[col[f]] if f in col else None  # noqa: E731
        company = str(get("company") or "").strip()
        part_code = str(get("part_code") or "").strip()
        part_name = str(get("part_name") or "").strip()
        if not company or not part_code or not part_name:
            continue
        parts.append(SeedRow(
            company=company,
            category=str(get("category") or "").strip() or "기타",
            model=str(get("model") or "").strip() or "기타",
            part_code=part_code,
            part_name=part_name,
            cost_avg=_to_int(get("cost_avg")),
            local_price=_to_int(get("local_price")),
            univ_price=_to_int(get("univ_price")),
            symptom=str(get("symptom") or "").strip() or None,
            symptom_detail=str(get("symptom_detail") or "").strip() or None,
            symptom_location=str(get("symptom_location") or "").strip() or None,
            deal_count=_to_int(get("deal_count")) or 0,
            avg_price=_to_int(get("avg_price")),
            min_price=_to_int(get("min_price")),
            max_price=_to_int(get("max_price")),
        ))
    return parts


def _rows_to_deals(sheet) -> list[SeedDealRow]:
    col = _sheet_col_map(sheet, DEAL_COL)
    deals: list[SeedDealRow] = []
    for row in sheet.iter_rows(min_row=2, values_only=True):
        if all(v is None for v in row):
            continue
        get = lambda f: row[col[f]] if f in col else None  # noqa: E731
        part_code = str(get("part_code") or "").strip()
        if not part_code:
            continue
        deals.append(SeedDealRow(
            part_code=part_code,
            company=str(get("company") or "").strip() or None,
            model=str(get("model") or "").strip() or None,
            hospital=str(get("hospital") or "").strip() or None,
            deal_date=_to_date(get("deal_date")),
            quantity=_to_int(get("quantity")) or 1,
            deal_price=_to_int(get("deal_price")),
            cost_price=_to_int(get("cost_price")),
        ))
    return deals


# ── 복합 시트 파서 (한 시트에 부품+납품 정보) ─────────────────────
def _parse_combined(sheet) -> tuple[list[SeedRow], list[SeedDealRow]]:
    """
    한 시트에 부품 정보와 납품 정보가 함께 있는 경우.
    동일 part_code 행들을 묶어 부품 마스터를 생성하고, 납품 행을 추출.
    """
    all_col = {**PART_COL, **DEAL_COL}
    col = _sheet_col_map(sheet, all_col)

    part_map: dict[str, SeedRow] = {}
    deals: list[SeedDealRow] = []

    for row in sheet.iter_rows(min_row=2, values_only=True):
        if all(v is None for v in row):
            continue
        get = lambda f: row[col[f]] if f in col else None  # noqa: E731

        part_code = str(get("part_code") or "").strip()
        part_name = str(get("part_name") or "").strip()
        company = str(get("company") or "").strip()

        if not part_code:
            continue

        # 부품 마스터 (처음 등장 시 등록)
        if part_code not in part_map and part_name and company:
            part_map[part_code] = SeedRow(
                company=company,
                category=str(get("category") or "").strip() or "기타",
                model=str(get("model") or "").strip() or "기타",
                part_code=part_code,
                part_name=part_name,
                cost_avg=_to_int(get("cost_avg")),
                local_price=_to_int(get("local_price")),
                univ_price=_to_int(get("univ_price")),
                symptom=str(get("symptom") or "").strip() or None,
                symptom_detail=str(get("symptom_detail") or "").strip() or None,
                symptom_location=str(get("symptom_location") or "").strip() or None,
                deal_count=0,
                avg_price=None,
                min_price=None,
                max_price=None,
            )

        # 납품 내역 (병원 컬럼이 있는 경우)
        hospital = str(get("hospital") or "").strip()
        deal_price = _to_int(get("deal_price"))
        deal_date = _to_date(get("deal_date"))
        if hospital or deal_price or deal_date:
            deals.append(SeedDealRow(
                part_code=part_code,
                company=company or None,
                model=str(get("model") or "").strip() or None,
                hospital=hospital or None,
                deal_date=deal_date,
                quantity=_to_int(get("quantity")) or 1,
                deal_price=deal_price,
                cost_price=_to_int(get("cost_price")),
            ))

    return list(part_map.values()), deals


def parse_parts_excel(file_obj: io.BytesIO) -> SeedData:
    wb = load_workbook(file_obj, read_only=True, data_only=True)
    sheet_names_lower = {s.lower(): s for s in wb.sheetnames}

    parts: list[SeedRow] = []
    deals: list[SeedDealRow] = []

    # 시트 이름으로 판단
    part_sheet_key = next((k for k in sheet_names_lower if "부품" in k or "part" in k), None)
    deal_sheet_key = next((k for k in sheet_names_lower if "납품" in k or "deal" in k or "거래" in k), None)

    if part_sheet_key:
        parts = _rows_to_parts(wb[sheet_names_lower[part_sheet_key]])
    if deal_sheet_key:
        deals = _rows_to_deals(wb[sheet_names_lower[deal_sheet_key]])

    # 전용 시트가 없으면 첫 번째 시트를 복합 시트로 파싱
    if not parts:
        first_sheet = wb[wb.sheetnames[0]]
        col = _sheet_col_map(first_sheet, {**PART_COL, **DEAL_COL})
        has_hospital = "hospital" in col
        if has_hospital:
            parts, deals = _parse_combined(first_sheet)
        else:
            parts = _rows_to_parts(first_sheet)

    wb.close()
    return SeedData(parts=parts, deals=deals)
