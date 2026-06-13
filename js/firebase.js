import { firebaseConfig, CONFIGURED, ADMIN_EMAILS } from "./config.js";
import { state } from "./state.js";
import { render } from "./router.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import {
  getAuth, onAuthStateChanged, setPersistence, browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

let _unsubEntries = null;
let _unsubSuggestions = null;
let _unsubRisk = null;

function _stopListeners() {
  if(_unsubEntries){ _unsubEntries(); _unsubEntries = null; }
  if(_unsubSuggestions){ _unsubSuggestions(); _unsubSuggestions = null; }
  if(_unsubRisk){ _unsubRisk(); _unsubRisk = null; }
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
      state.view = "main";
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
    if(state.view === "risk") render();
  }, err => {
    console.error("riskAssessments 읽기 실패:", err.message);
    state.riskAssessments = {};
  });
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

  onAuthStateChanged(state.auth, user => {
    if(user){
      state.currentUser = user;
      state.isAdmin     = ADMIN_EMAILS.includes(user.email);
      state.isGuest     = false;

      if(state.view==="login"||state.view==="register"){
        const appEl = document.getElementById("app");
        if(appEl) appEl.innerHTML = '<div class="loading-bar">데이터 불러오는 중...</div>';
      }

      _startListeners();
    } else {
      state.currentUser = null;
      state.isAdmin     = false;
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
