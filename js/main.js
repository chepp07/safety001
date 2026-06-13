import { state } from "./state.js";
import { makeEmptyForm } from "./utils.js";
import { initFirebase } from "./firebase.js";

// 폼 초기화
state.form = makeEmptyForm();

// Firebase 초기화 → auth 상태 감지 → render() 호출
initFirebase();

// Service Worker 등록
if("serviceWorker" in navigator){
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js")
      .then(reg => console.log("SW 등록:", reg.scope))
      .catch(err => console.warn("SW 실패:", err));
  });
}
