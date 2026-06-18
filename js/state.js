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
  users: {},               // 가입자 목록 (마스터 전용)
  recipients: {},          // 문자 수신자 목록 (마스터 전용)
  roleGrants: {},          // 이메일 기반 권한 부여 (미접속자 사전 부여 포함)

  // UI 상태
  adminTab: "accidents",   // "accidents" | "suggestions" | "master"
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
  isMaster: false,
  myRole: "user",          // "master" | "admin" | "user" (effective)
  myDbRole: "",            // users/{uid}.role 원본 값 (grant와 합산 전)
  myPhone: "",             // 내 등록 번호 (없으면 메인에서 등록 안내)
  myRealName: "",          // 내 실명 (구글 별명이 아닌 등록 실명. 없으면 메인에서 등록 안내)
  isGuest: false,

  // 내 접수 조회
  myReportPhone: "",
  myReportSelected: null,

  // 언어
  lang: localStorage.getItem("accLang") || "ko",
};
