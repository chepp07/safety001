// 직원이 제작한 매뉴얼 포스터 이미지 URL을 넣으면 해당 유형 카드 상단에 표시됩니다.
// (ImgBB 등에 업로드 후 직접 이미지 주소를 붙여넣으세요. 비워두면 인포그래픽만 표시)
const MANUAL_IMG = {
  vehicle:  "./img/manual-vehicle.jpg",   // 차량사고 포스터 (저장소 내 이미지)
  personal: "",   // 인사사고
  product:  "",   // 제품사고
  supply:   "",   // 공급사고
};

const TAG_STYLE = {
  "119":   { bg:"#fff0f0", co:"#b71c1c" },
  "112":   { bg:"#fff0f0", co:"#b71c1c" },
  "최우선": { bg:"#fff0f0", co:"#b71c1c" },
  "긴급":   { bg:"#fff3e6", co:"#e65100" },
  "필수":   { bg:"#eef2fb", co:"#1e2761" },
  "의무":   { bg:"#efe7fb", co:"#5b3ba8" },
};

export function renderManual() {
  const sections = [
    {
      key:"personal", icon:"🧑‍⚕️", title:"인사사고 대응절차", sub:"사람의 생명·안전이 최우선입니다",
      color:"#b71c1c", bg:"#fff5f5",
      steps:[
        { t:"부상자 상태 즉시 확인", tag:"최우선", sub:"의식·출혈·골절 등 중증 → 즉시 119 / 경증 → 응급처치 후 병원 이송" },
        { t:"2차 재해 방지", sub:"관련 설비 정지·전원 차단, 현장 통제, 주변 작업자 대피" },
        { t:"응급처치 시행", sub:"지혈·심폐소생 등. 척추·골절 의심 시 무리하게 이동 금지" },
        { t:"현장 보존 및 사진 촬영", sub:"가능한 한 원상태 유지, 사고지점·설비·주변 상황 촬영" },
        { t:"즉시 사고 접수 (앱) + 직접 보고", sub:"TF장·사업소장에게 전화 병행 보고" },
        { t:"목격자 확보 및 진술 기록", sub:"목격자 성명·연락처 확보" },
        { t:"작업중지 여부 판단", sub:"급박한 위험 시 작업중지권 발동·작업 중단" },
        { t:"중대재해 시 관계기관 보고", tag:"의무", sub:"사망·3일 이상 휴업 재해는 지체 없이 고용노동부 보고(법적 의무)" },
        { t:"원인 분석 및 재발방지 대책 수립" },
      ],
      checklist:[
        {label:"119 소방·구급", num:"119"},
        {label:"112 경찰", num:"112"},
        {label:"고용노동부", num:"1350"},
      ],
      note:"⚠️ 중대재해(사망·3일 이상 휴업 등)는 지체 없이 고용노동부에 보고할 의무가 있습니다.",
    },
    {
      key:"product", icon:"📦", title:"제품사고 대응절차", sub:"추가 손상 방지와 품질 추적이 핵심",
      color:"#e65100", bg:"#fff8f0",
      steps:[
        { t:"피해 제품 즉시 격리", tag:"필수", sub:"양품·불량 구분, 식별표(적색) 부착, 추가 손상·혼입 방지" },
        { t:"피해 범위 확인", sub:"품번·수량·LOT(로트)번호 기록 → 추적성 확보" },
        { t:"현장 사진 촬영", sub:"손상 상태·포장·라벨을 근접 촬영해 기록" },
        { t:"즉시 사고 접수 (앱)" },
        { t:"대체품·재작업 가능 여부 확인" },
        { t:"고객사 납입 일정 영향 검토", sub:"영향 예상 시 사전 공유로 혼선 방지" },
        { t:"원인 분석(4M) 및 재발방지 대책 수립" },
      ],
      checklist:[ {label:"품질팀", num:""}, {label:"생산관리", num:""} ],
      note:"📌 격리·식별표시와 LOT 기록을 먼저 하면 이후 원인 추적이 빨라집니다.",
    },
    {
      key:"supply", icon:"🚚", title:"공급사고 대응절차", sub:"라인 중단 최소화가 관건",
      color:"#1e2761", bg:"#f0f4ff",
      steps:[
        { t:"이상 내용 즉시 확인", sub:"이종·혼입·결품·불량·수량오류 등 구체 파악" },
        { t:"라인중단 여부·예상 시간 파악", tag:"긴급", sub:"중단/중단예상/미장착 구분, 예상 정지 시간 산정" },
        { t:"즉시 사고 접수 (앱)" },
        { t:"고객사 생산관리 담당자 직접 연락" },
        { t:"긴급 대체품 수배 및 특송 조치" },
        { t:"1차 협력사 원인 조사 요청" },
        { t:"수정 납입 계획 수립·보고 및 재발방지" },
      ],
      checklist:[ {label:"생산관리", num:""}, {label:"물류팀", num:""} ],
      note:"📌 라인중단 시간은 분 단위로 영향이 커집니다. 접수와 동시에 대체품 수배를 병행하세요.",
    },
    {
      key:"vehicle", icon:"🚗", title:"차량사고 대응절차", sub:"안전이 최우선! 신속·정확한 대응이 2차 사고를 예방합니다",
      color:"#7b5e00", bg:"#fffdf2",
      steps:[
        { t:"사고 시 즉시 부상자 확인", tag:"119", sub:"중증 부상 → 119 신고 / 경증 부상 → 사고수습 진행" },
        { t:"2차 사고 방지", sub:"비상등 점등 → 안전삼각대 설치 → 갓길로 이동하여 안전 확보" },
        { t:"사고현장 사진 촬영", sub:"본인 차량과 상대방 차량의 파손 상태를 모두 촬영" },
        { t:"상대방 정보 확인", tag:"필수", sub:"차량번호·상대방 성명·핸드폰 번호 확인 후 사무실 담당자에게 전달" },
        { t:"즉시 사고 접수 (앱)" },
        { t:"경찰 신고", tag:"112", sub:"대물·대인 사고 시 112 신고" },
        { t:"보험 접수 및 담당자 보고", sub:"사고위치 → 사고사진 → 상대방 인적사항을 담당자에게 보고" },
        { t:"사고 경위서 작성 및 제출" },
      ],
      checklist:[
        {label:"119 소방·구급", num:"119"},
        {label:"112 경찰", num:"112"},
      ],
      note:"⚠️ 상대방 차량번호·성명·연락처는 반드시 현장에서 확보해 사무실 담당자에게 전달하세요.",
    },
  ];

  const stepHtml = (s, step, i) => {
    const tag = step.tag ? (() => { const t = TAG_STYLE[step.tag]||{bg:"#eee",co:"#666"};
      return `<span style="font-size:10px;font-weight:800;padding:1px 7px;border-radius:10px;background:${t.bg};color:${t.co};margin-left:6px;white-space:nowrap;">${step.tag}</span>`; })() : "";
    const sub = step.sub ? `<div style="font-size:12px;color:#777;line-height:1.55;margin-top:2px;">${step.sub}</div>` : "";
    return `
    <div style="display:flex;align-items:flex-start;gap:11px;padding:9px 0;border-top:${i===0?"none":"1px dashed #eef2f7"};">
      <span style="background:${s.color};color:#fff;font-size:11px;font-weight:800;
        min-width:22px;height:22px;border-radius:50%;display:flex;align-items:center;
        justify-content:center;flex-shrink:0;margin-top:1px;">${i+1}</span>
      <div style="flex:1;min-width:0;">
        <div style="font-size:13.5px;font-weight:600;color:#222;line-height:1.5;">${step.t}${tag}</div>
        ${sub}
      </div>
    </div>`;
  };

  const card = (s) => {
    const img = MANUAL_IMG[s.key];
    const imgHtml = img ? `<div style="padding:12px 12px 0;"><img src="${img}" alt="${s.title}" style="width:100%;border-radius:10px;border:1px solid #eef2f7;display:block;"/></div>` : "";
    const checks = (s.checklist||[]).map(c => c.num
      ? `<a href="tel:${c.num}" style="text-decoration:none;background:${s.bg};border:1px solid ${s.color}22;border-radius:8px;padding:7px 11px;display:flex;flex-direction:column;">
           <span style="font-size:10px;color:#999;">${c.label}</span><span style="font-size:14px;font-weight:800;color:${s.color};">${c.num}</span></a>`
      : `<span style="background:${s.bg};border:1px solid ${s.color}22;border-radius:8px;padding:7px 11px;font-size:12px;font-weight:600;color:${s.color};">${c.label}</span>`
    ).join("");

    return `
    <div class="card" style="margin-bottom:16px;padding:0;overflow:hidden;">
      <div style="background:${s.color};padding:14px 16px;display:flex;align-items:center;gap:12px;">
        <div style="width:44px;height:44px;border-radius:11px;background:rgba(255,255,255,.18);
          display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0;">${s.icon}</div>
        <div style="min-width:0;">
          <div style="font-size:16px;font-weight:800;color:#fff;">${s.title}</div>
          <div style="font-size:11.5px;color:rgba(255,255,255,.8);margin-top:1px;line-height:1.4;">${s.sub}</div>
        </div>
      </div>
      ${imgHtml}
      <div style="padding:8px 16px 14px;">
        ${s.steps.map((step,i)=>stepHtml(s, step, i)).join("")}
        ${s.note ? `<div style="margin-top:12px;background:${s.bg};border-left:3px solid ${s.color};border-radius:0 8px 8px 0;padding:9px 12px;font-size:12px;color:#555;line-height:1.6;">${s.note}</div>` : ""}
        ${checks ? `<div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:12px;">${checks}</div>` : ""}
      </div>
    </div>`;
  };

  return `
<div class="page" style="max-width:600px;">
  <div style="display:flex;align-items:center;gap:10px;margin-bottom:1.5rem;">
    <button id="btn-manual-back" style="background:none;border:none;cursor:pointer;font-size:22px;color:#888;padding:4px;">‹</button>
    <div>
      <div style="font-size:18px;font-weight:700;">사고처리 매뉴얼</div>
      <div style="font-size:12px;color:#aaa;">사고 유형별 대응 절차</div>
    </div>
  </div>

  ${sections.map(card).join("")}

  <div class="card" style="background:#1e2761;border-color:#1e2761;margin-bottom:14px;">
    <div style="font-size:14px;font-weight:700;color:#fff;margin-bottom:12px;">📞 긴급 연락처</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
      ${[
        {label:"119 (소방/구급)", num:"119"},
        {label:"112 (경찰)", num:"112"},
        {label:"한국가스안전공사", num:"1544-4500"},
        {label:"고용노동부 신고", num:"1350"},
      ].map(c=>`
      <a href="tel:${c.num}" style="background:rgba(255,255,255,.1);border-radius:9px;
        padding:10px 12px;text-decoration:none;display:block;">
        <div style="font-size:11px;color:rgba(255,255,255,.6);margin-bottom:3px;">${c.label}</div>
        <div style="font-size:16px;font-weight:700;color:#fff;">${c.num}</div>
      </a>`).join("")}
    </div>
  </div>

  <div style="text-align:center;">
    <button id="btn-manual-back2" style="padding:11px 28px;background:#f5f5f5;border:none;
      border-radius:9px;font-size:14px;color:#666;cursor:pointer;font-family:inherit;">
      ← 메인으로
    </button>
  </div>
</div>`;
}
