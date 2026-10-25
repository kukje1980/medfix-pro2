# MedFix Pro (KJST 의료기기 서비스 관리) — 버전 목록

각 버전은 아래 커밋 시점의 소스 전체입니다. 해당 버전의 zip 은 "소스 다운로드" 링크로 바로 받을 수 있습니다
(GitHub 로그인이 필요할 수 있음). 웹 앱이므로 압축을 풀고 `pip install -r requirements.txt` → `python run.py` 로 실행합니다.

| 버전 | 날짜 | 주요 변경 | 커밋 | 소스 다운로드 |
|---|---|---|---|---|
| v1.0 | 2026-04-01 | 의료기기 서비스 관리 프로그램 초기 구현 (대시보드·고객·장비·기술자·서비스 요청·이력) | `da86e68` | [zip](https://github.com/kukje1980/medfix-pro2/archive/da86e68f248a287f3c97edd07de35a1562e3b0b1.zip) |
| v1.1 | 2026-04-28 | 노란색 테마, 앱 이름 KJST 변경, Render/Vercel 배포 설정 | `2edd4ae` | [zip](https://github.com/kukje1980/medfix-pro2/archive/2edd4ae488fb5766f7b5ba7a2b2d3b054bfc7387.zip) |
| v1.2 | 2026-05-02 | 부품관리 탭 구현 | `b64f068` | [zip](https://github.com/kukje1980/medfix-pro2/archive/b64f068cc17ccb27df5fc816ed6352666d02111c.zip) |
| v1.3 | 2026-05-04 | 부품 상세정보 인라인 패널, 가격/납품내역 표시 개선 | `7d04131` | [zip](https://github.com/kukje1980/medfix-pro2/archive/7d041317b9be389b5bb598feea2f23b95f18eebc.zip) |
| v1.4 | 2026-05-05 | Excel/JSON 업로드, 납품건수 정렬·배지, 검색모드 모델 컬럼 | `a743e5b` | [zip](https://github.com/kukje1980/medfix-pro2/archive/a743e5bafaaef52395014266c135030995acaae9.zip) |
| v1.5 | 2026-05-05 | Excel 비정규화 형식 파서, 원가 비밀번호, 트리 정렬, 종병가 레이블 | `b5185ad` | [zip](https://github.com/kukje1980/medfix-pro2/archive/b5185ad1a67e538de3ec2561e167f40aa2a9eea8.zip) |
| v1.6 | 2026-05-05 | Excel 업로드 버그 수정 (부품 미인식·영문 헤더·API 경로) | `bd1e823` | [zip](https://github.com/kukje1980/medfix-pro2/archive/bd1e823facd3493c577f051061b7d8aa459d2d28.zip) |
| v1.7.0 | 2026-10-25 | **통합판** — v1.6 의 부품관리·Excel 업로드 전체 + 개발 문서(CLAUDE.md), 버전 릴리스 자동 게시(release.yml) — **최신** | 이 브랜치 | [릴리스](https://github.com/kukje1980/medfix-pro2/releases/tag/v1.7.0) |

터미널에서 특정 버전으로 되돌리기: `git checkout <커밋>` (예: `git checkout b64f068`)
