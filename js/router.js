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

export function render() {
  if(!state.form) state.form = makeEmptyForm();
  const app = document.getElementById("app");
  if(!app) return;

  // 앞으로 이동할 때마다 히스토리 항목을 쌓아, 뒤로가기가 앱을 닫지 않고 이전 화면으로 돌아가게 한다.
  // 단, 루트 화면(login/main 등)은 항목을 쌓지 않고 교체해서 히스토리가 중복으로 불어나지 않게 한다.
  if(!_fromPopstate){
    const cur = history.state;
    if(!cur || cur.view === undefined){
      history.replaceState({ view: state.view }, "");
    } else if(cur.view !== state.view){
      if(VIEW_ROOT.has(state.view)){
        history.replaceState({ view: state.view }, "");
      } else {
        history.pushState({ view: state.view }, "");
      }
    }
  }

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

  window.scrollTo(0, 0);
}

// Back navigation
window.addEventListener("popstate", (e) => {
  _fromPopstate = true;
  if(e.state && e.state.view){
    // 쌓아둔 히스토리 항목으로 직접 복원
    state.view = e.state.view;
    render();
  } else {
    // 항목이 없으면(최초 진입 등) 매핑 기반 폴백
    const back = VIEW_BACK.get(state.view);
    if(back){
      state.view = back;
      render();
    }
  }
  _fromPopstate = false;
});

// Custom event trigger from admin.js
window.addEventListener("app:render", render);
