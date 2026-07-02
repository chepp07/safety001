import { T, SITES } from "../config.js";
import { state } from "../state.js";
import { sendSlackAlert } from "./submit.js";
import { ref, update } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// 현재 수정 중인 사고 키
let _editKey = null;

export function setAdminTab(tab) {
  state.adminTab = tab;
  // router의 render() 호출을 위해 window 이벤트 사용
  window.dispatchEvent(new CustomEvent("app:render"));
}

export function toggleDetail(id) {
  const el = document.getElementById(id);
  if(!el) return;
  el.style.display = el.style.display==="none" ? "block" : "none";
}

export function toggleSugDetail(id) {
  const el = document.getElementById(id);
  if(!el) return;
  el.style.display = el.style.display==="none" ? "table-row" : "none";
}

// HTML 속성값 escape (value="..." 주입 안전)
function _esc(s){ return String(s==null?"":s).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;"); }

// select 옵션 채우기(현재값이 목록에 없으면 앞에 추가해 보존 — 복합사고 등)
function _fillSelect(id, opts, cur){
  const sel = document.getElementById(id);
  if(!sel) return;
  let list = [...opts];
  if(cur && !list.includes(cur)) list.unshift(cur);
  sel.innerHTML = list.map(v=>`<option value="${_esc(v)}"${v===cur?" selected":""}>${_esc(v)}</option>`).join("");
}

// 세부유형 select 채우기(사고유형에 종속). 값은 KO 고정(엔트리가 toKo로 KO 정규화됨).
function _fillEditDetail(type, cur){
  const details = (T.ko.accDetailMap[type] || []).map(d => d.val);
  _fillSelect("edit-accDetail", details, cur);
}

// 인사사고 대상자(피해자/가해자) 행 HTML
function _personRowsHtml(victims, perps, accidentType){
  const vRows = victims.map(v=>`
    <div class="ev-row" style="display:flex;gap:6px;align-items:center;margin-bottom:6px;">
      <input class="ev-name input" style="flex:1;" placeholder="피해자 성명" value="${_esc(v.name)}"/>
      <input class="ev-aff input" style="flex:1;" placeholder="소속" value="${_esc(v.affiliation)}"/>
      <label style="font-size:12px;white-space:nowrap;color:#666;"><input type="checkbox" class="ev-unknown" ${v.unknown?"checked":""}/> 미확인</label>
    </div>`).join("");
  const showPerp = accidentType==="쌍방사고";
  const pList = (perps && perps.length) ? perps : [{name:"",affiliation:"",unknown:false}];
  const pRows = pList.map(p=>`
    <div class="ep-row" style="display:flex;gap:6px;align-items:center;margin-bottom:6px;">
      <input class="ep-name input" style="flex:1;" placeholder="가해자 성명" value="${_esc(p.name)}"/>
      <input class="ep-aff input" style="flex:1;" placeholder="소속" value="${_esc(p.affiliation)}"/>
      <label style="font-size:12px;white-space:nowrap;color:#666;"><input type="checkbox" class="ep-unknown" ${p.unknown?"checked":""}/> 미확인</label>
    </div>`).join("");
  return `<div style="margin-bottom:6px;font-size:12px;color:#888;">피해자</div>${vRows}
    <div id="edit-perp-wrap" style="display:${showPerp?"block":"none"};">
      <div style="margin:6px 0;font-size:12px;color:#888;">가해자</div>${pRows}
    </div>`;
}

// 인사사고 대상자 섹션 표시/채우기
function _fillPersonSection(e){
  const section = document.getElementById("edit-person-section");
  const wrap = document.getElementById("edit-person-wrap");
  if(!section || !wrap) return;
  const isPersonal = (e.accType==="인사사고") || String(e.accType||"").includes("인사사고");
  if(!isPersonal){ section.style.display="none"; wrap.innerHTML=""; return; }
  section.style.display="block";
  const atSel = document.getElementById("edit-accidentType");
  const accidentType = e.accidentType||"단독사고";
  if(atSel) atSel.value = accidentType;
  let victims=[], perps=[];
  try{ victims = e.victims ? JSON.parse(e.victims) : []; }catch{ victims=[]; }
  try{ perps = e.perpetrators ? JSON.parse(e.perpetrators) : []; }catch{ perps=[]; }
  if(!Array.isArray(victims) || victims.length===0) victims=[{name:"",affiliation:"",unknown:false}];
  if(!Array.isArray(perps)) perps=[];
  wrap.innerHTML = _personRowsHtml(victims, perps, accidentType);
}

export function openEditModal(key) {
  _editKey = key;
  const e = state.entries[key];
  if(!e) return;

  const modal = document.getElementById("edit-modal");
  if(!modal) return;

  const setVal = (id, val) => { const el = document.getElementById(id); if(el) el.value = val==null ? "" : val; };

  // 동적 select 채우기
  _fillSelect("edit-site",           SITES,                                     e.site||"");
  _fillSelect("edit-rank",           T.ko.ranks,                                e.rank||"");
  _fillSelect("edit-accType",        ["인사사고","제품사고","공급사고","차량사고"], e.accType||"");
  _fillEditDetail(e.accType||"", e.accDetail||"");

  setVal("edit-reporter",       e.reporter);
  setVal("edit-phone",          e.phone);
  setVal("edit-accDateTime",    e.accDateTime);
  setVal("edit-location",       e.location);
  setVal("edit-level",          e.level);
  setVal("edit-lineStop",       e.lineStop||"라인영향없음");
  setVal("edit-customerEffect", e.customerEffect||"아니오");
  setVal("edit-situation",      e.situation);
  setVal("edit-actionTaken",    e.actionTaken);
  setVal("edit-supportNeeded",  e.supportNeeded);
  setVal("edit-followUp",       e.followUp);
  setVal("edit-status",         e.status||"접수");

  // 인사사고 대상자
  _fillPersonSection(e);

  // 발송제외/수정자/사유 초기화
  const skip = document.getElementById("edit-skip-slack"); if(skip) skip.checked=false;
  setVal("edit-editor",""); setVal("edit-reason","");
  const errEl = document.getElementById("edit-err"); if(errEl) errEl.style.display="none";

  modal.style.display = "flex";

  const saveBtn = document.getElementById("btn-edit-save");
  if(saveBtn) saveBtn.onclick = saveEditAndResend;
  const cancelBtn = document.getElementById("btn-edit-cancel");
  if(cancelBtn) cancelBtn.onclick = closeEditModal;
}

export function closeEditModal() {
  const modal = document.getElementById("edit-modal");
  if(modal) modal.style.display = "none";
  _editKey = null;
}

export async function saveEditAndResend() {
  if(!_editKey) return;

  const getVal = (id) => { const el = document.getElementById(id); return el ? el.value : ""; };
  const errEl = document.getElementById("edit-err");

  const skipSlack = !!document.getElementById("edit-skip-slack")?.checked;
  const editor = getVal("edit-editor").trim();
  const reason = getVal("edit-reason").trim();

  // 조건부 필수: 발송제외 시 수정자 + 수정사유
  if(skipSlack && (!editor || !reason)){
    if(errEl){ errEl.textContent="발송 제외 시 수정자와 수정 사유를 입력해 주세요."; errEl.style.display="block"; window.scrollTo(0,0); }
    return;
  }

  const accType   = getVal("edit-accType");
  const accDetail = getVal("edit-accDetail");
  const level     = getVal("edit-level");
  const location  = getVal("edit-location").trim();
  const situation = getVal("edit-situation").trim();

  if(!accType || !level || !location || !situation){
    if(errEl){ errEl.textContent="필수 항목(사고유형, 긴급도, 발생위치, 현재상황)을 입력해 주세요."; errEl.style.display="block"; window.scrollTo(0,0); }
    return;
  }
  if(errEl) errEl.style.display="none";

  const updated = {
    site:           getVal("edit-site"),
    reporter:       getVal("edit-reporter").trim(),
    rank:           getVal("edit-rank"),
    phone:          getVal("edit-phone").trim(),
    accDateTime:    getVal("edit-accDateTime").trim(),
    location,
    accType, accDetail,
    level,
    lineStop:       getVal("edit-lineStop"),
    customerEffect: getVal("edit-customerEffect"),
    situation,
    actionTaken:    getVal("edit-actionTaken").trim()||"없음",
    supportNeeded:  getVal("edit-supportNeeded").trim()||"없음",
    followUp:       getVal("edit-followUp"),
    status:         getVal("edit-status"),
    updatedAt:      new Date().toLocaleString("ko-KR")
  };
  if(editor) updated.updatedBy = editor;
  if(reason) updated.editReason = reason;

  // 인사사고 대상자 재구성
  if(accType==="인사사고" || accType.includes("인사사고")){
    updated.accidentType = getVal("edit-accidentType");
    const victims = Array.from(document.querySelectorAll("#edit-person-wrap .ev-row")).map(r=>({
      name: (r.querySelector(".ev-name")?.value||"").trim(),
      affiliation: (r.querySelector(".ev-aff")?.value||"").trim(),
      unknown: !!r.querySelector(".ev-unknown")?.checked
    }));
    updated.victims = JSON.stringify(victims);
    const perps = Array.from(document.querySelectorAll("#edit-person-wrap .ep-row")).map(r=>({
      name: (r.querySelector(".ep-name")?.value||"").trim(),
      affiliation: (r.querySelector(".ep-aff")?.value||"").trim(),
      unknown: !!r.querySelector(".ep-unknown")?.checked
    }));
    updated.perpetrators = updated.accidentType==="쌍방사고" ? JSON.stringify(perps) : "";
  }

  try {
    await update(ref(state.db, `accidents/${_editKey}`), updated);
    // 발송제외 체크 시 재발송 생략(작업4). 그 외에는 표준 스키마로 재발송(작업3/4).
    if(!skipSlack){
      const fullEntry = { ...state.entries[_editKey], ...updated, lang:"ko", notifyType:"edit", channels:["slack","sms"] };
      sendSlackAlert(fullEntry);
    }
    closeEditModal();
    alert(skipSlack ? "수정이 완료되었습니다. (발송 제외)" : "수정이 완료되었으며 알림이 재발송되었습니다.");
  } catch(err) {
    if(errEl){ errEl.textContent="저장 중 오류가 발생했습니다."; errEl.style.display="block"; }
  }
}

// 사고유형 변경 시 세부유형 옵션 갱신 + 인사사고 대상자 섹션 토글
export function editSelectType(type) {
  _fillEditDetail(type, "");
  const section = document.getElementById("edit-person-section");
  if(!section) return;
  if(type==="인사사고"){
    section.style.display="block";
    const wrap = document.getElementById("edit-person-wrap");
    if(wrap && !wrap.innerHTML.trim()){
      const at = document.getElementById("edit-accidentType")?.value || "단독사고";
      wrap.innerHTML = _personRowsHtml([{name:"",affiliation:"",unknown:false}], [], at);
    }
  } else {
    section.style.display="none";
  }
}

export function downloadExcel() {
  const list = Object.values(state.entries);
  if(!list.length){ alert("다운로드할 데이터가 없습니다."); return; }
  const BOM = "﻿";
  const headers = ["사고번호","접수일시","사고발생일시","사업소","접수자","직급","연락처","사고유형","세부유형","긴급도","라인중단","고객사영향","상황","즉시조치","상태"];
  const rows = list.map(e=>[
    e.accNo||"", e.createdAt||"", e.accDateTime||"", e.site||"", e.reporter||"", e.rank||"", e.phone||"",
    e.accType||"", e.accDetail||"",
    {1:"최긴급",2:"긴급",3:"일반"}[e.level]||"",
    e.lineStop||"", e.customerEffect||"",
    e.situation||"", e.actionTaken||"", e.status||""
  ]);
  const csv = BOM + [headers,...rows]
    .map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv],{type:"text/csv;charset=utf-8;"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href=url; a.download="사고접수현황.csv"; a.click();
  URL.revokeObjectURL(url);
}

export function showLoginModal() {
  if(state.isAdmin){
    state.view = "admin";
    window.dispatchEvent(new CustomEvent("app:render"));
  } else {
    alert("관리자 권한이 없습니다.\n관리자 계정으로 로그인해 주세요.");
  }
}

export function doModalLogin() {
  const pw = document.getElementById("modal-pw")?.value;
  const errEl = document.getElementById("modal-err");
  // ADMIN_PW 비교는 더 이상 사용하지 않음 — isAdmin 기반으로만 처리
  if(errEl){ errEl.textContent="비밀번호가 올바르지 않습니다."; errEl.style.display="block"; }
}
