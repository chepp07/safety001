import { state } from "../state.js";
import { levelLabel } from "../utils.js";

export function renderMyReport() {
  const { myReportPhone, myReportSelected, entries } = state;

  const myList = myReportPhone
    ? Object.entries(entries)
        .filter(([,e]) => e.phone && e.phone.replace(/\D/g,"") === myReportPhone.replace(/\D/g,""))
        .sort((a,b) => (b[1].createdAt||"").localeCompare(a[1].createdAt||""))
    : [];

  const lvStyle = {
    "1":{bg:"#fff5f5",color:"#b71c1c",border:"#f5c6c6"},
    "2":{bg:"#fff8f0",color:"#e65100",border:"#fcd8a8"},
    "3":{bg:"#f0faf0",color:"#2e7d32",border:"#b8e0ba"}
  };

  return `
<div class="header" style="margin-bottom:1.25rem;">
  <div class="icon-wrap" style="background:#e8eef7;">📋</div>
  <div class="form-title">내 접수 조회</div>
  <div class="form-desc">접수 시 입력한 연락처로 본인 확인 후<br>나의 사고 접수 내역을 확인하고 후속조치를 입력할 수 있습니다.</div>
</div>

<div class="card">
  <div class="section-title">🔍 연락처로 조회</div>
  <div style="display:flex;gap:8px;">
    <input id="my-phone" class="input" value="${myReportPhone}" placeholder="010-0000-0000" type="tel" style="flex:1;"/>
    <button id="btn-my-search" style="padding:10px 18px;background:#1e2761;color:#fff;border:none;border-radius:9px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap;">조회</button>
  </div>
</div>

${myReportPhone && myList.length===0 ? `
<div class="card" style="text-align:center;color:#aaa;padding:2rem;font-size:14px;">
  접수 내역이 없습니다.
</div>` : ""}

${myList.length>0 ? `
<div class="card" style="padding:0;overflow:hidden;">
  <div style="padding:12px 16px;font-size:13px;font-weight:700;color:#1e2761;border-bottom:1px solid #eef2f7;">
    총 ${myList.length}건의 접수 내역
  </div>
  ${myList.map(([key,e])=>{
    const ls = lvStyle[e.level]||{bg:"#f5f5f5",color:"#999",border:"#ddd"};
    const isSelected = myReportSelected===key;
    return `
  <div style="border-bottom:1px solid #eef2f7;">
    <div onclick="selectMyReport('${key}')"
      style="padding:12px 16px;cursor:pointer;background:${isSelected?"#f0f4ff":"#fff"};transition:background .15s;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap;">
        <span style="display:inline-block;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:700;background:${ls.bg};color:${ls.color};border:1px solid ${ls.border};">
          Lv${e.level||"?"} ${["","최긴급","긴급","일반"][+e.level]||""}
        </span>
        <span style="font-family:monospace;font-size:11px;color:#999;">${e.accNo||"-"}</span>
        <span style="margin-left:auto;font-size:11px;color:#aaa;">${(e.createdAt||"").slice(0,16)}</span>
      </div>
      <div style="font-size:14px;font-weight:600;color:#1a1a1a;margin-bottom:3px;">${e.site} · ${e.accType} > ${e.accDetail}</div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <span style="font-size:12px;color:#888;">📍 ${e.location||"-"}</span>
        <span style="font-size:12px;padding:1px 7px;border-radius:5px;font-weight:600;
          background:${e.status==="완료"?"#e8f5e9":e.status==="처리중"?"#fff8f0":"#f0f4ff"};
          color:${e.status==="완료"?"#2e7d32":e.status==="처리중"?"#e65100":"#1e2761"};">
          ${e.status||"접수"}
        </span>
        ${e.followUp?`<span style="font-size:12px;color:#2e7d32;">✅ 후속조치 ${e.followUp.split("\n\n").filter(Boolean).length}건</span>`:""}
      </div>
    </div>

    ${isSelected?`
    <div style="background:#f9fbfd;border-top:1px dashed #dce8f4;padding:14px 16px;">
      <div style="font-size:12px;font-weight:700;color:#888;margin-bottom:8px;">📄 접수 내용</div>
      <div style="background:#fff;border:1px solid #dce8f4;border-radius:9px;padding:12px;font-size:13px;line-height:2;margin-bottom:14px;">
        <strong>발생일시</strong>: ${e.accDateTime||"-"}<br>
        <strong>긴급도</strong>: ${["","Level 1 최긴급","Level 2 긴급","Level 3 일반"][+e.level]||"-"}<br>
        <strong>라인중단</strong>: ${e.lineStop||"-"} &nbsp;|&nbsp; <strong>고객사영향</strong>: ${e.customerEffect||"-"}<br>
        <strong>현재 상황</strong>: ${(e.situation||"-").replace(/\n/g,"<br>")}
        ${e.actionTaken&&e.actionTaken!=="없음"?`<br><strong>즉시 조치</strong>: ${e.actionTaken}`:""}
      </div>

      ${e.followUp?`
      <div style="font-size:12px;font-weight:700;color:#2e7d32;margin-bottom:8px;">✅ 후속조치 이력</div>
      <div style="margin-bottom:14px;">
        ${e.followUp.split("\n\n").filter(Boolean).map((item,idx)=>`
        <div style="background:#f0faf0;border:1px solid #b8e0ba;border-radius:9px;padding:10px 12px;margin-bottom:8px;font-size:13px;color:#1a1a1a;line-height:1.7;">
          <div style="font-size:11px;color:#2e7d32;font-weight:700;margin-bottom:4px;">후속조치 ${idx+1}</div>
          ${item.replace(/\n/g,"<br>")}
        </div>`).join("")}
      </div>`:""}

      <div style="font-size:12px;font-weight:700;color:#e05c00;margin-bottom:8px;">📝 후속조치 입력 (2차 보고)</div>
      <textarea id="followup-input-${key}" class="textarea"
        placeholder="후속조치 내용을 입력해 주세요.&#10;예) 파손 부품 교체 완료, 고객사 보고 완료, 재발방지 교육 실시 등"
        style="min-height:100px;font-size:14px;margin-bottom:8px;"></textarea>
      <button onclick="saveFollowUp('${key}')"
        style="width:100%;padding:11px;background:#e05c00;color:#fff;border:none;border-radius:9px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;">
        📤 후속조치 저장 (2차 보고)
      </button>
      <div id="followup-ok-${key}" style="display:none;text-align:center;font-size:13px;color:#2e7d32;margin-top:8px;font-weight:600;">
        ✅ 후속조치가 저장되었습니다.
      </div>
    </div>`:""}
  </div>`;
  }).join("")}
</div>`:""
}

<div style="text-align:center;margin-top:1.5rem;">
  <button id="btn-my-back" style="padding:10px 24px;background:#f5f5f5;border:none;border-radius:9px;font-size:14px;color:#666;cursor:pointer;font-family:inherit;">← 접수 폼으로 돌아가기</button>
</div>`;
}

export function renderAccDetail() {
  const { currentUser, isAdmin, entries } = state;
  const key = window._accDetailKey;
  const e = key ? entries[key] : null;

  if(!e) return `
<div class="card" style="text-align:center;padding:2.5rem;">
  <div style="font-size:40px;margin-bottom:1rem;">🔍</div>
  <div style="font-size:16px;font-weight:700;margin-bottom:8px;">사고 정보를 찾을 수 없습니다.</div>
  <div style="font-size:13px;color:#888;margin-bottom:1.5rem;">링크가 만료되었거나 잘못된 접근입니다.</div>
  <button onclick="location.href=location.pathname"
    style="padding:10px 24px;background:#1e2761;color:#fff;border:none;border-radius:9px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;">
    메인으로
  </button>
</div>`;

  const lvStyle = {
    "1":{bg:"#fff5f5",color:"#b71c1c",border:"#f5c6c6",text:"Level 1 최긴급"},
    "2":{bg:"#fff8f0",color:"#e65100",border:"#fcd8a8",text:"Level 2 긴급"},
    "3":{bg:"#f0faf0",color:"#2e7d32",border:"#b8e0ba",text:"Level 3 일반"}
  };
  const ls = lvStyle[e.level] || {bg:"#f5f5f5",color:"#999",border:"#ddd",text:"-"};

  const lineStopColor = {
    "라인중단발생":"#b71c1c","라인중단예상":"#e65100",
    "미장착":"#7b5e00","라인영향없음":"#2e7d32"
  }[e.lineStop] || "#888";

  return `
<div class="header" style="margin-bottom:1.25rem;">
  <div class="icon-wrap" style="background:#fff0e0;">🚨</div>
  <div class="form-title">사고 상세 조회</div>
  <div class="acc-no-badge">${e.accNo}</div>
</div>

<div style="background:${ls.bg};border:1.5px solid ${ls.border};border-radius:10px;
  padding:12px 16px;margin-bottom:1rem;text-align:center;">
  <div style="font-size:18px;font-weight:700;color:${ls.color};">${ls.text}</div>
  <div style="font-size:12px;color:#aaa;margin-top:3px;">접수일시: ${e.createdAt||"-"}</div>
</div>

<div class="card">
  <div class="section-title">📋 기본 정보</div>
  <div style="font-size:14px;line-height:2.2;color:#333;">
    <div style="display:grid;grid-template-columns:auto 1fr;gap:0 12px;">
      <span style="color:#aaa;white-space:nowrap;">사업소</span>
      <span style="font-weight:600;">${e.site||"-"}</span>
      <span style="color:#aaa;white-space:nowrap;">사고유형</span>
      <span style="font-weight:600;">${e.accType||"-"} &gt; ${e.accDetail||"-"}</span>
      <span style="color:#aaa;white-space:nowrap;">발생일시</span>
      <span>${e.accDateTime||"-"}</span>
      <span style="color:#aaa;white-space:nowrap;">발생위치</span>
      <span>${e.location||"-"}</span>
      <span style="color:#aaa;white-space:nowrap;">접수자</span>
      <span>${e.reporter||"-"} ${e.rank||""} (${e.phone||"-"})</span>
    </div>
  </div>
</div>

<div class="card">
  <div class="section-title">⚡ 상황 요약</div>
  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
    <div style="flex:1;min-width:120px;background:#f5f8fc;border-radius:9px;padding:10px 12px;text-align:center;">
      <div style="font-size:11px;color:#aaa;margin-bottom:4px;">라인중단</div>
      <div style="font-size:14px;font-weight:700;color:${lineStopColor};">${e.lineStop||"-"}</div>
    </div>
    <div style="flex:1;min-width:120px;background:#f5f8fc;border-radius:9px;padding:10px 12px;text-align:center;">
      <div style="font-size:11px;color:#aaa;margin-bottom:4px;">고객사 영향</div>
      <div style="font-size:14px;font-weight:700;color:${e.customerEffect==="예"?"#e65100":"#2e7d32"};">${e.customerEffect||"-"}</div>
    </div>
    <div style="flex:1;min-width:120px;background:#f5f8fc;border-radius:9px;padding:10px 12px;text-align:center;">
      <div style="font-size:11px;color:#aaa;margin-bottom:4px;">처리상태</div>
      <div style="font-size:14px;font-weight:700;
        color:${e.status==="완료"?"#2e7d32":e.status==="처리중"?"#e65100":"#1e2761"};">
        ${e.status||"접수"}
      </div>
    </div>
  </div>
  <div style="margin-bottom:10px;">
    <div style="font-size:12px;color:#aaa;margin-bottom:5px;">현재 상황</div>
    <div style="background:#f9fbfd;border:1px solid #dce8f4;border-radius:8px;padding:10px 12px;font-size:13px;line-height:1.7;color:#333;">
      ${(e.situation||"-").replace(/\n/g,"<br>")}
    </div>
  </div>
  ${e.actionTaken&&e.actionTaken!=="없음"?`
  <div style="margin-bottom:10px;">
    <div style="font-size:12px;color:#aaa;margin-bottom:5px;">즉시 조치</div>
    <div style="background:#f0faf0;border:1px solid #b8e0ba;border-radius:8px;padding:10px 12px;font-size:13px;line-height:1.7;color:#333;">
      ${e.actionTaken.replace(/\n/g,"<br>")}
    </div>
  </div>`:""}
  ${e.supportNeeded&&e.supportNeeded!=="없음"?`
  <div>
    <div style="font-size:12px;color:#aaa;margin-bottom:5px;">추가 지원 필요 여부</div>
    <div style="background:#fffbe6;border:1px solid #ffe082;border-radius:8px;padding:10px 12px;font-size:13px;line-height:1.7;color:#333;">
      ${e.supportNeeded.replace(/\n/g,"<br>")}
    </div>
  </div>`:""}
</div>

${e.photos&&e.photos.length>0?`
<div class="card">
  <div class="section-title">📷 현장 사진</div>
  <div style="display:flex;gap:10px;flex-wrap:wrap;">
    ${(Array.isArray(e.photos)?e.photos:JSON.parse(e.photos||"[]")).filter(Boolean).map(url=>`
    <a href="${url}" target="_blank" style="display:block;">
      <img src="${url}" style="width:100px;height:100px;object-fit:cover;border-radius:9px;border:1px solid #dce8f4;cursor:pointer;"/>
    </a>`).join("")}
  </div>
  <div style="font-size:11px;color:#aaa;margin-top:8px;">사진을 탭하면 크게 볼 수 있습니다.</div>
</div>`:""}

${e.followUp?`
<div class="card">
  <div class="section-title">✅ 후속조치 이력</div>
  ${e.followUp.split("\n\n").filter(Boolean).map((item,idx)=>`
  <div style="background:#f0faf0;border:1px solid #b8e0ba;border-radius:9px;padding:10px 12px;margin-bottom:8px;font-size:13px;color:#1a1a1a;line-height:1.7;">
    <div style="font-size:11px;color:#2e7d32;font-weight:700;margin-bottom:4px;">후속조치 ${idx+1}</div>
    ${item.replace(/\n/g,"<br>")}
  </div>`).join("")}
</div>`:""}

<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:1.5rem;">
  <button id="btn-acc-back"
    style="padding:11px 24px;background:#f5f5f5;border:none;border-radius:9px;font-size:14px;color:#666;cursor:pointer;font-family:inherit;">
    ← ${currentUser ? "메인으로" : "로그인"}
  </button>
  ${currentUser ? `
  <button id="btn-acc-admin"
    style="padding:11px 24px;background:#1e2761;color:#fff;border:none;border-radius:9px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;">
    🛡️ ${isAdmin ? "관리자 페이지" : "메인으로"}
  </button>` : `
  <button id="btn-acc-login"
    style="padding:11px 24px;background:#1e2761;color:#fff;border:none;border-radius:9px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;">
    🔐 로그인 / 회원가입
  </button>`}
</div>`;
}
