import { T } from "../config.js";
import { state } from "../state.js";
import { sendSlackAlert } from "./submit.js";
import { ref, update, remove } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

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

export function openEditModal(key) {
  _editKey = key;
  const e = state.entries[key];
  if(!e) return;

  const modal = document.getElementById("edit-modal");
  if(!modal) return;

  // 필드 채우기
  const setVal = (id, val) => { const el = document.getElementById(id); if(el) el.value = val||""; };

  setVal("edit-level",      e.level||"");
  setVal("edit-lineStop",   e.lineStop||"라인영향없음");
  setVal("edit-custEffect", e.customerEffect||"아니오");
  setVal("edit-location",   e.location||"");
  setVal("edit-situation",  e.situation||"");
  setVal("edit-action",     e.actionTaken||"");
  setVal("edit-support",    e.supportNeeded||"");

  // 사고 유형 버튼 상태 초기화
  const accType = (e.accType||"").split(",")[0].trim();
  _updateEditTypeBtns(accType);
  _updateEditDetailWrap(accType, e.accDetail||"");

  modal.style.display = "flex";

  // 저장 버튼 바인딩
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

  const accType   = getVal("edit-accType") || (state.entries[_editKey]||{}).accType;
  const accDetail = getVal("edit-accDetail") || (state.entries[_editKey]||{}).accDetail;
  const level     = getVal("edit-level");
  const lineStop  = getVal("edit-lineStop");
  const custEffect = getVal("edit-custEffect");
  const location  = getVal("edit-location").trim();
  const situation = getVal("edit-situation").trim();
  const action    = getVal("edit-action").trim();
  const support   = getVal("edit-support").trim();

  const errEl = document.getElementById("edit-err");
  if(!accType || !situation || !level || !location){
    if(errEl){ errEl.textContent="필수 항목(사고유형, 긴급도, 발생위치, 현재상황)을 입력해 주세요."; errEl.style.display="block"; }
    return;
  }
  if(errEl) errEl.style.display="none";

  const updated = {
    accType, accDetail, level, lineStop,
    customerEffect: custEffect,
    location, situation,
    actionTaken: action||"없음",
    supportNeeded: support||"없음",
    updatedAt: new Date().toLocaleString("ko-KR")
  };

  try {
    await update(ref(state.db, `accidents/${_editKey}`), updated);
    // 재발송
    const fullEntry = { ...state.entries[_editKey], ...updated };
    sendSlackAlert(fullEntry);
    closeEditModal();
    alert("수정이 완료되었으며 알림이 재발송되었습니다.");
  } catch(err) {
    if(errEl){ errEl.textContent="저장 중 오류가 발생했습니다."; errEl.style.display="block"; }
  }
}

export function editSelectType(type) {
  _updateEditTypeBtns(type);
  const currentDetail = document.getElementById("edit-accDetail")?.value || "";
  _updateEditDetailWrap(type, currentDetail);
}

function _updateEditTypeBtns(selectedType) {
  const types = ["인사사고","제품사고","공급사고","차량사고"];
  types.forEach(tp => {
    const btn = document.getElementById(`edit-type-${tp}`);
    if(!btn) return;
    if(tp === selectedType){
      btn.style.background = "#1e2761";
      btn.style.color = "#fff";
      btn.style.borderColor = "#1e2761";
    } else {
      btn.style.background = "#f5f8fc";
      btn.style.color = "#555";
      btn.style.borderColor = "#dce8f4";
    }
  });
  const hiddenType = document.getElementById("edit-accType");
  if(hiddenType) hiddenType.value = selectedType;
}

function _updateEditDetailWrap(type, selectedDetail) {
  const wrap = document.getElementById("edit-detail-wrap");
  if(!wrap) return;

  const lang = state.lang;
  const detailMap = T[lang]?.accDetailMap || T.ko.accDetailMap;
  const details = detailMap[type] || [];

  if(details.length === 0){
    wrap.innerHTML = '<span style="color:#bbb;font-size:13px;">사고 유형을 먼저 선택해 주세요.</span>';
    return;
  }

  wrap.innerHTML = details.map(d => {
    const isOn = d.val === selectedDetail;
    return `<button type="button"
      onclick="(function(){
        document.getElementById('edit-accDetail').value='${d.val}';
        document.querySelectorAll('#edit-detail-wrap button').forEach(b=>{ b.style.background='#f5f8fc'; b.style.color='#555'; b.style.borderColor='#dce8f4'; });
        this.style.background='#e05c00'; this.style.color='#fff'; this.style.borderColor='#e05c00';
      }).call(this)"
      style="padding:6px 12px;border-radius:8px;border:1.5px solid ${isOn?"#e05c00":"#dce8f4"};
      background:${isOn?"#e05c00":"#f5f8fc"};font-size:12px;font-weight:600;cursor:pointer;
      font-family:inherit;color:${isOn?"#fff":"#555"};margin:3px;transition:all .15s;">
      ${d.val}
    </button>`;
  }).join("");

  const hiddenDetail = document.getElementById("edit-accDetail");
  if(hiddenDetail) hiddenDetail.value = selectedDetail;
}

export function updateAdminTable() {
  const wrap = document.getElementById("admin-table");
  if(!wrap) return;

  const { entries, filter } = state;
  let filtered = Object.entries(entries).filter(([,e])=>{
    if(filter.accType!=="전체" && e.accType!==filter.accType) return false;
    if(filter.level!=="전체" && String(e.level)!==String(filter.level)) return false;
    if(filter.search){
      const s = filter.search.toLowerCase();
      if(!(e.reporter||"").includes(filter.search) &&
         !(e.site||"").includes(filter.search) &&
         !(e.accDetail||"").includes(filter.search) &&
         !(e.accNo||"").toLowerCase().includes(s)) return false;
    }
    return true;
  });
  filtered.sort((a,b)=>(b[1].createdAt||"").localeCompare(a[1].createdAt||""));

  const countEl = document.getElementById("admin-count");
  if(countEl) countEl.textContent = `총 ${filtered.length}건`;

  const lvStyle = {
    "1":{bg:"#fff5f5",color:"#b71c1c",border:"#f5c6c6"},
    "2":{bg:"#fff8f0",color:"#e65100",border:"#fcd8a8"},
    "3":{bg:"#f0faf0",color:"#2e7d32",border:"#b8e0ba"}
  };

  if(filtered.length===0){
    wrap.innerHTML = '<div class="card" style="text-align:center;padding:2rem;color:#bbb;font-size:14px;">검색 결과가 없습니다.</div>';
    return;
  }

  wrap.innerHTML = filtered.map(([key,e])=>{
    const ls = lvStyle[e.level]||{bg:"#f5f5f5",color:"#999",border:"#ddd"};
    return `
    <div style="background:#fff;border-radius:12px;border:1px solid #eef2f7;margin-bottom:10px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.05);">
      <div style="padding:11px 14px;cursor:pointer;display:flex;align-items:flex-start;gap:10px;" onclick="toggleDetail('detail-${key}')">
        <div style="flex-shrink:0;margin-top:1px;">
          <span style="display:inline-block;padding:3px 8px;border-radius:20px;font-size:11px;font-weight:700;background:${ls.bg};color:${ls.color};border:1px solid ${ls.border};white-space:nowrap;">
            Lv${e.level||"?"} ${["","최긴급","긴급","일반"][+e.level]||""}
          </span>
        </div>
        <div style="flex:1;min-width:0;">
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:4px;">
            <span style="font-weight:700;font-size:13px;">${e.site||"-"}</span>
            <span style="font-size:12px;color:#555;">${e.accType||"-"}</span>
            ${e.accDetail?`<span style="font-size:11px;color:#888;background:#f0f4f8;padding:1px 6px;border-radius:5px;">${e.accDetail}</span>`:""}
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            ${e.lineStop==="라인중단발생"?'<span style="font-size:10px;background:#fff0f0;color:#b71c1c;font-weight:700;padding:1px 6px;border-radius:4px;">중단발생</span>'
             :e.lineStop==="라인중단예상"?'<span style="font-size:10px;background:#fff8f0;color:#e65100;font-weight:700;padding:1px 6px;border-radius:4px;">중단예상</span>'
             :e.lineStop==="미장착"?'<span style="font-size:10px;background:#fffde7;color:#7b5e00;font-weight:700;padding:1px 6px;border-radius:4px;">미장착</span>'
             :'<span style="font-size:10px;background:#f0faf0;color:#2e7d32;font-weight:700;padding:1px 6px;border-radius:4px;">영향없음</span>'}
            ${e.customerEffect==="예"?'<span style="font-size:10px;background:#fff3e0;color:#e65100;font-weight:700;padding:1px 6px;border-radius:4px;">고객사영향</span>':""}
            <span style="font-size:11px;color:#aaa;">${e.reporter||""} ${e.rank||""}</span>
            <span style="font-size:11px;color:#bbb;">${(e.createdAt||"").slice(0,16)}</span>
          </div>
        </div>
        <div style="flex-shrink:0;display:flex;flex-direction:column;align-items:flex-end;gap:5px;" onclick="event.stopPropagation()">
          <select class="status-sel" data-key="${key}" style="border:1px solid #ddd;border-radius:6px;padding:3px 6px;font-size:11px;cursor:pointer;font-family:inherit;max-width:68px;">
            ${["접수","처리중","완료","보류"].map(st=>`<option${e.status===st?" selected":""}>${st}</option>`).join("")}
          </select>
          <div style="display:flex;gap:4px;">
            <button class="del-btn" data-key="${key}" style="background:none;border:1px solid #eee;border-radius:5px;cursor:pointer;color:#ccc;font-size:12px;padding:2px 6px;">✕</button>
            <button onclick="openEditModal('${key}')" style="background:#e05c00;border:none;border-radius:5px;cursor:pointer;color:#fff;font-size:11px;padding:2px 7px;font-family:inherit;font-weight:600;">수정</button>
          </div>
        </div>
      </div>
      <div id="detail-${key}" style="display:none;border-top:1px dashed #eef2f7;padding:12px 14px;background:#f9fbfd;font-size:12px;">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px;">
          <div><span style="color:#aaa;">사고번호</span> <strong>${e.accNo||"-"}</strong></div>
          <div><span style="color:#aaa;">발생위치</span> <strong>${e.location||"-"}</strong></div>
          <div><span style="color:#aaa;">발생일시</span> <strong>${e.accDateTime||"-"}</strong></div>
          <div><span style="color:#aaa;">연락처</span> <strong>${e.phone||"-"}</strong></div>
        </div>
        <div style="margin-bottom:6px;">
          <div style="color:#aaa;margin-bottom:3px;">현재 상황</div>
          <div style="background:#fff;border:1px solid #dce8f4;border-radius:7px;padding:8px 10px;color:#333;line-height:1.6;">${(e.situation||"-").replace(/\n/g,"<br>")}</div>
        </div>
        ${e.actionTaken?`<div style="margin-bottom:6px;"><div style="color:#aaa;margin-bottom:3px;">즉시 조치</div><div style="background:#fff;border:1px solid #dce8f4;border-radius:7px;padding:8px 10px;color:#333;line-height:1.6;">${e.actionTaken.replace(/\n/g,"<br>")}</div></div>`:""}
      </div>
    </div>`;
  }).join("");

  document.querySelectorAll(".status-sel").forEach(s => {
    s.onchange = () => { update(ref(state.db, `accidents/${s.dataset.key}`), {status:s.value}); };
  });
  document.querySelectorAll(".del-btn").forEach(b => {
    b.onclick = () => {
      if(!confirm("이 사고 접수 건을 삭제하시겠습니까?")) return;
      remove(ref(state.db, `accidents/${b.dataset.key}`));
    };
  });
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
