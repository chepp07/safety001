import { firebaseConfig, CONFIGURED, ADMIN_EMAILS, MASTER_EMAILS, emailKey } from "./config.js";
import { state } from "./state.js";
import { render, restoreNavState } from "./router.js";

// 새로고침 시 복원할 화면 (sessionStorage에 저장된 nav). 로그인 필요한 화면만 대상.
const _RESTORE_VIEWS = ["main","admin","risk","manual","suggest","myreport","form"];
function _loadPendingNav() {
  try {
    const saved = JSON.parse(sessionStorage.getItem("nav") || "null");
    if(saved && _RESTORE_VIEWS.includes(saved.view)) window._pendingNav = saved;
  } catch(e) {}
}
// 보류된 복원 적용 — report류는 데이터가 와야 완전 복원되므로 미도착 시 보류 유지
function _applyPendingNav() {
  const nav = window._pendingNav;
  if(!nav) return false;
  restoreNavState(nav);
  const needsData = nav.view==="risk" && ["report","nmReport","edudoc"].includes(nav.riskMode||"");
  if(needsData && !((state.riskAssessments||{})[nav.currentKey])) return true; // 아직 보류
  window._pendingNav = null;
  return true;
}
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, onValue, get, update } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// 현재 사용자의 역할 계산 — 우선순위: 시드 마스터 > 마스터 지정값(roleGrants, 강등 포함) > 레거시 > DB역할
// roleGrants는 마스터가 명시 지정한 '권위 있는' 값이라, 레거시 관리자라도 'user'로 지정하면 강등이 적용된다.
function _computeRole(email, dbRole) {
  if(MASTER_EMAILS.includes(email)) return "master";
  const g  = state.roleGrants && state.roleGrants[emailKey(email)];
  const gr = g && (g.role || g);
  if(gr) return gr;                                  // 마스터가 지정한 값(최우선, 강등 포함)
  if(ADMIN_EMAILS.includes(email)) return "admin";   // 레거시(미지정 시에만)
  if(dbRole) return dbRole;
  return "user";
}
function _applyRole(email, dbRole) {
  state.myRole  = _computeRole(email, dbRole);
  state.isMaster = state.myRole === "master";
  state.isAdmin  = state.isMaster || state.myRole === "admin";
}

// 가입자 정보를 users/{uid}에 기록 (역할은 보존, 시드/레거시는 자동 부여)
async function _ensureUserRecord(user) {
  const uref = ref(state.db, `users/${user.uid}`);
  let existing = {};
  try { existing = (await get(uref)).val() || {}; } catch(e) {}
  // 보안: 사용자가 스스로 역할을 올리지 못하도록, 시드 마스터 외에는 기존 역할만 보존(없으면 user)
  // 레거시 관리자(ADMIN_EMAILS)는 _applyRole의 폴백으로 관리자 권한을 받고, 마스터가 화면에서 정식 부여 가능
  const seedRole = MASTER_EMAILS.includes(user.email)
    ? "master"
    : (existing.role || "user");
  // 구글 가입자는 별명이 들어오므로 실명(realName)은 비워두고 메인에서 등록받음.
  // 이메일 가입자는 가입 시 입력한 이름을 실명으로 간주.
  const isGoogle = (user.providerData||[]).some(p => p.providerId === "google.com");
  const realName = existing.realName || (isGoogle ? "" : (user.displayName || ""));
  const name = existing.realName || existing.name || user.displayName || (user.email||"").split("@")[0];
  const now = new Date().toLocaleString("ko-KR");
  try {
    await update(uref, {
      email: user.email,
      name,
      realName,
      role: seedRole,
      createdAt: existing.createdAt || now,
      lastLogin: now
    });
  } catch(e) { /* 규칙 미설정 등으로 실패해도 로그인 흐름은 유지 */ }
}
import {
  getAuth, onAuthStateChanged, setPersistence, browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

let _unsubEntries = null;
let _unsubSuggestions = null;
let _unsubRisk = null;
let _unsubMe = null;
let _unsubGrants = null;
let _unsubUsers = null;
let _unsubRecipients = null;
let _masterAttached = false;

function _stopListeners() {
  if(_unsubEntries){ _unsubEntries(); _unsubEntries = null; }
  if(_unsubSuggestions){ _unsubSuggestions(); _unsubSuggestions = null; }
  if(_unsubRisk){ _unsubRisk(); _unsubRisk = null; }
  if(_unsubMe){ _unsubMe(); _unsubMe = null; }
  if(_unsubGrants){ _unsubGrants(); _unsubGrants = null; }
  if(_unsubUsers){ _unsubUsers(); _unsubUsers = null; }
  if(_unsubRecipients){ _unsubRecipients(); _unsubRecipients = null; }
  _masterAttached = false;
}

// 마스터가 되면 가입자/수신자 전체 리스너를 1회 부착
function _maybeAttachMaster() {
  if(!state.isMaster || _masterAttached) return;
  _masterAttached = true;
  _unsubUsers = onValue(ref(state.db, "users"), s => {
    state.users = s.val() || {};
    if(state.view === "admin") render();
  }, err => { console.error("users 읽기 실패:", err.message); state.users = {}; });
  _unsubRecipients = onValue(ref(state.db, "recipients"), s => {
    state.recipients = s.val() || {};
    if(state.view === "admin") render();
  }, err => { console.error("recipients 읽기 실패:", err.message); state.recipients = {}; });
}

function _startListeners() {
  _stopListeners();
  let _entriesReady = false;
  let _suggestionsReady = false;

  function _tryRender() {
    if(!_entriesReady || !_suggestionsReady) return;

    if(window._pendingAccNo){
      const found = Object.entries(state.entries).find(([,e]) => e.accNo === window._pendingAccNo);
      if(found){
        state.view = "accdetail";
        window._accDetailKey = found[0];
        window._pendingAccNo = null;
      } else if(state.view==="login"||state.view==="register"){
        state.view = "main";
      }
    } else if(state.view==="login"||state.view==="register"){
      // 새로고침 복원: 저장된 화면이 있으면 그쪽으로, 없으면 메인
      if(window._pendingNav) _applyPendingNav();
      else state.view = "main";
    }

    render();
  }

  _unsubEntries = onValue(ref(state.db, "accidents"), snapshot => {
    state.entries = snapshot.val() || {};
    _entriesReady = true;
    _tryRender();
  }, err => {
    console.error("accidents 읽기 실패:", err.message);
    state.entries = {};
    state.loadError = err.message;
    _entriesReady = true;   // 실패해도 화면이 멈추지 않도록 진행
    _tryRender();
  });

  _unsubSuggestions = onValue(ref(state.db, "suggestions"), snap => {
    state.suggestions = snap.val() || {};
    _suggestionsReady = true;
    _tryRender();
  }, err => {
    console.error("suggestions 읽기 실패:", err.message);
    state.suggestions = {};
    state.loadError = err.message;
    _suggestionsReady = true;
    _tryRender();
  });

  // 수시 위험성평가 — 초기 렌더 게이팅과 무관한 독립 리스너
  _unsubRisk = onValue(ref(state.db, "riskAssessments"), snap => {
    state.riskAssessments = snap.val() || {};
    // 새로고침으로 보고서 화면 복원이 보류 중이었다면, 데이터 도착 시 적용
    if(window._pendingNav && window._pendingNav.view === "risk"){ _applyPendingNav(); render(); }
    else if(state.view === "risk") render();
  }, err => {
    console.error("riskAssessments 읽기 실패:", err.message);
    state.riskAssessments = {};
  });

  // 내 역할(role) + 이메일 권한부여(roleGrants) 실시간 반영
  const _user = state.currentUser;
  if(_user){
    _unsubMe = onValue(ref(state.db, `users/${_user.uid}`), snap => {
      const me = snap.val() || {};
      state.myDbRole   = me.role || "";
      state.myPhone    = me.phone || "";
      state.myRealName = me.realName || "";
      _applyRole(_user.email, state.myDbRole);
      _maybeAttachMaster();
      render();
    }, err => {
      console.error("내 역할 읽기 실패:", err.message);
    });

    _unsubGrants = onValue(ref(state.db, "roleGrants"), snap => {
      state.roleGrants = snap.val() || {};
      _applyRole(_user.email, state.myDbRole);
      _maybeAttachMaster();
      render();
    }, err => {
      console.error("roleGrants 읽기 실패:", err.message);
      state.roleGrants = {};
    });
  }
}

export function initFirebase() {
  if(!CONFIGURED){
    state.view = "login";
    render();
    return;
  }

  const app  = initializeApp(firebaseConfig);
  state.db   = getDatabase(app);
  state.auth = getAuth(app);

  setPersistence(state.auth, browserLocalPersistence).catch(e => console.warn("persistence:", e));

  // URL 파라미터 보존
  const urlParams = new URLSearchParams(window.location.search);
  const accParam  = urlParams.get("a") || urlParams.get("acc");
  if(accParam) window._pendingAccNo = accParam;

  // 사고 알림 링크(?a=)가 아니면, 새로고침 전 화면 복원 대상을 불러온다
  if(!accParam) _loadPendingNav();

  onAuthStateChanged(state.auth, user => {
    if(user){
      state.currentUser = user;
      _applyRole(user.email, null);   // 즉시 적용할 baseline (시드/레거시 기준)
      state.isGuest     = false;

      if(state.view==="login"||state.view==="register"){
        const appEl = document.getElementById("app");
        if(appEl) appEl.innerHTML = '<div class="loading-bar">데이터 불러오는 중...</div>';
      }

      _ensureUserRecord(user);   // 가입자 기록 업서트 (역할 리스너가 이어서 정확히 반영)
      _startListeners();
    } else {
      state.currentUser = null;
      state.isAdmin     = false;
      state.isMaster    = false;
      state.myRole      = "user";
      state.myDbRole    = "";
      state.myPhone     = "";
      state.myRealName  = "";
      state.roleGrants  = {};
      _stopListeners();

      if(!state.isGuest){
        if(window._pendingAccNo){
          onValue(ref(state.db, "accidents"), snapshot => {
            state.entries = snapshot.val() || {};
            const found = Object.entries(state.entries).find(([,e]) => e.accNo === window._pendingAccNo);
            if(found){
              state.view = "accdetail";
              window._accDetailKey = found[0];
              window._pendingAccNo = null;
            } else {
              state.view = "login";
            }
            render();
          });
        } else {
          state.view = "login";
          render();
        }
      }
    }
  });
}
