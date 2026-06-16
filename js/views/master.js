import { state } from "../state.js";
import { MASTER_EMAILS, ADMIN_EMAILS, SITES } from "../config.js";
import { ROLE_LABEL } from "../features/master.js";

const esc = (s) => String(s==null?"":s)
  .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
const norm = (p) => (p||"").replace(/[^0-9]/g,"");

// 관리자 대시보드 안에서 렌더되는 "마스터 관리" 탭 본문
export function renderMasterTab() {
  if(!state.isMaster){
    return '<div class="card" style="text-align:center;padding:2.5rem;color:#bbb;font-size:14px;">마스터 관리자만 접근할 수 있습니다.</div>';
  }

  const users = Object.entries(state.users || {})
    .sort((a,b) => (b[1].lastLogin||"").localeCompare(a[1].lastLogin||""));
  const recipients = Object.entries(state.recipients || {})
    .sort((a,b) => (a[1].name||"").localeCompare(b[1].name||""));

  // 번호 → 수신자 매핑 (가입자 리스트의 수신 상태 표시용)
  const recByPhone = {};
  recipients.forEach(([id,r]) => { if(r.phone) recByPhone[norm(r.phone)] = id; });

  const roleBadge = (role) => {
    const c = role==="master" ? {bg:"#efe7fb",co:"#5b3ba8"} : role==="admin" ? {bg:"#e8eef7",co:"#1a3a6b"} : {bg:"#f0f2f5",co:"#888"};
    return `<span style="font-size:11px;font-weight:700;padding:2px 9px;border-radius:20px;background:${c.bg};color:${c.co};">${ROLE_LABEL[role]||"일반"}</span>`;
  };
  const inp = "padding:6px 9px;border:1px solid #ddd;border-radius:7px;font-size:12px;font-family:inherit;";

  // ── 가입자 / 권한 / 문자수신 관리 ──
  const userRows = users.length === 0
    ? '<div style="padding:1.5rem;text-align:center;color:#bbb;font-size:13px;">가입자 정보를 불러오는 중이거나 없습니다.</div>'
    : users.map(([uid,u]) => {
        const role = u.role || "user";
        const seed = MASTER_EMAILS.includes(u.email);
        const isMe = state.currentUser && state.currentUser.uid === uid;
        const phone = u.phone || "";
        const legacy = role==="user" && ADMIN_EMAILS.includes(u.email)
          ? ' <span style="font-size:10px;color:#b88600;">(레거시 관리자)</span>' : "";

        const roleCtrl = seed
          ? `${roleBadge("master")} <span style="font-size:10px;color:#aaa;">(고정)</span>`
          : `<select class="role-sel" data-uid="${uid}" style="${inp}cursor:pointer;">
               ${["user","admin","master"].map(r=>`<option value="${r}"${role===r?" selected":""}>${ROLE_LABEL[r]}</option>`).join("")}
             </select>`;

        // 문자수신 토글
        let recCtrl;
        if(!norm(phone)){
          recCtrl = '<span style="font-size:11px;color:#bbb;">번호 입력 후 등록 가능</span>';
        } else if(recByPhone[norm(phone)]){
          recCtrl = `<button class="rec-user-remove" data-phone="${esc(phone)}" style="padding:5px 11px;background:#fdecec;color:#c0392b;border:1px solid #f0c4c4;border-radius:7px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">✓ 수신중 · 해제</button>`;
        } else {
          recCtrl = `<button class="rec-user-add" data-uid="${uid}" data-name="${esc(u.name||"")}" data-phone="${esc(phone)}" style="padding:5px 11px;background:#1e2761;color:#fff;border:none;border-radius:7px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">📱 수신등록</button>`;
        }

        return `<div style="padding:11px 13px;border-bottom:1px solid #eef2f7;">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <div style="flex:1;min-width:140px;">
              <div style="font-weight:600;font-size:13px;">${esc(u.name||"-")}${isMe?' <span style="font-size:10px;color:#1d6f42;">(나)</span>':""} ${roleBadge(role)}${legacy}</div>
              <div style="font-size:11px;color:#999;">${esc(u.email||"-")} · 최근 ${esc((u.lastLogin||"-")).slice(0,16)}</div>
            </div>
            ${roleCtrl}
          </div>
          <div style="display:flex;align-items:center;gap:8px;margin-top:8px;flex-wrap:wrap;">
            <input class="user-phone" data-uid="${uid}" value="${esc(phone)}" placeholder="휴대폰 번호" inputmode="numeric" style="${inp}width:150px;"/>
            ${recCtrl}
          </div>
        </div>`;
      }).join("");

  // ── 문자 수신자 목록 (복수 사업장 / 긴급도 칩) ──
  const chip = (label, on, cls, data) =>
    `<button class="${cls}" ${data} style="font-size:11px;font-weight:600;padding:3px 9px;border-radius:14px;cursor:pointer;font-family:inherit;border:1px solid ${on?"#1e2761":"#dce8f4"};background:${on?"#1e2761":"#f5f8fc"};color:${on?"#fff":"#888"};">${label}</button>`;

  const recRows = recipients.length === 0
    ? '<div style="padding:1.2rem;text-align:center;color:#bbb;font-size:13px;">등록된 문자 수신자가 없습니다.</div>'
    : recipients.map(([id,r]) => {
        const active = r.active !== false;
        const lv = r.levels || { "1":true, "2":true, "3":true };
        const sites = Array.isArray(r.sites) ? r.sites : [];
        const siteChips = SITES.map(s => chip(s, sites.includes(s), "rec-site-chip", `data-id="${id}" data-site="${esc(s)}"`)).join("");
        const lvChips = ["1","2","3"].map(n => chip("Lv"+n, lv[n]!==false, "rec-lv-chip", `data-id="${id}" data-lv="${n}"`)).join("");
        return `<div style="padding:11px 13px;border-bottom:1px solid #eef2f7;">
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="flex:1;min-width:0;">
              <div style="font-weight:600;font-size:13px;">${esc(r.name||"-")} <span style="font-size:12px;color:#888;font-weight:400;">${esc(r.phone||"-")}</span></div>
            </div>
            <label style="display:flex;align-items:center;gap:5px;font-size:12px;color:${active?"#1d6f42":"#bbb"};cursor:pointer;">
              <input type="checkbox" class="rec-toggle" data-id="${id}" ${active?"checked":""} style="width:15px;height:15px;"/>${active?"발송":"중지"}
            </label>
            <button class="rec-del" data-id="${id}" style="background:none;border:1px solid #f0c4c4;color:#c0392b;border-radius:6px;font-size:11px;padding:4px 9px;cursor:pointer;font-family:inherit;">삭제</button>
          </div>
          <div style="margin-top:8px;">
            <div style="font-size:10px;color:#aaa;margin-bottom:4px;">발송 사업장 ${sites.length===0?"<b style='color:#1d6f42;'>(전체)</b>":"("+sites.length+"곳)"} · 누르면 선택/해제</div>
            <div style="display:flex;gap:5px;flex-wrap:wrap;">${siteChips}</div>
          </div>
          <div style="margin-top:7px;display:flex;align-items:center;gap:6px;">
            <span style="font-size:10px;color:#aaa;">수신 긴급도:</span>
            <div style="display:flex;gap:5px;">${lvChips}</div>
          </div>
        </div>`;
      }).join("");

  // 외부 수신자(비가입자) 추가 폼
  const extSiteChecks = SITES.map(s =>
    `<label style="font-size:12px;display:flex;align-items:center;gap:4px;cursor:pointer;"><input type="checkbox" class="ext-site" value="${esc(s)}" style="width:14px;height:14px;"/> ${esc(s)}</label>`
  ).join("");

  return `
  <div id="master-msg" style="display:none;border-radius:9px;padding:9px 12px;font-size:13px;margin-bottom:12px;"></div>

  <div style="background:#fff;border-radius:12px;border:1px solid #eef2f7;overflow:hidden;margin-bottom:1.25rem;box-shadow:0 1px 4px rgba(0,0,0,.05);">
    <div style="padding:12px 14px;border-bottom:1px solid #eef2f7;display:flex;align-items:center;justify-content:space-between;">
      <div style="font-size:14px;font-weight:700;">👥 가입자 · 권한 · 문자수신</div>
      <span style="font-size:12px;color:#aaa;">총 ${users.length}명</span>
    </div>
    <div>${userRows}</div>
    <div style="padding:9px 14px;font-size:11px;color:#bbb;background:#fafbfd;border-top:1px solid #eef2f7;">
      ※ 권한 변경 즉시 적용 · 번호 입력 후 ‘수신등록’을 누르면 아래 수신자 목록에 추가됩니다. 시드 마스터(${esc(MASTER_EMAILS.join(", "))})는 변경 불가.
    </div>
  </div>

  <div style="background:#fff;border-radius:12px;border:1px solid #eef2f7;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.05);">
    <div style="padding:12px 14px;border-bottom:1px solid #eef2f7;">
      <div style="font-size:14px;font-weight:700;">📱 문자(SMS) 수신자 — ${recipients.length}명</div>
      <div style="font-size:11px;color:#aaa;margin-top:2px;">사업장은 여러 곳 중복 선택 가능(미선택=전체). ‘발송’ 체크된 사람에게만 전송됩니다.</div>
    </div>
    <div>${recRows}</div>

    <div style="padding:12px 14px;border-top:1px solid #eef2f7;background:#fafbfd;">
      <div style="font-size:12px;font-weight:700;color:#445;margin-bottom:7px;">+ 외부 수신자 추가 (앱 미가입자)</div>
      <div style="display:flex;gap:7px;flex-wrap:wrap;margin-bottom:8px;">
        <input id="ext-name" placeholder="이름" style="${inp}width:100px;"/>
        <input id="ext-phone" placeholder="휴대폰 번호" inputmode="numeric" style="${inp}flex:1;min-width:120px;"/>
      </div>
      <div style="font-size:11px;color:#888;margin-bottom:4px;">발송 사업장 (미선택 시 전체)</div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:8px;">${extSiteChecks}</div>
      <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
        <span style="font-size:12px;color:#667;font-weight:700;">긴급도:</span>
        <label style="font-size:12px;display:flex;align-items:center;gap:4px;cursor:pointer;"><input type="checkbox" class="ext-lv" data-lv="1" checked style="width:14px;height:14px;"/> Lv1</label>
        <label style="font-size:12px;display:flex;align-items:center;gap:4px;cursor:pointer;"><input type="checkbox" class="ext-lv" data-lv="2" checked style="width:14px;height:14px;"/> Lv2</label>
        <label style="font-size:12px;display:flex;align-items:center;gap:4px;cursor:pointer;"><input type="checkbox" class="ext-lv" data-lv="3" checked style="width:14px;height:14px;"/> Lv3</label>
        <button id="btn-ext-add" style="margin-left:auto;padding:8px 16px;background:#1e2761;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">＋ 추가</button>
      </div>
    </div>
  </div>`;
}
