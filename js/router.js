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

const VIEW_ROOT = new Set(["login", "register", "main"]);
const VIEW_BACK = new Map([
  ["form",      "main"],
  ["manual",    "main"],
  ["suggest",   "main"],
  ["myreport",  "form"],
  ["success",   "form"],
  ["admin",     "main"],
  ["accdetail", "login"],
]);

export function render() {
  if(!state.form) state.form = makeEmptyForm();
  const app = document.getElementById("app");
  if(!app) return;

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
    default:          html = renderLogin();
  }

  app.innerHTML = html;

  // lazy import events to avoid circular dep at module load time
  import("./events.js").then(m => m.bindEvents());

  window.scrollTo(0, 0);
}

// Back navigation
window.addEventListener("popstate", () => {
  const back = VIEW_BACK.get(state.view);
  if(back){
    state.view = back;
    render();
  }
});

// Custom event trigger from admin.js
window.addEventListener("app:render", render);
