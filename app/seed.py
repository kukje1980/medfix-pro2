from datetime import date, timedelta
from sqlalchemy.orm import Session
from app.models.customer import Customer
from app.models.device import Device
from app.models.technician import Technician
from app.models.service_request import ServiceRequest
from app.models.service_history import ServiceHistory


def seed_data(db: Session):
    if db.query(Customer).count() > 0:
        return

    customers = [
        Customer(name="서울대학교병원", contact_person="김영수", phone="02-2072-2114", email="service@snuh.org",
                 address="서울특별시 종로구 대학로 101", hospital_type="상급종합병원"),
        Customer(name="연세세브란스병원", contact_person="이민정", phone="02-2228-0114", email="med@severance.ac.kr",
                 address="서울특별시 서대문구 연세로 50-1", hospital_type="상급종합병원"),
        Customer(name="삼성서울병원", contact_person="박준혁", phone="02-3410-2114", email="device@smc.samsung.com",
                 address="서울특별시 강남구 일원로 81", hospital_type="상급종합병원"),
        Customer(name="강남성모병원", contact_person="최지영", phone="02-2258-5114", email="eq@cmcseoul.or.kr",
                 address="서울특별시 서초구 반포대로 222", hospital_type="종합병원"),
        Customer(name="한양대병원", contact_person="정대한", phone="02-2290-8114", email="med@hanyang.ac.kr",
                 address="서울특별시 성동구 왕십리로 222-1", hospital_type="종합병원"),
        Customer(name="분당서울대학교병원", contact_person="오수진", phone="031-787-7114", email="service@snubh.org",
                 address="경기도 성남시 분당구 구미로 173번길 82", hospital_type="상급종합병원"),
    ]
    for c in customers:
        db.add(c)
    db.flush()

    devices = [
        Device(customer_id=customers[0].id, model_name="LOGIQ E10", manufacturer="GE Healthcare",
               serial_number="GE-US-2021-001", device_type="초음파", status="정상",
               location="1층 초음파실", install_date=date(2021, 3, 15),
               warranty_expiry=date(2024, 3, 15), last_service_date=date(2025, 12, 10)),
        Device(customer_id=customers[0].id, model_name="SOMATOM Definition AS+", manufacturer="Siemens Healthineers",
               serial_number="SIE-CT-2020-007", device_type="CT", status="점검중",
               location="2층 영상의학과", install_date=date(2020, 6, 1),
               warranty_expiry=date(2023, 6, 1), last_service_date=date(2025, 11, 20)),
        Device(customer_id=customers[1].id, model_name="Affiniti 70", manufacturer="Philips",
               serial_number="PHL-US-2022-003", device_type="초음파", status="정상",
               location="3층 심장내과", install_date=date(2022, 1, 20),
               warranty_expiry=date(2025, 1, 20), last_service_date=date(2026, 1, 5)),
        Device(customer_id=customers[1].id, model_name="MAGNETOM Vida 3T", manufacturer="Siemens Healthineers",
               serial_number="SIE-MRI-2019-002", device_type="MRI", status="수리중",
               location="지하1층 MRI실", install_date=date(2019, 9, 10),
               warranty_expiry=date(2022, 9, 10), last_service_date=date(2025, 10, 5)),
        Device(customer_id=customers[2].id, model_name="Revolution CT", manufacturer="GE Healthcare",
               serial_number="GE-CT-2023-005", device_type="CT", status="정상",
               location="2층 영상의학과", install_date=date(2023, 4, 1),
               warranty_expiry=date(2026, 4, 1), last_service_date=date(2026, 2, 15)),
        Device(customer_id=customers[2].id, model_name="CARESTREAM DRX-Evolution", manufacturer="Carestream",
               serial_number="CS-XR-2022-011", device_type="X-Ray", status="정상",
               location="1층 응급의학과", install_date=date(2022, 7, 15),
               warranty_expiry=date(2025, 7, 15)),
        Device(customer_id=customers[3].id, model_name="Acuson Sequoia", manufacturer="Siemens Healthineers",
               serial_number="SIE-US-2023-009", device_type="초음파", status="정상",
               location="2층 산부인과", install_date=date(2023, 2, 1),
               warranty_expiry=date(2026, 2, 1)),
        Device(customer_id=customers[4].id, model_name="INNOVA 3100", manufacturer="GE Healthcare",
               serial_number="GE-ANG-2021-004", device_type="혈관조영", status="정상",
               location="3층 심혈관센터", install_date=date(2021, 11, 1),
               warranty_expiry=date(2024, 11, 1), last_service_date=date(2025, 9, 20)),
        Device(customer_id=customers[5].id, model_name="Optima MR450w 1.5T", manufacturer="GE Healthcare",
               serial_number="GE-MRI-2022-006", device_type="MRI", status="정상",
               location="지하1층 MRI실", install_date=date(2022, 5, 10),
               warranty_expiry=date(2025, 5, 10), last_service_date=date(2026, 1, 20)),
        Device(customer_id=customers[5].id, model_name="BrightSpeed 16", manufacturer="GE Healthcare",
               serial_number="GE-CT-2018-012", device_type="CT", status="폐기",
               location="창고", install_date=date(2018, 3, 1),
               warranty_expiry=date(2021, 3, 1)),
    ]
    for d in devices:
        db.add(d)
    db.flush()

    technicians = [
        Technician(name="홍길동", employee_id="EMP001", phone="010-1234-5678",
                   email="hong@medfix.co.kr", specialization="초음파,X-Ray", status="재직중"),
        Technician(name="김철수", employee_id="EMP002", phone="010-2345-6789",
                   email="kim@medfix.co.kr", specialization="CT,MRI", status="재직중"),
        Technician(name="이영희", employee_id="EMP003", phone="010-3456-7890",
                   email="lee@medfix.co.kr", specialization="MRI,초음파", status="재직중"),
        Technician(name="박민수", employee_id="EMP004", phone="010-4567-8901",
                   email="park@medfix.co.kr", specialization="CT,혈관조영", status="재직중"),
    ]
    for t in technicians:
        db.add(t)
    db.flush()

    today = date.today()
    today_str = date.today().strftime("%Y%m%d")
    service_requests = [
        ServiceRequest(request_number=f"SR-{today_str}-001", device_id=devices[1].id, customer_id=customers[0].id,
                       assigned_technician_id=technicians[1].id,
                       request_type="정기점검", priority="보통", status="진행중",
                       title="CT 정기 점검", description="6개월 정기 점검 일정",
                       scheduled_date=today + timedelta(days=2)),
        ServiceRequest(request_number=f"SR-{today_str}-002", device_id=devices[3].id, customer_id=customers[1].id,
                       assigned_technician_id=technicians[2].id,
                       request_type="고장수리", priority="긴급", status="진행중",
                       title="MRI 그라디언트 코일 이상", description="영상에 노이즈 발생, 그라디언트 코일 점검 필요",
                       scheduled_date=today),
        ServiceRequest(request_number=f"SR-{today_str}-003", device_id=devices[0].id, customer_id=customers[0].id,
                       assigned_technician_id=technicians[0].id,
                       request_type="정기점검", priority="낮음", status="배정",
                       title="초음파 정기 점검", description="연간 정기 점검",
                       scheduled_date=today + timedelta(days=5)),
        ServiceRequest(request_number=f"SR-{today_str}-004", device_id=devices[6].id, customer_id=customers[3].id,
                       request_type="정기점검", priority="보통", status="접수",
                       title="초음파 반기 점검 신청", description="6개월 정기 점검 요청",
                       scheduled_date=today + timedelta(days=10)),
        ServiceRequest(request_number=f"SR-{today_str}-005", device_id=devices[7].id, customer_id=customers[4].id,
                       assigned_technician_id=technicians[3].id,
                       request_type="고장수리", priority="높음", status="완료",
                       title="혈관조영 장비 전원 불안정", description="전원 공급 불안정 증상 수리",
                       scheduled_date=today - timedelta(days=5),
                       completed_date=today - timedelta(days=3)),
        ServiceRequest(request_number=f"SR-{today_str}-006", device_id=devices[4].id, customer_id=customers[2].id,
                       assigned_technician_id=technicians[1].id,
                       request_type="정기점검", priority="보통", status="완료",
                       title="Revolution CT 정기 점검", description="분기 정기 점검 완료",
                       scheduled_date=today - timedelta(days=10),
                       completed_date=today - timedelta(days=8)),
        ServiceRequest(request_number=f"SR-{today_str}-007", device_id=devices[2].id, customer_id=customers[1].id,
                       assigned_technician_id=technicians[0].id,
                       request_type="정기점검", priority="보통", status="완료",
                       title="Affiniti 70 연간 점검", description="연간 예방 점검",
                       scheduled_date=today - timedelta(days=25),
                       completed_date=today - timedelta(days=24)),
        ServiceRequest(request_number=f"SR-{today_str}-008", device_id=devices[8].id, customer_id=customers[5].id,
                       assigned_technician_id=technicians[2].id,
                       request_type="정기점검", priority="보통", status="완료",
                       title="MRI 1.5T 정기 점검", description="반기 정기 점검 완료",
                       scheduled_date=today - timedelta(days=15),
                       completed_date=today - timedelta(days=14)),
    ]
    for sr in service_requests:
        db.add(sr)
    db.flush()

    histories = [
        ServiceHistory(service_request_id=service_requests[4].id, device_id=devices[7].id,
                       technician_id=technicians[3].id, service_date=today - timedelta(days=3),
                       service_type="고장수리", work_performed="전원 공급 장치 교체 및 점검",
                       parts_replaced="전원공급장치(PSU) 1개", labor_hours=4.0,
                       result="정상처리", next_service_date=today + timedelta(days=180)),
        ServiceHistory(service_request_id=service_requests[5].id, device_id=devices[4].id,
                       technician_id=technicians[1].id, service_date=today - timedelta(days=8),
                       service_type="정기점검", work_performed="필터 청소, 캘리브레이션, 소프트웨어 업데이트",
                       parts_replaced="에어필터 2개", labor_hours=3.5,
                       result="정상처리", next_service_date=today + timedelta(days=90)),
        ServiceHistory(service_request_id=service_requests[6].id, device_id=devices[2].id,
                       technician_id=technicians[0].id, service_date=today - timedelta(days=24),
                       service_type="정기점검", work_performed="프로브 점검, 이미지 품질 테스트, 전기안전 점검",
                       labor_hours=2.5, result="정상처리", next_service_date=today + timedelta(days=365)),
        ServiceHistory(service_request_id=service_requests[7].id, device_id=devices[8].id,
                       technician_id=technicians[2].id, service_date=today - timedelta(days=14),
                       service_type="정기점검", work_performed="냉각 시스템 점검, 헬륨 레벨 확인, RF 코일 점검",
                       labor_hours=5.0, result="정상처리", next_service_date=today + timedelta(days=180)),
    ]
    for h in histories:
        db.add(h)

    db.commit()
