import { state } from "../state.js";
import { MASTER_EMAILS, ADMIN_EMAILS, SITES } from "../config.js";
import { ROLE_LABEL } from "../features/master.js";

const esc = (s) => String(s==null?"":s)
  .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");

// 관리자 대시보드 안에서 렌더되는 "마스터 관리" 탭 본문
export function renderMasterTab() {
  if(!state.isMaster){
    return '<div class="card" style="text-align:center;padding:2.5rem;color:#bbb;font-size:14px;">마스터 관리자만 접근할 수 있습니다.</div>';
  }

  const users = Object.entries(state.users || {})
    .sort((a,b) => (b[1].lastLogin||"").localeCompare(a[1].lastLogin||""));
  const recipients = Object.entries(state.recipients || {})
    .sort((a,b) => (a[1].name||"").localeCompare(b[1].name||""));

  const roleBadge = (role) => {
    const c = role==="master" ? {bg:"#efe7fb",co:"#5b3ba8"} : role==="admin" ? {bg:"#e8eef7",co:"#1a3a6b"} : {bg:"#f0f2f5",co:"#888"};
    return `<span style="font-size:11px;font-weight:700;padding:2px 9px;border-radius:20px;background:${c.bg};color:${c.co};">${ROLE_LABEL[role]||"일반"}</span>`;
  };

  // ── 가입자 / 권한 관리 ──
  const userRows = users.length === 0
    ? '<tr><td colspan="4" style="padding:1.5rem;text-align:center;color:#bbb;">가입자 정보를 불러오는 중이거나 없습니다.</td></tr>'
    : users.map(([uid,u]) => {
        const role = u.role || "user";
        const seed = MASTER_EMAILS.includes(u.email);   // 시드 마스터는 변경 불가
        const isMe = state.currentUser && state.currentUser.uid === uid;
        const sel = seed
          ? `${roleBadge("master")} <span style="font-size:10px;color:#aaa;">(고정)</span>`
          : `<select class="role-sel" data-uid="${uid}" style="border:1px solid #ddd;border-radius:6px;padding:4px 8px;font-size:12px;font-family:inherit;cursor:pointer;">
               ${["user","admin","master"].map(r=>`<option value="${r}"${role===r?" selected":""}>${ROLE_LABEL[r]}</option>`).join("")}
             </select>`;
        const legacy = role==="user" && ADMIN_EMAILS.includes(u.email)
          ? ' <span style="font-size:10px;color:#b88600;">(레거시 관리자 · 정식 부여 권장)</span>' : "";
        return `<tr style="border-bottom:1px solid #eef2f7;">
          <td style="padding:9px 10px;font-size:13px;">
            <div style="font-weight:600;">${esc(u.name||"-")}${isMe?' <span style="font-size:10px;color:#1d6f42;">(나)</span>':""}</div>
            <div style="font-size:11px;color:#999;">${esc(u.email||"-")}</div>
          </td>
          <td style="padding:9px 10px;">${roleBadge(role)}${legacy}</td>
          <td style="padding:9px 10px;font-size:11px;color:#aaa;white-space:nowrap;">${esc((u.lastLogin||"-")).slice(0,16)}</td>
          <td style="padding:9px 10px;text-align:right;">${sel}</td>
        </tr>`;
      }).join("");

  // ── 문자 수신자 관리 ──
  const lvBadge = (n, on) => `<span style="font-size:10px;font-weight:700;padding:1px 6px;border-radius:5px;background:${on?"#e8eef7":"#f3f4f6"};color:${on?"#1a3a6b":"#ccc"};">Lv${n}</span>`;
  const recRows = recipients.length === 0
    ? '<div style="padding:1.2rem;text-align:center;color:#bbb;font-size:13px;">등록된 문자 수신자가 없습니다.</div>'
    : recipients.map(([id,r]) => {
        const active = r.active !== false;
        const lv = r.levels || { "1":true, "2":true, "3":true };
        const scopeLabel = r.scope ? esc(r.scope) : "공통(전체)";
        return `<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-bottom:1px solid #eef2f7;">
          <div style="flex:1;min-width:0;">
            <div style="font-weight:600;font-size:13px;">${esc(r.name||"-")} <span style="font-size:11px;color:#aaa;font-weight:400;">${scopeLabel}</span></div>
            <div style="font-size:12px;color:#888;margin:2px 0 3px;">${esc(r.phone||"-")}</div>
            <div style="display:flex;gap:4px;">${lvBadge("1",lv["1"]!==false)}${lvBadge("2",lv["2"]!==false)}${lvBadge("3",lv["3"]!==false)}</div>
          </div>
          <label style="display:flex;align-items:center;gap:5px;font-size:12px;color:${active?"#1d6f42":"#bbb"};cursor:pointer;">
            <input type="checkbox" class="rec-toggle" data-id="${id}" ${active?"checked":""} style="width:15px;height:15px;"/>
            ${active?"발송":"중지"}
          </label>
          <button class="rec-del" data-id="${id}" style="background:none;border:1px solid #f0c4c4;color:#c0392b;border-radius:6px;font-size:11px;padding:4px 9px;cursor:pointer;font-family:inherit;">삭제</button>
        </div>`;
      }).join("");

  return `
  <div id="master-msg" style="display:none;border-radius:9px;padding:9px 12px;font-size:13px;margin-bottom:12px;"></div>

  <div style="background:#fff;border-radius:12px;border:1px solid #eef2f7;padding:0;overflow:hidden;margin-bottom:1.25rem;box-shadow:0 1px 4px rgba(0,0,0,.05);">
    <div style="padding:12px 14px;border-bottom:1px solid #eef2f7;display:flex;align-items:center;justify-content:space-between;">
      <div style="font-size:14px;font-weight:700;">👥 가입자 · 권한 관리</div>
      <span style="font-size:12px;color:#aaa;">총 ${users.length}명</span>
    </div>
    <div style="overflow-x:auto;">
      <table style="width:100%;border-collapse:collapse;">
        <thead style="background:#f7f9fc;"><tr>
          <th style="padding:8px 10px;text-align:left;font-size:11px;font-weight:700;color:#888;">가입자</th>
          <th style="padding:8px 10px;text-align:left;font-size:11px;font-weight:700;color:#888;">현재 권한</th>
          <th style="padding:8px 10px;text-align:left;font-size:11px;font-weight:700;color:#888;">최근 접속</th>
          <th style="padding:8px 10px;text-align:right;font-size:11px;font-weight:700;color:#888;">권한 변경</th>
        </tr></thead>
        <tbody>${userRows}</tbody>
      </table>
    </div>
    <div style="padding:9px 14px;font-size:11px;color:#bbb;background:#fafbfd;border-top:1px solid #eef2f7;">
      ※ 권한 변경은 즉시 적용됩니다. 시드 마스터(${esc(MASTER_EMAILS.join(", "))})는 코드 고정이라 변경할 수 없습니다.
    </div>
  </div>

  <div style="background:#fff;border-radius:12px;border:1px solid #eef2f7;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.05);">
    <div style="padding:12px 14px;border-bottom:1px solid #eef2f7;">
      <div style="font-size:14px;font-weight:700;">📱 문자(SMS) 수신자 관리</div>
      <div style="font-size:11px;color:#aaa;margin-top:2px;">사고 접수 시 문자를 받을 담당자입니다. ‘발송’ 체크된 사람에게만 전송됩니다.</div>
    </div>
    <div style="padding:12px 14px;border-bottom:1px solid #eef2f7;background:#fafbfd;">
      <div style="display:flex;gap:7px;flex-wrap:wrap;margin-bottom:8px;">
        <input id="rec-name" placeholder="이름" style="padding:8px 10px;border:1px solid #ddd;border-radius:8px;font-size:13px;font-family:inherit;width:100px;"/>
        <input id="rec-phone" placeholder="휴대폰 번호" inputmode="numeric" style="padding:8px 10px;border:1px solid #ddd;border-radius:8px;font-size:13px;font-family:inherit;flex:1;min-width:120px;"/>
        <select id="rec-scope" style="padding:8px 10px;border:1px solid #ddd;border-radius:8px;font-size:13px;font-family:inherit;background:#fff;">
          <option value="">공통(전체 사업소)</option>
          ${SITES.map(s=>`<option value="${esc(s)}">${esc(s)}</option>`).join("")}
        </select>
      </div>
      <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
        <span style="font-size:12px;color:#667;font-weight:700;">수신 긴급도:</span>
        <label style="font-size:12px;display:flex;align-items:center;gap:4px;cursor:pointer;"><input type="checkbox" class="rec-lv" data-lv="1" checked style="width:14px;height:14px;"/> Lv1 최긴급</label>
        <label style="font-size:12px;display:flex;align-items:center;gap:4px;cursor:pointer;"><input type="checkbox" class="rec-lv" data-lv="2" checked style="width:14px;height:14px;"/> Lv2 긴급</label>
        <label style="font-size:12px;display:flex;align-items:center;gap:4px;cursor:pointer;"><input type="checkbox" class="rec-lv" data-lv="3" checked style="width:14px;height:14px;"/> Lv3 일반</label>
        <button id="btn-rec-add" style="margin-left:auto;padding:8px 16px;background:#1e2761;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">＋ 추가</button>
      </div>
    </div>
    <div>${recRows}</div>
  </div>`;
}
