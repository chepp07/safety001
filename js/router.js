import { state } from "./state.js";
import { makeEmptyForm } from "./utils.js";
import { renderLogin, renderRegister, renderSetupGuide } from "./views/login.js";
import { renderMain } from "./views/main.js";
import { renderManual } from "./views/manual.js";
import { renderSuggest } from "./views/suggest.js";
import { renderForm } from "./views/form.js";
import { renderSuccess } from "./views/success.js";
import { renderMyReport, renderAccDetail } from "./views/myreport.js";
import { renderAdmin } from "./views/admin.js";
import { renderRisk } from "./views/risk.js";

const VIEW_ROOT = new Set(["login", "register", "main"]);
const VIEW_BACK = new Map([
  ["form",      "main"],
  ["manual",    "main"],
  ["suggest",   "main"],
  ["myreport",  "form"],
  ["success",   "form"],
  ["admin",     "main"],
  ["risk",      "main"],
  ["accdetail", "login"],
]);

// popstate(뒤로가기)로 인한 render인지 표시 — 이때는 히스토리를 다시 쌓지 않는다
let _fromPopstate = false;
let _lastSig = null;   // 화면(하위모드 포함) 전환 감지용

// 네비게이션 시그니처 — 화면 + (위험성평가) 하위모드 + 대상 키
function _navSig() {
  if(state.view === "risk") return "risk:" + (state.risk?.mode||"list") + ":" + (state.risk?.currentKey||"");
  return state.view;
}
function _navState() {
  return { view: state.view, riskMode: state.risk?.mode||null, currentKey: state.risk?.currentKey||null };
}

// 저장된 네비게이션 상태로 화면 복원 (뒤로가기 / 새로고침 공용)
export function restoreNavState(nav) {
  if(!nav) return;
  state.view = nav.view || "main";
  if(nav.view === "risk" && state.risk){
    const mode = nav.riskMode || "list";
    state.risk.currentKey = nav.currentKey || null;
    if(["report","nmReport","edudoc"].includes(mode)){
      const rec = (state.riskAssessments||{})[nav.currentKey];
      if(rec){ state.risk.current = rec; state.risk.mode = mode; }
      else { state.risk.mode = "list"; }              // 데이터 미도착 시 목록으로
    } else if(["editor","nmEditor","edu"].includes(mode)){
      state.risk.mode = state.risk.draft ? mode : "list";  // 초안은 메모리에만 → 없으면 목록
    } else {
      state.risk.mode = "list";
    }
  }
}

export function render() {
  if(!state.form) state.form = makeEmptyForm();
  const app = document.getElementById("app");
  if(!app) return;

  // 같은 화면을 다시 그릴 때(폼 버튼 클릭 등)는 스크롤 위치 유지, 화면(하위모드 포함)이 바뀔 때만 최상단으로.
  const sig = _navSig();
  const sigChanged = sig !== _lastSig;
  const prevScroll = window.scrollY;
  _lastSig = sig;

  // 앞으로 이동할 때마다 히스토리 항목을 쌓아 뒤로가기가 단계별로 동작하게 한다.
  // 루트 화면(login/register/main)은 항목을 쌓지 않고 교체.
  if(!_fromPopstate){
    const cur = history.state;
    if(!cur || cur.sig === undefined){
      history.replaceState({ sig, nav: _navState() }, "");
    } else if(cur.sig !== sig){
      if(VIEW_ROOT.has(state.view)){
        history.replaceState({ sig, nav: _navState() }, "");
      } else {
        history.pushState({ sig, nav: _navState() }, "");
      }
    }
  }

  // 새로고침 시 현재 화면 복원용으로 저장
  try { sessionStorage.setItem("nav", JSON.stringify(_navState())); } catch(e){}

  let html = "";
  switch(state.view){
    case "login":     html = renderLogin();    break;
    case "register":  html = renderRegister(); break;
    case "setup":     html = renderSetupGuide(); break;
    case "main":      html = renderMain();     break;
    case "form":      html = renderForm();     break;
    case "manual":    html = renderManual();   break;
    case "suggest":   html = renderSuggest();  break;
    case "success":   html = renderSuccess();  break;
    case "myreport":  html = renderMyReport(); break;
    case "accdetail": html = renderAccDetail(); break;
    case "admin":     html = renderAdmin();    break;
    case "risk":      html = renderRisk();     break;
    default:          html = renderLogin();
  }

  app.innerHTML = html;

  // lazy import events to avoid circular dep at module load time
  import("./events.js").then(m => m.bindEvents());

  // 화면(하위모드 포함) 전환 시에만 최상단으로, 같은 화면 재렌더 시엔 위치 유지
  if(sigChanged) window.scrollTo(0, 0);
  else window.scrollTo(0, prevScroll);
}

// Back navigation — 쌓아둔 nav 상태로 단계별 복원
window.addEventListener("popstate", (e) => {
  _fromPopstate = true;
  if(e.state && e.state.nav){
    restoreNavState(e.state.nav);
    render();
  } else {
    const back = VIEW_BACK.get(state.view);
    if(back){ state.view = back; render(); }
  }
  _fromPopstate = false;
});

// Custom event trigger from admin.js
window.addEventListener("app:render", render);
