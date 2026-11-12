/* 장비 교육 — 안구 단면 모형 + 장비별 작동 원리 애니메이션
 * 모든 장면은 시간 t(초)의 순수 함수로 그려지므로 진행 막대로 자유롭게 탐색할 수 있다. */
(function () {
'use strict';
const svg = document.getElementById('edu-svg');
if (!svg) return;

/* ---------- 공통 유틸 ---------- */
const D = Math.PI / 180;
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const ease = x => x * x * (3 - 2 * x);
const es = (t, a, b) => ease(seg(t, a, b));
const bell = (t, a, b) => Math.sin(Math.PI * seg(t, a, b));
const win = (t, a, b, f = 0.4) => Math.min(seg(t, a, a + f), 1 - seg(t, b - f, b));
const r1 = v => Math.round(v * 10) / 10;
const r2 = v => Math.round(v * 100) / 100;
const pt = p => r1(p[0]) + ' ' + r1(p[1]);
let cache = {};
const el = id => cache[id] || (cache[id] = svg.querySelector('#' + id));
const S = (id, a) => { const e = el(id); if (e) for (const k in a) e.setAttribute(k, a[k]); };
const O = (id, v) => { const e = el(id); if (e) e.setAttribute('opacity', r2(clamp(v))); };
const TX = (id, s) => { const e = el(id); if (e && e.textContent !== s) e.textContent = s; };
const T = (x, y, s, c = '', a = 'start', extra = '') => `<text x="${x}" y="${y}" class="${c}" text-anchor="${a}" ${extra}>${s}</text>`;
const DEV = 'fill="#24344d" stroke="#6f88ad" stroke-width="1.5"';
const PANEL = 'fill="#0e1b30" stroke="#2c4166" stroke-width="1"';

/* ---------- 안구 모형 (우안 수평 단면, 위에서 본 모습) ---------- */
const CX = 680, CY = 270;
const P = (R, deg) => [CX - R * Math.cos(deg * D), CY - R * Math.sin(deg * D)];
const arc = (R, a) => `M${pt(P(R, a))} A${R} ${R} 0 1 1 ${pt(P(R, 360 - a))}`;
const LENS = 'M575 208 Q540 270 575 332 Q615 270 575 208 Z';
const FOVEA = [823, 270];
const DISC = [CX + 144 * Math.cos(22 * D), CY + 144 * Math.sin(22 * D)];
const CIL = `M546 197 L${pt(P(154, 36))} A154 154 0 0 1 ${pt(P(154, 58))} Q592 176 573 197 L557 205 Z`;
const MIRROR = 'transform="matrix(1 0 0 -1 0 540)"';

const EYE_DEF = { cq: 0, pupil: 22, lens: 1, cat: 0, catS: 1, iol: 0, iolS: 1, bag: 0, pco: 0, gap: 0, hl: '' };

function eyeMarkup() {
  return `
<defs>
  <radialGradient id="gVit" cx="45%" cy="50%" r="60%"><stop offset="0" stop-color="#21416a"/><stop offset="1" stop-color="#172f4f"/></radialGradient>
  <linearGradient id="gLens" x1="0" x2="1"><stop offset="0" stop-color="#9fd0f7" stop-opacity=".75"/><stop offset="1" stop-color="#5f9fd6" stop-opacity=".6"/></linearGradient>
  <radialGradient id="gFundus" cx="50%" cy="50%" r="55%"><stop offset="0" stop-color="#e8652a"/><stop offset=".7" stop-color="#c7431a"/><stop offset="1" stop-color="#7a2410"/></radialGradient>
  <filter id="fGlow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <marker id="mArr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 Z" fill="context-stroke"/></marker>
</defs>
<g id="eye">
  <circle id="e-vit" cx="${CX}" cy="${CY}" r="154" fill="url(#gVit)"/>
  <path id="e-choroid" d="${arc(151.5, 40)}" fill="none" stroke="#a04632" stroke-width="5"/>
  <path id="e-retina" d="${arc(146.5, 58)}" fill="none" stroke="#f2b25a" stroke-width="5"/>
  <path id="e-sclera" d="${arc(159.5, 30)}" fill="none" stroke="#ece6d8" stroke-width="11"/>
  <path id="e-nerve" d="M807.7 335.7 L909.7 376.9 L919.5 352.7 L817.5 311.5 Z" fill="#e6c684" stroke="#b08f55" stroke-width="1.5"/>
  <ellipse id="e-fovea" cx="823.5" cy="270" rx="3.5" ry="10" fill="#b7601f"/>
  <path id="e-ac" d="" fill="#3b7fae" opacity=".55"/>
  <g id="e-ciliary" fill="#c9737a" stroke="#8d4a52" stroke-width="1">
    <path d="${CIL}"/><path d="${CIL}" ${MIRROR}/>
    <g stroke="#b9c9dc" stroke-width=".8" fill="none">
      <path id="e-zon" d="M571 199 L575 209 M566 202 L572 214 M574 196 L578 208"/>
      <path d="M571 199 L575 209 M566 202 L572 214 M574 196 L578 208" ${MIRROR}/>
    </g>
  </g>
  <g id="e-lensg">
    <path id="e-lens" d="${LENS}" fill="url(#gLens)" stroke="#b7d6f2" stroke-width="1.2"/>
    <path id="e-cat" d="${LENS}" fill="#b98d3e" stroke="#8c6420" opacity="0"/>
    <path id="e-bag" d="${LENS}" fill="none" stroke="#b7d6f2" stroke-width="1.2" stroke-dasharray="3 2" opacity="0"/>
    <g id="e-iol" opacity="0">
      <path d="M575 242 Q566 270 575 298 Q586 270 575 242 Z" fill="#bfe6ff" fill-opacity=".8" stroke="#eaf6ff" stroke-width="1.2"/>
      <path d="M575 242 Q584 226 576 213 M575 298 Q566 314 574 327" fill="none" stroke="#eaf6ff" stroke-width="1.5"/>
    </g>
    <path id="e-pco" d="M575 208 Q615 270 575 332" pathLength="100" fill="none" stroke="#efe9d6" stroke-width="5" stroke-linecap="butt" opacity="0"/>
  </g>
  <g id="e-iris" fill="#8a5a3c" stroke="#5b3a25" stroke-width="1">
    <path id="e-iris1" d=""/><path id="e-iris2" d=""/>
  </g>
  <path id="e-cornea" d="" fill="#a8dcff" fill-opacity=".5" stroke="#bfe6ff" stroke-width="1.3"/>
</g>`;
}

function corneaPts(cx0, r, half, q, off) {
  const n = 44, pts = [];
  const xf = 495 + 10.5 * Math.min(q, 1) + off, k = q > 1 ? (q - 1) * 1.2 : 0;
  for (let i = 0; i <= n; i++) {
    const th = lerp(-half, half, i / n) * D;
    let x = cx0 - r * Math.cos(th);
    const y = CY + r * Math.sin(th);
    if (q > 0 && x < xf) x = xf + (xf - x) * k;
    pts.push([x, y]);
  }
  return pts;
}
const apexX = q => { const xf = 495 + 10.5 * Math.min(q, 1); return q > 1 ? xf + (xf - 495) * (q - 1) * 1.2 : xf; };

let lastEye = {};
function applyEye(E) {
  if (E.cq !== lastEye.cq) {
    const o = corneaPts(597, 102, 54, E.cq, 0), i = corneaPts(601, 97, 52.5, E.cq, 9);
    S('e-cornea', { d: 'M' + o.map(pt).join(' L') + ' L' + i.slice().reverse().map(pt).join(' L') + ' Z' });
    S('e-ac', { d: 'M' + i.map(pt).join(' L') + ' L579 340 L579 200 Z' });
  }
  if (E.pupil !== lastEye.pupil) {
    const y = r1(270 - E.pupil), m = r1((197 + y) / 2);
    const d = (a, b, c, mm) => `M545 ${a} L553 ${b} Q561 ${mm} 558 ${c} L552 ${c} Q552 ${mm} 545 ${a} Z`;
    S('e-iris1', { d: d(199, 195, y, m) });
    S('e-iris2', { d: d(341, 345, 540 - y, 540 - m) });
  }
  O('e-lens', E.lens); O('e-cat', E.cat); O('e-bag', E.bag); O('e-iol', E.iol); O('e-pco', E.pco);
  if (E.catS !== lastEye.catS) S('e-cat', { transform: `translate(568 267) scale(${r2(E.catS)}) translate(-568 -267)` });
  if (E.iolS !== lastEye.iolS) S('e-iol', { transform: `translate(575 270) scale(${r2(E.iolS)}) translate(-575 -270)` });
  if (E.gap !== lastEye.gap) S('e-pco', { 'stroke-dasharray': `${r1(50 - E.gap)} ${r1(2 * E.gap)} ${r1(50 - E.gap)}` });
  if (E.hl !== lastEye.hl) {
    svg.querySelectorAll('#eye .hl').forEach(n => n.classList.remove('hl'));
    (E.hl || '').split(' ').filter(Boolean).forEach(id => { const n = el(id); if (n) n.classList.add('hl'); });
  }
  lastEye = Object.assign({}, E);
}

/* 평행 광선이 각막에서 굴절되어 중심와로 모이는 경로 (y 오프셋 dy) */
const cornX = dy => 597 - Math.sqrt(102 * 102 - dy * dy);
function rayTo(x0, dy, xStop) {
  const xc = cornX(dy), k = (xStop - xc) / (FOVEA[0] - xc);
  return `M${x0} ${270 + dy} L${r1(xc)} ${270 + dy} L${r1(xStop)} ${r1(270 + dy * (1 - k))}`;
}
const along = (pts, u) => {
  let L = 0; const ls = [];
  for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); ls.push(l); L += l; }
  let d = clamp(u) * L;
  for (let i = 0; i < ls.length; i++) { if (d <= ls[i]) { const f = d / ls[i]; return [lerp(pts[i][0], pts[i + 1][0], f), lerp(pts[i][1], pts[i + 1][1], f)]; } d -= ls[i]; }
  return pts[pts.length - 1];
};

/* ====================================================================== */
/*  장면 정의                                                              */
/* ====================================================================== */
const SCENES = [];

/* ---------- 0. 안구 구조 ---------- */
(function () {
  const parts = [
    { id: 'path', name: '빛의 경로', hl: '', lbl: null,
      cap: '눈은 카메라와 같습니다. 빛은 <b>각막 → 전방(방수) → 동공 → 수정체 → 유리체</b>를 지나 <b>망막</b>의 황반에 초점을 맺고, 시신경을 통해 뇌로 전달됩니다. 이 그림은 우안을 위에서 내려다본 수평 단면입니다.' },
    { id: 'cornea', name: '각막 (Cornea)', hl: 'e-cornea', a: [498, 250], l: [395, 150], anchor: 'end',
      cap: '<b>각막</b>은 눈 맨 앞의 투명한 창으로, 눈 전체 굴절력의 약 2/3(약 43D)를 담당합니다. 중심 두께는 약 0.5 mm. 관련 장비: <b>안압계</b>(각막을 눌러 안압 측정), <b>경면현미경</b>(각막 내피세포), <b>세극등</b>.' },
    { id: 'ac', name: '전방 · 방수', hl: 'e-ac', a: [524, 282], l: [395, 330], anchor: 'end',
      cap: '<b>전방</b>은 각막과 홍채 사이 공간으로 <b>방수</b>(aqueous humor)가 채워져 있습니다. 방수의 생성과 배출 균형이 <b>안압(IOP)</b>을 결정합니다. 정상 전방 깊이는 약 3 mm입니다.' },
    { id: 'angle', name: '전방각 · 섬유주', hl: '', a: [541, 197], l: [430, 96], anchor: 'end',
      cap: '<b>전방각</b>은 각막과 홍채가 만나는 모서리로, 방수가 <b>섬유주(trabecular meshwork) → 쉴렘관</b>을 통해 빠져나가는 배출구입니다. 이곳이 막히거나 좁아지면 안압이 올라 <b>녹내장</b>의 원인이 됩니다.' },
    { id: 'iris', name: '홍채 · 동공', hl: 'e-iris', a: [554, 228], l: [500, 52], anchor: 'end',
      cap: '<b>홍채</b>는 카메라의 조리개입니다. 가운데 구멍인 <b>동공</b>의 크기를 조절해 들어오는 빛의 양을 조절합니다. 안저 검사 시에는 산동제로 동공을 넓히기도 합니다(산동).' },
    { id: 'lens', name: '수정체 (Lens)', hl: 'e-lens', a: [572, 300], l: [430, 430], anchor: 'end',
      cap: '<b>수정체</b>는 두께를 바꿔 초점을 맞추는 볼록렌즈입니다(조절). 혼탁해지면 <b>백내장</b>이며, <b>초음파유화술(Phaco)</b>로 제거하고 인공수정체(IOL)를 넣습니다.' },
    { id: 'ciliary', name: '모양체 · 섬모체소대', hl: 'e-ciliary', a: [578, 172], l: [640, 62], anchor: 'middle',
      cap: '<b>모양체(섬모체)</b>는 방수를 만들어내고, <b>섬모체소대</b>로 수정체를 매달아 두께를 조절합니다. <b>다이오드 레이저 모양체광응고술</b>은 이 조직을 응고시켜 방수 생성을 줄입니다.' },
    { id: 'vit', name: '유리체 (Vitreous)', hl: 'e-vit', a: null, l: [700, 215], anchor: 'middle',
      cap: '<b>유리체</b>는 안구 내부의 약 80%를 채우는 투명한 젤로, 안구의 형태를 유지합니다. 유리체 혼탁이나 출혈은 안저 관찰을 방해합니다.' },
    { id: 'retina', name: '망막 (Retina)', hl: 'e-retina', a: [778, 163], l: [850, 70], anchor: 'middle',
      cap: '<b>망막</b>은 카메라의 필름(이미지 센서)에 해당하는 신경 조직으로, 시세포가 빛을 전기 신호로 바꿉니다. 관련 장비: <b>안저카메라, 도상검안경, 시야계</b>.' },
    { id: 'macula', name: '황반 · 중심와', hl: 'e-fovea', a: [826, 270], l: [862, 262], anchor: 'start',
      cap: '<b>황반</b>은 망막 중심부이며 그 한가운데 <b>중심와(fovea)</b>에 원뿔세포가 밀집해 가장 선명한 중심 시력을 담당합니다.' },
    { id: 'sclera', name: '맥락막 · 공막', hl: 'e-choroid e-sclera', a: [745, 420], l: [690, 492], anchor: 'middle',
      cap: '<b>공막</b>은 안구를 감싸는 질긴 흰색 외막(흰자위), <b>맥락막</b>은 망막에 영양을 공급하는 혈관층입니다. 안쪽부터 망막 – 맥락막 – 공막 순서입니다.' },
    { id: 'nerve', name: '시신경 · 시신경유두', hl: 'e-nerve', a: [884, 356], l: [946, 424], anchor: 'end',
      cap: '<b>시신경</b>은 약 120만 개의 신경섬유 다발로 시각 정보를 뇌로 전달합니다. 눈 안에서 보이는 출발점이 <b>시신경유두</b>(시야에서는 <b>맹점</b>)이며, 녹내장에서는 유두 함몰(C/D비)이 커집니다.' },
  ];
  const STEP = 5;
  SCENES.push({
    id: 'anatomy', icon: '👁️', name: '안구 구조', en: 'Anatomy of the Eye',
    maker: '—', category: '기초 해부학', target: '안구 전체',
    principle: '장비 교육에 앞서 안구의 구조와 빛의 경로를 익힙니다. 각 장비가 "어느 조직에 작용하는지"를 먼저 이해하면 원리가 쉬워집니다. 그림의 라벨을 누르면 해당 구조로 이동합니다.',
    dur: parts.length * STEP,
    steps: parts.map((p, i) => ({ t: i * STEP, title: p.name, cap: p.cap })),
    terms: [
      ['전안부', 'Anterior segment', '각막·전방·홍채·수정체 등 눈의 앞부분. 세극등·안압계·경면현미경의 검사 영역.'],
      ['후안부(안저)', 'Posterior segment / Fundus', '유리체·망막·맥락막·시신경유두. 안저카메라·도상검안경의 검사 영역.'],
      ['안압', 'IOP, Intraocular pressure', '방수의 생성량과 배출량 균형으로 유지되는 눈 속 압력. 단위 mmHg.'],
      ['굴절력', 'Diopter (D)', '렌즈가 빛을 꺾는 힘. 각막 약 43D + 수정체 약 20D ≈ 눈 전체 약 60D.'],
    ],
    facts: [['안축장(앞뒤 길이)', '약 24 mm'], ['각막 지름 / 중심 두께', '약 11.5 mm / 약 0.5 mm'], ['전방 깊이', '약 3 mm'], ['정상 안압', '10 ~ 21 mmHg'], ['수정체 지름 / 두께', '약 9~10 mm / 약 4 mm']],
    build() {
      let s = '<g id="an-rays" fill="none" stroke="#ffe27a" stroke-width="1.6" stroke-linecap="round">';
      [-26, 0, 26].forEach((dy, i) => { s += `<path id="an-r${i}" d="${rayTo(250, dy, FOVEA[0])}" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/>`; });
      s += '</g>';
      s += `<circle id="an-angle" cx="541" cy="196" r="9" fill="none" stroke="#ffd54a" stroke-width="2" opacity="0"/><circle id="an-angle2" cx="541" cy="344" r="9" fill="none" stroke="#ffd54a" stroke-width="2" opacity="0"/>`;
      s += T(250, 245, '빛 →', 't-y t-s');
      parts.forEach((p, i) => {
        if (!p.l) return;
        const ly = p.l[1] - 5, lx = p.l[0] + (p.anchor === 'end' ? 4 : p.anchor === 'start' ? -4 : 0);
        s += `<g class="an-lbl" id="an-l${i}" data-step="${i}">` +
          (p.a ? `<line x1="${lx}" y1="${p.anchor === 'middle' ? p.l[1] + (p.a[1] < p.l[1] ? -16 : 6) : ly}" x2="${p.a[0]}" y2="${p.a[1]}" stroke-width="1"/>` : '') +
          T(p.l[0], p.l[1], p.name, '', p.anchor) + '</g>';
      });
      s += T(30, 520, '우안 수평 단면 (위에서 본 모습) · 비율은 이해를 돕기 위해 일부 과장', 't-xs t-dim');
      s += T(905, 400, '↘ 뇌로', 't-xs t-dim');
      return s;
    },
    update(t, E) {
      const i = Math.min(parts.length - 1, Math.floor(t / STEP));
      E.hl = parts[i].hl;
      const p = i === 0 ? es(t, 0.3, 3.5) : 1;
      for (let k = 0; k < 3; k++) S('an-r' + k, { 'stroke-dashoffset': r2(1 - p) });
      O('an-rays', i === 0 ? 1 : 0.28);
      const ang = parts[i].id === 'angle' ? 0.6 + 0.4 * Math.sin(t * 5) : 0;
      O('an-angle', ang); O('an-angle2', ang);
      parts.forEach((q, k) => { const n = el('an-l' + k); if (n) n.classList.toggle('on', k === i); });
    },
  });
})();

/* ---------- 1. 비접촉 안압계 ---------- */
(function () {
  const qOf = t => t < 7 ? 0 : t < 9 ? seg(t, 7, 9) : t < 10 ? 1 + 0.35 * es(t, 9, 10) : t < 11 ? 1.35 - 0.35 * es(t, 10, 11) : 1 - es(t, 11, 12.5);
  const pOf = t => t < 5 ? 0 : t < 10 ? Math.sin(Math.PI / 2 * seg(t, 5, 10)) : Math.cos(Math.PI / 2 * seg(t, 10, 12.5));
  const sigOf = t => { const q = qOf(t); return q <= 0 ? 0 : Math.exp(-Math.pow((q - 1) / 0.2, 2)); };
  const gx = t => 62 + (t - 5) / 8 * 250, gy = v => 502 - v * 72;
  const curve = f => { let d = ''; for (let t = 5; t <= 13.001; t += 0.05) d += (d ? ' L' : 'M') + r1(gx(t)) + ' ' + r1(gy(f(t))); return d; };
  SCENES.push({
    id: 'nct', icon: '💨', name: '비접촉 안압계', en: 'Non-Contact Tonometer (NCT, Air-puff)',
    maker: 'KOWA (Japan)', category: 'Tonometer (안압계)', target: '각막 중심부',
    principle: '각막에 닿지 않고 <b>압축 공기</b>를 분사해 각막 중심을 일정 면적만큼 <b>평평하게(압평)</b> 만듭니다. 각막이 평평해지는 순간 적외선 반사 신호가 최대가 되며, 그 순간까지 걸린 <b>시간(=그때의 분사 압력)</b>을 안압(mmHg)으로 환산합니다. 안압이 높을수록 각막이 단단히 버티므로 압평까지 시간이 더 걸립니다.',
    dur: 18, eye: {},
    steps: [
      { t: 0, title: '정렬 (Alignment)', cap: '노즐을 각막 중심 정면에 맞추고 작동 거리(약 11 mm)를 유지합니다. 적외선 정렬 광이 각막 정점에서 반사되는 위치로 X·Y·Z 정렬을 확인합니다.' },
      { t: 5, title: '공기 분사 (Air pulse)', cap: '피스톤이 공기를 압축해 노즐로 분사합니다. 분사 압력은 시간에 따라 <b>거의 직선적으로 증가</b>합니다. 전체 과정은 실제로 수 밀리초(ms) 안에 끝납니다.' },
      { t: 7, title: '압평 (Applanation)', cap: '공기 압력이 안압을 이기면서 볼록하던 각막 중심이 <b>일자로 평평</b>해집니다. 이때 각막은 평면거울처럼 작용해 적외선이 수광 센서로 가장 많이 반사됩니다 → <b>신호 피크</b>.' },
      { t: 10, title: '과압평 · 복원', cap: '압력이 더 오르면 각막은 잠깐 오목해졌다가, 분사가 끝나면 다시 평평한 상태(2차 압평)를 지나 원래의 볼록한 모양으로 돌아옵니다.' },
      { t: 13, title: '안압 환산', cap: '공기 분사 시작부터 <b>1차 압평 피크까지의 시간 t₁</b>(= 그 순간의 분사압)을 안압으로 환산해 표시합니다. 보통 3회 측정해 평균값을 사용합니다.' },
    ],
    terms: [
      ['압평', 'Applanation', '각막의 일정 면적을 평평하게 누르는 것. 평평해진 순간 "누르는 힘 = 안압 × 면적" 관계가 성립합니다.'],
      ['임버트-픽 법칙', 'Imbert–Fick law', '얇은 막으로 된 구를 평평하게 누르는 데 필요한 힘은 내부 압력 × 압평 면적과 같다는 원리. 압평 안압계의 이론적 기초.'],
      ['골드만 압평안압계', 'GAT', '세극등에 장착해 각막에 직접 접촉하는 표준(gold standard) 안압계. NCT 값의 비교 기준.'],
      ['중심각막두께', 'CCT', '각막이 두꺼우면 안압이 실제보다 높게, 얇으면 낮게 측정되는 경향이 있습니다.'],
      ['안압', 'IOP', '눈 속 압력. 녹내장 진단·경과 관찰의 핵심 지표.'],
    ],
    facts: [['정상 안압', '10 ~ 21 mmHg'], ['작동 거리', '약 11 mm (기종별 상이)'], ['측정 소요 시간', '수 ms'], ['권장 측정 횟수', '3회 평균'], ['접촉 여부', '비접촉 · 점안마취 불필요']],
    tips: ['노즐·관찰창 오염(눈물·먼지)은 정렬 불량과 측정 오차의 흔한 원인입니다.', '측정값이 흔들리면 정렬 광학계와 수광 센서, 공기 통로 누설, 교정(calibration) 상태를 순서대로 확인합니다.', '눈 깜빡임·눈꺼풀 가림·힘주기는 측정값을 높게 만듭니다.'],
    build() {
      let s = `<g id="n-dev">
        <rect x="150" y="212" width="250" height="116" rx="14" ${DEV}/>
        ${T(275, 200, '비접촉 안압계 (NCT)', 't-b', 'middle')}
        <rect x="178" y="250" width="205" height="40" rx="6" fill="#111d31" stroke="#43597c"/>
        <rect id="n-piston" x="184" y="254" width="26" height="32" rx="3" fill="#9fb4d6"/>
        ${T(280, 243, '공기 압축 챔버 (피스톤)', 't-xs t-dim', 'middle')}
        <path d="M383 256 L400 256 L434 263 L434 277 L400 284 L383 284 Z" fill="#8fa6c7" stroke="#c6d6ee" stroke-width="1"/>
        ${T(417, 306, '노즐', 't-xs', 'middle')}
        <g transform="rotate(48 410 172)"><rect x="390" y="162" width="40" height="20" rx="4" fill="#3a1e24" stroke="#ff8f8f"/></g>
        ${T(383, 150, '적외선 발광부', 't-xs t-r', 'end')}
        <g transform="rotate(-48 410 368)"><rect x="390" y="358" width="40" height="20" rx="4" fill="#12322a" stroke="#6fe39a"/></g>
        ${T(383, 396, '수광 센서', 't-xs t-g', 'end')}
        <circle id="n-det" cx="410" cy="368" r="13" fill="#6fe39a" filter="url(#fGlow)" opacity="0"/>
      </g>
      <g id="n-ir" stroke="#ff6b6b" stroke-width="1.6" fill="none" opacity="0">
        <path id="n-in" d=""/><path id="n-o0" d=""/><path id="n-o1" d=""/><path id="n-o2" d=""/>
      </g>
      <g id="n-air" fill="#bfe9ff">${Array.from({ length: 12 }, (_, i) => `<circle id="n-a${i}" r="2.3" opacity="0"/>`).join('')}</g>
      <g id="n-flat" opacity="0"><line id="n-fl" x1="0" y1="225" x2="0" y2="315" stroke="#ffd54a" stroke-width="3"/>${T(500, 118, '압평 — 각막이 일자로 평평', 't-y t-b', 'middle')}<line x1="500" y1="124" x2="499" y2="222" stroke="#ffd54a" stroke-width="1"/></g>
      <g id="n-wd" opacity="0"><line x1="436" y1="336" x2="494" y2="336" stroke="#8ea3c4" marker-start="url(#mArr)" marker-end="url(#mArr)"/>${T(465, 352, '약 11 mm', 't-xs t-dim', 'middle')}</g>
      ${T(480, 80, '※ 실제로는 수 ms — 슬로모션', 't-s t-dim', 'middle', 'id="n-slow" opacity="0"')}
      <g id="n-graph">
        <rect x="24" y="398" width="306" height="132" rx="8" ${PANEL}/>
        <line x1="62" y1="502" x2="318" y2="502" stroke="#54698c"/><line x1="62" y1="416" x2="62" y2="502" stroke="#54698c"/>
        ${T(318, 518, '시간 (ms) →', 't-xs t-dim', 'end')}
        ${T(70, 414, '— 분사 압력', 't-xs t-c')}${T(160, 414, '— 수광 신호', 't-xs t-g')}
        <clipPath id="n-clip"><rect id="n-clipr" x="62" y="400" width="0" height="110"/></clipPath>
        <g clip-path="url(#n-clip)" fill="none" stroke-width="2">
          <path d="${curve(pOf)}" stroke="#7fe3ff"/><path d="${curve(sigOf)}" stroke="#6fe39a"/>
        </g>
        <g id="n-t1" opacity="0"><line x1="${gx(9)}" y1="420" x2="${gx(9)}" y2="502" stroke="#ffd54a" stroke-dasharray="4 3"/>${T(gx(9), 518, 't₁ (압평)', 't-xs t-y', 'middle')}
          <line x1="62" y1="${gy(pOf(9))}" x2="${gx(9)}" y2="${gy(pOf(9))}" stroke="#ffd54a" stroke-dasharray="2 3"/>${T(58, gy(pOf(9)) + 4, 'P₁', 't-xs t-y', 'end')}</g>
      </g>
      <g id="n-read" opacity="0">
        <rect x="24" y="36" width="240" height="104" rx="10" ${PANEL}/>
        ${T(40, 62, '측정 결과 · 안압 (IOP)', 't-s t-dim')}
        ${T(40, 104, '15', 't-xl t-y', 'start', 'id="n-val"')}${T(92, 104, 'mmHg', 't-l')}
        ${T(40, 128, 't₁ → 분사압 P₁ → 안압 환산', 't-xs t-dim')}
      </g>`;
      return s;
    },
    update(t, E) {
      const q = qOf(t), sig = sigOf(t), p = pOf(t), ax = apexX(q);
      E.cq = q;
      S('n-dev', { transform: `translate(${r1(lerp(-70, 0, es(t, 0.3, 2.8)))},0)` });
      O('n-ir', es(t, 2.8, 3.6)); O('n-wd', win(t, 2.6, 5.2));
      S('n-in', { d: `M420 184 L${r1(ax)} 270` });
      const sp = 38 * (1 - sig) + 3;
      [-1, 0, 1].forEach((j, i) => S('n-o' + i, { d: `M${r1(ax)} 270 L420 ${r1(356 + j * sp)}`, opacity: j === 0 ? 1 : r2(0.35 + 0.65 * sig) }));
      O('n-det', sig);
      S('n-piston', { x: r1(184 + 150 * (t < 10 ? es(t, 5, 10) : 1 - es(t, 10, 12.5))) });
      for (let i = 0; i < 12; i++) {
        const ph = (t * 1.7 + i / 12) % 1;
        S('n-a' + i, { cx: r1(lerp(436, ax - 4, ph)), cy: r1(270 + ((i % 5) - 2) * 3.2 * (1 + ph * 1.2)), opacity: r2(p > 0.03 ? p * (1 - ph * 0.5) : 0) });
      }
      O('n-flat', sig > 0.35 && t < 10 ? sig : 0); S('n-fl', { x1: r1(ax - 5), x2: r1(ax - 5) });
      O('n-slow', win(t, 5, 12.8));
      S('n-clipr', { width: r1(clamp(gx(t) - 62, 0, 256)) });
      O('n-t1', seg(t, 9, 9.3)); O('n-read', es(t, 13.2, 14.2));
      TX('n-val', String(Math.round(15 * es(t, 13.2, 15))));
    },
  });
})();

/* ---------- 2. 세극등 현미경 ---------- */
(function () {
  const u = [0.814, 0.581], n = [-0.581, 0.814];
  const A = [345, 117], pC1 = [506, 232], pC2 = [515, 238.4], pL1 = [560, 270.6], pL2 = [589, 291.3], pEnd = [640, 327.7];
  const band = (a, b, w) => `M${r1(a[0] + n[0] * w)} ${r1(a[1] + n[1] * w)} L${r1(b[0] + n[0] * w)} ${r1(b[1] + n[1] * w)} L${r1(b[0] - n[0] * w)} ${r1(b[1] - n[1] * w)} L${r1(a[0] - n[0] * w)} ${r1(a[1] - n[1] * w)} Z`;
  SCENES.push({
    id: 'slit', icon: '🔬', name: '세극등 현미경', en: 'Slit Lamp Biomicroscope',
    maker: 'KOWA (Japan) · KEELER (UK)', category: 'Slit Lamp (세극등)', target: '전안부 (각막 · 전방 · 홍채 · 수정체)',
    principle: '가늘고 밝은 <b>세극광(slit beam)</b>을 비스듬히 비추고, 정면의 <b>쌍안 현미경</b>으로 확대 관찰합니다. 투명한 각막과 수정체를 빛이 비스듬히 통과하면서 산란되어, 마치 조직을 얇게 썬 단면처럼 보이는 <b>광학 절편</b>이 만들어집니다. 조명과 현미경은 같은 축을 중심으로 회전하므로 초점이 항상 일치합니다.',
    dur: 24, eye: {},
    steps: [
      { t: 0, title: '구성', cap: '세극등은 <b>조명계</b>(세극 폭·높이·각도 조절)와 <b>관찰계</b>(쌍안 실체현미경, 6~40배)로 구성됩니다. 두 축이 같은 회전 중심을 가져 초점이 항상 같은 곳에 맺힙니다(공초점).' },
      { t: 4, title: '세극광 조사', cap: '조명계에서 나온 가느다란 세극광이 30~45° 각도로 비스듬히 눈에 들어갑니다. 빛은 각막 → 전방 → 동공 → 수정체 순으로 통과합니다.' },
      { t: 8.5, title: '광학 절편 (Optical section)', cap: '투명 조직에서 산란된 빛이 현미경으로 들어와 <b>각막과 수정체의 단면</b>이 밝은 띠로 보입니다. 정상 방수는 빛을 산란시키지 않아 그 사이 전방은 <b>어두운 틈</b>으로 보입니다.' },
      { t: 14, title: '세극 폭 조절', cap: '세극을 좁히면 <b>단면(깊이·두께)</b> 관찰에, 넓히면 <b>표면 전체</b> 관찰에 유리합니다. 조명 각도·필터(코발트블루, 무적색)와 조합해 다양한 조명법을 씁니다.' },
      { t: 19, title: '전방 세포 · 플레어', cap: '염증이 있으면 방수 속 세포와 단백질이 세극광에 떠다니는 먼지처럼 빛납니다(<b>틴들 현상</b>). 어두운 전방에 보이는 세포(cell)와 뿌연 정도(flare)로 염증을 등급화합니다.' },
    ],
    terms: [
      ['세극광', 'Slit beam', '폭·높이·각도를 조절할 수 있는 좁은 띠 모양의 조명.'],
      ['광학 절편', 'Optical section', '세극광이 투명 조직을 비스듬히 통과하며 만드는 단면상.'],
      ['직접조명법 / 역조명법', 'Direct / Retro-illumination', '병변에 직접 빛을 비추는 방법 / 뒤쪽 조직(홍채·안저)에서 반사된 빛으로 비춰 보는 방법.'],
      ['틴들 현상', 'Tyndall effect', '방수 내 입자가 세극광을 산란시켜 빛줄기가 보이는 현상. 전방 염증의 지표.'],
      ['코발트블루 필터', 'Cobalt blue filter', '형광염색(플루오레세인) 관찰, 골드만 압평안압 측정에 사용.'],
    ],
    facts: [['배율', '약 6× ~ 40×'], ['세극 폭', '0 ~ 약 12~14 mm 연속 가변'], ['조명 각도', '좌우 약 ±90° 회전'], ['부속 장비', '압평안압계, 전안부 카메라, 레이저 연동']],
    tips: ['조명 미러·프리즘·대물렌즈의 먼지와 곰팡이는 상 흐림의 주원인입니다.', '세극상이 초점면에서 좌우로 흔들리면 조명계와 관찰계의 공초점 정렬(focusing rod로 확인)을 점검합니다.', '광원(할로겐/LED) 밝기 저하와 접점 불량을 확인합니다.'],
    build() {
      return `
      <g id="s-mic"><rect x="170" y="240" width="205" height="60" rx="10" ${DEV}/><rect x="140" y="250" width="34" height="16" rx="4" ${DEV}/><rect x="140" y="274" width="34" height="16" rx="4" ${DEV}/>
        <ellipse cx="381" cy="270" rx="7" ry="25" fill="#8fc6f2" fill-opacity=".6" stroke="#cfe6fb"/>
        ${T(272, 275, '쌍안 현미경 (관찰계)', 't-s', 'middle')}${T(157, 316, '접안렌즈', 't-xs t-dim', 'middle')}${T(381, 316, '대물렌즈', 't-xs t-dim', 'middle')}</g>
      <g id="s-ill"><g transform="rotate(35.5 345 117)"><rect x="235" y="97" width="110" height="40" rx="8" ${DEV}/><rect x="345" y="109" width="10" height="16" fill="#ffe27a"/></g>
        ${T(250, 52, '조명계 (세극 조명)', 't-s', 'middle')}</g>
      <path id="s-beam" d="" fill="#ffe9a0" opacity=".3"/>
      <path id="s-cor" d="" fill="#eaf6ff" filter="url(#fGlow)" opacity="0"/>
      <path id="s-len" d="" fill="#fff0a8" filter="url(#fGlow)" opacity="0"/>
      <g id="s-back" stroke="#bfe6ff" stroke-width="1.2" stroke-dasharray="5 4" fill="none" opacity="0"><path d="M510 235 L388 262"/><path d="M572 280 L388 276"/></g>
      <g id="s-cells" fill="#fff" opacity="0">${[[526, 247], [533, 251], [539, 256], [529, 249.5], [544, 259]].map((p, i) => `<circle id="s-c${i}" cx="${p[0]}" cy="${p[1]}" r="1.6"/>`).join('')}</g>
      <g id="s-view" opacity="0">
        <rect x="24" y="328" width="330" height="200" rx="10" ${PANEL}/>${T(36, 348, '현미경으로 본 모습', 't-s t-dim')}
        <circle cx="130" cy="436" r="78" fill="#05080f" stroke="#2c4166"/>
        <circle cx="130" cy="436" r="64" fill="#6e452c"/><circle cx="130" cy="436" r="64" fill="none" stroke="#8a5a3c" stroke-width="10" stroke-dasharray="2 5"/>
        <circle cx="130" cy="436" r="24" fill="#05080f"/>
        <path id="s-vc" d="M96 376 Q84 436 96 496" fill="none" stroke="#eaf6ff" stroke-width="5" stroke-linecap="round" filter="url(#fGlow)"/>
        <path id="s-vl" d="M132 414 Q122 436 132 458" fill="none" stroke="#ffe890" stroke-width="9" stroke-linecap="round" opacity=".85"/>
        <g id="s-vcells" fill="#fff" opacity="0"><circle cx="110" cy="420" r="1.4"/><circle cx="116" cy="442" r="1.4"/><circle cx="107" cy="455" r="1.4"/><circle cx="118" cy="430" r="1.2"/><circle cx="112" cy="466" r="1.2"/></g>
        <line x1="97" y1="392" x2="222" y2="380" stroke="#54698c"/>${T(226, 384, '각막 절편', 't-s')}
        <line x1="112" y1="436" x2="222" y2="430" stroke="#54698c"/>${T(226, 434, '전방 (어두운 틈)', 't-s')}
        <line x1="134" y1="452" x2="222" y2="480" stroke="#54698c"/>${T(226, 484, '수정체 절편', 't-s')}
      </g>`;
    },
    update(t, E) {
      const p = es(t, 4, 7.5), w = 1.6 + 6 * bell(t, 14.3, 18.5);
      const end = [lerp(A[0], pEnd[0], p), lerp(A[1], pEnd[1], p)];
      S('s-beam', { d: band(A, end, w), opacity: r2(t < 4 ? 0 : 0.34) });
      S('s-cor', { d: band(pC1, pC2, w + 1.2) }); S('s-len', { d: band(pL1, pL2, w + 1) });
      O('s-cor', seg(t, 5.3, 5.8)); O('s-len', seg(t, 6.6, 7.2) * 0.9);
      O('s-back', win(t, 8.7, 14)); O('s-view', es(t, 9.3, 10.5));
      S('s-vc', { 'stroke-width': r1(3 + w * 0.9) }); S('s-vl', { 'stroke-width': r1(6 + w * 1.6) });
      const cells = seg(t, 19.2, 20);
      O('s-cells', cells); O('s-vcells', cells);
      for (let i = 0; i < 5; i++) S('s-c' + i, { opacity: r2(0.4 + 0.6 * Math.abs(Math.sin(t * 3 + i * 1.7))) });
    },
  });
})();

/* ---------- 3. 안저카메라 ---------- */
(function () {
  const pr = [P(146, 135), P(146, 225)];
  SCENES.push({
    id: 'fundus', icon: '📷', name: '안저카메라', en: 'Fundus Camera (Non-mydriatic)',
    maker: 'KOWA (Japan)', category: 'Fundus Camera (NONMYD · VX · GENESIS)', target: '망막 · 시신경유두 · 황반 (안저)',
    principle: '동공의 <b>가장자리로 고리 모양 조명</b>을 넣고, <b>동공 중앙</b>으로 되돌아오는 망막 반사광만 받아 촬영합니다. 조명과 촬영 경로를 동공에서 분리하므로 각막·수정체 반사 없이 선명한 안저 사진을 얻습니다. 무산동 방식은 눈에 보이지 않는 <b>적외선</b>으로 정렬해 동공이 줄어들지 않게 한 뒤, 순간 <b>플래시</b>로 촬영합니다.',
    dur: 22, eye: { pupil: 28 },
    steps: [
      { t: 0, title: '정렬 (적외선 관찰)', cap: '어두운 방에서 자연히 커진 동공(4 mm 이상)을 이용합니다. 눈에 보이지 않는 <b>적외선</b>으로 안저를 비춰 모니터로 보면서 위치와 초점을 맞추므로 동공이 줄어들지 않습니다.' },
      { t: 4.5, title: '고리 조명 (Ring illumination)', cap: '조명광은 구멍 뚫린 거울에서 반사되어 <b>고리(ring) 모양</b>으로 동공 가장자리를 통과한 뒤, 눈 속에서 퍼져 망막을 넓게 비춥니다. 각막 중심부는 조명이 지나가지 않습니다.' },
      { t: 9, title: '촬영 (플래시)', cap: '셔터를 누르면 <b>플래시</b>(제논 또는 백색 LED)가 순간 발광합니다. 망막에서 반사된 빛은 <b>동공 중앙</b> → 대물렌즈 → 거울의 구멍을 지나 이미지 센서에 도달합니다.' },
      { t: 12.5, title: '영상 형성', cap: '센서에 시야각 약 45°의 컬러 안저 영상이 맺힙니다. 플래시 직후에는 동공이 수축하므로 반대쪽 눈은 동공이 다시 커질 때까지 잠시 기다린 뒤 촬영합니다.' },
      { t: 16, title: '판독 포인트', cap: '<b>시신경유두</b>(색·경계·함몰비 C/D), <b>황반</b>(중심와 반사·출혈·삼출물), <b>혈관</b>(동맥·정맥 굵기 비, 교차 현상)을 봅니다. 당뇨망막병증·녹내장·황반변성 검진의 기본 검사입니다.' },
    ],
    terms: [
      ['안저', 'Fundus', '동공을 통해 보이는 눈 속 뒷면. 망막·시신경유두·황반·혈관.'],
      ['무산동', 'Non-mydriatic', '산동제 없이 자연 동공으로 촬영하는 방식. 적외선 정렬 + 순간 플래시.'],
      ['시신경유두 함몰비', 'C/D ratio', '유두(disc) 지름 대비 중앙 함몰(cup) 지름의 비. 녹내장에서 커집니다.'],
      ['고리 조명', 'Ring illumination', '조명과 촬영 광로를 동공에서 분리(굴스트란트 원리)해 각막 반사를 제거하는 방식.'],
      ['형광안저촬영', 'FA / FAG', '형광 조영제 주사 후 여기·차단 필터로 망막 혈관 누출을 촬영하는 검사.'],
    ],
    facts: [['시야각(화각)', '약 45° (기종별 20°~50°)'], ['최소 동공 지름', '약 4 mm (소동공 모드 약 3.3 mm)'], ['정렬 광원', '적외선 (IR)'], ['촬영 광원', '제논 플래시 / 백색 LED'], ['시신경유두 지름', '약 1.5 mm']],
    tips: ['대물렌즈의 먼지·지문은 사진 중앙의 흰 점·뿌연 반사로 나타납니다. 가장 흔한 화질 불만 원인입니다.', '사진 주변부가 어둡거나 초승달 모양 반사가 생기면 작동 거리·정렬(동공 중심) 문제입니다.', '플래시 미발광 시 플래시 램프·충전 회로·동기 신호를 점검합니다.'],
    build() {
      const fan = p => `M${p[0]} ${p[1]} L${pt(pr[0])} A146 146 0 0 1 ${pt(pr[1])} Z`;
      return `
      <g id="f-cam"><rect x="120" y="205" width="282" height="130" rx="14" ${DEV}/>
        ${T(261, 194, '안저카메라', 't-b', 'middle')}
        <ellipse cx="408" cy="270" rx="8" ry="46" fill="#8fc6f2" fill-opacity=".6" stroke="#cfe6fb"/>${T(420, 216, '대물렌즈', 't-xs t-dim')}
        <rect x="146" y="252" width="9" height="36" fill="#6fe39a"/>${T(150, 244, '이미지 센서', 't-xs t-g', 'middle')}
        <path d="M286 244 L296 262 M304 278 L314 296" stroke="#cfe6fb" stroke-width="4" stroke-linecap="round"/>${T(300, 232, '유공 거울', 't-xs t-dim', 'middle')}
        <rect x="286" y="312" width="28" height="14" rx="3" fill="#ffe27a"/>${T(276, 324, '플래시 / IR', 't-xs t-y', 'end')}
      </g>
      <g id="f-ill" opacity="0">
        <path d="M296 312 L291 253 L408 232 L408 308 L309 287 L304 312 Z" id="f-i0" fill="#ffe27a" opacity=".16"/>
        <path d="M408 228 L408 312 L551 254 Z" id="f-i1" fill="#ffe27a" opacity=".2"/>
        <path d="M408 228 L408 312 L551 286 Z" id="f-i2" fill="#ffe27a" opacity=".2"/>
        <path d="${fan([551, 254])}" id="f-i3" fill="#ffe27a" opacity=".15"/>
        <path d="${fan([551, 286])}" id="f-i4" fill="#ffe27a" opacity=".15"/>
      </g>
      <path id="f-img" d="M822 270 L551 264 L408 256 L160 270 L408 284 L551 276 Z" fill="#ff9a4a" opacity="0"/>
      <rect id="f-flash" x="0" y="0" width="960" height="540" fill="#fff" opacity="0" pointer-events="none"/>
      <g id="f-pupil" opacity="0"><line x1="556" y1="210" x2="508" y2="140" stroke="#8ea3c4"/>${T(505, 122, '조명: 동공 가장자리', 't-xs t-y', 'middle')}${T(505, 136, '촬영: 동공 중앙', 't-xs', 'middle', 'fill="#ffb27a" style="fill:#ffb27a"')}</g>
      <g id="f-photo" opacity="0">
        <rect x="24" y="346" width="378" height="186" rx="10" ${PANEL}/>${T(36, 366, '촬영된 안저 사진 (우안)', 't-s t-dim')}
        <clipPath id="f-pc"><circle cx="118" cy="446" r="76"/></clipPath>
        <circle cx="118" cy="446" r="76" fill="url(#gFundus)"/>
        <g clip-path="url(#f-pc)" fill="none" stroke-linecap="round">
          <circle cx="104" cy="448" r="17" fill="#8f2c12" opacity=".7" stroke="none"/><circle cx="104" cy="448" r="3" fill="#6e1f0c" stroke="none"/>
          <g stroke="#7a1410" stroke-width="2.6"><path d="M156 441 C140 404 96 396 42 420"/><path d="M156 451 C140 490 96 498 42 474"/><path d="M158 441 C170 420 182 410 196 404"/><path d="M158 451 C170 472 182 482 196 490"/></g>
          <g stroke="#e33a2a" stroke-width="1.5"><path d="M154 442 C144 414 104 404 50 432"/><path d="M154 450 C144 480 104 488 50 462"/><path d="M159 443 C174 428 186 422 198 420"/><path d="M159 449 C174 464 186 470 198 474"/><path d="M120 409 C116 420 112 426 108 430"/><path d="M120 483 C116 474 112 468 108 464"/></g>
          <circle cx="157" cy="446" r="13" fill="#ffd98a" stroke="#f0b45a" stroke-width="1.5"/><circle cx="155" cy="446" r="5" fill="#fff3cf" stroke="none"/>
        </g>
        <circle cx="118" cy="446" r="76" fill="none" stroke="#05080f" stroke-width="3"/>
        <g id="f-lbls" opacity="0">
          <line x1="166" y1="438" x2="226" y2="402" stroke="#8ea3c4"/>${T(230, 400, '시신경유두', 't-s t-b')}${T(230, 416, '함몰비(C/D) · 색 · 경계', 't-xs t-dim')}
          <line x1="110" y1="450" x2="226" y2="452" stroke="#8ea3c4"/>${T(230, 450, '황반 · 중심와', 't-s t-b')}${T(230, 466, '출혈 · 삼출물 · 부종', 't-xs t-dim')}
          <line x1="150" y1="482" x2="226" y2="500" stroke="#8ea3c4"/>${T(230, 500, '망막 혈관', 't-s t-b')}${T(230, 516, '동맥(밝음) · 정맥(굵고 어두움)', 't-xs t-dim')}
        </g>
      </g>`;
    },
    update(t, E) {
      const ir = t < 4.5 ? 0.55 + 0.2 * Math.sin(t * 4) : 0;
      const vis = t >= 4.5 ? es(t, 4.5, 6) * (t > 13 ? 1 - es(t, 13, 14.5) * 0.75 : 1) : 0;
      const col = t < 4.5 ? '#c0392b' : '#ffe27a';
      for (let i = 0; i < 5; i++) S('f-i' + i, { fill: col });
      O('f-ill', Math.max(ir * seg(t, 0.8, 1.6), vis)); O('f-pupil', win(t, 5.5, 12.5));
      O('f-flash', 0.75 * bell(t, 9.6, 10.3));
      O('f-img', t < 9.6 ? 0 : 0.5 * (1 - 0.6 * es(t, 13, 14.5)));
      O('f-photo', es(t, 11.2, 12.6)); O('f-lbls', es(t, 16, 17));
      E.pupil = Math.round(lerp(28, 15, es(t, 10.4, 12.2)));
    },
  });
})();

/* ---------- 4. 자동 시야계 ---------- */
(function () {
  const N = [585, 270];
  const bowlPt = a => { const c = Math.cos(a * D), s = Math.sin(a * D), ox = N[0] - 560; const d = ox * c + Math.sqrt(ox * ox * c * c - ox * ox + 330 * 330); return [N[0] - d * c, 270 - d * s]; };
  const retPt = a => { const c = Math.cos(a * D), s = Math.sin(a * D), ox = N[0] - CX; const d = -ox * c + Math.sqrt(ox * ox * c * c - ox * ox + 144 * 144); return [N[0] + d * c, 270 + d * s]; };
  const BS = Math.atan2(DISC[1] - N[1], DISC[0] - N[0]) / D;
  const EV = [
    { t: 4.3, a: 30, b: 1, seen: 1 }, { t: 6.2, a: -22, b: 1, seen: 1 }, { t: 8.1, a: 42, b: 1, seen: 1 }, { t: 10, a: -38, b: 1, seen: 1 },
    { t: 12.8, a: BS, b: 1, seen: 0 },
    { t: 16.4, a: -10, b: 1, seen: 1, skip: 1 }, { t: 18.4, a: -10, b: 0.55, seen: 1, skip: 1 }, { t: 20.4, a: -10, b: 0.28, seen: 0, thr: 1 },
  ];
  const LEN = 1.7, mx = a => 118 + a * 1.9;
  SCENES.push({
    id: 'peri', icon: '🎯', name: '자동 시야계', en: 'Automated Perimeter',
    maker: 'KOWA (Japan)', category: 'Perimeter (시야계)', target: '망막 전체 → 시신경 → 시각 경로 (기능 검사)',
    principle: '환자가 중앙의 고정점을 바라보는 동안 반구형 돔의 여러 위치에 <b>밝기가 다른 빛 자극</b>을 제시하고, 보이면 버튼을 누르게 합니다. 각 위치에서 겨우 볼 수 있는 가장 어두운 빛(<b>역치</b>)을 dB로 기록해 <b>시야 지도</b>를 만듭니다. 시야의 각 지점은 망막의 정해진 지점에 대응하므로, 시야 결손의 모양으로 망막·시신경(녹내장)·뇌 시각 경로의 이상 부위를 추정합니다.',
    dur: 28, eye: {},
    steps: [
      { t: 0, title: '고정 · 배경 순응', cap: '한쪽 눈을 가리고 돔 중앙의 <b>고정점</b>을 계속 바라봅니다. 돔 내부는 일정한 배경 휘도(31.5 asb)로 균일하게 밝혀져 있습니다. 고정점의 상은 황반 중심와에 맺힙니다.' },
      { t: 4, title: '자극 제시 · 응답', cap: '시야 곳곳에 빛 자극이 0.2초씩 나타납니다. 빛은 눈 속에서 <b>상하·좌우가 뒤집혀</b> 반대쪽 망막에 맺힙니다(귀쪽 시야 → 코쪽 망막). 보이면 환자가 응답 버튼을 누릅니다.' },
      { t: 12, title: '생리적 맹점', cap: '귀쪽 약 15° 위치의 자극은 <b>시신경유두</b>에 맺힙니다. 이곳에는 시세포가 없어 누구나 보지 못합니다 → <b>맹점</b>. 맹점에 자극을 주어 환자가 고정을 잘 유지하는지 감시합니다.' },
      { t: 16, title: '역치 측정', cap: '같은 위치에서 자극을 점점 어둡게 제시해 "보임 → 안 보임"으로 바뀌는 경계를 찾습니다. 이 밝기가 그 지점의 <b>역치</b>이며, dB 값이 클수록 더 어두운 빛도 보는 것(감도 높음)입니다.' },
      { t: 23, title: '시야 지도', cap: '모든 검사점의 역치를 모아 <b>시야 지도</b>(수치·그레이스케일·편차 지도)를 출력합니다. 녹내장은 궁상 암점·비측 계단 등 특징적인 결손 패턴을 보입니다.' },
    ],
    terms: [
      ['역치', 'Threshold', '50% 확률로 겨우 감지하는 자극 밝기. 단위 dB (값이 클수록 감도가 좋음).'],
      ['암점', 'Scotoma', '시야 안에서 감도가 떨어지거나 보이지 않는 부분.'],
      ['생리적 맹점', 'Blind spot', '시신경유두에 해당하는 정상적 암점. 고정점에서 귀쪽 약 15°.'],
      ['고정 감시', 'Fixation monitoring', '맹점 자극법(Heijl–Krakau), 시선 추적 등으로 환자가 중심을 보는지 확인.'],
      ['MD / PSD', 'Mean / Pattern Standard Deviation', '정상 대비 전체적 감도 저하(MD)와 국소적 불균일(PSD)을 나타내는 지표.'],
      ['아포스틸브', 'asb', '휘도 단위. 표준 배경 31.5 asb, 최대 자극 10,000 asb = 0 dB.'],
    ],
    facts: [['배경 휘도', '31.5 asb'], ['표준 자극 크기', 'Goldmann III (지름 약 0.43°)'], ['자극 제시 시간', '0.2 초'], ['대표 검사 범위', '중심 24° / 30° (예: 24-2, 30-2)'], ['정상 시야 범위', '이측 약 100°, 비측 60°, 상 60°, 하 70°']],
    tips: ['돔 내부 오염·변색은 배경 휘도와 자극 밝기 오차를 일으킵니다. 휘도 교정(calibration)을 정기 점검합니다.', '응답 버튼 접점 불량은 "무응답"으로 기록되어 가짜 암점을 만듭니다.', '턱받침·이마받침 위치와 교정 렌즈 홀더 가림(렌즈 테 암점)을 확인합니다.'],
    build() {
      const top = bowlPt(48), bot = bowlPt(-48);
      const b1 = [560 + 330 * Math.cos(228 * D), 270 + 330 * Math.sin(228 * D)];
      let grid = '';
      for (let i = -5; i <= 5; i++) for (let j = -5; j <= 5; j++) { if (Math.hypot(i, j) > 5.2) continue; grid += `<rect x="${r1(mx(i * 6) - 4)}" y="${r1(428 + j * 11.4 - 4)}" width="8" height="8" rx="1.5" fill="#b9c8dd" opacity="${r2(0.42 - Math.hypot(i, j) * 0.04)}"/>`; }
      return `
      <path d="M${pt(b1)} A330 330 0 0 0 ${r1(b1[0])} ${r1(540 - b1[1])}" fill="none" stroke="#33466a" stroke-width="12" stroke-linecap="round"/>
      <path d="M${pt(b1)} A330 330 0 0 0 ${r1(b1[0])} ${r1(540 - b1[1])}" fill="none" stroke="#8fa6c7" stroke-width="1.5" transform="translate(6 0)"/>
      ${T(372, 40, '반구형 돔 (배경 31.5 asb)', 't-s t-dim')}
      ${T(top[0] + 22, top[1] + 44, '▲ 이측(귀쪽) 시야', 't-xs t-dim')}${T(bot[0] + 22, bot[1] - 36, '▼ 비측(코쪽) 시야', 't-xs t-dim')}
      <line id="p-fixl" x1="236" y1="270" x2="${FOVEA[0]}" y2="270" stroke="#ffd866" stroke-width="1.2" stroke-dasharray="6 5" opacity="0"/>
      <circle cx="236" cy="270" r="5" fill="#ffd866"/>${T(246, 262, '고정점', 't-xs t-y')}
      <circle cx="${N[0]}" cy="270" r="2.5" fill="#fff"/>
      <path id="p-ray" d="" fill="none" stroke="#bff3ff" stroke-width="1.6" opacity="0"/>
      <circle id="p-stim" r="7" fill="#eaffff" filter="url(#fGlow)" opacity="0"/>
      <circle id="p-hit" r="6" fill="#bff3ff" filter="url(#fGlow)" opacity="0"/>
      ${T(0, 0, '', 't-xs t-c', 'start', 'id="p-stxt"')}
      <g id="p-bs" opacity="0"><line x1="${r1(DISC[0] + 6)}" y1="${r1(DISC[1] + 8)}" x2="850" y2="420" stroke="#ff8f8f"/>${T(800, 436, '시신경유두 = 맹점', 't-s t-r')}${T(800, 452, '(시세포 없음)', 't-xs t-dim')}</g>
      <g id="p-btn"><rect x="790" y="470" width="150" height="52" rx="10" ${PANEL}/>${T(865, 490, '환자 응답 버튼', 't-xs t-dim', 'middle')}${T(865, 511, '대기', 't-s t-b', 'middle', 'id="p-resp"')}</g>
      <g id="p-map">
        ${T(118, 326, '시야 지도 (우안)', 't-s t-dim', 'middle')}
        <circle cx="118" cy="428" r="86" ${PANEL}/>
        <g id="p-grid" opacity="0">${grid}<ellipse cx="${r1(mx(BS))}" cy="430" rx="8" ry="10" fill="#05080f"/></g>
        <g stroke="#2c4166" fill="none"><circle cx="118" cy="428" r="19"/><circle cx="118" cy="428" r="38"/><circle cx="118" cy="428" r="57"/><line x1="32" y1="428" x2="204" y2="428"/><line x1="118" y1="342" x2="118" y2="514"/></g>
        ${T(196, 366, '이측', 't-xs t-dim', 'end')}${T(40, 366, '비측', 't-xs t-dim')}${T(122, 414, '10°', 't-xs t-dim')}${T(122, 376, '30°', 't-xs t-dim')}
        ${EV.map((e, i) => e.skip ? '' : `<circle id="p-m${i}" cx="${r1(mx(e.a))}" cy="428" r="5" fill="${e.seen || e.thr ? '#6fe39a' : '#111'}" stroke="${e.seen || e.thr ? '#eafff1' : '#ff8f8f'}" stroke-width="1.5" opacity="0"/>`).join('')}
        ${T(mx(BS), 452, '맹점', 't-xs t-r', 'middle', 'id="p-mbs" opacity="0"')}
        ${T(mx(-10), 452, '30 dB', 't-xs t-g', 'middle', 'id="p-mthr" opacity="0"')}
      </g>
      ${T(520, 528, '', 't-s', 'middle', 'id="p-thr"')}`;
    },
    update(t, E) {
      O('p-fixl', es(t, 0.8, 2.2) * 0.8);
      const e = EV.find(v => t >= v.t && t < v.t + LEN);
      let resp = '대기', rc = '#d7e6ff';
      if (e) {
        const lt = t - e.t, sp = bowlPt(e.a), rp = retPt(e.a), on = seg(lt, 0, 0.15) * (1 - seg(lt, 1.2, 1.5));
        S('p-stim', { cx: r1(sp[0]), cy: r1(sp[1]), opacity: r2(on * e.b) });
        S('p-ray', { d: `M${pt(sp)} L${pt(rp)}`, opacity: r2(on * e.b * 0.8) });
        S('p-hit', { cx: r1(rp[0]), cy: r1(rp[1]), opacity: r2(on * e.b) });
        S('p-stxt', { x: r1(sp[0] + 14), y: r1(sp[1] + 4) }); TX('p-stxt', on > 0.3 ? '빛 자극' : '');
        if (lt > 0.7) { resp = e.seen ? '✔ 보임 (누름)' : '✘ 무응답'; rc = e.seen ? '#6fe39a' : '#ff8f8f'; }
      } else { O('p-stim', 0); O('p-ray', 0); O('p-hit', 0); TX('p-stxt', ''); }
      TX('p-resp', resp); S('p-resp', { style: 'fill:' + rc });
      EV.forEach((v, i) => O('p-m' + i, seg(t, v.t + 0.8, v.t + 1.1)));
      O('p-bs', win(t, 13, 16)); O('p-mbs', seg(t, 13.6, 14));
      O('p-mthr', seg(t, 21.3, 21.8));
      TX('p-thr', t >= 16 && t < 23 ? '자극 밝기:  밝게 ✔' + (t > 18.4 ? '  →  어둡게 ✔' : '') + (t > 20.4 ? '  →  더 어둡게 ✘' : '') + (t > 21.3 ? '   ⇒ 역치 ≈ 30 dB' : '') : '');
      O('p-grid', es(t, 23.3, 25));
    },
  });
})();

/* ---------- 5. 도상검안경 ---------- */
(function () {
  const pr = [P(146, 135), P(146, 225)];
  SCENES.push({
    id: 'bio', icon: '🔦', name: '도상검안경', en: 'Binocular Indirect Ophthalmoscope (BIO)',
    maker: 'KOWA (Japan) · KEELER (UK)', category: 'Indirect Ophthalmoscope (도상검안경)', target: '망막 전체 (특히 주변부)',
    principle: '검사자가 머리에 쓴 광원으로 빛을 비추고, 눈앞에 든 <b>집광렌즈(+20D 등)</b>가 그 빛을 동공 안으로 모아 망막을 넓게 밝힙니다. 망막에서 나온 빛은 다시 집광렌즈를 지나 렌즈와 검사자 사이 공중에 <b>상하좌우가 뒤집힌 실상(도립 실상)</b>을 만들고, 검사자는 양안으로 그 상을 입체적으로 봅니다.',
    dur: 23, eye: { pupil: 38 },
    steps: [
      { t: 0, title: '구성', cap: '<b>헤드밴드형 광원 + 쌍안 관찰부</b>와 손에 드는 <b>집광렌즈</b>로 구성됩니다. 산동제로 동공을 충분히 넓힌 뒤 검사합니다.' },
      { t: 4, title: '조명', cap: '광원에서 나온 빛이 집광렌즈에서 모여 동공을 통과한 뒤 눈 속에서 다시 퍼져 <b>망막을 넓게</b> 비춥니다.' },
      { t: 8, title: '도립 실상 형성', cap: '망막의 각 점에서 나온 빛은 눈을 나와 집광렌즈를 지나며 렌즈 앞 초점면(20D → 약 5 cm)에 모입니다. 이렇게 공중에 맺힌 상은 <b>상하·좌우가 모두 뒤집힌 실상</b>입니다.' },
      { t: 14, title: '배율 · 시야 · 입체시', cap: '+20D 렌즈 기준 배율 약 3배, 시야 약 45°. 직상검안경(15배·약 5°)보다 배율은 낮지만 <b>훨씬 넓게</b>, 양안으로 <b>입체적으로</b> 볼 수 있습니다. 렌즈 도수가 높을수록 시야는 넓고 배율은 낮아집니다.' },
      { t: 18, title: '주변부 관찰', cap: '환자의 시선 방향과 검사자 위치를 바꿔가며 주변부 망막까지 관찰합니다. <b>공막누르개</b>로 눈 바깥을 살짝 눌러 최주변부(거상연)의 열공·박리를 확인합니다.' },
    ],
    terms: [
      ['도상(倒像)', 'Inverted image', '상하·좌우가 뒤집힌 상. 간접검안경의 상이 도립 실상이어서 붙은 이름.'],
      ['집광렌즈', 'Condensing lens', '+14D / +20D / +28D 등의 비구면 볼록렌즈. 조명 집광과 결상 역할을 동시에 수행.'],
      ['입체시', 'Stereopsis', '양안 시차로 깊이를 느끼는 것. 망막 박리·융기 병변의 높이 판단에 중요.'],
      ['공막누르기', 'Scleral depression', '공막 바깥을 눌러 주변부 망막을 시야 안으로 밀어 넣는 술기.'],
      ['거상연', 'Ora serrata', '망막의 앞쪽 끝 경계. 톱니 모양.'],
    ],
    facts: [['+20D 배율 / 시야', '약 3× / 약 45°'], ['+28D 배율 / 시야', '약 2.2× / 약 55° (소동공·소아)'], ['+14D 배율 / 시야', '약 4.3× / 약 35° (황반·유두 정밀)'], ['상의 종류', '도립 실상 (상하좌우 반전)'], ['작업 거리', '팔 길이 (약 40~50 cm)']],
    tips: ['광원(LED/할로겐) 밝기 저하, 배터리·충전 접점, 케이블 단선을 우선 확인합니다.', '양안 상이 겹치지 않으면 동공간거리(PD) 조절부와 미러 정렬을 점검합니다.', '집광렌즈 표면의 흠집·코팅 손상은 반사와 상 흐림을 만듭니다.'],
    build() {
      const fan = p => `M${p[0]} ${p[1]} L${pt(pr[0])} A146 146 0 0 1 ${pt(pr[1])} Z`;
      return `
      <g><rect x="34" y="212" width="78" height="116" rx="14" ${DEV}/><rect x="96" y="222" width="20" height="18" rx="3" fill="#ffe27a"/>
        <circle cx="104" cy="268" r="6" fill="#8fc6f2"/><circle cx="104" cy="290" r="6" fill="#8fc6f2"/>
        ${T(73, 200, '헤드밴드 (검사자)', 't-s', 'middle')}${T(120, 226, '광원', 't-xs t-y')}${T(73, 346, '쌍안 관찰부', 't-xs t-dim', 'middle')}</g>
      <ellipse cx="400" cy="270" rx="10" ry="64" fill="#8fc6f2" fill-opacity=".55" stroke="#cfe6fb" stroke-width="1.5"/>
      ${T(400, 190, '집광렌즈 (+20D)', 't-s', 'middle')}
      <g id="b-ill" opacity="0" fill="#ffe27a">
        <path d="M116 231 L400 210 L400 330 Z" opacity=".13"/><path d="M400 210 L551 258 L551 282 L400 330 Z" opacity=".17"/>
        <path d="${fan([551, 270])}" opacity=".15"/>
      </g>
      <g id="b-img" opacity="0" fill="none" stroke-width="1.3">
        <g stroke="#ff9a4a"><path d="M800 205 L551 258 L400 297.4 L315 292.2 L110 279.7"/><path d="M800 205 L551 282 L400 321.4 L315 292.2 L110 221.8"/></g>
        <g stroke="#7fe3ff"><path d="M800 335 L551 282 L400 242.6 L315 247.8 L110 260.3"/><path d="M800 335 L551 258 L400 218.6 L315 247.8 L110 318.2"/></g>
      </g>
      <g id="b-obj" opacity="0"><line x1="797" y1="333" x2="797" y2="210" stroke="#fff" stroke-width="3" marker-end="url(#mArr)"/>${T(782, 275, '망막(실물)', 't-xs', 'end')}</g>
      <g id="b-aer" opacity="0"><line x1="315" y1="249" x2="315" y2="290" stroke="#ffd54a" stroke-width="3.5" marker-end="url(#mArr)"/>
        <line x1="315" y1="205" x2="315" y2="335" stroke="#ffd54a" stroke-dasharray="3 4" opacity=".5"/>
        ${T(315, 356, '공중 도립 실상', 't-s t-y t-b', 'middle')}${T(315, 372, '(상하·좌우 반전)', 't-xs t-dim', 'middle')}</g>
      <g id="b-fov" opacity="0"><path d="M${pt(P(128, 139))} A128 128 0 0 1 ${pt(P(128, 221))}" fill="none" stroke="#6fe39a" stroke-width="2" marker-start="url(#mArr)" marker-end="url(#mArr)"/>${T(735, 238, '시야 약 45°', 't-s t-g t-b', 'middle')}
        <rect x="150" y="400" width="330" height="96" rx="10" ${PANEL}/>${T(166, 426, '도상검안경 (+20D)', 't-s t-b')}${T(322, 426, '약 3배 · 시야 45° · 입체', 't-s t-g')}
        ${T(166, 452, '직상검안경', 't-s t-b')}${T(322, 452, '약 15배 · 시야 5° · 단안', 't-s t-dim')}${T(166, 480, '렌즈 도수 ↑  →  시야 ↑ · 배율 ↓', 't-xs t-y')}</g>
      <g id="b-dep" opacity="0"><path d="M560 60 L596 118" stroke="#cfd9ea" stroke-width="6" stroke-linecap="round"/><circle cx="598" cy="121" r="6" fill="#cfd9ea"/>
        ${T(548, 50, '공막누르개', 't-s', 'end')}<path d="M${pt(P(146.5, 58))} A146.5 146.5 0 0 1 ${pt(P(146.5, 80))}" fill="none" stroke="#ffd54a" stroke-width="5" filter="url(#fGlow)"/>${T(690, 108, '주변부 망막 · 거상연', 't-xs t-y', 'middle')}</g>`;
    },
    update(t) {
      O('b-ill', es(t, 4, 5.5) * (t > 8 ? 1 - 0.65 * es(t, 8, 9) : 1));
      O('b-obj', es(t, 8.2, 9)); O('b-img', es(t, 9, 10.5) * (t > 18 ? 1 - 0.6 * es(t, 18, 19) : 1));
      O('b-aer', es(t, 10.8, 11.8)); O('b-fov', win(t, 14, 18)); O('b-dep', es(t, 18.3, 19.3));
    },
  });
})();

/* ---------- 6. 경면현미경 ---------- */
(function () {
  function hexCells(x0, y0, w, h, s) {
    const cells = [], dx = s * Math.sqrt(3), dy = 1.5 * s;
    const jit = (x, y) => { const k = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453, k2 = Math.sin(x * 39.346 + y * 11.135) * 24634.633; return [(k - Math.floor(k) - 0.5) * s * 0.55, (k2 - Math.floor(k2) - 0.5) * s * 0.55]; };
    for (let r = -1; r * dy < h + s; r++) for (let c = -1; c * dx < w + dx; c++) {
      const cx = x0 + c * dx + (r & 1 ? dx / 2 : 0), cy = y0 + r * dy, pts = [];
      for (let k = 0; k < 6; k++) { const a = (60 * k + 30) * D, vx = Math.round((cx + s * Math.cos(a)) * 2) / 2, vy = Math.round((cy + s * Math.sin(a)) * 2) / 2, j = jit(vx, vy); pts.push(r1(vx + j[0]) + ',' + r1(vy + j[1])); }
      cells.push(pts.join(' '));
    }
    return cells;
  }
  const cells = hexCells(24, 40, 226, 166, 12);
  SCENES.push({
    id: 'spec', icon: '🔷', name: '경면현미경', en: 'Specular Microscope',
    maker: 'KONAN (Japan)', category: 'Specular Microscope', target: '각막 내피세포층',
    principle: '각막 맨 안쪽의 <b>내피세포층</b>과 방수의 경계면은 굴절률이 달라 거울처럼 빛을 반사합니다(<b>경면 반사</b>). 가는 빛을 비스듬히 비추고 <b>입사각과 같은 반사각</b> 방향에서 촬영하면 내피세포의 벌집 모양이 찍힙니다. 영상을 자동 분석해 <b>세포 밀도(CD)·크기 변이(CV)·육각형 비율(HEX)</b>을 계산합니다. 내피세포는 재생되지 않으므로 수술 전후 평가에 필수입니다.',
    dur: 25, eye: {},
    steps: [
      { t: 0, title: '정렬 (비접촉)', cap: '환자가 고정등을 바라보면 장비가 자동으로 각막 정점을 찾아 정렬·초점을 맞춥니다. 각막에 닿지 않는 <b>비접촉식</b>입니다.' },
      { t: 4, title: '경면 반사 원리', cap: '빛은 각막 <b>앞면</b>에서 강하게, <b>내피–방수 경계면</b>에서 약하게 반사됩니다. 가는 슬릿 조명을 비스듬히 넣어 두 반사광을 분리하고, 내피에서 온 반사광만 카메라로 받습니다.' },
      { t: 10, title: '내피세포 영상', cap: '한 층으로 배열된 <b>육각형 내피세포</b>가 벌집 모양으로 촬영됩니다. 세포 경계는 어둡게, 세포 면은 밝게 보입니다.' },
      { t: 14.5, title: '자동 분석', cap: '소프트웨어가 세포 경계를 추적해 <b>CD</b>(세포 밀도, cells/mm²), <b>CV</b>(세포 크기 변이계수), <b>HEX</b>(육각형 세포 비율)와 각막 두께(CCT)를 계산합니다.' },
      { t: 20, title: '임상적 의미', cap: '내피세포는 각막의 물을 퍼내 투명도를 유지하는 펌프입니다. 사람에서는 <b>재생되지 않아</b> 나이·수술·콘택트렌즈로 줄어듭니다. 밀도가 너무 낮으면 각막 부종이 생기므로 백내장 수술 전 반드시 확인합니다.' },
    ],
    terms: [
      ['각막 내피세포', 'Corneal endothelium', '각막 가장 안쪽의 단층 육각형 세포. 펌프 기능으로 각막 투명도를 유지.'],
      ['경면 반사', 'Specular reflection', '매끄러운 경계면에서 입사각 = 반사각으로 일어나는 거울 반사.'],
      ['세포 밀도', 'CD / ECD', '1 mm² 당 내피세포 수. 가장 중요한 지표.'],
      ['변이계수', 'CV (Polymegethism)', '세포 크기의 불균일 정도. 높을수록 세포가 스트레스 상태(다형성 증가).'],
      ['육각형 세포율', 'HEX, 6A (Pleomorphism)', '정상적인 육각형 세포의 비율. 낮을수록 세포 형태 이상.'],
      ['구타타', 'Guttata', '푹스 내피이영양증에서 보이는 검은 점 모양의 내피 결손상.'],
    ],
    facts: [['정상 성인 CD', '약 2,000 ~ 3,000 cells/mm²'], ['CV 정상', '약 0.25 ~ 0.35 (25~35%) 이하'], ['HEX 정상', '약 60% 이상'], ['각막 부종 위험', 'CD 약 500 ~ 700 이하'], ['중심각막두께(CCT)', '약 520 ~ 560 µm']],
    tips: ['촬영이 안 잡히면 대물부 오염, 정렬 카메라, 고정등 상태를 확인합니다.', '영상이 흐리면 초점 구동부와 조명 슬릿 위치를 점검합니다.', '자동 분석이 부정확할 때는 세포 중심점 수동 지정(center method)으로 재분석합니다.'],
    build() {
      let endo = '';
      for (let i = 0; i < 11; i++) endo += `<rect x="240" y="${360 + i * 13.2}" width="12" height="12.2" rx="2.5" fill="${i % 2 ? '#ffd27a' : '#f5c060'}" stroke="#a0731f" stroke-width=".7"/>`;
      let lam = '';
      for (let i = 0; i < 7; i++) lam += `<line x1="${106 + i * 19}" y1="360" x2="${106 + i * 19}" y2="505" stroke="#6da0cb" stroke-width=".8" opacity=".5"/>`;
      return `
      <g><rect x="300" y="218" width="140" height="104" rx="12" ${DEV}/>${T(370, 208, '경면현미경 (비접촉)', 't-s t-b', 'middle')}
        ${T(310, 250, '조명 (슬릿)', 't-xs t-y')}${T(310, 300, '카메라', 't-xs t-c')}
        <rect x="428" y="238" width="12" height="16" fill="#ffe27a"/><rect x="428" y="286" width="12" height="16" fill="#7fe3ff"/></g>
      <g id="k-beam" fill="none" stroke-width="1.8" opacity="0"><path d="M440 246 L498 270" stroke="#ffe27a"/><path d="M498 270 L440 294" stroke="#7fe3ff"/></g>
      <g id="k-zoom" opacity="0">
        <circle cx="499" cy="270" r="13" fill="none" stroke="#ffd54a" stroke-dasharray="3 3"/><line x1="490" y1="280" x2="330" y2="345" stroke="#ffd54a" stroke-dasharray="3 3" opacity=".6"/>
        <rect x="20" y="335" width="310" height="194" rx="10" ${PANEL}/>${T(30, 353, '각막 단면 확대', 't-s t-dim')}
        <rect x="70" y="360" width="22" height="145" fill="#86bce2"/><rect x="92" y="360" width="4" height="145" fill="#b9dcf4"/>
        <rect x="96" y="360" width="140" height="145" fill="#4f86b3"/>${lam}<rect x="236" y="360" width="4" height="145" fill="#d5ecfb"/>
        ${endo}<rect x="252" y="360" width="76" height="145" fill="#1f4f78"/>
        ${T(45, 522, '공기', 't-xs t-dim', 'middle')}${T(81, 522, '상피', 't-xs', 'middle')}${T(166, 522, '실질 (약 500 µm)', 't-xs', 'middle')}${T(246, 522, '내피', 't-xs t-y', 'middle')}${T(291, 522, '방수', 't-xs', 'middle')}
        <g fill="none" stroke-width="2" stroke-linecap="round">
          <path id="k-r1" d="M24 372 L70 398 L252 436" stroke="#ffe27a" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/>
          <path id="k-r2" d="M70 398 L26 424" stroke="#e8eef8" stroke-width="3" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/>
          <path id="k-r3" d="M252 436 L70 474 L26 500" stroke="#7fe3ff" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/>
        </g>
        <g id="k-l2" opacity="0">${T(23, 444, '앞면반사', 't-xs')}${T(23, 457, '✕ 차단', 't-xs t-r')}</g>
        <g id="k-l3" opacity="0">${T(258, 418, '경면 반사', 't-xs t-c t-b')}<circle cx="252" cy="436" r="5" fill="#7fe3ff" filter="url(#fGlow)"/>${T(104, 494, '→ 카메라로', 't-xs t-c')}</g>
      </g>
      <g id="k-hex" opacity="0">
        ${T(24, 30, '내피세포 영상', 't-s t-dim')}
        <clipPath id="k-hc"><rect x="24" y="40" width="226" height="166" rx="6"/></clipPath>
        <clipPath id="k-sc"><rect id="k-scr" x="24" y="40" width="0" height="166"/></clipPath>
        <g clip-path="url(#k-hc)"><rect x="24" y="40" width="226" height="166" fill="#18212e"/>
          <g fill="#6a7c93" stroke="#141c28" stroke-width="1.8">${cells.map(c => `<polygon points="${c}"/>`).join('')}</g>
          <g clip-path="url(#k-sc)" fill="rgba(83,224,255,.12)" stroke="#53e0ff" stroke-width="1.3">${cells.map(c => `<polygon points="${c}"/>`).join('')}</g>
          <line id="k-scan" x1="24" y1="40" x2="24" y2="206" stroke="#fff" stroke-width="1.5" opacity="0"/>
        </g>
        <rect x="24" y="40" width="226" height="166" rx="6" fill="none" stroke="#2c4166"/>
      </g>
      <g id="k-stat" opacity="0">
        ${T(264, 62, 'CD', 't-s t-dim')}${T(300, 62, '0', 't-l t-y', 'start', 'id="k-cd"')}${T(358, 62, 'cells/mm²', 't-xs t-dim')}
        ${T(264, 92, 'CV', 't-s t-dim')}${T(300, 92, '0', 't-l t-y', 'start', 'id="k-cv"')}${T(336, 92, '% (크기 변이)', 't-xs t-dim')}
        ${T(264, 122, 'HEX', 't-s t-dim')}${T(300, 122, '0', 't-l t-y', 'start', 'id="k-hx"')}${T(336, 122, '% (육각형 비율)', 't-xs t-dim')}
        ${T(264, 152, 'CCT', 't-s t-dim')}${T(300, 152, '0', 't-l t-y', 'start', 'id="k-ct"')}${T(342, 152, 'µm (각막 두께)', 't-xs t-dim')}
        ${T(264, 182, '판정: 정상 범위', 't-s t-g t-b', 'start', 'id="k-ok" opacity="0"')}
      </g>`;
    },
    update(t) {
      O('k-beam', es(t, 1.5, 3)); O('k-zoom', es(t, 4, 5));
      S('k-r1', { 'stroke-dashoffset': r2(1 - seg(t, 5, 6.5)) });
      S('k-r2', { 'stroke-dashoffset': r2(1 - seg(t, 5.4, 6.2)) }); O('k-l2', seg(t, 6.2, 6.8));
      S('k-r3', { 'stroke-dashoffset': r2(1 - seg(t, 7.2, 8.7)) }); O('k-l3', seg(t, 7.2, 7.8));
      O('k-hex', es(t, 10, 11.5));
      const sc = seg(t, 14.8, 18.5);
      S('k-scr', { width: r1(226 * sc) }); S('k-scan', { x1: r1(24 + 226 * sc), x2: r1(24 + 226 * sc), opacity: sc > 0 && sc < 1 ? 1 : 0 });
      O('k-stat', seg(t, 14.8, 15.3));
      TX('k-cd', Math.round(2720 * sc).toLocaleString()); TX('k-cv', String(Math.round(29 * sc)));
      TX('k-hx', String(Math.round(61 * sc))); TX('k-ct', String(Math.round(545 * sc)));
      O('k-ok', seg(t, 18.6, 19.2));
    },
  });
})();

/* ---------- 7. Nd:YAG 레이저 ---------- */
(function () {
  const shots = [10.2, 11.8, 13.4], gaps = [0, 7, 14, 20];
  const capY = dy => 270 + dy * 0.71;
  SCENES.push({
    id: 'yag', icon: '⚡', name: 'Nd:YAG 레이저', en: 'Q-switched Nd:YAG Laser (Photodisruptor)',
    maker: 'A.R.C. Laser (Germany)', category: 'Laser (Q-LAS 계열)', target: '수정체 후낭 · 홍채',
    principle: '파장 1064 nm 적외선 레이저를 <b>수 나노초(ns)</b>의 매우 짧은 펄스로 한 점에 모읍니다. 초점에서는 에너지 밀도가 극도로 높아져 조직이 순간적으로 <b>플라스마</b>가 되고, 이때 생기는 <b>충격파</b>가 조직을 열 없이 기계적으로 찢습니다(<b>광파괴</b>). 초점 밖에서는 에너지가 퍼지므로 각막·인공수정체·망막은 손상되지 않습니다. 대표 시술은 <b>후발백내장의 후낭절개술</b>입니다.',
    dur: 24, eye: { pupil: 32, lens: 0, bag: 1, iol: 1, pco: 1 },
    steps: [
      { t: 0, title: '후발백내장 (PCO)', cap: '백내장 수술 후 남겨둔 <b>수정체 후낭</b>이 시간이 지나며 뿌옇게 혼탁해질 수 있습니다. 빛이 혼탁한 막에서 산란되어 다시 시야가 흐려집니다 → <b>후발백내장</b>.' },
      { t: 5, title: '조준 · 초점', cap: '두 개의 붉은 <b>조준광</b>이 하나로 겹치는 지점이 레이저 초점입니다. 세극등으로 보면서 조준광이 후낭에서 한 점이 되도록 맞춥니다. 필요 시 인공수정체 보호를 위해 초점을 약간 뒤로 오프셋합니다.' },
      { t: 9.5, title: '광파괴 (Photodisruption)', cap: '발사! 수 ns의 펄스가 초점에 집중되어 <b>플라스마 → 충격파</b>가 발생하고 후낭이 찢어집니다. 보통 약 1 mJ의 낮은 에너지부터 시작해 십자(+) 또는 원형으로 여러 발을 조사합니다.' },
      { t: 15, title: '후낭 개구 완성', cap: '후낭 중앙에 동공 크기 정도의 창이 열려 빛이 다시 황반까지 깨끗하게 도달합니다. 외래에서 수 분 내에 끝나는 비침습 시술입니다.' },
      { t: 19, title: '다른 적응증 — 홍채절개술', cap: '같은 레이저로 주변부 홍채에 작은 구멍을 내는 <b>레이저 홍채절개술(LPI)</b>도 시행합니다. 후방의 방수가 전방으로 흐르는 우회로를 만들어 <b>폐쇄각 녹내장</b>을 예방·치료합니다.' },
    ],
    terms: [
      ['광파괴', 'Photodisruption', '초단펄스 레이저의 플라스마·충격파로 조직을 기계적으로 절개하는 작용. 열 작용이 아님.'],
      ['Q-스위칭', 'Q-switching', '레이저 공진기에 에너지를 모았다가 한꺼번에 방출해 ns 단위의 고출력 펄스를 만드는 기술.'],
      ['후발백내장', 'PCO, Posterior capsular opacification', '백내장 수술 후 후낭이 혼탁해지는 가장 흔한 후기 합병증.'],
      ['후낭절개술', 'Posterior capsulotomy', 'YAG 레이저로 혼탁한 후낭 중앙을 여는 시술.'],
      ['레이저 홍채절개술', 'LPI, Laser peripheral iridotomy', '주변부 홍채에 구멍을 내어 동공 차단을 해소하는 시술.'],
      ['광학적 절연파괴', 'Optical breakdown', '강한 전기장으로 물질이 이온화되어 플라스마가 형성되는 현상.'],
    ],
    facts: [['파장', '1064 nm (근적외선, 눈에 안 보임)'], ['펄스 폭', '수 ns (약 4 ns)'], ['펄스 에너지', '약 0.3 ~ 10 mJ 가변'], ['조준광', '적색 다이오드, 2빔 수렴 방식'], ['초점 오프셋', '후방 0 ~ 수백 µm 조절']],
    tips: ['조준광 두 빔이 초점면에서 정확히 겹치는지, 치료 빔 초점과 일치하는지(정렬)를 정기 점검합니다.', '에너지 출력을 에너지 미터로 측정해 표시값과 비교합니다.', '레이저 사용 구역 표시와 보호안경(1064 nm) 등 안전 관리 사항을 함께 확인합니다.'],
    build() {
      let rays = '', sc = '', pass = '';
      [-18, 0, 18].forEach(dy => {
        rays += `<path d="${rayTo(430, dy, 594)}"/>`;
        const y = capY(dy);
        for (let k = -2; k <= 2; k++) sc += `<line x1="596" y1="${r1(y)}" x2="${r1(596 + 34 * Math.cos(k * 0.5))}" y2="${r1(y + 34 * Math.sin(k * 0.5))}"/>`;
        pass += `<line x1="594" y1="${r1(y)}" x2="${FOVEA[0]}" y2="270"/>`;
      });
      return `
      <g><rect x="140" y="222" width="262" height="96" rx="12" ${DEV}/>${T(271, 212, 'Nd:YAG 레이저 (1064 nm)', 't-b', 'middle')}
        <ellipse cx="406" cy="270" rx="7" ry="36" fill="#8fc6f2" fill-opacity=".6" stroke="#cfe6fb"/>
        ${T(271, 264, '세극등 일체형 전달계', 't-s t-dim', 'middle')}${T(271, 284, 'Q-switch · ns 펄스', 't-xs t-dim', 'middle')}</g>
      <g id="y-rays" fill="none" stroke="#ffe27a" stroke-width="1.5" opacity="0">${rays}</g>
      <g id="y-sc" stroke="#ffe27a" stroke-width="1" opacity="0">${sc}</g>
      <g id="y-pass" stroke="#ffe27a" stroke-width="1.5" opacity="0">${pass}</g>
      ${T(700, 215, '빛 산란 → 뿌옇게 보임', 't-s t-r', 'middle', 'id="y-t1" opacity="0"')}
      ${T(712, 215, '빛이 황반까지 도달', 't-s t-g', 'middle', 'id="y-t4" opacity="0"')}
      <g id="y-pl" opacity="0"><line x1="600" y1="318" x2="640" y2="372" stroke="#8ea3c4"/>${T(644, 386, '혼탁한 후낭', 't-s')}<line x1="570" y1="250" x2="500" y2="120" stroke="#8ea3c4"/>${T(498, 110, '인공수정체 (IOL)', 't-s', 'middle')}</g>
      <path id="y-cone" d="" fill="#ff5a5a" opacity="0"/>
      <g id="y-aim" stroke="#ff3b3b" stroke-width="1.4" opacity="0"><line id="y-a1" x1="406" y1="244"/><line id="y-a2" x1="406" y1="296"/><circle id="y-d1" r="2.6" fill="#ff3b3b" stroke="none"/><circle id="y-d2" r="2.6" fill="#ff3b3b" stroke="none"/></g>
      ${T(271, 342, '', 't-s t-b', 'middle', 'id="y-at"')}
      <g id="y-fx"><circle id="y-ring" r="0" fill="none" stroke="#fff" stroke-width="1.5" opacity="0"/>
        <path id="y-star" d="M0 -11 L3 -3 L11 0 L3 3 L0 11 L-3 3 L-11 0 L-3 -3 Z" fill="#fff" filter="url(#fGlow)" opacity="0"/></g>
      ${T(480, 110, '', 't-s t-y', 'middle', 'id="y-en"')}
      <g id="y-deb" fill="#efe9d6">${[0, 1, 2, 3, 4, 5].map(i => `<circle id="y-b${i}" r="1.6" opacity="0"/>`).join('')}</g>
      <g id="y-lpi" opacity="0"><rect x="549" y="220" width="11" height="7" fill="#3b7fae"/>
        <path d="M566 232 Q556 222 541 222" fill="none" stroke="#7fe3ff" stroke-width="1.8" marker-end="url(#mArr)"/>
        <line x1="545" y1="216" x2="470" y2="130" stroke="#8ea3c4"/>${T(466, 108, '홍채 구멍 → 방수 우회로', 't-s t-c', 'middle')}${T(466, 124, '(후방 → 전방)', 't-xs t-dim', 'middle')}</g>`;
    },
    update(t, E) {
      const n = shots.filter(s => t >= s + 0.15).length;
      const last = shots[n - 1];
      E.gap = n ? lerp(gaps[n - 1], gaps[n], es(t, last + 0.15, last + 0.9)) : 0;
      const open = seg(E.gap, 8, 20);
      const lightOn = t < 5 ? es(t, 0.8, 2.2) : t >= 15 && t < 19 ? es(t, 15, 16) : t >= 19 ? 1 - es(t, 19, 19.6) : 0;
      O('y-rays', lightOn); O('y-sc', lightOn * (1 - open) * 0.8); O('y-pass', lightOn * open);
      O('y-t1', t < 5 ? es(t, 2.2, 3) : 0); O('y-t4', t >= 15 && t < 19 ? es(t, 16, 17) : 0); O('y-pl', win(t, 1.5, 5));
      const lpi = t >= 19;
      const F = lpi ? [lerp(595, 553, es(t, 19.2, 20.4)), lerp(270, 224, es(t, 19.2, 20.4))] : [lerp(564, 595, es(t, 5.6, 8.4)), 270];
      const aimOn = t >= 5 ? es(t, 5, 5.6) : 0;
      O('y-aim', aimOn);
      const ext = (y0) => { const k = (598 - 406) / (F[0] - 406); return [lpi ? F[0] : 598, lpi ? F[1] : y0 + (F[1] - y0) * k]; };
      const e1 = ext(244), e2 = ext(296);
      S('y-a1', { x2: r1(e1[0]), y2: r1(e1[1]) }); S('y-a2', { x2: r1(e2[0]), y2: r1(e2[1]) });
      S('y-d1', { cx: r1(e1[0] - 1), cy: r1(e1[1]) }); S('y-d2', { cx: r1(e2[0] - 1), cy: r1(e2[1]) });
      TX('y-at', t >= 5 && t < 8.4 ? '조준광 2점 → 초점 불일치' : t >= 8.4 && t < 9.5 ? '● 1점으로 겹침 = 초점 일치' : '');
      S('y-at', { style: 'fill:' + (t >= 8.4 ? '#6fe39a' : '#ff8f8f') });
      const all = shots.concat([21.2]);
      let fl = 0, ring = 0;
      all.forEach(s => { fl = Math.max(fl, bell(t, s, s + 0.45)); if (t >= s && t < s + 0.9) ring = seg(t, s, s + 0.9); });
      S('y-cone', { d: `M406 236 L406 304 L${r1(F[0])} ${r1(F[1])} Z`, opacity: r2(0.1 * aimOn + 0.55 * fl) });
      S('y-fx', { transform: `translate(${r1(F[0])} ${r1(F[1])})` });
      S('y-star', { opacity: r2(fl), transform: `scale(${r2(0.6 + fl)})` });
      S('y-ring', { r: r1(ring * 30), opacity: r2(ring > 0 ? 1 - ring : 0) });
      TX('y-en', t >= 9.5 && t < 15 ? `펄스 ${Math.min(3, shots.filter(s => t >= s).length)} / 3  ·  약 1.0 mJ · 4 ns` : '');
      for (let i = 0; i < 6; i++) {
        const s = shots[i % 3], lt = t - s - 0.2, a = (i * 1.3 - 2.6) * 0.5;
        S('y-b' + i, { cx: r1(600 + lt * 9 * Math.cos(a)), cy: r1(270 + (i - 2.5) * 5 + lt * 9 * Math.sin(a) + lt * lt * 0.6), opacity: r2(lt > 0 ? clamp(1 - lt / 9) * 0.8 : 0) });
      }
      O('y-lpi', seg(t, 21.3, 21.9));
    },
  });
})();

/* ---------- 8. 다이오드 레이저 (모양체광응고) ---------- */
(function () {
  const pathTop = [[568, 203], [561, 222], [556, 246], [550, 256], [537, 258], [529, 240], [534, 212], [540, 198], [534, 187]];
  const NP = 7;
  SCENES.push({
    id: 'diode', icon: '🔴', name: '다이오드 레이저', en: 'Diode Laser — Transscleral Cyclophotocoagulation',
    maker: 'A.R.C. Laser (Germany)', category: 'Laser · Laser Fiber/Probe', target: '모양체 (공막 경유) · 망막',
    principle: '810 nm 근적외선은 흰 공막은 잘 투과하고 <b>멜라닌 색소</b>에는 잘 흡수됩니다. 프로브를 각막 가장자리(윤부) 바로 뒤 공막에 대고 조사하면 빛이 공막을 지나 <b>모양체의 색소상피</b>에서 열로 바뀌어 조직을 응고시킵니다(<b>광응고</b>). 방수를 만드는 모양체가 줄어들어 방수 생성이 감소하고 <b>안압이 내려갑니다</b>. 같은 레이저에 안내 프로브를 연결하면 망막 광응고에도 사용합니다.',
    dur: 26, eye: { pupil: 20 },
    steps: [
      { t: 0, title: '방수 순환과 안압', cap: '<b>방수</b>는 모양체에서 만들어져 후방 → 동공 → 전방으로 흐른 뒤 전방각의 섬유주를 통해 빠져나갑니다. 배출이 막히면 방수가 쌓여 <b>안압이 상승</b>하고 시신경이 손상됩니다(녹내장).' },
      { t: 6, title: '프로브 위치', cap: '광섬유 프로브를 <b>윤부 뒤 약 1.2 mm</b> 공막에 밀착시킵니다. 이 바로 안쪽에 모양체가 있습니다. 눈을 절개하지 않는 경공막(공막 경유) 방식입니다.' },
      { t: 10.5, title: '레이저 조사 (광응고)', cap: '810 nm 레이저가 공막을 투과해 모양체 색소상피의 멜라닌에 흡수됩니다. 열에 의해 <b>모양체 조직이 응고</b>되어 방수 분비 기능이 줄어듭니다. (일반적인 예: 1.5 ~ 2 W, 2초)' },
      { t: 16, title: '여러 지점 반복', cap: '윤부를 따라 프로브를 옮겨가며 약 270° 범위에 수십 발을 조사합니다. 3시·9시 방향(긴뒤섬모체신경·혈관)은 피합니다.' },
      { t: 20, title: '안압 하강', cap: '방수 생성이 줄어 수 주에 걸쳐 <b>안압이 내려갑니다</b>. 약물·수술로 조절되지 않는 <b>난치성 녹내장</b>에 주로 사용합니다.' },
    ],
    terms: [
      ['광응고', 'Photocoagulation', '빛 에너지가 조직에 흡수되어 열로 바뀌며 단백질을 응고시키는 작용. (YAG의 광파괴와 구분)'],
      ['경공막 모양체광응고술', 'TSCPC', '공막을 통해 모양체를 응고시켜 방수 생성을 줄이는 녹내장 시술.'],
      ['방수', 'Aqueous humor', '모양체에서 분비되어 전안부를 채우고 각막·수정체에 영양을 공급하는 맑은 액체.'],
      ['섬유주', 'Trabecular meshwork', '전방각에 있는 방수 배출 필터. 여기를 지나 쉴렘관으로 배출.'],
      ['윤부', 'Limbus', '각막과 공막의 경계부. 프로브 위치의 기준점.'],
      ['안내 광응고', 'Endophotocoagulation', '유리체 수술 중 안내 프로브(endo probe)로 망막을 직접 응고하는 방법.'],
    ],
    facts: [['파장', '810 nm (근적외선)'], ['주 흡수체', '멜라닌 색소'], ['프로브 위치', '윤부 뒤 약 1.2 mm'], ['일반적 조사 조건', '약 1.5 ~ 2 W × 2초 (술자·기종별 상이)'], ['조사 범위', '약 270°, 수십 발']],
    tips: ['광섬유 끝단 오염·탄화, 꺾임·단선은 출력 저하의 가장 흔한 원인입니다. 파워미터로 끝단 출력을 확인합니다.', '프로브·파이버 커넥터 체결 상태와 인식(식별) 오류를 점검합니다.', '풋스위치, 보호 필터·보호안경(810 nm) 등 안전 부속을 함께 확인합니다.'],
    build() {
      let ps = '';
      for (let i = 0; i < NP; i++) ps += `<circle id="d-t${i}" r="2.2"/><circle id="d-b${i}" r="2.2"/>`;
      return `
      <g><rect x="30" y="46" width="176" height="92" rx="12" ${DEV}/>${T(118, 82, '다이오드 레이저', 't-b', 'middle')}${T(118, 104, '810 nm', 't-s t-r', 'middle')}
        <circle id="d-led" cx="186" cy="62" r="5" fill="#ff5a5a" opacity=".2"/></g>
      <path id="d-fib" d="" fill="none" stroke="#e8a23a" stroke-width="2.5"/>
      <g id="d-probe"><rect x="300" y="160" width="104" height="24" rx="9" ${DEV}/><rect x="402" y="166" width="138" height="12" rx="3" fill="#8fa6c7" stroke="#c6d6ee"/>
        <path d="M540 164 L548 166 L548 178 L540 180 Z" fill="#dfe8f5"/>${T(352, 150, '광섬유 프로브', 't-s', 'middle', 'id="d-pl"')}</g>
      <g id="d-dim" opacity="0"><path d="M537 181 L548 166" stroke="#ffd54a" stroke-width="2"/><line x1="541" y1="170" x2="470" y2="118" stroke="#ffd54a"/>${T(466, 112, '윤부 뒤 약 1.2 mm', 't-s t-y', 'end')}</g>
      <path id="d-coT" d="${CIL}" fill="#f6ead9" opacity="0"/><path id="d-coB" d="${CIL}" ${MIRROR} fill="#f6ead9" opacity="0"/>
      <g id="d-shot" opacity="0"><line id="d-bm" x1="548" y1="172" x2="578" y2="180" stroke="#ff4d4d" stroke-width="4" stroke-linecap="round" filter="url(#fGlow)"/><circle id="d-heat" cx="576" cy="180" r="10" fill="#ff8a3d" filter="url(#fGlow)"/></g>
      <g id="d-flow" fill="#8fe9ff">${ps}</g>
      <g id="d-lab" opacity="0">
        <line x1="586" y1="168" x2="640" y2="70" stroke="#8ea3c4"/>${T(644, 62, '모양체: 방수 생성', 't-s t-c')}
        <line x1="533" y1="188" x2="500" y2="60" stroke="#8ea3c4"/>${T(496, 50, '전방각(섬유주): 방수 배출', 't-s t-c', 'end')}
      </g>
      <g><rect x="24" y="396" width="320" height="130" rx="10" ${PANEL}/>${T(40, 420, '안압 (IOP)', 't-s t-dim')}
        ${T(40, 462, '38', 't-xl', 'start', 'id="d-val"')}${T(96, 462, 'mmHg', 't-l')}${T(200, 462, '', 't-s t-b', 'start', 'id="d-st"')}
        <rect x="40" y="482" width="288" height="10" rx="5" fill="#24354f"/><rect x="${40 + 10 * 5.76}" y="482" width="${11 * 5.76}" height="10" fill="#2f9e5b"/>
        <path id="d-ndl" d="M0 478 L6 468 L-6 468 Z" fill="#ffd54a"/>
        ${T(40, 512, '0', 't-xs t-dim')}${T(40 + 15.5 * 5.76, 512, '정상 10~21', 't-xs t-g', 'middle')}${T(328, 512, '50', 't-xs t-dim', 'end')}</g>`;
    },
    update(t, E) {
      const dx = lerp(-130, 0, es(t, 6.2, 8.6)), dy = lerp(0, 196, es(t, 16.2, 17.6));
      S('d-probe', { transform: `translate(${r1(dx)} ${r1(dy)})`, opacity: r2(es(t, 6, 6.6)) });
      O('d-fib', es(t, 6, 6.6));
      S('d-fib', { d: `M206 96 C270 96 ${r1(230 + dx)} ${r1(172 + dy)} ${r1(300 + dx)} ${r1(172 + dy)}` });
            O('d-dim', win(t, 8.6, 16)); O('d-lab', win(t, 1, 6.2));
      const s1 = t >= 11 && t < 15, s2 = t >= 17.8 && t < 19.8, on = s1 || s2;
      const m = s2 ? 1 : 0;
      S('d-bm', { y1: m ? 368 : 172, y2: m ? 360 : 180 }); S('d-heat', { cy: m ? 360 : 180, r: r1(9 + 3 * Math.sin(t * 14)) });
      O('d-shot', on ? 1 : 0); O('d-led', on ? 1 : 0.2);
      const cT = es(t, 11.5, 15), cB = es(t, 18.2, 19.8);
      O('d-coT', cT * 0.85); O('d-coB', cB * 0.85);
      for (let i = 0; i < NP; i++) {
        const u = (t * 0.11 + i / NP) % 1, p = along(pathTop, u), fade = Math.min(u * 8, (1 - u) * 8, 1);
        const keep = i % 3 === 0 ? 1 : 0;
        S('d-t' + i, { cx: r1(p[0]), cy: r1(p[1]), opacity: r2(fade * lerp(1, keep, cT)) });
        S('d-b' + i, { cx: r1(p[0]), cy: r1(540 - p[1]), opacity: r2(fade * lerp(1, keep, cB)) });
      }
      const iop = lerp(lerp(38, 30, cT), 18, es(t, 19.5, 23.5));
      TX('d-val', String(Math.round(iop))); S('d-val', { style: 'fill:' + (iop > 21 ? '#ff8f8f' : '#6fe39a') });
      S('d-ndl', { transform: `translate(${r1(40 + iop * 5.76)} 0)` });
      TX('d-st', iop > 21 ? '▲ 높음' : '✔ 정상 범위'); S('d-st', { style: 'fill:' + (iop > 21 ? '#ff8f8f' : '#6fe39a') });
    },
  });
})();

/* ---------- 9. 초음파유화 핸드피스 ---------- */
(function () {
  const u = [0.817, 0.576], ENT = [505, 222];
  const sOf = t => t < 4.6 ? -46 : t < 8.2 ? lerp(-46, 78, es(t, 4.6, 8.2)) : t < 16.4 ? 78 : lerp(78, -14, es(t, 16.4, 18));
  SCENES.push({
    id: 'phaco', icon: '🛠️', name: '초음파유화 핸드피스', en: 'Phacoemulsification Handpiece',
    maker: '각 제조사 (Infiniti · Centurion · Sovereign · Stellaris 등)', category: 'Phaco Handpiece', target: '수정체 (백내장)',
    principle: '핸드피스 내부의 <b>압전소자(피에조)</b>가 전기 신호를 초당 약 3~4만 회의 <b>초음파 진동</b>으로 바꾸고, 혼(horn)이 이를 증폭해 끝의 <b>티타늄 팁</b>을 앞뒤로 미세하게 진동시킵니다. 이 진동이 딱딱한 수정체 핵을 잘게 부수어(<b>유화</b>) 팁 안쪽 구멍으로 <b>흡인</b>하고, 동시에 슬리브를 통해 <b>관류액</b>을 공급해 전방 깊이와 안압을 유지하고 팁의 열을 식힙니다.',
    dur: 27, eye: { pupil: 40, cat: 1 },
    steps: [
      { t: 0, title: '백내장', cap: '<b>백내장</b>은 수정체가 혼탁해져 빛이 망막까지 제대로 도달하지 못하는 질환입니다. 혼탁한 수정체를 제거하고 인공수정체로 바꾸는 것이 치료입니다.' },
      { t: 4, title: '절개 · 팁 삽입', cap: '각막 가장자리에 약 2.2~2.8 mm의 작은 절개창을 만들고, 수정체 앞 주머니(전낭)를 둥글게 연 뒤(원형전낭절개) 핸드피스의 팁을 수정체 핵까지 넣습니다.' },
      { t: 9, title: '초음파 유화 · 흡인', cap: '팁이 초음파로 진동하며 <b>수정체 핵을 잘게 부수고</b>, 조각은 팁 내부로 <b>흡인</b>됩니다(노란 점). 동시에 슬리브에서 <b>관류액</b>(파란 점)이 나와 전방을 유지하고 팁을 식힙니다.' },
      { t: 16.5, title: '인공수정체(IOL) 삽입', cap: '핵과 피질을 모두 제거하고 남긴 <b>수정체낭(주머니)</b> 안에, 접힌 인공수정체를 넣어 펼칩니다. 절개창이 작아 봉합 없이 자가 폐쇄됩니다.' },
      { t: 22, title: '결과 · 핸드피스 구조', cap: '투명한 인공수정체를 통해 빛이 다시 황반에 초점을 맺습니다. 핸드피스는 <b>압전소자 → 혼 → 팁</b>으로 진동을 전달하며, 관류·흡인 라인이 연결됩니다.' },
    ],
    terms: [
      ['초음파유화술', 'Phacoemulsification', '초음파 진동으로 수정체 핵을 유화·흡인하는 현대 백내장 수술의 표준 술식.'],
      ['압전소자', 'Piezoelectric crystal', '전압을 가하면 미세하게 늘고 줄어드는 세라믹. 핸드피스 초음파 진동의 발생원.'],
      ['혼', 'Horn', '압전소자의 진동을 증폭해 팁으로 전달하는 금속 구조.'],
      ['관류 / 흡인', 'Irrigation / Aspiration (I/A)', '관류액(BSS) 공급과 유화 조각 흡인. 균형이 무너지면 전방이 꺼집니다(surge).'],
      ['스트로크', 'Stroke length', '팁이 앞뒤로 움직이는 진폭. 초음파 파워(%)에 비례.'],
      ['원형전낭절개', 'CCC, Capsulorhexis', '수정체 전낭을 둥글게 여는 과정. 남은 주머니에 IOL을 넣습니다.'],
      ['인공수정체', 'IOL, Intraocular lens', '제거한 수정체를 대신하는 영구 삽입 렌즈.'],
    ],
    facts: [['진동 주파수', '약 28 ~ 45 kHz (기종별 고정)'], ['팁 스트로크', '최대 약 80 ~ 100 µm'], ['절개창 크기', '약 2.2 ~ 2.8 mm'], ['팁 재질', '티타늄 합금'], ['멸균', '고압증기멸균(오토클레이브) 반복']],
    tips: ['반복 멸균(열·습기)으로 압전소자 열화·접착 분리, 커넥터·케이블 절연 불량이 가장 흔한 고장입니다.', '튜닝(tuning) 실패·파워 저하 시 압전소자 임피던스/공진 주파수, 팁 체결 토크, 혼 균열을 확인합니다.', '흡인 라인 막힘과 관류 누수(O-링)를 점검하고, 수리 후에는 본체에서 튜닝 테스트를 합니다.'],
    build() {
      let rays = '', pass = '';
      [-18, 0, 18].forEach(dy => { rays += `<path d="${rayTo(380, dy, 561)}"/>`; pass += `<line x1="561" y1="${r1(270 + dy * 0.8)}" x2="${FOVEA[0]}" y2="270"/>`; });
      return `
      <g id="h-rays" fill="none" stroke="#ffe27a" stroke-width="1.5" opacity="0">${rays}</g>
      <g id="h-pass" stroke="#ffe27a" stroke-width="1.5" opacity="0">${pass}</g>
      <g id="h-blk" opacity="0">${T(700, 215, '혼탁 → 빛이 차단·산란', 't-s t-r', 'middle')}<line x1="582" y1="318" x2="560" y2="420" stroke="#8ea3c4"/>${T(556, 438, '혼탁한 수정체 (백내장)', 't-s', 'middle')}</g>
      ${T(712, 215, '빛이 황반에 초점', 't-s t-g', 'middle', 'id="h-ok" opacity="0"')}
      <g id="h-us" fill="none" stroke="#fff" stroke-width="1.3">${[0, 1, 2].map(i => `<circle id="h-w${i}" r="0" opacity="0"/>`).join('')}</g>
      <g id="h-irr" fill="#6fc3ff">${[0, 1, 2, 3, 4].map(i => `<circle id="h-i${i}" r="2" opacity="0"/>`).join('')}</g>
      <g id="h-hp">
        <path d="M-330 -7 C-380 -7 -400 -30 -470 -30" fill="none" stroke="#e9c46a" stroke-width="4"/>
        <path d="M-330 7 C-380 7 -410 20 -470 22" fill="none" stroke="#6fc3ff" stroke-width="4"/>
        <rect x="-332" y="-16" width="134" height="32" rx="7" ${DEV}/>
        ${[0, 1, 2, 3].map(i => `<rect x="${-304 + i * 17}" y="-11" width="12" height="22" rx="2" fill="#e6b450" stroke="#8c6420"/>`).join('')}
        <path d="M-200 -13 L-150 -5.5 L-150 5.5 L-200 13 Z" fill="#9fb4d6" stroke="#c6d6ee"/>
        <rect x="-150" y="-5.5" width="134" height="11" rx="4.5" fill="#5aaaff" fill-opacity=".45" stroke="#8fc6f2" stroke-width=".8"/>
        <path d="M-152 -2.4 L-4 -2.4 L0 2.4 L-152 2.4 Z" fill="#eef3fa"/>
        <g fill="#e9c46a">${[0, 1, 2, 3, 4].map(i => `<circle id="h-a${i}" cy="0" r="1.9" opacity="0"/>`).join('')}</g>
      </g>
      <g id="h-lb1" opacity="0">${T(330, 250, '초음파 진동 (약 4만 회/초)', 't-s t-y', 'middle')}<text x="330" y="268" class="t-xs" text-anchor="middle"><tspan style="fill:#e9c46a">● 흡인 (유화된 조각)</tspan>  <tspan style="fill:#6fc3ff">● 관류액</tspan></text></g>
      <g id="h-lb2" opacity="0">
        <line x1="238" y1="96" x2="270" y2="66" stroke="#8ea3c4"/>${T(234, 110, '압전소자 (초음파 발생)', 't-s t-y', 'end')}
        <line x1="322" y1="158" x2="350" y2="120" stroke="#8ea3c4"/>${T(318, 174, '혼 (진동 증폭)', 't-s', 'end')}
        <line x1="430" y1="232" x2="452" y2="190" stroke="#8ea3c4"/>${T(432, 248, '팁 + 관류 슬리브', 't-s', 'end')}
        ${T(150, 30, '흡인 · 관류 라인 ↖', 't-xs t-dim', 'middle')}
        <line x1="590" y1="330" x2="560" y2="420" stroke="#8ea3c4"/>${T(556, 438, '수정체낭 안의 인공수정체 (IOL)', 't-s', 'middle')}
      </g>`;
    },
    update(t, E) {
      const us = t >= 9.3 && t < 16.2;
      const s = sOf(t) + (us ? 1.6 * Math.sin(t * 90) : 0);
      const Pt = [ENT[0] + u[0] * s, ENT[1] + u[1] * s];
      S('h-hp', { transform: `translate(${r1(Pt[0])} ${r1(Pt[1])}) rotate(35.2)`, opacity: r2(es(t, 4, 4.8)) });
      const rm = es(t, 10, 16);
      E.cat = 1 - rm * 0.4; E.catS = 1 - rm; if (rm >= 1) E.cat = 0;
      E.lens = 1 - seg(t, 9.5, 12); E.bag = seg(t, 9.5, 12);
      E.iol = es(t, 18.6, 20.6); E.iolS = lerp(0.35, 1, es(t, 18.8, 21));
      const l1 = t < 4 ? es(t, 0.8, 2) : 0, l2 = es(t, 22, 23.2);
      O('h-rays', Math.max(l1, l2)); O('h-pass', l2); O('h-blk', win(t, 1.6, 4.4)); O('h-ok', es(t, 23.2, 24));
      for (let i = 0; i < 3; i++) { const ph = (t * 2.2 + i / 3) % 1; S('h-w' + i, { cx: r1(Pt[0]), cy: r1(Pt[1]), r: r1(4 + ph * 20), opacity: r2(us ? (1 - ph) * 0.8 : 0) }); }
      for (let i = 0; i < 5; i++) {
        const ph = (t * 0.9 + i / 5) % 1;
        S('h-a' + i, { cx: r1(-ph * 330), opacity: us ? 0.95 : 0 });
        const a = (i - 2) * 0.55 + 0.6, b = [Pt[0] - u[0] * 16, Pt[1] - u[1] * 16];
        S('h-i' + i, { cx: r1(b[0] + Math.cos(a) * ph * 26), cy: r1(b[1] + Math.sin(a) * ph * 26), opacity: r2(us ? 1 - ph : 0) });
      }
      O('h-lb1', win(t, 9.6, 16.2)); O('h-lb2', es(t, 22.4, 23.4));
    },
  });
})();

/* ====================================================================== */
/*  플레이어                                                               */
/* ====================================================================== */
const $id = id => document.getElementById(id);
const ui = { tabs: $id('edu-tabs'), info: $id('edu-info'), chip: $id('edu-step-chip'), cap: $id('edu-caption'), play: $id('edu-play'), big: $id('edu-bigplay'),
  bar: $id('edu-bar'), fill: $id('edu-bar-fill'), marks: $id('edu-bar-marks'), time: $id('edu-time'), speed: $id('edu-speed'), voice: $id('edu-voice'), full: $id('edu-full'), player: $id('edu-player') };
let cur = null, t = 0, playing = false, speed = 1, lastTs = 0, stepIdx = -1, voiceOn = false;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const fmt = s => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');

function speak(html) {
  if (!voiceOn || !window.speechSynthesis) return;
  speechSynthesis.cancel();
  const m = new SpeechSynthesisUtterance(html.replace(/<[^>]+>/g, ''));
  m.lang = 'ko-KR'; m.rate = 1.05;
  speechSynthesis.speak(m);
}

function render() {
  const E = Object.assign({}, EYE_DEF, cur.eye || {});
  cur.update(t, E);
  applyEye(E);
  let i = 0;
  cur.steps.forEach((s, k) => { if (t >= s.t) i = k; });
  if (i !== stepIdx) {
    stepIdx = i;
    ui.chip.textContent = `${i + 1} / ${cur.steps.length} · ${cur.steps[i].title}`;
    ui.cap.innerHTML = cur.steps[i].cap;
    ui.info.querySelectorAll('.edu-steps li').forEach((li, k) => li.classList.toggle('active', k === i));
    if (playing) speak(cur.steps[i].title + '. ' + cur.steps[i].cap);
  }
  ui.fill.style.width = (t / cur.dur * 100) + '%';
  ui.time.textContent = fmt(t) + ' / ' + fmt(cur.dur);
}
function syncUI() {
  ui.play.textContent = playing ? '⏸' : (t >= cur.dur ? '↻' : '▶');
  ui.big.classList.toggle('hidden', playing || t > 0);
}
function frame(ts) {
  if (!playing) return;
  const dt = Math.min(0.1, (ts - lastTs) / 1000); lastTs = ts;
  t += dt * speed;
  if (t >= cur.dur) { t = cur.dur; playing = false; }
  render();
  if (playing) requestAnimationFrame(frame); else syncUI();
}
function play() {
  if (t >= cur.dur) { t = 0; stepIdx = -1; }
  playing = true; lastTs = performance.now(); syncUI();
  const s = cur.steps[Math.max(0, stepIdx)]; if (s && stepIdx >= 0) speak(s.title + '. ' + s.cap);
  requestAnimationFrame(frame);
}
function pause() { playing = false; if (window.speechSynthesis) speechSynthesis.cancel(); syncUI(); }
function seek(v) { t = clamp(v, 0, cur.dur); render(); syncUI(); }
function gotoStep(i) { seek(cur.steps[clamp(i, 0, cur.steps.length - 1)].t + 0.001); }

function infoHtml(s) {
  const steps = s.steps.map((st, i) => `<li data-i="${i}"><span class="n">${i + 1}</span>${esc(st.title)}</li>`).join('');
  const terms = s.terms.map(x => `<div><b>${esc(x[0])}</b><i>${esc(x[1])}</i><br>${esc(x[2])}</div>`).join('');
  const facts = s.facts.map(x => `<tr><td>${esc(x[0])}</td><td>${esc(x[1])}</td></tr>`).join('');
  return `
  <div class="edu-card"><h2>${s.icon} ${esc(s.name)}</h2><div class="edu-en">${esc(s.en)}</div>
    <dl class="edu-meta"><dt>제조사</dt><dd>${esc(s.maker)}</dd><dt>분류</dt><dd>${esc(s.category)}</dd><dt>적용 부위</dt><dd>${esc(s.target)}</dd></dl>
    <p>${s.principle}</p></div>
  <div class="edu-card"><h3>진행 단계</h3><ul class="edu-steps">${steps}</ul></div>
  <div class="edu-card"><h3>전문 용어</h3><div class="edu-terms">${terms}</div></div>
  <div class="edu-card"><h3>참고 수치</h3><table class="edu-facts">${facts}</table></div>
  ${s.tips ? `<div class="edu-card"><h3>현장 점검 포인트</h3><ul class="edu-tips">${s.tips.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>` : ''}
  <p class="edu-note">※ 수치는 교육용 일반 참고값입니다. 실제 사양·사용법은 모델별 사용설명서와 서비스 매뉴얼을 따르세요. 그림은 이해를 돕기 위해 비율을 과장했습니다.</p>`;
}

function load(id, autoplay) {
  if (cur) pause();
  cur = SCENES.find(s => s.id === id) || SCENES[0];
  cache = {}; lastEye = {}; stepIdx = -1; t = 0;
  svg.innerHTML = eyeMarkup() + '<g id="scene">' + cur.build() + '</g>';
  ui.info.innerHTML = infoHtml(cur);
  ui.marks.innerHTML = cur.steps.slice(1).map(s => `<span style="left:${s.t / cur.dur * 100}%"></span>`).join('');
  ui.tabs.querySelectorAll('.edu-tab').forEach(b => b.classList.toggle('active', b.dataset.id === cur.id));
  render(); syncUI();
  if (location.hash.slice(1) !== cur.id) history.replaceState(null, '', '#' + cur.id);
  if (autoplay) play();
}

ui.tabs.innerHTML = SCENES.map(s => `<button class="edu-tab" data-id="${s.id}"><span>${s.icon}</span>${esc(s.name)}</button>`).join('');
ui.tabs.addEventListener('click', e => { const b = e.target.closest('.edu-tab'); if (b) load(b.dataset.id, true); });
ui.info.addEventListener('click', e => { const li = e.target.closest('.edu-steps li'); if (li) gotoStep(+li.dataset.i); });
svg.addEventListener('click', e => { const g = e.target.closest('.an-lbl'); if (g) gotoStep(+g.dataset.step); });
ui.play.addEventListener('click', () => playing ? pause() : play());
ui.big.addEventListener('click', play);
$id('edu-prev').addEventListener('click', () => gotoStep(t - cur.steps[stepIdx].t > 1 ? stepIdx : stepIdx - 1));
$id('edu-next').addEventListener('click', () => gotoStep(stepIdx + 1));
ui.speed.addEventListener('change', () => { speed = +ui.speed.value; });
ui.voice.addEventListener('click', () => {
  voiceOn = !voiceOn; ui.voice.textContent = voiceOn ? '🔊' : '🔇'; ui.voice.classList.toggle('on', voiceOn);
  if (!voiceOn && window.speechSynthesis) speechSynthesis.cancel();
  else if (playing) speak(cur.steps[stepIdx].title + '. ' + cur.steps[stepIdx].cap);
});
ui.full.addEventListener('click', () => { if (document.fullscreenElement) document.exitFullscreen(); else if (ui.player.requestFullscreen) ui.player.requestFullscreen(); });
const barSeek = e => { const r = ui.bar.getBoundingClientRect(); seek((e.clientX - r.left) / r.width * cur.dur); };
ui.bar.addEventListener('pointerdown', e => { ui.bar.setPointerCapture(e.pointerId); barSeek(e); });
ui.bar.addEventListener('pointermove', e => { if (e.buttons & 1) barSeek(e); });
document.addEventListener('keydown', e => {
  if (/INPUT|SELECT|TEXTAREA|BUTTON/.test(e.target.tagName)) return;
  if (e.code === 'Space') { e.preventDefault(); playing ? pause() : play(); }
  else if (e.code === 'ArrowRight') gotoStep(stepIdx + 1);
  else if (e.code === 'ArrowLeft') gotoStep(stepIdx - 1);
});
window.addEventListener('pagehide', () => { if (window.speechSynthesis) speechSynthesis.cancel(); });

window.__edu = { load, seek, scenes: SCENES };
load(location.hash.slice(1) || 'anatomy', false);
})();
