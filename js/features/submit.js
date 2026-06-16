import { GAS_URL, T } from "../config.js";
import { state } from "../state.js";
import { genAccNo } from "../utils.js";
import { ref, push } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

export async function handleSubmit(renderFn) {
  // 중복 제출 방어: 이미 저장이 진행 중이면 즉시 무시 (1건이 여러 건으로 접수되는 문제 방지)
  if(state.saving) return;

  const { lang, form, errors } = state;

  const toKo = (val) => {
    if(lang !== "zh" || !val) return val;
    const typeMap = T.zh.accTypeMap || {};
    const detailMap = T.zh.accDetailKo || {};
    return typeMap[val] || detailMap[val] || val;
  };

  if(form.photos.includes("uploading")){
    state.errors = { submit: lang==="zh" ? "请等待照片上传完成。" : "사진 업로드가 완료될 때까지 기다려 주세요." };
    renderFn(); window.scrollTo(0,0); return;
  }

  const errs = {};
  if(!form.site)              errs.site = lang==="zh" ? "请选择事业所。" : "사업소를 선택해 주세요.";
  if(!form.reporter.trim())   errs.reporter = lang==="zh" ? "请输入报告人姓名。" : "접수자 성명을 입력해 주세요.";
  if(!form.rank)              errs.rank = lang==="zh" ? "请选择职级。" : "직급을 선택해 주세요.";
  if(!form.phone || form.phone.replace(/\D/g,"").length<10)
                              errs.phone = lang==="zh" ? "请输入联系电话。" : "연락처를 입력해 주세요.";
  if(!form.accYear||!form.accMonth||!form.accDay)
                              errs.accYear = "사고 발생 날짜를 선택해 주세요.";
  if(!form.accHour||!form.accMin)
                              errs.accHour = "사고 발생 시간을 선택해 주세요.";
  if(!form.location.trim())   errs.location = "사고 발생 위치를 입력해 주세요.";
  if(form.isComplex){
    if(form.accTypes.length===0)  errs.accType = "사고 유형을 하나 이상 선택해 주세요.";
    if(form.accDetails.length===0) errs.accDetail = "세부 유형을 하나 이상 선택해 주세요.";
  } else {
    if(!form.accType)   errs.accType = lang==="zh" ? "请选择事故类型。" : "사고 유형을 선택해 주세요.";
    if(!form.accDetail) errs.accDetail = lang==="zh" ? "请选择细分类型。" : "세부 유형을 선택해 주세요.";
  }
  if(!form.level)         errs.level = lang==="zh" ? "请选择紧急程度。" : "긴급도를 선택해 주세요.";
  if(!form.lineStop)      errs.lineStop = lang==="zh" ? "请选择停线情况。" : "라인중단 여부를 선택해 주세요.";
  if(!form.customerEffect) errs.customerEffect = "고객사 영향 여부를 선택해 주세요.";
  if(!form.situation.trim()) errs.situation = lang==="zh" ? "请填写当前状况。" : "현재 상황을 입력해 주세요.";
  if(form.checks.some(c=>!c)) errs.checks = "모든 확인 사항을 체크해 주세요.";

  const hasPersonalAcc = form.isComplex ? form.accTypes.includes("인사사고") : form.accType==="인사사고";
  if(hasPersonalAcc){
    if(!form.accidentType) errs.accidentType = "단독/쌍방 여부를 선택해 주세요.";
    const victimOk = form.victims.every(v=>v.unknown||v.name.trim());
    if(!victimOk) errs.victims = "피해자 성명을 입력하거나 '미확인'을 체크해 주세요.";
    if(form.accidentType==="쌍방사고"){
      const perpOk = form.perpetrators.every(p=>p.unknown||p.name.trim());
      if(!perpOk) errs.perpetrators = "가해자 성명을 입력하거나 '미확인'을 체크해 주세요.";
    }
  }

  if(Object.keys(errs).length){
    state.errors = errs;
    renderFn(); window.scrollTo(0,0); return;
  }

  state.saving = true; renderFn();

  const accNo = genAccNo();
  const entry = {
    accNo,
    site: form.site,
    reporter: form.reporter.trim(),
    rank: form.rank,
    phone: form.phone,
    accDateTime: `${form.accYear}년 ${form.accMonth}월 ${form.accDay}일 ${form.accAmPm} ${form.accHour}시 ${form.accMin}분`,
    location: form.location.trim(),
    isComplex: form.isComplex,
    accType:   toKo(form.isComplex ? form.accTypes.join(", ") : form.accType),
    accDetail: toKo(form.isComplex ? form.accDetails.join(", ") : form.accDetail),
    accTypes:  form.isComplex ? form.accTypes.join(", ") : "",
    accDetails: form.isComplex ? form.accDetails.join(", ") : "",
    level: form.level,
    lineStop: form.lineStop,
    customerEffect: form.customerEffect,
    situation: form.situation.trim(),
    actionTaken: form.actionTaken.trim()||"없음",
    supportNeeded: form.supportNeeded.trim()||"없음",
    accidentType: form.accidentType||"",
    victims: hasPersonalAcc ? JSON.stringify(form.victims) : "",
    perpetrators: hasPersonalAcc && form.accidentType==="쌍방사고" ? JSON.stringify(form.perpetrators) : "",
    followUp: "",
    photos: form.photos.filter(p => p && p !== "uploading"),
    status: "접수",
    createdAt: new Date().toLocaleString("ko-KR")
  };

  try {
    await push(ref(state.db, "accidents"), entry);
    state.submitted = entry;
    state.view = "success";
    sendSlackAlert(entry);
  } catch(err) {
    state.errors = { submit: "저장 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." };
  }
  state.saving = false;
  renderFn();
}

export async function sendSlackAlert(e) {
  try {
    const formData = new FormData();
    formData.append("payload", JSON.stringify(e));
    await fetch(GAS_URL, { method:"POST", mode:"no-cors", body:formData });
  } catch(err) {
    console.warn("알림 발송 실패:", err);
  }
}
