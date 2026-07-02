import { state } from "./state.js";
import { makeEmptyForm } from "./utils.js";
import { initFirebase } from "./firebase.js";

// 폼 초기화
state.form = makeEmptyForm();

// Firebase 초기화 → auth 상태 감지 → render() 호출
initFirebase();

// Service Worker 등록 + 새 버전 자동 반영
if("serviceWorker" in navigator){
  // 재방문(이미 SW가 제어 중) 상태에서 새 버전이 활성화되면 자동 새로고침 → 수동 캐시 삭제 불필요
  let _swReloaded = false;
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if(_swReloaded || !hadController) return;   // 최초 방문 시의 컨트롤러 획득은 새로고침 제외
    _swReloaded = true;
    window.location.reload();
  });

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js")
      .then(reg => {
        if(reg.update) reg.update();   // 접속 시 업데이트 확인
        console.log("SW 등록:", reg.scope);
      })
      .catch(err => console.warn("SW 실패:", err));
  });
}
