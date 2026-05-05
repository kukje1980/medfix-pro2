"""
Excel 파일 파서 — parts / part_deals 데이터 추출

지원 형식:
  1. 비정규화(denormalized) 형식:
     - 열 A(시리즈/모델), B(직품모델), C(품목코드), D(품명), E(거래수),
       F(원가), G(로컬가), H(종병가), I(교체증상), J(상세설명), K(교체위치),
       L(병원명/거래처), M(납품일), N(수량), O(납품단가), P(원가)
     - 품목코드(C)가 있는 행 = 부품 마스터 (+ 납품 첫 행 겸용 가능)
     - 품목코드(C)가 없고 병원(L)이 있는 행 = 이전 부품의 납품 내역
  2. 정규화된 시트 형식 (부품 시트 + 납품 시트 분리)
  3. JSON seed 형식
"""
from __future__ import annotations
import io
from datetime import date, datetime
from openpyxl import load_workbook
from app.schemas.part import SeedData, SeedRow, SeedDealRow


# ── 회사/카테고리 분류 규칙 ──────────────────────────────────────────
# (키워드 lower match, 앞쪽 규칙 우선)
SERIES_RULES: list[tuple[str, str, list[str]]] = [
    # KOWA (Japan)
    ("KOWA (Japan)", "Fundus Camera (NONMYD 시리즈)", ["nonmyd"]),
    ("KOWA (Japan)", "Fundus Camera (VX 시리즈)",    ["vx-10", "vx-20", "vx 10", "vx series", "fundus camera (vx"]),
    ("KOWA (Japan)", "Fundus Camera (GENESIS 시리즈)", ["genesis"]),
    ("KOWA (Japan)", "Fundus Camera",               ["fundus"]),
    ("KOWA (Japan)", "Slit Lamp (세극등)",           ["slit lamp", "세극등"]),
    ("KOWA (Japan)", "Tonometer (안압계)",           ["tonometer", "안압계"]),
    ("KOWA (Japan)", "Perimeter (시야계)",           ["perimeter", "시야계"]),
    ("KOWA (Japan)", "Indirect Ophthalmoscope (도상검안경)", ["indirect ophthalmoscope", "도상검안경"]),
    ("KOWA (Japan)", "Digital Conversion (디지털 변환)", ["digital conversion", "디지털 변환"]),
    # A.R.C. Laser (Germany)
    ("A.R.C. Laser (Germany)", "Laser Fiber/Probe (파이버/프로브)",
     ["lipolysis", "cyclophoto", "endo probe", "laser fiber", "laser probe", "bare fiber", "fiber"]),
    ("A.R.C. Laser (Germany)", "Laser (레이저)",
     ["q-las", "fox q", "classic (laser)", "classic laser", "safety filter", "safety goggle",
      "goggle", "foot switch q", "laser table", "laser filter", "laser"]),
    # KONAN (Japan)
    ("KONAN (Japan)", "Specular Microscope", ["konan", "specular", "nsp-", "nsp ", "cellchek", "sp-"]),
    # KEELER (UK)
    ("KEELER (UK)", "Loupe",                 ["loupe"]),
    ("KEELER (UK)", "Slit Lamp",             ["keeler slit", "psl-"]),
    ("KEELER (UK)", "Indirect Ophthalmoscope", ["vantageplus", "api ii", "symphony", "indirect"]),
    ("KEELER (UK)", "Accessories",           ["keeler", "handle", "charger", "battery"]),
    # Phaco Handpiece
    ("Phaco Handpiece (해외)", "Handpiece",
     ["handpiece", "phaco", "infiniti", "centurion", "sovereign", "legacy", "millennium", "stellaris"]),
    # Camera/주변기기
    ("Camera/주변기기", "Camera",            ["ccd camera", "camera"]),
    ("Camera/주변기기", "Accessories",       ["monitor", "printer", "video"]),
    # NewEyesTech
    ("NewEyesTech", "Digital Adapters",     ["beam splitter", "video adapter", "camera adapter", "neweyes"]),
    ("NewEyesTech", "Digital Conversion",   ["digital"]),
]


def _classify_series(series: str) -> tuple[str, str]:
    """시리즈명 → (company, category) 반환"""
    low = series.lower()
    for company, category, keywords in SERIES_RULES:
        if any(kw in low for kw in keywords):
            return company, category
    return "기타", "기타"


# ── 유틸리티 ────────────────────────────────────────────────────────
def _clean(v) -> str:
    return str(v).strip() if v is not None else ""


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
    if isinstance(v, datetime):
        return v.date()
    if isinstance(v, date):
        return v
    s = str(v).strip()
    for fmt in ("%Y-%m-%d", "%Y.%m.%d", "%Y/%m/%d", "%m/%d/%Y", "%Y년 %m월 %d일"):
        try:
            return datetime.strptime(s, fmt).date()
        except ValueError:
            continue
    return None


# ── 컬럼명 매핑 ──────────────────────────────────────────────────────
# 헤더 셀 값 (정규화된 lower) → 내부 필드명
HEADER_MAP: dict[str, str] = {
    # 부품 마스터
    "시리즈": "series", "series": "series",
    "직품모델": "model2", "제품모델": "model2",
    "품목코드": "part_code", "품번": "part_code", "파트번호": "part_code", "part_code": "part_code", "part code": "part_code",
    "품명": "part_name", "부품명": "part_name", "part_name": "part_name", "part name": "part_name",
    "거래수": "deal_count", "가래수": "deal_count", "납품건수": "deal_count", "deal_count": "deal_count",
    "원가(원)": "cost_avg", "원가": "cost_avg", "금액": "cost_avg", "cost_avg": "cost_avg",
    "로컬가": "local_price", "로컬": "local_price", "로컬(만)": "local_price", "local_price": "local_price",
    "종병가": "univ_price", "대학가": "univ_price", "종합병원가": "univ_price",
    "대학(만)": "univ_price", "종병(만)": "univ_price", "univ_price": "univ_price",
    "교체 증상": "symptom", "교체증상": "symptom", "증상": "symptom", "symptom": "symptom",
    "상세 설명": "symptom_detail", "상세설명": "symptom_detail", "symptom_detail": "symptom_detail",
    "교체 위치": "symptom_location", "교체위치": "symptom_location",
    "교체 위": "symptom_location", "교체위": "symptom_location",
    # 납품 내역
    "병원명/거래처": "hospital", "병원명": "hospital", "병원": "hospital",
    "거래처": "hospital", "hospital": "hospital",
    "납품일": "deal_date", "deal_date": "deal_date",
    "수량": "quantity", "quantity": "quantity",
    "납품단가(원)": "deal_price", "납품단가": "deal_price", "납품가": "deal_price",
    "deal_price": "deal_price",
    "원가_납품": "cost_price", "cost_price": "cost_price",
}


def _build_col_index(sheet) -> dict[str, int]:
    """첫 행 헤더 → {field: col_index} 매핑"""
    header_row = list(sheet.iter_rows(min_row=1, max_row=1, values_only=True))[0]
    col_idx: dict[str, int] = {}
    for i, cell in enumerate(header_row):
        if cell is None:
            continue
        norm = str(cell).strip().lower()
        field = HEADER_MAP.get(norm)
        if field and field not in col_idx:
            col_idx[field] = i
    return col_idx


# ── 비정규화 형식 파서 ────────────────────────────────────────────────
def _parse_denormalized(sheet, company_override: str | None = None) -> tuple[list[SeedRow], list[SeedDealRow]]:
    """
    한 시트에 부품 마스터 + 납품 내역이 섞인 형식.
    - 품목코드(C) 있는 행 → 부품 마스터 + 납품 첫 건 가능
    - 품목코드(C) 없고 병원(L) 있는 행 → 이전 부품의 납품 내역
    """
    col = _build_col_index(sheet)

    # col_idx 기반 getter; 없으면 None
    def get(row, field):
        idx = col.get(field)
        return row[idx] if idx is not None and idx < len(row) else None

    # 위치 기반 fallback (헤더가 없거나 매핑 실패 시)
    def get_pos(row, *positions):
        for p in positions:
            if p < len(row) and row[p] is not None:
                val = str(row[p]).strip()
                if val:
                    return row[p]
        return None

    parts: dict[str, SeedRow] = {}
    deals: list[SeedDealRow] = []
    current_code: str | None = None
    current_series: str | None = None

    for row in sheet.iter_rows(min_row=2, values_only=True):
        if all(v is None for v in row):
            continue

        # series = col A (항상 있음)
        series_val = get(row, "series") or (row[0] if len(row) > 0 else None)
        series = _clean(series_val)

        part_code = _clean(get(row, "part_code") or "")
        part_name = _clean(get(row, "part_name") or "")
        hospital = _clean(get(row, "hospital") or "")
        deal_date_raw = get(row, "deal_date")
        deal_price_raw = get(row, "deal_price")

        # ── 부품 마스터 행 ──
        if part_code and part_code not in parts:
            company, category = _classify_series(series)
            if company_override:
                company = company_override

            parts[part_code] = SeedRow(
                company=company,
                category=category,
                model=series or "기타",
                part_code=part_code,
                part_name=part_name or part_code,
                cost_avg=_to_int(get(row, "cost_avg")),
                local_price=_to_int(get(row, "local_price")),
                univ_price=_to_int(get(row, "univ_price")),
                symptom=_clean(get(row, "symptom") or "") or None,
                symptom_detail=_clean(get(row, "symptom_detail") or "") or None,
                symptom_location=_clean(get(row, "symptom_location") or "") or None,
                deal_count=_to_int(get(row, "deal_count")) or 0,
                avg_price=None,
                min_price=None,
                max_price=None,
            )
            current_code = part_code
            current_series = series

        elif part_code and part_code in parts:
            # 이미 등록된 부품 코드면 current 갱신만
            current_code = part_code
            current_series = series

        elif series and not part_code:
            # 품목코드 없는 행: 시리즈는 있고 이전 부품과 같은 시리즈면 유지
            if series != current_series:
                # 시리즈가 바뀌었는데 코드가 없으면 current 초기화
                current_code = None
                current_series = series

        # ── 납품 내역 행 ──
        if current_code and (hospital or deal_date_raw or deal_price_raw):
            deal_date = _to_date(deal_date_raw)
            deal_price = _to_int(deal_price_raw)
            cost_price_raw = get(row, "cost_price")

            # 원가 컬럼이 별도로 없으면 비용 컬럼에서 폴백
            if cost_price_raw is None:
                cost_price_raw = get(row, "cost_avg")

            deals.append(SeedDealRow(
                part_code=current_code,
                hospital=hospital or None,
                deal_date=deal_date,
                quantity=_to_int(get(row, "quantity")) or 1,
                deal_price=deal_price,
                cost_price=_to_int(cost_price_raw),
            ))

    return list(parts.values()), deals


# ── 정규화 형식 파서 ────────────────────────────────────────────────
def _parse_parts_sheet(sheet) -> list[SeedRow]:
    col = _build_col_index(sheet)
    parts = []
    for row in sheet.iter_rows(min_row=2, values_only=True):
        if all(v is None for v in row):
            continue
        def get(f): return col.get(f) and row[col[f]] if col.get(f) is not None and col[f] < len(row) else None  # noqa
        series = _clean(get("series") or "")
        part_code = _clean(get("part_code") or "")
        part_name = _clean(get("part_name") or "")
        company_raw = _clean(get("company") or "")
        category_raw = _clean(get("category") or "")
        if not part_code or not part_name:
            continue
        if company_raw:
            company, category = company_raw, category_raw or "기타"
        else:
            company, category = _classify_series(series)
            if not category:
                category = category_raw or "기타"
        parts.append(SeedRow(
            company=company,
            category=category,
            model=series or category_raw or "기타",
            part_code=part_code,
            part_name=part_name,
            cost_avg=_to_int(get("cost_avg")),
            local_price=_to_int(get("local_price")),
            univ_price=_to_int(get("univ_price")),
            symptom=_clean(get("symptom") or "") or None,
            symptom_detail=_clean(get("symptom_detail") or "") or None,
            symptom_location=_clean(get("symptom_location") or "") or None,
            deal_count=_to_int(get("deal_count")) or 0,
            avg_price=_to_int(get("avg_price")),
            min_price=_to_int(get("min_price")),
            max_price=_to_int(get("max_price")),
        ))
    return parts


def _parse_deals_sheet(sheet) -> list[SeedDealRow]:
    col = _build_col_index(sheet)
    deals = []
    for row in sheet.iter_rows(min_row=2, values_only=True):
        if all(v is None for v in row):
            continue
        def get(f): return row[col[f]] if col.get(f) is not None and col[f] < len(row) else None  # noqa
        part_code = _clean(get("part_code") or "")
        if not part_code:
            continue
        deals.append(SeedDealRow(
            part_code=part_code,
            hospital=_clean(get("hospital") or "") or None,
            deal_date=_to_date(get("deal_date")),
            quantity=_to_int(get("quantity")) or 1,
            deal_price=_to_int(get("deal_price")),
            cost_price=_to_int(get("cost_price")),
        ))
    return deals


# ── 진입점 ────────────────────────────────────────────────────────────
def parse_parts_excel(
    file_obj: io.BytesIO,
    company_override: str | None = None,
) -> SeedData:
    wb = load_workbook(file_obj, read_only=True, data_only=True)
    sheet_names = wb.sheetnames
    names_lower = {s.lower(): s for s in sheet_names}

    parts: list[SeedRow] = []
    deals: list[SeedDealRow] = []

    # 전용 시트 탐색 (부품 / 납품 키워드)
    part_key = next((k for k in names_lower if "부품" in k and "납품" not in k), None)
    deal_key = next((k for k in names_lower if "납품" in k or "deal" in k or "거래" in k), None)

    if part_key:
        parts = _parse_parts_sheet(wb[names_lower[part_key]])
    if deal_key:
        deals = _parse_deals_sheet(wb[names_lower[deal_key]])

    # 전용 시트 없으면 → 각 시트를 비정규화 형식으로 파싱
    if not parts:
        for sheet_name in sheet_names:
            sheet = wb[sheet_name]
            col = _build_col_index(sheet)
            # 병원 컬럼이 있으면 비정규화 형식으로 판단
            if "hospital" in col or "series" in col or "part_code" in col:
                p, d = _parse_denormalized(sheet, company_override)
                parts.extend(p)
                deals.extend(d)
            else:
                # 열 위치로 비정규화 파싱 시도
                p, d = _parse_denormalized(sheet, company_override)
                if p:
                    parts.extend(p)
                    deals.extend(d)

    wb.close()
    # 중복 제거 (part_code 기준 첫 번째 우선)
    seen: set[str] = set()
    unique_parts = []
    for p in parts:
        if p.part_code not in seen:
            seen.add(p.part_code)
            unique_parts.append(p)

    return SeedData(parts=unique_parts, deals=deals)
