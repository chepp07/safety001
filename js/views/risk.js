import { state } from "../state.js";
import { SITES } from "../config.js";
import {
  LIKELIHOOD, SEVERITY, RA_REASONS,
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
function renderList() {
  const items = Object.entries(state.riskAssessments || {})
    .sort((a,b) => (b[1].createdAt||"").localeCompare(a[1].createdAt||""));

  const rows = items.length === 0
    ? '<div class="card" style="text-align:center;padding:2.5rem;color:#bbb;font-size:14px;">아직 작성된 수시 위험성평가가 없습니다.</div>'
    : items.map(([key,r]) => {
        const hazards = Array.isArray(r.hazards) ? r.hazards : [];
        const maxScore = hazards.reduce((m,h)=>Math.max(m, riskScore(h)), 0);
        const lv = riskLevel(maxScore);
        const done = r.status === "완료";
        return `
        <div style="background:#fff;border-radius:12px;border:1px solid #eef2f7;margin-bottom:10px;padding:13px 14px;box-shadow:0 1px 4px rgba(0,0,0,.05);">
          <div style="display:flex;align-items:flex-start;gap:10px;">
            <div style="flex:1;min-width:0;">
              <div style="display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin-bottom:5px;">
                <span style="font-weight:700;font-size:13px;">${esc(r.raNo||"-")}</span>
                <span style="font-size:11px;font-weight:700;padding:2px 8px;border-radius:20px;background:${done?"#e8f5e9":"#fff8e1"};color:${done?"#2e7d32":"#b88600"};">${done?"완료":"작성중"}</span>
                <span style="font-size:11px;font-weight:700;padding:2px 8px;border-radius:20px;background:${lv.bg};color:${lv.color};border:1px solid ${lv.border};">최고위험성 ${lv.label}</span>
              </div>
              <div style="font-size:12px;color:#555;margin-bottom:2px;">${esc(r.site||"-")} · ${esc(r.targetWork||"-")}</div>
              <div style="font-size:11px;color:#aaa;">평가일 ${esc(r.assessDate||"-")} · 평가자 ${esc(r.assessor||"-")}${r.accNo?` · 대상사고 ${esc(r.accNo)}`:""}</div>
            </div>
          </div>
          <div style="display:flex;gap:6px;justify-content:flex-end;margin-top:10px;">
            ${done
              ? `<button class="ra-report-btn" data-key="${key}" style="padding:6px 14px;background:#1e2761;color:#fff;border:none;border-radius:7px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">📄 보고서 보기</button>
                 <button class="ra-edit-btn" data-key="${key}" style="padding:6px 12px;background:#fff;color:#555;border:1px solid #ddd;border-radius:7px;font-size:12px;cursor:pointer;font-family:inherit;">수정</button>`
              : `<button class="ra-edit-btn" data-key="${key}" style="padding:6px 14px;background:#e05c00;color:#fff;border:none;border-radius:7px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">✏️ 이어서 작성</button>`}
            <button class="ra-del-btn" data-key="${key}" style="padding:6px 10px;background:#fff;color:#ccc;border:1px solid #eee;border-radius:7px;font-size:12px;cursor:pointer;font-family:inherit;">삭제</button>
          </div>
        </div>`;
      }).join("");

  return `
  <div style="padding-bottom:2rem;max-width:640px;margin:0 auto;">
    ${header("산업안전보건법 제36조 · 시행규칙 제37조")}
    <button id="btn-risk-new" style="width:100%;padding:13px;background:#1e2761;color:#fff;border:none;border-radius:11px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;margin-bottom:1.25rem;box-shadow:0 2px 8px rgba(30,39,97,.2);">＋ 새 수시 위험성평가 작성</button>
    ${rows}
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
  <div class="no-print" style="max-width:820px;margin:0 auto;display:flex;gap:8px;justify-content:space-between;padding:0 0 14px;">
    <button id="btn-ra-report-back" style="padding:8px 14px;border:1px solid #ddd;border-radius:8px;background:#fff;font-size:13px;cursor:pointer;font-family:inherit;">← 목록</button>
    <div style="display:flex;gap:8px;">
      <button id="btn-ra-report-edit" style="padding:8px 14px;border:1px solid #ddd;border-radius:8px;background:#fff;font-size:13px;cursor:pointer;font-family:inherit;">수정</button>
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
