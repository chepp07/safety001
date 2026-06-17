import { state } from "../state.js";
import { SITES } from "../config.js";
import {
  LIKELIHOOD, SEVERITY, RA_REASONS, EDU_METHODS, NM_CATEGORIES,
  riskScore, resRiskScore, riskLevel
} from "../features/risk.js";

const esc = (s) => String(s==null?"":s)
  .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
const nl2br = (s) => esc(s).replace(/\n/g,"<br>");

// ───────────────────────── 진입점 ─────────────────────────
export function renderRisk() {
  const mode = state.risk?.mode || "list";
  if(mode === "editor") return renderEditor();
  if(mode === "report") return renderReport();
  if(mode === "edu")    return renderEduEditor();
  if(mode === "edudoc") return renderEduDoc();
  if(mode === "nmEditor") return renderNmEditor();
  if(mode === "nmReport") return renderNmReport();
  return renderList();
}

function header(sub) {
  return `
  <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:1.25rem;">
    <div>
      <div style="font-size:17px;font-weight:700;">📑 수시 위험성평가</div>
      <div style="font-size:12px;color:#888;margin-top:2px;">${sub}</div>
    </div>
    <button id="btn-risk-back" style="padding:7px 12px;border:1px solid #ddd;border-radius:8px;background:#fff;font-size:13px;cursor:pointer;font-family:inherit;">← 메인</button>
  </div>`;
}

// ───────────────────────── 목록 ─────────────────────────
function raCard(key, r) {
  const hazards = Array.isArray(r.hazards) ? r.hazards : [];
  const lv = riskLevel(hazards.reduce((m,h)=>Math.max(m, riskScore(h)), 0));
  const done = r.status === "완료";
  return `
  <div style="background:#fff;border-radius:12px;border:1px solid #eef2f7;margin-bottom:10px;padding:13px 14px;box-shadow:0 1px 4px rgba(0,0,0,.05);">
    <div style="flex:1;min-width:0;">
      <div style="display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin-bottom:5px;">
        <span style="font-weight:700;font-size:13px;">${esc(r.raNo||"-")}</span>
        <span style="font-size:11px;font-weight:700;padding:2px 8px;border-radius:20px;background:${done?"#e8f5e9":"#fff8e1"};color:${done?"#2e7d32":"#b88600"};">${done?"완료":"작성중"}</span>
        <span style="font-size:11px;font-weight:700;padding:2px 8px;border-radius:20px;background:${lv.bg};color:${lv.color};border:1px solid ${lv.border};">최고위험성 ${lv.label}</span>
      </div>
      <div style="font-size:12px;color:#555;margin-bottom:2px;">${esc(r.site||"-")} · ${esc(r.targetWork||"-")}</div>
      <div style="font-size:11px;color:#aaa;">평가일 ${esc(r.assessDate||"-")} · 평가자 ${esc(r.assessor||"-")}${r.accNo?` · 대상사고 ${esc(r.accNo)}`:""}</div>
    </div>
    <div style="display:flex;gap:6px;justify-content:flex-end;margin-top:10px;">
      ${done
        ? `<button class="ra-report-btn" data-key="${key}" style="padding:6px 14px;background:#1e2761;color:#fff;border:none;border-radius:7px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">📄 보고서 보기</button>
           <button class="ra-edit-btn" data-key="${key}" style="padding:6px 12px;background:#fff;color:#555;border:1px solid #ddd;border-radius:7px;font-size:12px;cursor:pointer;font-family:inherit;">수정</button>`
        : `<button class="ra-edit-btn" data-key="${key}" style="padding:6px 14px;background:#e05c00;color:#fff;border:none;border-radius:7px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">✏️ 이어서 작성</button>`}
      <button class="ra-del-btn" data-key="${key}" style="padding:6px 10px;background:#fff;color:#ccc;border:1px solid #eee;border-radius:7px;font-size:12px;cursor:pointer;font-family:inherit;">삭제</button>
    </div>
  </div>`;
}

function nmCard(key, r) {
  const lv = riskLevel(riskScore(r));
  const done = r.status === "완료";
  return `
  <div style="background:#fff;border-radius:12px;border:1px solid #eef2f7;margin-bottom:10px;padding:13px 14px;box-shadow:0 1px 4px rgba(0,0,0,.05);">
    <div style="flex:1;min-width:0;">
      <div style="display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin-bottom:5px;">
        <span style="font-size:11px;font-weight:700;padding:2px 8px;border-radius:20px;background:#fff3e6;color:#e65100;">아차사고</span>
        <span style="font-weight:700;font-size:13px;">${esc(r.nmNo||"-")}</span>
        <span style="font-size:11px;font-weight:700;padding:2px 8px;border-radius:20px;background:${done?"#e8f5e9":"#fff8e1"};color:${done?"#2e7d32":"#b88600"};">${done?"완료":"작성중"}</span>
        <span style="font-size:11px;font-weight:700;padding:2px 8px;border-radius:20px;background:${lv.bg};color:${lv.color};border:1px solid ${lv.border};">위험성 ${lv.label}</span>
      </div>
      <div style="font-size:12px;color:#555;margin-bottom:2px;">${esc(r.site||"-")} · ${esc(r.location||"-")}</div>
      <div style="font-size:11px;color:#aaa;">발생 ${esc(r.occurredAt||"-")} · 보고자 ${esc(r.reporter||"-")}</div>
    </div>
    <div style="display:flex;gap:6px;justify-content:flex-end;margin-top:10px;">
      ${done
        ? `<button class="nm-report-btn" data-key="${key}" style="padding:6px 14px;background:#1e2761;color:#fff;border:none;border-radius:7px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">📄 보고서 보기</button>
           <button class="nm-edit-btn" data-key="${key}" style="padding:6px 12px;background:#fff;color:#555;border:1px solid #ddd;border-radius:7px;font-size:12px;cursor:pointer;font-family:inherit;">수정</button>`
        : `<button class="nm-edit-btn" data-key="${key}" style="padding:6px 14px;background:#e05c00;color:#fff;border:none;border-radius:7px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">✏️ 이어서 작성</button>`}
      <button class="nm-del-btn" data-key="${key}" style="padding:6px 10px;background:#fff;color:#ccc;border:1px solid #eee;border-radius:7px;font-size:12px;cursor:pointer;font-family:inherit;">삭제</button>
    </div>
  </div>`;
}

function renderList() {
  const all = Object.entries(state.riskAssessments || {})
    .sort((a,b) => (b[1].createdAt||"").localeCompare(a[1].createdAt||""));
  const risks = all.filter(([,r]) => r.docType !== "nearmiss");
  const nms   = all.filter(([,r]) => r.docType === "nearmiss");

  const riskRows = risks.length === 0
    ? '<div style="text-align:center;padding:1.5rem;color:#bbb;font-size:13px;">작성된 수시 위험성평가가 없습니다.</div>'
    : risks.map(([k,r]) => raCard(k,r)).join("");
  const nmRows = nms.length === 0
    ? '<div style="text-align:center;padding:1.5rem;color:#bbb;font-size:13px;">작성된 아차사고 보고서가 없습니다.</div>'
    : nms.map(([k,r]) => nmCard(k,r)).join("");

  return `
  <div style="padding-bottom:2rem;max-width:640px;margin:0 auto;">
    ${header("산업안전보건법 제36조 · 시행규칙 제37조")}
    <div style="display:flex;gap:8px;margin-bottom:1.25rem;flex-wrap:wrap;">
      <button id="btn-risk-new" style="flex:1;min-width:200px;padding:13px;background:#1e2761;color:#fff;border:none;border-radius:11px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;box-shadow:0 2px 8px rgba(30,39,97,.2);">＋ 수시 위험성평가</button>
      <button id="btn-nm-new" style="flex:1;min-width:200px;padding:13px;background:#e65100;color:#fff;border:none;border-radius:11px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;box-shadow:0 2px 8px rgba(230,81,0,.2);">＋ 아차사고 보고서</button>
    </div>

    <div style="font-size:13px;font-weight:800;color:#1e2761;margin:0 0 .6rem;">📑 수시 위험성평가</div>
    ${riskRows}

    <div style="font-size:13px;font-weight:800;color:#e65100;margin:1.5rem 0 .6rem;">⚠️ 아차사고 보고서</div>
    ${nmRows}
  </div>`;
}

// ───────────────────────── 편집기 ─────────────────────────
function accidentOptions(selected) {
  const opts = ['<option value="">— 사고 미연계 (직접 작성) —</option>'];
  Object.entries(state.entries || {})
    .sort((a,b)=>(b[1].createdAt||"").localeCompare(a[1].createdAt||""))
    .forEach(([key,e]) => {
      const label = `${e.accNo||"-"} · ${e.site||""} · ${e.accType||""}`;
      opts.push(`<option value="${key}"${selected===e.accNo?" selected":""}>${esc(label)}</option>`);
    });
  return opts.join("");
}

function hazardCard(h, i, total) {
  const sc = riskScore(h), lv = riskLevel(sc);
  const rsc = resRiskScore(h), rlv = riskLevel(rsc);
  const likOpts = (val) => LIKELIHOOD.map(o=>`<option value="${o.v}"${Number(val)===o.v?" selected":""}>${o.l}</option>`).join("");
  const sevOpts = (val) => SEVERITY.map(o=>`<option value="${o.v}"${Number(val)===o.v?" selected":""}>${o.l}</option>`).join("");
  const inp = "padding:8px 10px;border:1px solid #dce8f4;border-radius:8px;font-size:13px;font-family:inherit;width:100%;box-sizing:border-box;";
  const sel = "padding:8px 10px;border:1px solid #dce8f4;border-radius:8px;font-size:13px;font-family:inherit;width:100%;box-sizing:border-box;background:#fff;";
  const lbl = "font-size:11px;font-weight:700;color:#667;margin:9px 0 3px;";

  return `
  <div style="border:1.5px solid #e3ebf5;border-radius:12px;padding:13px;margin-bottom:12px;background:#fbfcfe;">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
      <span style="font-size:13px;font-weight:800;color:#1e2761;">위험요인 #${i+1}</span>
      ${total>1?`<button class="hz-remove" data-hz="${i}" style="background:none;border:1px solid #f0c4c4;color:#c0392b;border-radius:6px;font-size:11px;padding:3px 9px;cursor:pointer;font-family:inherit;">삭제</button>`:""}
    </div>

    <div style="${lbl}">유해·위험요인 <span style="color:#c0392b;">*</span></div>
    <input class="hz-f" data-hz="${i}" data-hf="hazard" value="${esc(h.hazard)}" placeholder="예: 컨베이어 점검 중 끼임" style="${inp}"/>

    <div style="${lbl}">관련 작업 / 발생 원인</div>
    <input class="hz-f" data-hz="${i}" data-hf="cause" value="${esc(h.cause)}" placeholder="예: 전원 미차단 상태로 정비 작업" style="${inp}"/>

    <div style="${lbl}">현재 안전·보건 조치</div>
    <input class="hz-f" data-hz="${i}" data-hf="currentMeasure" value="${esc(h.currentMeasure)}" placeholder="예: LOTO 절차 미흡, 방호덮개 일부 개방" style="${inp}"/>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:6px;">
      <div><div style="${lbl}">가능성(빈도)</div><select class="hz-sel" data-hz="${i}" data-hsel="likelihood" style="${sel}">${likOpts(h.likelihood)}</select></div>
      <div><div style="${lbl}">중대성(강도)</div><select class="hz-sel" data-hz="${i}" data-hsel="severity" style="${sel}">${sevOpts(h.severity)}</select></div>
    </div>

    <div style="display:flex;align-items:center;gap:8px;margin-top:10px;padding:8px 11px;border-radius:9px;background:${lv.bg};border:1px solid ${lv.border};">
      <span style="font-size:12px;color:#555;">현재 위험성</span>
      <span style="font-size:18px;font-weight:800;color:${lv.color};">${sc||"-"}</span>
      <span style="font-size:12px;font-weight:800;color:${lv.color};padding:2px 9px;border-radius:20px;background:#fff;border:1px solid ${lv.border};">${lv.label}</span>
      <span style="font-size:11px;color:#888;margin-left:auto;">${lv.action}</span>
    </div>

    <div style="${lbl}">위험성 감소대책${sc>=10?' <span style="color:#c0392b;">* (높음 이상 필수)</span>':""}</div>
    <textarea class="hz-f" data-hz="${i}" data-hf="reduction" placeholder="예: 정비 전 전원차단·잠금(LOTO) 의무화, 방호덮개 인터록 설치" style="${inp}min-height:56px;resize:vertical;">${esc(h.reduction)}</textarea>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:6px;">
      <div><div style="${lbl}">개선 후 가능성</div><select class="hz-sel" data-hz="${i}" data-hsel="resLikelihood" style="${sel}">${likOpts(h.resLikelihood)}</select></div>
      <div><div style="${lbl}">개선 후 중대성</div><select class="hz-sel" data-hz="${i}" data-hsel="resSeverity" style="${sel}">${sevOpts(h.resSeverity)}</select></div>
    </div>
    <div style="margin-top:8px;font-size:12px;color:#555;">개선 후 위험성 → <strong style="color:${rlv.color};">${rsc||"-"} (${rlv.label})</strong></div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px;">
      <div><div style="${lbl}">조치 담당자</div><input class="hz-f" data-hz="${i}" data-hf="owner" value="${esc(h.owner)}" placeholder="담당자/부서" style="${inp}"/></div>
      <div><div style="${lbl}">완료 예정일</div><input type="date" class="hz-f" data-hz="${i}" data-hf="dueDate" value="${esc(h.dueDate)}" style="${inp}"/></div>
    </div>
    <label style="display:flex;align-items:center;gap:7px;margin-top:9px;font-size:13px;cursor:pointer;">
      <input type="checkbox" class="hz-chk" data-hz="${i}" ${h.done?"checked":""} style="width:16px;height:16px;"/>
      조치 완료
    </label>
  </div>`;
}

function renderEditor() {
  const d = state.risk.draft;
  if(!d) return renderList();

  const inp = "padding:9px 11px;border:1px solid #dce8f4;border-radius:8px;font-size:14px;font-family:inherit;width:100%;box-sizing:border-box;";
  const sel = inp + "background:#fff;";
  const lbl = "font-size:12px;font-weight:700;color:#445;margin:0 0 5px;";
  const sectionTitle = (t) => `<div style="font-size:13px;font-weight:800;color:#1e2761;margin:1.4rem 0 .7rem;padding-bottom:6px;border-bottom:2px solid #eef2f7;">${t}</div>`;

  const siteOpts = ['<option value="">선택</option>']
    .concat(SITES.map(s=>`<option value="${esc(s)}"${d.site===s?" selected":""}>${esc(s)}</option>`)).join("");
  const reasonOpts = RA_REASONS.map(r=>`<option value="${esc(r)}"${d.reason===r?" selected":""}>${esc(r)}</option>`).join("");

  const photos = d.photosPreviews.map((url,idx)=>{
    const uploading = d.photos[idx]==="uploading";
    return `
    <div style="position:relative;width:74px;height:74px;border-radius:9px;overflow:hidden;border:1px solid #dce8f4;">
      <img src="${url}" style="width:100%;height:100%;object-fit:cover;${uploading?"opacity:.4;":""}"/>
      ${uploading?'<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:10px;color:#1e2761;font-weight:700;">업로드중</div>':
        `<button class="ra-photo-del" data-idx="${idx}" style="position:absolute;top:2px;right:2px;width:18px;height:18px;border-radius:50%;background:rgba(0,0,0,.55);color:#fff;border:none;font-size:11px;cursor:pointer;line-height:1;">×</button>`}
    </div>`;
  }).join("");

  const accInfo = d.accSnapshot ? `
    <div style="background:#fff0e0;border:1px solid #fcd8a8;border-radius:9px;padding:10px 12px;margin-top:8px;font-size:12px;color:#7a3b00;line-height:1.6;">
      <strong>연계 사고:</strong> ${esc(d.accSnapshot.accNo)} · ${esc(d.accSnapshot.accType)} ${d.accSnapshot.accDetail?`> ${esc(d.accSnapshot.accDetail)}`:""}<br>
      <strong>발생:</strong> ${esc(d.accSnapshot.accDateTime||"-")} · ${esc(d.accSnapshot.location||"-")}<br>
      <strong>상황:</strong> ${nl2br(d.accSnapshot.situation||"-")}
    </div>` : "";

  return `
  <div style="padding-bottom:3rem;max-width:640px;margin:0 auto;">
    ${header(d._key ? `${esc(d.raNo||"")} 편집` : "신규 작성")}

    <div id="ra-err" style="display:none;background:#fff5f5;border:1px solid #f5c6c6;color:#b71c1c;border-radius:9px;padding:10px 12px;font-size:13px;margin-bottom:12px;"></div>

    ${sectionTitle("① 평가 개요")}
    <div style="${lbl}">기존 사고에서 불러오기</div>
    <select id="ra-acc" style="${sel}">${accidentOptions(d.accNo)}</select>
    ${accInfo}

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px;">
      <div><div style="${lbl}">사업소 <span style="color:#c0392b;">*</span></div><select id="ra-site" style="${sel}">${siteOpts}</select></div>
      <div><div style="${lbl}">평가일자</div><input type="date" id="ra-date" value="${esc(d.assessDate)}" style="${inp}"/></div>
      <div><div style="${lbl}">평가자 <span style="color:#c0392b;">*</span></div><input id="ra-assessor" value="${esc(d.assessor)}" placeholder="성명/직급" style="${inp}"/></div>
      <div><div style="${lbl}">참여자(근로자 등)</div><input id="ra-participants" value="${esc(d.participants)}" placeholder="현장 근로자 등" style="${inp}"/></div>
    </div>
    <div style="margin-top:10px;"><div style="${lbl}">수시평가 실시 사유</div><select id="ra-reason" style="${sel}">${reasonOpts}</select></div>
    <div style="margin-top:10px;"><div style="${lbl}">평가 대상 작업 / 공정 <span style="color:#c0392b;">*</span></div><input id="ra-target" value="${esc(d.targetWork)}" placeholder="예: 컨베이어 라인 정비 작업" style="${inp}"/></div>
    <div style="margin-top:8px;font-size:11px;color:#aaa;">평가 방법: 빈도·강도법 (위험성 = 가능성 × 중대성)</div>

    ${sectionTitle("② 유해·위험요인 파악 및 위험성 결정")}
    <div id="ra-hazards">
      ${d.hazards.map((h,i)=>hazardCard(h,i,d.hazards.length)).join("")}
    </div>
    <button id="btn-hz-add" style="width:100%;padding:11px;background:#eef2fb;color:#1e2761;border:1.5px dashed #b9c6e8;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">＋ 위험요인 추가</button>

    ${sectionTitle("③ 현장 사진 (최대 3장)")}
    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
      ${photos}
      ${d.photos.filter(p=>p&&p!=="uploading").length + d.photos.filter(p=>p==="uploading").length < 3 ? `
      <label style="width:74px;height:74px;border-radius:9px;border:1.5px dashed #b9c6e8;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;color:#1e2761;font-size:11px;background:#fbfcfe;">
        <span style="font-size:20px;">＋</span>사진
        <input id="ra-photo-input" type="file" accept="image/*" multiple style="display:none;"/>
      </label>`:""}
    </div>

    ${sectionTitle("④ 종합 의견 / 결론")}
    <textarea id="ra-conclusion" placeholder="평가 결과 종합 의견, 재발방지 종합대책 등을 기술해 주세요." style="${inp}min-height:90px;resize:vertical;">${esc(d.conclusion)}</textarea>

    <div style="display:flex;gap:8px;margin-top:1.5rem;">
      <button id="btn-ra-save" style="flex:1;padding:13px;background:#fff;color:#1e2761;border:1.5px solid #1e2761;border-radius:11px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;">임시저장</button>
      <button id="btn-ra-complete" style="flex:1.4;padding:13px;background:#1e2761;color:#fff;border:none;border-radius:11px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;">평가 완료 → 보고서 생성</button>
    </div>
  </div>`;
}

// ───────────────────────── 완료 보고서 (인쇄/PDF) ─────────────────────────
function renderReport() {
  const r = state.risk.current;
  if(!r) return renderList();
  const hazards = Array.isArray(r.hazards) ? r.hazards : [];
  const maxLv = riskLevel(hazards.reduce((m,h)=>Math.max(m, riskScore(h)),0));

  const th = "border:1px solid #b9c6e8;padding:6px 7px;background:#eef2fb;font-size:11px;font-weight:700;color:#1e2761;";
  const td = "border:1px solid #cdd8ec;padding:6px 7px;font-size:11px;color:#222;vertical-align:top;";
  const ov = "border:1px solid #cdd8ec;padding:7px 9px;font-size:12px;";
  const ovh = "border:1px solid #b9c6e8;padding:7px 9px;font-size:12px;background:#f3f6fc;font-weight:700;color:#445;white-space:nowrap;";

  const hazardRows = hazards.map((h,i)=>{
    const sc=riskScore(h), lv=riskLevel(sc), rsc=resRiskScore(h), rlv=riskLevel(rsc);
    return `<tr>
      <td style="${td}text-align:center;">${i+1}</td>
      <td style="${td}"><strong>${esc(h.hazard)}</strong>${h.cause?`<br><span style="color:#777;">${esc(h.cause)}</span>`:""}</td>
      <td style="${td}">${esc(h.currentMeasure||"-")}</td>
      <td style="${td}text-align:center;">${h.likelihood}×${h.severity}<br><span style="font-weight:800;color:${lv.color};">${sc} ${lv.label}</span></td>
      <td style="${td}">${nl2br(h.reduction||"-")}</td>
      <td style="${td}text-align:center;font-weight:800;color:${rlv.color};">${rsc} ${rlv.label}</td>
      <td style="${td}">${esc(h.owner||"-")}${h.dueDate?`<br>${esc(h.dueDate)}`:""}<br><span style="color:${h.done?"#2e7d32":"#c0392b"};font-weight:700;">${h.done?"완료":"진행"}</span></td>
    </tr>`;
  }).join("");

  const photos = (Array.isArray(r.photos)?r.photos:[]).filter(Boolean).map(u=>
    `<img src="${esc(u)}" style="width:150px;height:150px;object-fit:cover;border:1px solid #cdd8ec;border-radius:4px;"/>`
  ).join("");

  const sigBox = (role)=>`<td style="border:1px solid #b9c6e8;padding:0;width:33.3%;">
    <div style="background:#f3f6fc;font-size:11px;font-weight:700;color:#445;padding:5px;text-align:center;border-bottom:1px solid #b9c6e8;">${role}</div>
    <div style="height:54px;"></div></td>`;

  return `
  <style>
    @media print {
      .no-print { display:none !important; }
      body { background:#fff !important; }
      #app { padding:0 !important; }
      .ra-report { box-shadow:none !important; border:none !important; margin:0 !important; max-width:none !important; }
      @page { margin:14mm; }
    }
  </style>
  <div class="no-print" style="max-width:820px;margin:0 auto;display:flex;gap:8px;justify-content:space-between;flex-wrap:wrap;padding:0 0 14px;">
    <button id="btn-ra-report-back" style="padding:8px 14px;border:1px solid #ddd;border-radius:8px;background:#fff;font-size:13px;cursor:pointer;font-family:inherit;">← 목록</button>
    <div style="display:flex;gap:8px;flex-wrap:wrap;">
      <button id="btn-ra-report-edit" style="padding:8px 14px;border:1px solid #ddd;border-radius:8px;background:#fff;font-size:13px;cursor:pointer;font-family:inherit;">수정</button>
      <button id="btn-ra-edu" style="padding:8px 16px;border:none;border-radius:8px;background:#1d6f42;color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">${r.education ? "📋 특별안전교육 문서" : "📋 특별안전교육 일지 생성"}</button>
      <button onclick="window.print()" style="padding:8px 16px;border:none;border-radius:8px;background:#1e2761;color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">🖨️ 인쇄 / PDF 저장</button>
    </div>
  </div>

  <div class="ra-report" style="max-width:820px;margin:0 auto;background:#fff;border:1px solid #e3ebf5;border-radius:8px;padding:30px 32px;box-shadow:0 2px 10px rgba(0,0,0,.06);color:#222;">
    <div style="text-align:center;border-bottom:2.5px solid #1e2761;padding-bottom:12px;margin-bottom:8px;">
      <div style="font-size:21px;font-weight:800;letter-spacing:2px;color:#1e2761;">수시 위험성평가 결과보고서</div>
      <div style="font-size:11px;color:#888;margin-top:4px;">산업안전보건법 제36조 · 같은 법 시행규칙 제37조 (기록 3년 보존)</div>
    </div>
    <div style="text-align:right;font-size:11px;color:#888;margin-bottom:10px;">평가번호 <strong>${esc(r.raNo||"-")}</strong></div>

    <table style="width:100%;border-collapse:collapse;margin-bottom:6px;">
      <tr><td style="${ovh}">사업소</td><td style="${ov}">${esc(r.site||"-")}</td><td style="${ovh}">평가일자</td><td style="${ov}">${esc(r.assessDate||"-")}</td></tr>
      <tr><td style="${ovh}">평가자</td><td style="${ov}">${esc(r.assessor||"-")}</td><td style="${ovh}">참여자</td><td style="${ov}">${esc(r.participants||"-")}</td></tr>
      <tr><td style="${ovh}">평가방법</td><td style="${ov}">${esc(r.method||"빈도·강도법")}</td><td style="${ovh}">실시사유</td><td style="${ov}">${esc(r.reason||"-")}</td></tr>
      <tr><td style="${ovh}">대상작업</td><td style="${ov}" colspan="3">${esc(r.targetWork||"-")}</td></tr>
      <tr><td style="${ovh}">연계사고</td><td style="${ov}">${esc(r.accNo||"해당없음")}</td><td style="${ovh}">최고위험성</td><td style="${ov}"><span style="font-weight:800;color:${maxLv.color};">${maxLv.label}</span></td></tr>
    </table>

    <div style="font-size:12px;font-weight:800;color:#1e2761;margin:16px 0 6px;">유해·위험요인 및 위험성 결정</div>
    <table style="width:100%;border-collapse:collapse;">
      <thead><tr>
        <th style="${th}width:26px;">No</th>
        <th style="${th}">유해·위험요인 / 원인</th>
        <th style="${th}">현재 조치</th>
        <th style="${th}width:62px;">현재<br>위험성</th>
        <th style="${th}">위험성 감소대책</th>
        <th style="${th}width:62px;">개선후<br>위험성</th>
        <th style="${th}width:70px;">담당/완료</th>
      </tr></thead>
      <tbody>${hazardRows || `<tr><td style="${td}" colspan="7">등록된 위험요인이 없습니다.</td></tr>`}</tbody>
    </table>
    <div style="font-size:10px;color:#999;margin-top:4px;">※ 위험성 = 가능성(빈도 1~5) × 중대성(강도 1~4) · 1~4 낮음 / 5~9 보통 / 10~15 높음 / 16~20 매우 높음</div>

    ${r.conclusion?`<div style="margin-top:16px;"><div style="font-size:12px;font-weight:800;color:#1e2761;margin-bottom:6px;">종합 의견</div>
      <div style="border:1px solid #cdd8ec;border-radius:5px;padding:10px 12px;font-size:12px;line-height:1.7;">${nl2br(r.conclusion)}</div></div>`:""}

    ${photos?`<div style="margin-top:16px;"><div style="font-size:12px;font-weight:800;color:#1e2761;margin-bottom:6px;">현장 사진</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">${photos}</div></div>`:""}

    <table style="width:100%;border-collapse:collapse;margin-top:22px;">
      <tr>${sigBox("평가자")}${sigBox("검토")}${sigBox("승인")}</tr>
    </table>
    <div style="text-align:center;font-size:11px;color:#aaa;margin-top:14px;">
      작성일시 ${esc(r.createdAt||"-")}${r.completedAt?` · 완료 ${esc(r.completedAt)}`:""}
    </div>
  </div>`;
}

// ───────────────────────── 특별안전교육 편집기 ─────────────────────────
function renderEduEditor() {
  const ed = state.risk.eduDraft;
  const r  = state.risk.current;
  if(!ed) return renderList();

  const inp = "padding:9px 11px;border:1px solid #dce8f4;border-radius:8px;font-size:14px;font-family:inherit;width:100%;box-sizing:border-box;";
  const sel = inp + "background:#fff;";
  const lbl = "font-size:12px;font-weight:700;color:#445;margin:0 0 5px;";
  const sectionTitle = (t) => `<div style="font-size:13px;font-weight:800;color:#1d6f42;margin:1.4rem 0 .7rem;padding-bottom:6px;border-bottom:2px solid #eef2f7;">${t}</div>`;

  const methodOpts = EDU_METHODS.map(m=>`<option value="${esc(m)}"${ed.method===m?" selected":""}>${esc(m)}</option>`).join("");

  const attRows = ed.attendees.map((a,i)=>`
    <div style="display:grid;grid-template-columns:1.2fr 1fr 32px;gap:7px;margin-bottom:7px;align-items:center;">
      <input class="edu-att" data-i="${i}" data-af="name" value="${esc(a.name)}" placeholder="성명" style="${inp}"/>
      <input class="edu-att" data-i="${i}" data-af="dept" value="${esc(a.dept)}" placeholder="소속/직급" style="${inp}"/>
      <button class="edu-att-del" data-i="${i}" style="background:none;border:1px solid #f0c4c4;color:#c0392b;border-radius:7px;font-size:13px;padding:7px 0;cursor:pointer;font-family:inherit;">×</button>
    </div>`).join("");

  return `
  <div style="padding-bottom:3rem;max-width:640px;margin:0 auto;">
    ${header(r ? `${esc(r.raNo||"")} 특별안전교육` : "특별안전교육")}
    <div style="background:#eaf5ee;border:1px solid #b6dcc4;border-radius:9px;padding:10px 12px;font-size:12px;color:#1d6f42;line-height:1.6;margin-bottom:14px;">
      산업안전보건법 제29조에 따른 <strong>특별안전교육 일지</strong>를 작성합니다. 교육자료 내용(사고 개요·위험성평가 결과·재발방지대책)은 평가 데이터에서 <strong>자동 생성</strong>됩니다.
    </div>

    <div id="edu-err" style="display:none;background:#fff5f5;border:1px solid #f5c6c6;color:#b71c1c;border-radius:9px;padding:10px 12px;font-size:13px;margin-bottom:12px;"></div>

    ${sectionTitle("교육 개요")}
    <div><div style="${lbl}">교육명 <span style="color:#c0392b;">*</span></div><input id="edu-name" value="${esc(ed.eduName)}" style="${inp}"/></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px;">
      <div><div style="${lbl}">교육일자</div><input type="date" id="edu-date" value="${esc(ed.eduDate)}" style="${inp}"/></div>
      <div><div style="${lbl}">교육방법</div><select id="edu-method" style="${sel}">${methodOpts}</select></div>
      <div><div style="${lbl}">시작시간</div><input type="time" id="edu-start" value="${esc(ed.startTime)}" style="${inp}"/></div>
      <div><div style="${lbl}">종료시간</div><input type="time" id="edu-end" value="${esc(ed.endTime)}" style="${inp}"/></div>
      <div><div style="${lbl}">교육시간(시간)</div><input id="edu-duration" value="${esc(ed.duration)}" placeholder="예: 1" style="${inp}"/></div>
      <div><div style="${lbl}">교육장소</div><input id="edu-place" value="${esc(ed.place)}" placeholder="예: 안전교육장" style="${inp}"/></div>
      <div><div style="${lbl}">강사(교육자) <span style="color:#c0392b;">*</span></div><input id="edu-instructor" value="${esc(ed.instructor)}" placeholder="성명" style="${inp}"/></div>
      <div><div style="${lbl}">강사 소속/직책</div><input id="edu-instructor-org" value="${esc(ed.instructorOrg)}" placeholder="예: 안전관리자" style="${inp}"/></div>
    </div>
    <div style="margin-top:10px;"><div style="${lbl}">교육 대상(부서/공정)</div><input id="edu-target" value="${esc(ed.targetDept)}" style="${inp}"/></div>
    <div style="margin-top:10px;"><div style="${lbl}">교육 목표</div><textarea id="edu-objective" style="${inp}min-height:60px;resize:vertical;">${esc(ed.objective)}</textarea></div>
    <div style="margin-top:10px;"><div style="${lbl}">추가 교육내용(선택)</div><textarea id="edu-extra" placeholder="자동 생성되는 교육자료 외에 강조할 내용을 입력하세요." style="${inp}min-height:60px;resize:vertical;">${esc(ed.extraContent)}</textarea></div>

    ${sectionTitle("참석자 명단")}
    <div style="font-size:11px;color:#aaa;margin-bottom:8px;">※ 서명란은 인쇄된 일지에 자필 서명하도록 비워서 출력됩니다.</div>
    <div id="edu-attendees">${attRows}</div>
    <button id="btn-edu-att-add" style="width:100%;padding:10px;background:#eef7f1;color:#1d6f42;border:1.5px dashed #b6dcc4;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;margin-top:4px;">＋ 참석자 추가</button>

    <div style="display:flex;gap:8px;margin-top:1.5rem;">
      <button id="btn-edu-cancel" style="flex:1;padding:13px;background:#fff;color:#666;border:1.5px solid #ddd;border-radius:11px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;">취소</button>
      <button id="btn-edu-make" style="flex:1.6;padding:13px;background:#1d6f42;color:#fff;border:none;border-radius:11px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;">교육 문서 생성 (일지·자료)</button>
    </div>
  </div>`;
}

// ───────────────────────── 특별안전교육 문서 (일지 + 교육자료, 인쇄/PDF) ─────────────────────────
function renderEduDoc() {
  const r  = state.risk.current;
  const ed = r && r.education;
  if(!r || !ed) return renderList();
  const hazards = Array.isArray(r.hazards) ? r.hazards : [];
  const acc = r.accSnapshot;

  const th  = "border:1px solid #b9c6e8;padding:6px 7px;background:#eef2fb;font-size:11px;font-weight:700;color:#1e2761;";
  const td  = "border:1px solid #cdd8ec;padding:6px 7px;font-size:11px;color:#222;vertical-align:top;";
  const ovh = "border:1px solid #b9c6e8;padding:7px 9px;font-size:12px;background:#f3f6fc;font-weight:700;color:#445;white-space:nowrap;";
  const ov  = "border:1px solid #cdd8ec;padding:7px 9px;font-size:12px;";

  const timeStr = (ed.startTime || ed.endTime)
    ? `${esc(ed.startTime||"")}${ed.endTime?` ~ ${esc(ed.endTime)}`:""}${ed.duration?` (${esc(ed.duration)}시간)`:""}`
    : (ed.duration ? `${esc(ed.duration)}시간` : "-");

  // ── 일지: 참석자 명단(서명란 포함) ──
  const attRows = (ed.attendees||[]).map((a,i)=>`
    <tr>
      <td style="${td}text-align:center;">${i+1}</td>
      <td style="${td}">${esc(a.name)}</td>
      <td style="${td}">${esc(a.dept||"-")}</td>
      <td style="${td}height:26px;"></td>
    </tr>`).join("");

  // ── 교육자료: 위험성평가 기반 자동 생성 ──
  const hazRows = hazards.map((h,i)=>{
    const lv = riskLevel(riskScore(h)), rlv = riskLevel(resRiskScore(h));
    return `<tr>
      <td style="${td}text-align:center;">${i+1}</td>
      <td style="${td}"><strong>${esc(h.hazard)}</strong>${h.cause?`<br><span style="color:#777;">${esc(h.cause)}</span>`:""}</td>
      <td style="${td}text-align:center;font-weight:800;color:${lv.color};">${riskScore(h)} ${lv.label}</td>
      <td style="${td}">${nl2br(h.reduction||"-")}</td>
      <td style="${td}text-align:center;font-weight:800;color:${rlv.color};">${rlv.label}</td>
    </tr>`;
  }).join("");

  // 작업자 안전수칙 = 감소대책에서 도출
  const rules = hazards.map(h=>h.reduction).filter(s=>s && s.trim());
  const ruleItems = rules.length
    ? rules.map(s=>`<li style="margin-bottom:5px;">${esc(s)}</li>`).join("")
    : '<li>작업 전 위험요인을 확인하고 안전수칙을 준수한다.</li>';

  const sigBox = (role)=>`<td style="border:1px solid #b9c6e8;padding:0;width:33.3%;">
    <div style="background:#f3f6fc;font-size:11px;font-weight:700;color:#445;padding:5px;text-align:center;border-bottom:1px solid #b9c6e8;">${role}</div>
    <div style="height:50px;"></div></td>`;

  return `
  <style>
    @media print {
      .no-print { display:none !important; }
      body { background:#fff !important; }
      #app { padding:0 !important; }
      .edu-page { box-shadow:none !important; border:none !important; margin:0 !important; max-width:none !important; }
      .page-break { break-before:page; page-break-before:always; }
      @page { margin:14mm; }
    }
  </style>
  <div class="no-print" style="max-width:820px;margin:0 auto;display:flex;gap:8px;justify-content:space-between;flex-wrap:wrap;padding:0 0 14px;">
    <button id="btn-edu-back" style="padding:8px 14px;border:1px solid #ddd;border-radius:8px;background:#fff;font-size:13px;cursor:pointer;font-family:inherit;">← 보고서</button>
    <div style="display:flex;gap:8px;flex-wrap:wrap;">
      <button id="btn-edu-edit" style="padding:8px 14px;border:1px solid #ddd;border-radius:8px;background:#fff;font-size:13px;cursor:pointer;font-family:inherit;">교육정보 수정</button>
      <button onclick="window.print()" style="padding:8px 16px;border:none;border-radius:8px;background:#1d6f42;color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">🖨️ 인쇄 / PDF 저장</button>
    </div>
  </div>

  <!-- 1면: 특별안전교육 일지 -->
  <div class="edu-page" style="max-width:820px;margin:0 auto 18px;background:#fff;border:1px solid #e3ebf5;border-radius:8px;padding:30px 32px;box-shadow:0 2px 10px rgba(0,0,0,.06);color:#222;">
    <div style="text-align:center;border-bottom:2.5px solid #1d6f42;padding-bottom:12px;margin-bottom:12px;">
      <div style="font-size:21px;font-weight:800;letter-spacing:2px;color:#1d6f42;">특별안전교육 일지</div>
      <div style="font-size:11px;color:#888;margin-top:4px;">산업안전보건법 제29조 (근로자 안전보건교육) · 교육 실시 기록 3년 보존</div>
    </div>

    <table style="width:100%;border-collapse:collapse;margin-bottom:6px;">
      <tr><td style="${ovh}">교육명</td><td style="${ov}" colspan="3">${esc(ed.eduName||"-")}</td></tr>
      <tr><td style="${ovh}">교육일자</td><td style="${ov}">${esc(ed.eduDate||"-")}</td><td style="${ovh}">교육시간</td><td style="${ov}">${timeStr}</td></tr>
      <tr><td style="${ovh}">교육장소</td><td style="${ov}">${esc(ed.place||"-")}</td><td style="${ovh}">교육방법</td><td style="${ov}">${esc(ed.method||"-")}</td></tr>
      <tr><td style="${ovh}">강사</td><td style="${ov}">${esc(ed.instructor||"-")}${ed.instructorOrg?` (${esc(ed.instructorOrg)})`:""}</td><td style="${ovh}">교육대상</td><td style="${ov}">${esc(ed.targetDept||"-")}</td></tr>
      <tr><td style="${ovh}">관련 사고</td><td style="${ov}">${esc(r.accNo||"해당없음")}</td><td style="${ovh}">평가번호</td><td style="${ov}">${esc(r.raNo||"-")}</td></tr>
      <tr><td style="${ovh}">교육목표</td><td style="${ov}" colspan="3">${nl2br(ed.objective||"-")}</td></tr>
    </table>

    <div style="font-size:12px;font-weight:800;color:#1d6f42;margin:14px 0 6px;">교육 내용 요약</div>
    <div style="border:1px solid #cdd8ec;border-radius:5px;padding:10px 12px;font-size:12px;line-height:1.7;">
      ${acc?`① 사고 개요: ${esc(acc.accType||"")} ${acc.accDetail?`> ${esc(acc.accDetail)}`:""} / ${esc(acc.location||"-")} / ${esc(acc.accDateTime||"-")}<br>`:""}
      ② 위험성평가 결과: 유해·위험요인 ${hazards.length}건 도출, 감소대책 수립<br>
      ③ 재발방지 대책 및 작업자 안전수칙 교육 (상세 — 별첨 교육자료)
      ${ed.extraContent?`<br>④ 추가 강조사항: ${nl2br(ed.extraContent)}`:""}
    </div>

    <div style="font-size:12px;font-weight:800;color:#1d6f42;margin:16px 0 6px;">참석자 명단 (이수 확인)</div>
    <table style="width:100%;border-collapse:collapse;">
      <thead><tr>
        <th style="${th}width:34px;">No</th><th style="${th}width:130px;">성명</th><th style="${th}">소속/직급</th><th style="${th}width:150px;">서명</th>
      </tr></thead>
      <tbody>${attRows || `<tr><td style="${td}" colspan="4">참석자 없음</td></tr>`}</tbody>
    </table>
    <div style="text-align:right;font-size:11px;color:#888;margin-top:6px;">총 ${ (ed.attendees||[]).length }명 참석</div>

    <table style="width:100%;border-collapse:collapse;margin-top:18px;">
      <tr>${sigBox("교육 담당자")}${sigBox("안전관리자")}${sigBox("승인")}</tr>
    </table>
  </div>

  <!-- 2면: 특별안전교육 자료 (자동 생성) -->
  <div class="edu-page page-break" style="max-width:820px;margin:0 auto;background:#fff;border:1px solid #e3ebf5;border-radius:8px;padding:30px 32px;box-shadow:0 2px 10px rgba(0,0,0,.06);color:#222;">
    <div style="text-align:center;border-bottom:2.5px solid #1e2761;padding-bottom:12px;margin-bottom:14px;">
      <div style="font-size:20px;font-weight:800;letter-spacing:1px;color:#1e2761;">특별안전교육 자료</div>
      <div style="font-size:12px;color:#666;margin-top:4px;">${esc(ed.eduName||"")}</div>
    </div>

    <div style="font-size:13px;font-weight:800;color:#1e2761;margin:6px 0 6px;">1. 사고 개요</div>
    <table style="width:100%;border-collapse:collapse;margin-bottom:6px;">
      <tr><td style="${ovh}">사고번호</td><td style="${ov}">${esc(r.accNo||"해당없음")}</td><td style="${ovh}">발생일시</td><td style="${ov}">${esc(acc?.accDateTime||"-")}</td></tr>
      <tr><td style="${ovh}">사고유형</td><td style="${ov}">${esc(acc?.accType||"-")} ${acc?.accDetail?`> ${esc(acc.accDetail)}`:""}</td><td style="${ovh}">발생장소</td><td style="${ov}">${esc(acc?.location||r.targetWork||"-")}</td></tr>
      <tr><td style="${ovh}">사고경위</td><td style="${ov}" colspan="3">${nl2br(acc?.situation||"-")}</td></tr>
    </table>

    <div style="font-size:13px;font-weight:800;color:#1e2761;margin:16px 0 6px;">2. 유해·위험요인 및 위험성평가 결과</div>
    <table style="width:100%;border-collapse:collapse;">
      <thead><tr>
        <th style="${th}width:26px;">No</th><th style="${th}">유해·위험요인 / 원인</th><th style="${th}width:70px;">위험성</th><th style="${th}">재발방지·감소대책</th><th style="${th}width:60px;">개선후</th>
      </tr></thead>
      <tbody>${hazRows || `<tr><td style="${td}" colspan="5">-</td></tr>`}</tbody>
    </table>

    <div style="font-size:13px;font-weight:800;color:#1e2761;margin:16px 0 6px;">3. 작업자 안전수칙 (반드시 준수)</div>
    <ul style="margin:0;padding-left:20px;font-size:12px;line-height:1.7;color:#222;">${ruleItems}</ul>

    ${r.conclusion?`<div style="font-size:13px;font-weight:800;color:#1e2761;margin:16px 0 6px;">4. 종합 의견</div>
      <div style="border:1px solid #cdd8ec;border-radius:5px;padding:10px 12px;font-size:12px;line-height:1.7;">${nl2br(r.conclusion)}</div>`:""}

    ${(Array.isArray(r.photos)&&r.photos.filter(Boolean).length)?`
      <div style="font-size:13px;font-weight:800;color:#1e2761;margin:16px 0 6px;">5. 현장 사진</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">${r.photos.filter(Boolean).map(u=>`<img src="${esc(u)}" style="width:150px;height:150px;object-fit:cover;border:1px solid #cdd8ec;border-radius:4px;"/>`).join("")}</div>`:""}

    <div style="text-align:center;font-size:11px;color:#aaa;margin-top:18px;border-top:1px solid #eee;padding-top:10px;">
      본 자료는 수시 위험성평가(${esc(r.raNo||"-")}) 결과를 바탕으로 자동 생성되었습니다.
    </div>
  </div>`;
}

// ───────────────────────── 아차사고 보고서 편집기 ─────────────────────────
function renderNmEditor() {
  const d = state.risk.draft;
  if(!d) return renderList();

  const inp = "padding:9px 11px;border:1px solid #dce8f4;border-radius:8px;font-size:14px;font-family:inherit;width:100%;box-sizing:border-box;";
  const sel = inp + "background:#fff;";
  const lbl = "font-size:12px;font-weight:700;color:#445;margin:0 0 5px;";
  const sectionTitle = (t) => `<div style="font-size:13px;font-weight:800;color:#e65100;margin:1.4rem 0 .7rem;padding-bottom:6px;border-bottom:2px solid #eef2f7;">${t}</div>`;

  const siteOpts = ['<option value="">선택</option>']
    .concat(SITES.map(s=>`<option value="${esc(s)}"${d.site===s?" selected":""}>${esc(s)}</option>`)).join("");
  const catOpts = NM_CATEGORIES.map(c=>`<option value="${esc(c)}"${d.category===c?" selected":""}>${esc(c)}</option>`).join("");
  const likOpts = LIKELIHOOD.map(o=>`<option value="${o.v}"${Number(d.likelihood)===o.v?" selected":""}>${o.l}</option>`).join("");
  const sevOpts = SEVERITY.map(o=>`<option value="${o.v}"${Number(d.severity)===o.v?" selected":""}>${o.l}</option>`).join("");
  const sc = riskScore(d), lv = riskLevel(sc);

  const photos = d.photosPreviews.map((url,idx)=>{
    const uploading = d.photos[idx]==="uploading";
    return `
    <div style="position:relative;width:74px;height:74px;border-radius:9px;overflow:hidden;border:1px solid #dce8f4;">
      <img src="${url}" style="width:100%;height:100%;object-fit:cover;${uploading?"opacity:.4;":""}"/>
      ${uploading?'<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:10px;color:#1e2761;font-weight:700;">업로드중</div>':
        `<button class="nm-photo-del" data-idx="${idx}" style="position:absolute;top:2px;right:2px;width:18px;height:18px;border-radius:50%;background:rgba(0,0,0,.55);color:#fff;border:none;font-size:11px;cursor:pointer;line-height:1;">×</button>`}
    </div>`;
  }).join("");

  return `
  <div style="padding-bottom:3rem;max-width:640px;margin:0 auto;">
    ${header(d._key ? `${esc(d.nmNo||"")} 편집` : "아차사고 보고서 — 신규 작성")}
    <div style="background:#fff3e6;border:1px solid #fcd8a8;border-radius:9px;padding:10px 12px;font-size:12px;color:#e65100;line-height:1.6;margin-bottom:14px;">
      <strong>아차사고(near-miss)</strong>: 사고로 이어지진 않았으나 다칠 뻔했던 위험 상황을 기록하여, 실제 사고를 예방하기 위한 보고서입니다.
    </div>

    <div id="nm-err" style="display:none;background:#fff5f5;border:1px solid #f5c6c6;color:#b71c1c;border-radius:9px;padding:10px 12px;font-size:13px;margin-bottom:12px;"></div>

    ${sectionTitle("① 개요")}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
      <div><div style="${lbl}">사업소 <span style="color:#c0392b;">*</span></div><select id="nm-site" style="${sel}">${siteOpts}</select></div>
      <div><div style="${lbl}">발생 일자</div><input type="date" id="nm-date" value="${esc(d.occurredAt)}" style="${inp}"/></div>
      <div><div style="${lbl}">발생 장소 <span style="color:#c0392b;">*</span></div><input id="nm-location" value="${esc(d.location)}" placeholder="예: 2공장 도킹존" style="${inp}"/></div>
      <div><div style="${lbl}">보고자(발견자)</div><input id="nm-reporter" value="${esc(d.reporter)}" placeholder="성명" style="${inp}"/></div>
    </div>
    <div style="margin-top:10px;"><div style="${lbl}">아차사고 유형</div><select id="nm-category" style="${sel}">${catOpts}</select></div>

    ${sectionTitle("② 아차사고 내용")}
    <div style="${lbl}">어떤 위험한 상황이 있었는지 <span style="color:#c0392b;">*</span></div>
    <textarea id="nm-desc" placeholder="예: 지게차 후진 중 작업자가 통로에 있어 충돌할 뻔함" style="${inp}min-height:80px;resize:vertical;">${esc(d.description)}</textarea>

    ${sectionTitle("③ 잠재 위험성")}
    <div style="${lbl}">사고로 이어졌다면 예상되는 피해</div>
    <textarea id="nm-potential" placeholder="예: 충돌 시 작업자 중상(골절 등) 가능" style="${inp}min-height:60px;resize:vertical;">${esc(d.potentialRisk)}</textarea>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px;">
      <div><div style="${lbl}">가능성(빈도)</div><select id="nm-likelihood" style="${sel}">${likOpts}</select></div>
      <div><div style="${lbl}">중대성(강도)</div><select id="nm-severity" style="${sel}">${sevOpts}</select></div>
    </div>
    <div style="display:flex;align-items:center;gap:8px;margin-top:10px;padding:8px 11px;border-radius:9px;background:${lv.bg};border:1px solid ${lv.border};">
      <span style="font-size:12px;color:#555;">위험성</span>
      <span style="font-size:18px;font-weight:800;color:${lv.color};">${sc||"-"}</span>
      <span style="font-size:12px;font-weight:800;color:${lv.color};padding:2px 9px;border-radius:20px;background:#fff;border:1px solid ${lv.border};">${lv.label}</span>
      <span style="font-size:11px;color:#888;margin-left:auto;">${lv.action}</span>
    </div>

    ${sectionTitle("④ 조치 및 재발방지")}
    <div style="${lbl}">즉시 조치 내용</div>
    <textarea id="nm-action" placeholder="예: 통로 차단·경고, 지게차 운행 경로 분리 안내" style="${inp}min-height:56px;resize:vertical;">${esc(d.immediateAction)}</textarea>
    <div style="${lbl}">재발방지 대책 <span style="color:#c0392b;">*</span></div>
    <textarea id="nm-measure" placeholder="예: 보행자·차량 동선 분리, 후방 감지센서 설치, 운행 구역 표시" style="${inp}min-height:70px;resize:vertical;">${esc(d.preventiveMeasure)}</textarea>

    ${sectionTitle("⑤ 현장 사진 (최대 3장)")}
    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
      ${photos}
      ${d.photos.filter(p=>p).length < 3 ? `
      <label style="width:74px;height:74px;border-radius:9px;border:1.5px dashed #fcd8a8;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;color:#e65100;font-size:11px;background:#fff8f0;">
        <span style="font-size:20px;">＋</span>사진
        <input id="nm-photo-input" type="file" accept="image/*" multiple style="display:none;"/>
      </label>`:""}
    </div>

    <div style="display:flex;gap:8px;margin-top:1.5rem;">
      <button id="btn-nm-save" style="flex:1;padding:13px;background:#fff;color:#e65100;border:1.5px solid #e65100;border-radius:11px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;">임시저장</button>
      <button id="btn-nm-complete" style="flex:1.4;padding:13px;background:#e65100;color:#fff;border:none;border-radius:11px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;">작성 완료 → 보고서 생성</button>
    </div>
  </div>`;
}

// ───────────────────────── 아차사고 보고서 (인쇄/PDF) ─────────────────────────
function renderNmReport() {
  const r = state.risk.current;
  if(!r) return renderList();
  const lv = riskLevel(riskScore(r));

  const ovh = "border:1px solid #fcd8a8;padding:7px 9px;font-size:12px;background:#fff6ec;font-weight:700;color:#7a3b00;white-space:nowrap;";
  const ov  = "border:1px solid #f0dcc4;padding:7px 9px;font-size:12px;";
  const block = (title, body) => `
    <div style="font-size:12px;font-weight:800;color:#e65100;margin:14px 0 6px;">${title}</div>
    <div style="border:1px solid #f0dcc4;border-radius:5px;padding:10px 12px;font-size:12px;line-height:1.7;">${body}</div>`;

  const photos = (Array.isArray(r.photos)?r.photos:[]).filter(Boolean).map(u=>
    `<img src="${esc(u)}" style="width:150px;height:150px;object-fit:cover;border:1px solid #f0dcc4;border-radius:4px;"/>`).join("");
  const sigBox = (role)=>`<td style="border:1px solid #fcd8a8;padding:0;width:33.3%;">
    <div style="background:#fff6ec;font-size:11px;font-weight:700;color:#7a3b00;padding:5px;text-align:center;border-bottom:1px solid #fcd8a8;">${role}</div>
    <div style="height:54px;"></div></td>`;

  return `
  <style>
    @media print {
      .no-print { display:none !important; }
      body { background:#fff !important; }
      #app { padding:0 !important; }
      .nm-report { box-shadow:none !important; border:none !important; margin:0 !important; max-width:none !important; }
      @page { margin:14mm; }
    }
  </style>
  <div class="no-print" style="max-width:820px;margin:0 auto;display:flex;gap:8px;justify-content:space-between;flex-wrap:wrap;padding:0 0 14px;">
    <button id="btn-nm-report-back" style="padding:8px 14px;border:1px solid #ddd;border-radius:8px;background:#fff;font-size:13px;cursor:pointer;font-family:inherit;">← 목록</button>
    <div style="display:flex;gap:8px;">
      <button id="btn-nm-report-edit" style="padding:8px 14px;border:1px solid #ddd;border-radius:8px;background:#fff;font-size:13px;cursor:pointer;font-family:inherit;">수정</button>
      <button onclick="window.print()" style="padding:8px 16px;border:none;border-radius:8px;background:#e65100;color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">🖨️ 인쇄 / PDF 저장</button>
    </div>
  </div>

  <div class="nm-report" style="max-width:820px;margin:0 auto;background:#fff;border:1px solid #e3ebf5;border-radius:8px;padding:30px 32px;box-shadow:0 2px 10px rgba(0,0,0,.06);color:#222;">
    <div style="text-align:center;border-bottom:2.5px solid #e65100;padding-bottom:12px;margin-bottom:8px;">
      <div style="font-size:21px;font-weight:800;letter-spacing:2px;color:#e65100;">아차사고 보고서</div>
      <div style="font-size:11px;color:#888;margin-top:4px;">Near-miss Report · 잠재 위험 발굴 및 사고 예방</div>
    </div>
    <div style="text-align:right;font-size:11px;color:#888;margin-bottom:10px;">보고서번호 <strong>${esc(r.nmNo||"-")}</strong></div>

    <table style="width:100%;border-collapse:collapse;margin-bottom:6px;">
      <tr><td style="${ovh}">사업소</td><td style="${ov}">${esc(r.site||"-")}</td><td style="${ovh}">발생일자</td><td style="${ov}">${esc(r.occurredAt||"-")}</td></tr>
      <tr><td style="${ovh}">발생장소</td><td style="${ov}">${esc(r.location||"-")}</td><td style="${ovh}">보고자</td><td style="${ov}">${esc(r.reporter||"-")}</td></tr>
      <tr><td style="${ovh}">유형</td><td style="${ov}">${esc(r.category||"-")}</td><td style="${ovh}">위험성</td><td style="${ov}"><strong style="color:${lv.color};">${riskScore(r)} · ${lv.label}</strong> (가능성 ${r.likelihood}×중대성 ${r.severity})</td></tr>
    </table>

    ${block("① 아차사고 내용", nl2br(r.description||"-"))}
    ${block("② 잠재 위험성 (예상 피해)", nl2br(r.potentialRisk||"-"))}
    ${block("③ 즉시 조치", nl2br(r.immediateAction||"없음"))}
    ${block("④ 재발방지 대책", nl2br(r.preventiveMeasure||"-"))}

    ${photos?`<div style="margin-top:14px;"><div style="font-size:12px;font-weight:800;color:#e65100;margin-bottom:6px;">현장 사진</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">${photos}</div></div>`:""}

    <table style="width:100%;border-collapse:collapse;margin-top:22px;">
      <tr>${sigBox("보고자")}${sigBox("안전관리자")}${sigBox("사업소장")}</tr>
    </table>
    <div style="text-align:center;font-size:11px;color:#aaa;margin-top:14px;">
      작성일시 ${esc(r.createdAt||"-")}${r.completedAt?` · 완료 ${esc(r.completedAt)}`:""}
    </div>
  </div>`;
}
