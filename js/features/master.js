// 마스터 관리 — 가입자/권한/문자 수신자 관리 (마스터 전용)
import { state } from "../state.js";
import { emailKey } from "../config.js";
import { ref, update, push, remove, set } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

export const ROLE_LABEL = { master:"마스터", admin:"관리자", user:"일반" };

const norm = (p) => (p||"").replace(/[^0-9]/g, "");

// 가입한 사용자의 역할 변경
// users/{uid} 에 role + roleSet:true 를 함께 기록 → '마스터가 직접 지정함'을 표시해
// 레거시 관리자/이전 부여를 덮어쓰고 강등도 확실히 반영한다. (별도 노드 의존 없음)
export async function setUserRole(uid, role) {
  if(!state.isMaster) return { ok:false, msg:"마스터 권한이 필요합니다." };
  if(!["master","admin","user"].includes(role)) return { ok:false, msg:"잘못된 역할입니다." };
  try {
    await update(ref(state.db, `users/${uid}`), { role, roleSet: true });
    return { ok:true };
  } catch(err) {
    return { ok:false, msg:"역할 변경 중 오류가 발생했습니다. (규칙 설정을 확인하세요)" };
  }
}

// 이메일로 권한 부여 (아직 로그인 안 한 사람도 가능)
export async function grantRoleByEmail(email, role) {
  if(!state.isMaster) return { ok:false, msg:"마스터 권한이 필요합니다." };
  const e = (email||"").trim().toLowerCase();
  if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) return { ok:false, msg:"올바른 이메일을 입력해 주세요." };
  if(!["admin","master"].includes(role)) return { ok:false, msg:"부여할 권한을 선택해 주세요." };
  try {
    await set(ref(state.db, `roleGrants/${emailKey(e)}`), { email: e, role,
      grantedBy: state.currentUser?.email || "", grantedAt: new Date().toLocaleString("ko-KR") });
    return { ok:true };
  } catch(err) {
    return { ok:false, msg:"권한 부여 중 오류가 발생했습니다. (규칙 설정을 확인하세요)" };
  }
}

// 이메일 권한부여 회수
export async function revokeGrant(key) {
  if(!state.isMaster) return;
  try { await remove(ref(state.db, `roleGrants/${key}`)); } catch(e) {}
}

// 수신자 이름/번호 수정
export async function updateRecipientField(id, field, value) {
  if(!state.isMaster) return;
  const v = field === "phone" ? norm(value) : (value||"").trim();
  if(!v) return;
  try { await update(ref(state.db, `recipients/${id}`), { [field]: v }); } catch(e) {}
}

// 사용자 전화번호 저장 (문자 수신자로 등록하려면 필요)
export async function setUserPhone(uid, phone) {
  if(!state.isMaster) return;
  try { await update(ref(state.db, `users/${uid}`), { phone: norm(phone) }); } catch(e) {}
}

// 문자 수신자 추가 (sites: 사업장 배열 — 빈 배열이면 전체 / levels: {1,2,3})
export async function addRecipient(name, phone, sites, levels, uid) {
  if(!state.isMaster) return { ok:false, msg:"마스터 권한이 필요합니다." };
  const n = (name||"").trim();
  const p = norm(phone);
  const lv = levels || { "1":true, "2":true, "3":true };
  if(!n)            return { ok:false, msg:"수신자 이름을 입력해 주세요." };
  if(p.length < 10) return { ok:false, msg:"올바른 휴대폰 번호를 입력해 주세요." };
  if(!lv["1"] && !lv["2"] && !lv["3"]) return { ok:false, msg:"수신 긴급도를 하나 이상 선택해 주세요." };
  // 같은 번호가 이미 있으면 중복 추가 방지
  if(Object.values(state.recipients||{}).some(r => norm(r.phone) === p))
    return { ok:false, msg:"이미 등록된 번호입니다." };
  try {
    await push(ref(state.db, "recipients"), {
      name: n, phone: p,
      sites: Array.isArray(sites) ? sites : [],
      levels: { "1": !!lv["1"], "2": !!lv["2"], "3": !!lv["3"] },
      active: true,
      uid: uid || "",
      createdAt: new Date().toLocaleString("ko-KR")
    });
    return { ok:true };
  } catch(err) {
    return { ok:false, msg:"수신자 추가 중 오류가 발생했습니다." };
  }
}

// 번호로 수신자 제거 (가입자 리스트의 '수신 해제'용)
export async function removeRecipientByPhone(phone) {
  if(!state.isMaster) return;
  const p = norm(phone);
  const found = Object.entries(state.recipients||{}).find(([,r]) => norm(r.phone) === p);
  if(found){ try { await remove(ref(state.db, `recipients/${found[0]}`)); } catch(e) {} }
}

// 수신자의 사업장 토글 (포함↔제외)
export async function toggleRecipientSite(id, site) {
  if(!state.isMaster) return;
  const r = state.recipients[id]; if(!r) return;
  let sites = Array.isArray(r.sites) ? r.sites.slice() : [];
  if(sites.includes(site)) sites = sites.filter(s => s !== site);
  else sites.push(site);
  try { await update(ref(state.db, `recipients/${id}`), { sites }); } catch(e) {}
}

// 수신자의 긴급도 토글
export async function toggleRecipientLevel(id, lvl) {
  if(!state.isMaster) return;
  const r = state.recipients[id]; if(!r) return;
  const levels = Object.assign({ "1":true, "2":true, "3":true }, r.levels || {});
  levels[lvl] = levels[lvl] === false ? true : false;
  if(!levels["1"] && !levels["2"] && !levels["3"]) return; // 최소 1개 유지
  try { await update(ref(state.db, `recipients/${id}`), { levels }); } catch(e) {}
}

// 발송 on/off
export async function toggleRecipient(id, active) {
  if(!state.isMaster) return;
  try { await update(ref(state.db, `recipients/${id}`), { active: !!active }); } catch(e) {}
}

// 수신자 삭제
export async function deleteRecipient(id) {
  if(!state.isMaster) return;
  try { await remove(ref(state.db, `recipients/${id}`)); } catch(e) {}
}
