// 마스터 관리 — 가입자/권한/문자 수신자 관리 (마스터 전용)
import { state } from "../state.js";
import { ref, update, push, remove } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

export const ROLE_LABEL = { master:"마스터", admin:"관리자", user:"일반" };

// 사용자 역할 변경
export async function setUserRole(uid, role) {
  if(!state.isMaster) return { ok:false, msg:"마스터 권한이 필요합니다." };
  if(!["master","admin","user"].includes(role)) return { ok:false, msg:"잘못된 역할입니다." };
  try {
    await update(ref(state.db, `users/${uid}`), { role });
    return { ok:true };
  } catch(err) {
    return { ok:false, msg:"역할 변경 중 오류가 발생했습니다. (규칙 설정을 확인하세요)" };
  }
}

// 문자 수신자 추가
// scope: "" = 공통(전체 사업소), 또는 특정 사업소명 / levels: {1,2,3} 수신 긴급도
export async function addRecipient(name, phone, scope, levels) {
  if(!state.isMaster) return { ok:false, msg:"마스터 권한이 필요합니다." };
  const n = (name||"").trim();
  const p = (phone||"").replace(/[^0-9]/g, "");
  const lv = levels || { "1":true, "2":true, "3":true };
  if(!n)            return { ok:false, msg:"수신자 이름을 입력해 주세요." };
  if(p.length < 10) return { ok:false, msg:"올바른 휴대폰 번호를 입력해 주세요." };
  if(!lv["1"] && !lv["2"] && !lv["3"]) return { ok:false, msg:"수신 긴급도를 하나 이상 선택해 주세요." };
  try {
    await push(ref(state.db, "recipients"), {
      name: n, phone: p,
      scope: scope || "",
      levels: { "1": !!lv["1"], "2": !!lv["2"], "3": !!lv["3"] },
      active: true,
      createdAt: new Date().toLocaleString("ko-KR")
    });
    return { ok:true };
  } catch(err) {
    return { ok:false, msg:"수신자 추가 중 오류가 발생했습니다." };
  }
}

// 문자 수신자 발송 on/off
export async function toggleRecipient(id, active) {
  if(!state.isMaster) return;
  try { await update(ref(state.db, `recipients/${id}`), { active: !!active }); } catch(e) {}
}

// 문자 수신자 삭제
export async function deleteRecipient(id) {
  if(!state.isMaster) return;
  try { await remove(ref(state.db, `recipients/${id}`)); } catch(e) {}
}
