// 앱 전체에서 공유하는 가변 상태
// 모든 모듈이 이 객체를 import해서 직접 읽고 씁니다.
export const state = {
  // Firebase
  db: null,
  auth: null,
  entriesRef: null,

  // DB 데이터
  entries: {},
  suggestions: {},
  riskAssessments: {},

  // UI 상태
  adminTab: "accidents",   // "accidents" | "suggestions"
  view: "login",

  // 수시 위험성평가
  // mode: "list" | "editor" | "report" | "edu" | "edudoc"
  risk: { mode: "list", draft: null, current: null, currentKey: null, eduDraft: null },

  // 폼 상태
  saving: false,
  submitted: null,
  form: null,              // makeEmptyForm()으로 초기화됨 (main.js에서)
  errors: {},
  filter: { accType: "전체", level: "전체", search: "" },

  // 사용자
  currentUser: null,
  isAdmin: false,
  isGuest: false,

  // 내 접수 조회
  myReportPhone: "",
  myReportSelected: null,

  // 언어
  lang: localStorage.getItem("accLang") || "ko",
};
