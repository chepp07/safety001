// 수시 위험성평가 (Occasional Risk Assessment)
// 산업안전보건법 제36조 / 시행규칙 제37조 — 빈도·강도법
import { state } from "../state.js";
import { ref, push, update, remove } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// ── 평가 척도 (빈도·강도법) ──
export const LIKELIHOOD = [
  { v:1, l:"1 · 최하 (거의 발생 안 함)" },
  { v:2, l:"2 · 하 (드물게 발생)" },
  { v:3, l:"3 · 중 (가끔 발생)" },
  { v:4, l:"4 · 상 (자주 발생)" },
  { v:5, l:"5 · 최상 (빈번히 발생)" },
];
export const SEVERITY = [
  { v:1, l:"1 · 소 (경미·응급처치)" },
  { v:2, l:"2 · 중 (경상·통원치료)" },
  { v:3, l:"3 · 대 (휴업재해)" },
  { v:4, l:"4 · 최대 (사망·중대재해)" },
];

// 수시 위험성평가 실시 사유 (법정 trigger)
export const RA_REASONS = [
  "산업재해(사고) 발생",
  "중대산업사고·중대재해 발생",
  "작업방법 또는 작업절차의 변경",
  "기계·기구·설비·원재료의 신규 도입 또는 변경",
  "건설물·설비 등의 정비·보수",
  "그 밖에 사업주가 필요하다고 판단한 경우",
];

// 위험성 점수 = 가능성 × 중대성 (1~20)
export function riskScore(h) {
  return (Number(h.likelihood)||0) * (Number(h.severity)||0);
}
export function resRiskScore(h) {
  return (Number(h.resLikelihood)||0) * (Number(h.resSeverity)||0);
}

// 위험성 등급 (4단계)
export function riskLevel(score) {
  if(!score || score <= 0) return { label:"-",       color:"#999",    bg:"#f5f5f5", border:"#ddd",    action:"평가 필요" };
  if(score <= 4)           return { label:"낮음",     color:"#2e7d32", bg:"#f0faf0", border:"#b8e0ba", action:"현 수준 유지·관리" };
  if(score <= 9)           return { label:"보통",     color:"#b88600", bg:"#fffaf0", border:"#fce8b8", action:"개선 권고" };
  if(score <= 15)          return { label:"높음",     color:"#e65100", bg:"#fff8f0", border:"#fcd8a8", action:"조속한 개선 필요" };
  return                          { label:"매우 높음", color:"#b71c1c", bg:"#fff5f5", border:"#f5c6c6", action:"즉시 개선·작업중지 검토" };
}

export function makeEmptyHazard() {
  return {
    hazard:"", cause:"", currentMeasure:"",
    likelihood:3, severity:2,
    reduction:"", resLikelihood:1, resSeverity:1,
    owner:"", dueDate:"", done:false
  };
}

export function makeEmptyRA() {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
  const me = state.currentUser ? (state.currentUser.displayName || state.currentUser.email.split("@")[0]) : "";
  return {
    raNo:"", accNo:"", accSnapshot:null,
    site:"", assessDate: today, assessor: me, participants:"",
    method:"빈도·강도법", reason: RA_REASONS[0], targetWork:"",
    hazards:[ makeEmptyHazard() ],
    photos:[], photosPreviews:[],
    conclusion:"", status:"작성중"
  };
}

// 평가번호 RA-YYYYMMDD-###
export function genRaNo() {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}`;
  const cnt = Object.values(state.riskAssessments||{}).filter(r => r.raNo && r.raNo.startsWith("RA-"+ymd)).length;
  return `RA-${ymd}-${String(cnt+1).padStart(3,"0")}`;
}

// 기존 사고 불러오기 → 평가 초안 자동 채움
export function loadFromAccident(key) {
  const e = state.entries[key];
  const d = state.risk.draft;
  if(!e || !d) return;
  d.accNo = e.accNo || "";
  d.accSnapshot = {
    accNo: e.accNo||"", site: e.site||"", accType: e.accType||"", accDetail: e.accDetail||"",
    level: e.level||"", location: e.location||"", situation: e.situation||"",
    accDateTime: e.accDateTime||"", lineStop: e.lineStop||"", actionTaken: e.actionTaken||"",
    photos: Array.isArray(e.photos) ? e.photos.filter(Boolean) : []
  };
  d.site = e.site || d.site;
  d.targetWork = e.location || d.targetWork;
  // 첫 위험요인이 비어 있으면 사고 내용으로 시드
  const h0 = d.hazards[0];
  if(h0 && !h0.hazard.trim()){
    h0.hazard = [e.accType, e.accDetail].filter(Boolean).join(" - ");
    h0.cause  = e.situation || "";
    h0.currentMeasure = e.actionTaken && e.actionTaken!=="없음" ? e.actionTaken : "";
    // 사고 긴급도 → 중대성 초기값 추정
    h0.severity = e.level==="1" ? 4 : e.level==="2" ? 3 : 2;
  }
  // 사고 첨부사진을 평가 사진으로 가져오기 (최대 3장)
  if(d.accSnapshot.photos.length && d.photos.length===0){
    d.accSnapshot.photos.slice(0,3).forEach(u => { d.photos.push(u); d.photosPreviews.push(u); });
  }
}

// 저장 (임시저장 또는 완료)
export async function saveRA(complete) {
  const d = state.risk.draft;
  if(!d) return { ok:false, msg:"평가 데이터가 없습니다." };

  // 완료 시 필수 검증
  if(complete){
    if(!d.site.trim())     return { ok:false, msg:"사업소를 입력해 주세요." };
    if(!d.assessor.trim()) return { ok:false, msg:"평가자를 입력해 주세요." };
    if(!d.targetWork.trim()) return { ok:false, msg:"평가 대상 작업/공정을 입력해 주세요." };
    const valid = d.hazards.filter(h => h.hazard.trim());
    if(valid.length===0)   return { ok:false, msg:"유해·위험요인을 최소 1개 이상 입력해 주세요." };
    const noPlan = valid.find(h => riskScore(h) >= 10 && !h.reduction.trim());
    if(noPlan)             return { ok:false, msg:`위험성이 '높음' 이상인 요인('${noPlan.hazard}')은 감소대책을 반드시 입력해야 합니다.` };
  }

  const now = new Date().toLocaleString("ko-KR");
  const payload = {
    raNo: d.raNo || genRaNo(),
    accNo: d.accNo || "",
    accSnapshot: d.accSnapshot || null,
    site: d.site.trim(),
    assessDate: d.assessDate,
    assessor: d.assessor.trim(),
    participants: d.participants.trim(),
    method: d.method,
    reason: d.reason,
    targetWork: d.targetWork.trim(),
    hazards: d.hazards.filter(h => h.hazard.trim()).map(h => ({
      hazard:h.hazard.trim(), cause:h.cause.trim(), currentMeasure:h.currentMeasure.trim(),
      likelihood:Number(h.likelihood), severity:Number(h.severity),
      reduction:h.reduction.trim(),
      resLikelihood:Number(h.resLikelihood), resSeverity:Number(h.resSeverity),
      owner:h.owner.trim(), dueDate:h.dueDate, done:!!h.done
    })),
    photos: d.photos.filter(p => p && p !== "uploading"),
    conclusion: d.conclusion.trim(),
    status: complete ? "완료" : "작성중",
    createdAt: d.createdAt || now,
    createdBy: d.createdBy || state.currentUser?.email || "",
  };
  if(complete) payload.completedAt = d.completedAt || now;

  try {
    if(d._key){
      await update(ref(state.db, `riskAssessments/${d._key}`), payload);
    } else {
      const r = await push(ref(state.db, "riskAssessments"), payload);
      d._key = r.key;
    }
    d.raNo = payload.raNo;
    d.createdAt = payload.createdAt;
    return { ok:true, key:d._key, data: payload };
  } catch(err) {
    return { ok:false, msg:"저장 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." };
  }
}

export async function deleteRA(key) {
  try { await remove(ref(state.db, `riskAssessments/${key}`)); } catch(e) {}
}

// 작성중 평가를 편집기로 불러오기
export function loadDraftFromSaved(key) {
  const saved = state.riskAssessments[key];
  if(!saved) return;
  const d = {
    ...makeEmptyRA(),
    ...JSON.parse(JSON.stringify(saved)),
    _key: key,
    photosPreviews: Array.isArray(saved.photos) ? [...saved.photos] : []
  };
  if(!Array.isArray(d.hazards) || d.hazards.length===0) d.hazards = [ makeEmptyHazard() ];
  if(!Array.isArray(d.photos)) d.photos = [];
  state.risk.draft = d;
}

// ───────────────────────── 특별안전교육 (산업안전보건법 제29조) ─────────────────────────
export const EDU_METHODS = ["집체교육", "현장교육", "비대면(온라인)교육"];

export function makeEmptyAttendee() {
  return { name:"", dept:"", note:"" };
}

export function makeEmptyEducation(ra) {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
  const me = state.currentUser ? (state.currentUser.displayName || state.currentUser.email.split("@")[0]) : "";
  const name = [ra?.accNo, ra?.site].filter(Boolean).join(" ");
  return {
    eduName: (name ? name + " 사고 관련 특별안전교육" : "특별안전교육").trim(),
    eduDate: today, startTime:"", endTime:"", duration:"1",
    place: ra?.site || "", method: EDU_METHODS[0],
    instructor: me, instructorOrg:"", targetDept: ra?.targetWork || "",
    objective: "사고 발생 원인과 위험성평가 결과를 공유하고, 동종·유사 재해의 재발을 방지한다.",
    extraContent: "",
    attendees: [ makeEmptyAttendee(), makeEmptyAttendee(), makeEmptyAttendee() ],
    createdAt: ""
  };
}

// 교육 정보를 해당 위험성평가 레코드 하위(education)에 저장
export async function saveEducation() {
  const key = state.risk.currentKey;
  const ed  = state.risk.eduDraft;
  if(!key || !ed) return { ok:false, msg:"대상 평가를 찾을 수 없습니다." };
  if(!ed.eduName.trim())    return { ok:false, msg:"교육명을 입력해 주세요." };
  if(!ed.instructor.trim()) return { ok:false, msg:"강사(교육자)를 입력해 주세요." };
  const named = ed.attendees.filter(a => a.name.trim());
  if(named.length === 0)    return { ok:false, msg:"참석자를 최소 1명 이상 입력해 주세요." };

  const payload = {
    eduName: ed.eduName.trim(), eduDate: ed.eduDate,
    startTime: ed.startTime, endTime: ed.endTime, duration: ed.duration,
    place: ed.place.trim(), method: ed.method,
    instructor: ed.instructor.trim(), instructorOrg: ed.instructorOrg.trim(),
    targetDept: ed.targetDept.trim(), objective: ed.objective.trim(),
    extraContent: ed.extraContent.trim(),
    attendees: named.map(a => ({ name:a.name.trim(), dept:a.dept.trim(), note:a.note.trim() })),
    createdAt: ed.createdAt || new Date().toLocaleString("ko-KR")
  };

  try {
    await update(ref(state.db, `riskAssessments/${key}/education`), payload);
    if(state.risk.current) state.risk.current.education = payload;
    ed.createdAt = payload.createdAt;
    return { ok:true, data: payload };
  } catch(err) {
    return { ok:false, msg:"저장 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." };
  }
}

// ───────────────────────── 아차사고 보고서 (Near-miss) ─────────────────────────
export const NM_CATEGORIES = ["인적(불안전한 행동)", "설비·기계", "작업방법·절차", "작업환경", "기타"];

export function makeEmptyNearMiss() {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
  const me = state.currentUser ? (state.currentUser.displayName || state.currentUser.email.split("@")[0]) : "";
  return {
    docType: "nearmiss",
    nmNo:"", site:"", occurredAt: today, location:"", reporter: me,
    category: NM_CATEGORIES[0],
    description:"", potentialRisk:"",
    likelihood:3, severity:2,
    immediateAction:"", preventiveMeasure:"",
    photos:[], photosPreviews:[],
    status:"작성중"
  };
}

// 아차사고 번호 NM-YYYYMMDD-###
export function genNmNo() {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}`;
  const cnt = Object.values(state.riskAssessments||{}).filter(r => r.nmNo && r.nmNo.startsWith("NM-"+ymd)).length;
  return `NM-${ymd}-${String(cnt+1).padStart(3,"0")}`;
}

export function loadNmDraftFromSaved(key) {
  const saved = state.riskAssessments[key];
  if(!saved) return;
  const d = {
    ...makeEmptyNearMiss(),
    ...JSON.parse(JSON.stringify(saved)),
    _key: key,
    photosPreviews: Array.isArray(saved.photos) ? [...saved.photos] : []
  };
  if(!Array.isArray(d.photos)) d.photos = [];
  state.risk.draft = d;
}

export async function saveNearMiss(complete) {
  const d = state.risk.draft;
  if(!d) return { ok:false, msg:"보고서 데이터가 없습니다." };

  if(complete){
    if(!d.site.trim())            return { ok:false, msg:"사업소를 입력해 주세요." };
    if(!d.location.trim())        return { ok:false, msg:"발생 장소를 입력해 주세요." };
    if(!d.description.trim())     return { ok:false, msg:"아차사고 내용을 입력해 주세요." };
    if(!d.preventiveMeasure.trim()) return { ok:false, msg:"재발방지 대책을 입력해 주세요." };
  }

  const now = new Date().toLocaleString("ko-KR");
  const payload = {
    docType: "nearmiss",
    nmNo: d.nmNo || genNmNo(),
    site: d.site.trim(),
    occurredAt: d.occurredAt,
    location: d.location.trim(),
    reporter: d.reporter.trim(),
    category: d.category,
    description: d.description.trim(),
    potentialRisk: d.potentialRisk.trim(),
    likelihood: Number(d.likelihood),
    severity: Number(d.severity),
    immediateAction: d.immediateAction.trim(),
    preventiveMeasure: d.preventiveMeasure.trim(),
    photos: d.photos.filter(p => p && p !== "uploading"),
    status: complete ? "완료" : "작성중",
    createdAt: d.createdAt || now,
    createdBy: d.createdBy || state.currentUser?.email || "",
  };
  if(complete) payload.completedAt = d.completedAt || now;

  try {
    if(d._key){
      await update(ref(state.db, `riskAssessments/${d._key}`), payload);
    } else {
      const r = await push(ref(state.db, "riskAssessments"), payload);
      d._key = r.key;
    }
    d.nmNo = payload.nmNo;
    d.createdAt = payload.createdAt;
    return { ok:true, key:d._key, data: payload };
  } catch(err) {
    return { ok:false, msg:"저장 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." };
  }
}
