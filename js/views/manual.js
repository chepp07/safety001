export function renderManual() {
  const sections = [
    { icon:"🧑‍⚕️", title:"인사사고 대응절차", color:"#b71c1c", bg:"#fff5f5", steps:[
      "부상자 안전 확인 및 119 신고 (중상 시)",
      "현장 통제 및 2차 사고 예방 조치",
      "사고 현장 사진 촬영 (현장 보존)",
      "즉시 사고 접수 (앱 사용)",
      "TF장 및 사업소장 직접 보고",
      "작업중지 여부 판단 및 조치",
      "재발방지 대책 수립 및 보고"
    ]},
    { icon:"📦", title:"제품사고 대응절차", color:"#e65100", bg:"#fff8f0", steps:[
      "피해 제품 현장 격리 및 추가 손상 방지",
      "피해 수량 및 품번 확인",
      "현장 사진 촬영 (손상 상태 기록)",
      "즉시 사고 접수 (앱 사용)",
      "대체품 확보 가능 여부 확인",
      "고객사 납입 일정 영향 검토",
      "원인 분석 및 재발방지 대책 수립"
    ]},
    { icon:"🚚", title:"공급사고 대응절차", color:"#1e2761", bg:"#f0f4ff", steps:[
      "불량·이종·결품 수량 즉시 확인",
      "라인중단 여부 및 예상 시간 파악",
      "즉시 사고 접수 (앱 사용)",
      "고객사 생산관리 담당자 직접 연락",
      "긴급 대체품 수배 및 운송 조치",
      "1차 협력사 원인 조사 요청",
      "수정 납입 계획 수립 및 보고"
    ]},
    { icon:"🚗", title:"차량사고 대응절차", color:"#7b5e00", bg:"#fffde7", steps:[
      "부상자 확인 및 119 신고 (부상 시)",
      "2차 사고 방지 (삼각대 설치 등)",
      "현장 사진 촬영 (차량 손상 기록)",
      "즉시 사고 접수 (앱 사용)",
      "경찰 신고 (대물사고 시)",
      "보험사 접수 및 담당자 보고",
      "사고 경위서 작성 및 제출"
    ]}
  ];

  return `
<div class="page" style="max-width:600px;">
  <div style="display:flex;align-items:center;gap:10px;margin-bottom:1.5rem;">
    <button id="btn-manual-back" style="background:none;border:none;cursor:pointer;font-size:22px;color:#888;padding:4px;">‹</button>
    <div>
      <div style="font-size:18px;font-weight:700;">사고처리 매뉴얼</div>
      <div style="font-size:12px;color:#aaa;">사고 유형별 대응 절차</div>
    </div>
  </div>

  ${sections.map(s=>`
  <div class="card" style="margin-bottom:14px;">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
      <div style="width:42px;height:42px;border-radius:10px;background:${s.bg};
        display:flex;align-items:center;justify-content:center;font-size:22px;">${s.icon}</div>
      <div style="font-size:15px;font-weight:700;color:${s.color};">${s.title}</div>
    </div>
    <div style="display:flex;flex-direction:column;gap:8px;">
      ${s.steps.map((step,i)=>`
      <div style="display:flex;align-items:flex-start;gap:10px;font-size:13px;color:#333;line-height:1.6;">
        <span style="background:${s.color};color:#fff;font-size:10px;font-weight:700;
          min-width:18px;height:18px;border-radius:50%;display:flex;align-items:center;
          justify-content:center;flex-shrink:0;margin-top:2px;">${i+1}</span>
        <span>${step}</span>
      </div>`).join("")}
    </div>
  </div>`).join("")}

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
