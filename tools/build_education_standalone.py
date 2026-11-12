"""장비 교육 페이지를 서버 없이 실행되는 단일 HTML 파일로 묶는다.

사용법:  python tools/build_education_standalone.py
결과물:  standalone/안과장비교육.html  (더블클릭하면 브라우저에서 바로 실행)
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "standalone" / "안과장비교육.html"

SHELL_CSS = """
:root {
  --color-gray-50: #fffde7; --color-gray-100: #fef9c3; --color-gray-200: #fde68a;
  --color-gray-500: #64748b; --color-gray-700: #334155; --color-gray-800: #1e293b; --color-gray-900: #1e1a00;
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05); --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
}
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { font-size: 14px; }
body { font-family: 'Pretendard', 'Malgun Gothic', 'Apple SD Gothic Neo', -apple-system, 'Segoe UI', sans-serif; background: #fffde7; color: var(--color-gray-800); }
.sa-header { background: #78350f; color: #fff; padding: 14px 24px; display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; }
.sa-header h1 { font-size: 19px; }
.sa-header span { font-size: 12.5px; color: #fcd9a0; }
.sa-main { padding: 20px 24px 40px; max-width: 1640px; margin: 0 auto; }
@media (max-width: 640px) { .sa-main { padding: 12px; } .edu-time, .edu-speed { display: none; } }
"""


def main():
    css = (ROOT / "static/css/education.css").read_text(encoding="utf-8")
    js = (ROOT / "static/js/education.js").read_text(encoding="utf-8")
    tpl = (ROOT / "templates/education.html").read_text(encoding="utf-8")
    # 템플릿에서 탭 + 플레이어 + 정보 패널 마크업만 가져온다
    body = re.search(r'(<div class="edu-tabs".*?</aside>\s*</div>)', tpl, re.S).group(1)
    html = f"""<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>안과 장비 교육 프로그램</title>
<style>{SHELL_CSS}{css}</style>
</head>
<body>
<header class="sa-header"><h1>👁️ 안과 장비 교육 프로그램</h1><span>안구 모형으로 보는 장비별 작동 원리</span></header>
<main class="sa-main">
{body}
</main>
<script>{js.replace("</script>", "<\\/script>")}</script>
</body>
</html>
"""
    OUT.parent.mkdir(exist_ok=True)
    OUT.write_text(html, encoding="utf-8")
    print(f"{OUT.relative_to(ROOT)}  ({len(html.encode('utf-8')) // 1024} KB)")


if __name__ == "__main__":
    main()
