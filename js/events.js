import { state } from "./state.js";
import { makeEmptyForm, fmt, t } from "./utils.js";
import { render } from "./router.js";
import { startVoiceInput, stopVoice } from "./features/voice.js";
import { uploadPhotoDirectly, removePhoto } from "./features/photo.js";
import { handleSubmit, sendSlackAlert } from "./features/submit.js";
import {
  downloadExcel, showLoginModal,
  setAdminTab, toggleDetail, toggleSugDetail, openEditModal, editSelectType
} from "./features/admin.js";
import {
  makeEmptyRA, makeEmptyHazard, loadFromAccident, saveRA, deleteRA, loadDraftFromSaved,
  makeEmptyEducation, makeEmptyAttendee, saveEducation,
  makeEmptyNearMiss, loadNmDraftFromSaved, saveNearMiss, loadAccidentIntoNm
} from "./features/risk.js";
import {
  setUserRole, setUserPhone, grantRoleByEmail, revokeGrant,
  addRecipient, removeRecipientByPhone, updateRecipientField,
  toggleRecipientSite, toggleRecipientLevel, toggleRecipient, deleteRecipient
} from "./features/master.js";
import { signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { ref, update, push }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const $ = id => document.getElementById(id);

// 안전제안 이중제출 방지 in-flight 가드(작업1)
let _sugSaving = false;

export function bindEvents() {
  const { view } = state;

  // ── 로그인 ──
  if(view==="login"){
    $("btn-google-login")?.addEventListener("click", () => handleGoogleLogin("login-err"));
    $("btn-email-login")?.addEventListener("click", async () => {
      const email = $("login-email").value.trim();
      const pw    = $("login-pw").value;
      const errEl = $("login-err");
      if(!email||!pw){ errEl.textContent="이메일과 비밀번호를 입력해 주세요."; errEl.style.display="block"; return; }
      try {
        await signInWithEmailAndPassword(state.auth, email, pw);
      } catch {
        errEl.textContent="이메일 또는 비밀번호가 올바르지 않습니다."; errEl.style.display="block";
      }
    });
    $("login-pw")?.addEventListener("keydown", e => { if(e.key==="Enter") $("btn-email-login")?.click(); });
    $("go-register")?.addEventListener("click", () => { state.view="register"; render(); });
    $("btn-login-lang")?.addEventListener("click", () => {
      state.lang = state.lang==="ko" ? "zh" : "ko";
      localStorage.setItem("accLang", state.lang);
      render();
    });
    $("btn-guest-form")?.addEventListener("click", () => {
      state.isGuest = true; state.currentUser = null; state.isAdmin = false;
      state.view = "form"; render();
    });
  }

  // ── 회원가입 ──
  if(view==="register"){
    $("btn-google-register")?.addEventListener("click", () => handleGoogleLogin("reg-err"));
    $("btn-email-register")?.addEventListener("click", async () => {
      const name  = $("reg-name").value.trim();
      const email = $("reg-email").value.trim();
      const phone = ($("reg-phone")?.value || "").replace(/[^0-9]/g,"");
      const pw    = $("reg-pw").value;
      const pw2   = $("reg-pw2").value;
      const errEl = $("reg-err");
      if(!name||!email||!pw||!pw2){ errEl.textContent="모든 항목을 입력해 주세요."; errEl.style.display="block"; return; }
      if(pw!==pw2){ errEl.textContent="비밀번호가 일치하지 않습니다."; errEl.style.display="block"; return; }
      if(pw.length<6){ errEl.textContent="비밀번호는 6자리 이상이어야 합니다."; errEl.style.display="block"; return; }
      try {
        const cred = await createUserWithEmailAndPassword(state.auth, email, pw);
        await updateProfile(cred.user, { displayName: name });
        const reg = { realName: name, name };
        if(phone) reg.phone = phone;
        try { await update(ref(state.db, `users/${cred.user.uid}`), reg); } catch(e){}
      } catch(err) {
        const msg = err.code==="auth/email-already-in-use" ? "이미 사용 중인 이메일입니다." : "회원가입에 실패했습니다.";
        errEl.textContent=msg; errEl.style.display="block";
      }
    });
    $("go-login")?.addEventListener("click", () => { state.view="login"; render(); });
  }

  // ── 메인 ──
  if(view==="main"){
    $("btn-logout")?.addEventListener("click", async () => { await signOut(state.auth); state.view="login"; render(); });
    const toggleLang = () => {
      state.lang = state.lang==="ko" ? "zh" : "ko";
      localStorage.setItem("accLang", state.lang);
      render();
    };
    $("btn-main-lang")?.addEventListener("click", toggleLang);
    $("btn-main-lang-bottom")?.addEventListener("click", toggleLang);
    $("btn-main-form")?.addEventListener("click",    () => { state.view="form"; render(); });
    $("btn-main-manual")?.addEventListener("click",  () => { state.view="manual"; render(); });
    $("btn-main-suggest")?.addEventListener("click", () => {
      window._suggest = {site:"",category:"",title:"",detail:"",anonymous:false,name:"",phone:"",submitted:false};
      state.view="suggest"; render();
    });
    $("btn-main-admin")?.addEventListener("click",   () => { state.view="admin"; render(); });
    $("btn-main-risk")?.addEventListener("click",    () => {
      state.risk = { mode:"list", draft:null, current:null };
      state.view="risk"; render();
    });
    $("go-myreport-main")?.addEventListener("click", () => {
      if(state.currentUser) state.myReportPhone = state.currentUser.phoneNumber || "";
      state.view="myreport"; render();
    });
    $("btn-my-info-save")?.addEventListener("click", async () => {
      const nameEl = $("my-name-input");
      const phoneEl = $("my-phone-input");
      const updates = {};
      let newName = null;
      if(nameEl){
        const nm = nameEl.value.trim();
        if(!nm){ alert("실명을 입력해 주세요."); return; }
        updates.realName = nm; updates.name = nm; newName = nm;
      }
      if(phoneEl){
        const p = phoneEl.value.replace(/[^0-9]/g,"");
        if(p.length < 10){ alert("올바른 휴대폰 번호를 입력해 주세요."); return; }
        updates.phone = p;
      }
      if(state.currentUser && Object.keys(updates).length){
        try { await update(ref(state.db, `users/${state.currentUser.uid}`), updates); } catch(e){}
        if(newName){ try { await updateProfile(state.currentUser, { displayName: newName }); } catch(e){} }
      }
    });
  }

  // ── 매뉴얼 ──
  if(view==="manual"){
    $("btn-manual-back")?.addEventListener("click",  () => { state.view="main"; render(); });
    $("btn-manual-back2")?.addEventListener("click", () => { state.view="main"; render(); });
  }

  // ── 수시 위험성평가 ──
  if(view==="risk"){
    const risk = state.risk;
    $("btn-risk-back")?.addEventListener("click", () => { state.view="main"; render(); });

    if(risk.mode==="list"){
      $("btn-risk-new")?.addEventListener("click", () => {
        state.risk.draft = makeEmptyRA();
        state.risk.mode = "editor"; render();
      });
      document.querySelectorAll(".ra-edit-btn").forEach(b => {
        b.addEventListener("click", () => { loadDraftFromSaved(b.dataset.key); state.risk.mode="editor"; render(); });
      });
      document.querySelectorAll(".ra-report-btn").forEach(b => {
        b.addEventListener("click", () => {
          state.risk.current = state.riskAssessments[b.dataset.key];
          state.risk.currentKey = b.dataset.key;
          state.risk.mode="report"; render();
        });
      });
      document.querySelectorAll(".ra-del-btn").forEach(b => {
        b.addEventListener("click", async () => {
          if(!confirm("이 수시 위험성평가를 삭제하시겠습니까?")) return;
          await deleteRA(b.dataset.key);   // 리스너가 목록을 다시 그림
        });
      });

      // 아차사고 보고서
      $("btn-nm-new")?.addEventListener("click", () => {
        state.risk.draft = makeEmptyNearMiss();
        state.risk.mode = "nmEditor"; render();
      });
      document.querySelectorAll(".nm-edit-btn").forEach(b => {
        b.addEventListener("click", () => { loadNmDraftFromSaved(b.dataset.key); state.risk.mode="nmEditor"; render(); });
      });
      document.querySelectorAll(".nm-report-btn").forEach(b => {
        b.addEventListener("click", () => {
          state.risk.current = state.riskAssessments[b.dataset.key];
          state.risk.currentKey = b.dataset.key;
          state.risk.mode="nmReport"; render();
        });
      });
      document.querySelectorAll(".nm-del-btn").forEach(b => {
        b.addEventListener("click", async () => {
          if(!confirm("이 아차사고 보고서를 삭제하시겠습니까?")) return;
          await deleteRA(b.dataset.key);
        });
      });
    }

    if(risk.mode==="editor"){
      const d = risk.draft;
      $("ra-acc")?.addEventListener("change", e => {
        if(e.target.value) loadFromAccident(e.target.value);
        else { d.accNo=""; d.accSnapshot=null; }
        render();
      });
      $("ra-site")?.addEventListener("change",        e => { d.site=e.target.value; });
      $("ra-date")?.addEventListener("change",        e => { d.assessDate=e.target.value; });
      $("ra-assessor")?.addEventListener("input",     e => { d.assessor=e.target.value; });
      $("ra-participants")?.addEventListener("input", e => { d.participants=e.target.value; });
      $("ra-reason")?.addEventListener("change",      e => { d.reason=e.target.value; });
      $("ra-target")?.addEventListener("input",       e => { d.targetWork=e.target.value; });
      $("ra-conclusion")?.addEventListener("input",   e => { d.conclusion=e.target.value; });

      document.querySelectorAll(".hz-f").forEach(el => {
        el.addEventListener("input", () => { d.hazards[+el.dataset.hz][el.dataset.hf] = el.value; });
      });
      document.querySelectorAll(".hz-sel").forEach(el => {
        el.addEventListener("change", () => { d.hazards[+el.dataset.hz][el.dataset.hsel] = +el.value; render(); });
      });
      document.querySelectorAll(".hz-chk").forEach(el => {
        el.addEventListener("change", () => { d.hazards[+el.dataset.hz].done = el.checked; });
      });
      document.querySelectorAll(".hz-remove").forEach(el => {
        el.addEventListener("click", () => {
          d.hazards.splice(+el.dataset.hz, 1);
          if(d.hazards.length===0) d.hazards.push(makeEmptyHazard());
          render();
        });
      });
      $("btn-hz-add")?.addEventListener("click", () => { d.hazards.push(makeEmptyHazard()); render(); });

      const rpi = $("ra-photo-input");
      if(rpi){
        rpi.addEventListener("change", async e => {
          const files = Array.from(e.target.files);
          const remaining = 3 - d.photos.filter(p=>p).length;
          for(const file of files.slice(0, remaining)){
            d.photosPreviews.push(URL.createObjectURL(file));
            d.photos.push("uploading");
            render();
            const url = await uploadPhotoDirectly(file);
            const idx = d.photos.indexOf("uploading");
            if(idx!==-1){ d.photos[idx] = url||""; if(url) d.photosPreviews[idx]=url; }
            render();
          }
        });
      }
      document.querySelectorAll(".ra-photo-del").forEach(b => {
        b.addEventListener("click", () => {
          const idx=+b.dataset.idx;
          d.photos.splice(idx,1); d.photosPreviews.splice(idx,1); render();
        });
      });

      $("btn-ra-save")?.addEventListener("click", async () => {
        const res = await saveRA(false);
        const errEl = $("ra-err");
        if(res.ok){ state.risk.mode="list"; render(); }
        else if(errEl){ errEl.textContent=res.msg; errEl.style.display="block"; window.scrollTo(0,0); }
      });
      $("btn-ra-complete")?.addEventListener("click", async () => {
        const res = await saveRA(true);
        const errEl = $("ra-err");
        if(res.ok){ state.risk.current = res.data; state.risk.currentKey = res.key; state.risk.mode="report"; render(); }
        else if(errEl){ errEl.textContent=res.msg; errEl.style.display="block"; window.scrollTo(0,0); }
      });
    }

    if(risk.mode==="report"){
      $("btn-ra-report-back")?.addEventListener("click", () => {
        state.risk.mode="list"; state.risk.current=null; state.risk.currentKey=null; render();
      });
      $("btn-ra-report-edit")?.addEventListener("click", () => {
        const cur = state.risk.current;
        const key = Object.keys(state.riskAssessments).find(k => state.riskAssessments[k].raNo === cur.raNo);
        if(key) loadDraftFromSaved(key);
        state.risk.mode="editor"; render();
      });
      $("btn-ra-edu")?.addEventListener("click", () => {
        const cur = state.risk.current;
        if(cur && cur.education){
          state.risk.mode="edudoc";
        } else {
          state.risk.eduDraft = makeEmptyEducation(cur);
          state.risk.mode="edu";
        }
        render();
      });
    }

    if(risk.mode==="edu"){
      const ed = state.risk.eduDraft;
      $("edu-name")?.addEventListener("input",           e => { ed.eduName=e.target.value; });
      $("edu-date")?.addEventListener("change",          e => { ed.eduDate=e.target.value; });
      $("edu-method")?.addEventListener("change",        e => { ed.method=e.target.value; });
      $("edu-start")?.addEventListener("change",         e => { ed.startTime=e.target.value; });
      $("edu-end")?.addEventListener("change",           e => { ed.endTime=e.target.value; });
      $("edu-duration")?.addEventListener("input",       e => { ed.duration=e.target.value; });
      $("edu-place")?.addEventListener("input",          e => { ed.place=e.target.value; });
      $("edu-instructor")?.addEventListener("input",     e => { ed.instructor=e.target.value; });
      $("edu-instructor-org")?.addEventListener("input", e => { ed.instructorOrg=e.target.value; });
      $("edu-target")?.addEventListener("input",         e => { ed.targetDept=e.target.value; });
      $("edu-objective")?.addEventListener("input",      e => { ed.objective=e.target.value; });
      $("edu-extra")?.addEventListener("input",          e => { ed.extraContent=e.target.value; });

      document.querySelectorAll(".edu-att").forEach(el => {
        el.addEventListener("input", () => { ed.attendees[+el.dataset.i][el.dataset.af] = el.value; });
      });
      document.querySelectorAll(".edu-att-del").forEach(el => {
        el.addEventListener("click", () => {
          ed.attendees.splice(+el.dataset.i, 1);
          if(ed.attendees.length===0) ed.attendees.push(makeEmptyAttendee());
          render();
        });
      });
      $("btn-edu-att-add")?.addEventListener("click", () => { ed.attendees.push(makeEmptyAttendee()); render(); });

      $("btn-edu-cancel")?.addEventListener("click", () => { state.risk.mode="report"; render(); });
      $("btn-edu-make")?.addEventListener("click", async () => {
        const res = await saveEducation();
        const errEl = $("edu-err");
        if(res.ok){ state.risk.mode="edudoc"; render(); }
        else if(errEl){ errEl.textContent=res.msg; errEl.style.display="block"; window.scrollTo(0,0); }
      });
    }

    if(risk.mode==="edudoc"){
      $("btn-edu-back")?.addEventListener("click", () => { state.risk.mode="report"; render(); });
      $("btn-edu-edit")?.addEventListener("click", () => {
        const cur = state.risk.current;
        state.risk.eduDraft = {
          ...makeEmptyEducation(cur),
          ...(cur && cur.education ? JSON.parse(JSON.stringify(cur.education)) : {})
        };
        if(!Array.isArray(state.risk.eduDraft.attendees) || state.risk.eduDraft.attendees.length===0){
          state.risk.eduDraft.attendees = [ makeEmptyAttendee() ];
        }
        state.risk.mode="edu"; render();
      });
    }

    // 아차사고 보고서 편집기
    if(risk.mode==="nmEditor"){
      const d = risk.draft;
      $("nm-acc")?.addEventListener("change", e => {
        if(e.target.value) loadAccidentIntoNm(e.target.value);
        else d.accNo = "";
        render();
      });
      $("nm-site")?.addEventListener("change",      e => { d.site=e.target.value; });
      $("nm-date")?.addEventListener("change",      e => { d.occurredAt=e.target.value; });
      $("nm-location")?.addEventListener("input",   e => { d.location=e.target.value; });
      $("nm-reporter")?.addEventListener("input",   e => { d.reporter=e.target.value; });
      $("nm-category")?.addEventListener("change",  e => { d.category=e.target.value; });
      $("nm-desc")?.addEventListener("input",       e => { d.description=e.target.value; });
      $("nm-potential")?.addEventListener("input",  e => { d.potentialRisk=e.target.value; });
      $("nm-likelihood")?.addEventListener("change",e => { d.likelihood=+e.target.value; render(); });
      $("nm-severity")?.addEventListener("change",  e => { d.severity=+e.target.value; render(); });
      $("nm-action")?.addEventListener("input",     e => { d.immediateAction=e.target.value; });
      $("nm-measure")?.addEventListener("input",    e => { d.preventiveMeasure=e.target.value; });

      const npi = $("nm-photo-input");
      if(npi){
        npi.addEventListener("change", async e => {
          const files = Array.from(e.target.files);
          const remaining = 3 - d.photos.filter(p=>p).length;
          for(const file of files.slice(0, remaining)){
            d.photosPreviews.push(URL.createObjectURL(file));
            d.photos.push("uploading");
            render();
            const url = await uploadPhotoDirectly(file);
            const idx = d.photos.indexOf("uploading");
            if(idx!==-1){ d.photos[idx] = url||""; if(url) d.photosPreviews[idx]=url; }
            render();
          }
        });
      }
      document.querySelectorAll(".nm-photo-del").forEach(b => {
        b.addEventListener("click", () => {
          const idx=+b.dataset.idx;
          d.photos.splice(idx,1); d.photosPreviews.splice(idx,1); render();
        });
      });

      $("btn-nm-save")?.addEventListener("click", async () => {
        const res = await saveNearMiss(false);
        const errEl = $("nm-err");
        if(res.ok){ state.risk.mode="list"; render(); }
        else if(errEl){ errEl.textContent=res.msg; errEl.style.display="block"; window.scrollTo(0,0); }
      });
      $("btn-nm-complete")?.addEventListener("click", async () => {
        const res = await saveNearMiss(true);
        const errEl = $("nm-err");
        if(res.ok){ state.risk.current = res.data; state.risk.currentKey = res.key; state.risk.mode="nmReport"; render(); }
        else if(errEl){ errEl.textContent=res.msg; errEl.style.display="block"; window.scrollTo(0,0); }
      });
    }

    if(risk.mode==="nmReport"){
      $("btn-nm-report-back")?.addEventListener("click", () => {
        state.risk.mode="list"; state.risk.current=null; state.risk.currentKey=null; render();
      });
      $("btn-nm-report-edit")?.addEventListener("click", () => {
        const cur = state.risk.current;
        const key = state.risk.currentKey || Object.keys(state.riskAssessments).find(k => state.riskAssessments[k].nmNo === cur.nmNo);
        if(key) loadNmDraftFromSaved(key);
        state.risk.mode="nmEditor"; render();
      });
    }
  }

  // ── 안전개선 제안 ──
  if(view==="suggest"){
    $("btn-suggest-back-top")?.addEventListener("click", () => { state.view="main"; render(); });
    $("btn-suggest-back")?.addEventListener("click",     () => { state.view="main"; render(); });
    $("btn-suggest-another")?.addEventListener("click",  () => {
      window._suggest = {site:"",category:"",title:"",detail:"",anonymous:false,name:"",phone:"",submitted:false};
      render();
    });
    document.querySelectorAll("[data-sug-site]").forEach(b => {
      b.addEventListener("click", () => { window._suggest.site = b.dataset.sugSite; render(); });
    });
    $("sug-title")?.addEventListener("input",  e => { window._suggest.title=e.target.value; });
    $("sug-detail")?.addEventListener("input", e => { window._suggest.detail=e.target.value; });
    $("sug-name")?.addEventListener("input",   e => { window._suggest.name=e.target.value; });
    $("sug-phone")?.addEventListener("input",  e => {
      const v = fmt(e.target.value);
      window._suggest.phone = v; e.target.value = v;
    });
    $("sug-anon")?.addEventListener("change", e => { window._suggest.anonymous=e.target.checked; render(); });
    document.querySelectorAll("[data-sug-cat]").forEach(b => {
      b.addEventListener("click", () => { window._suggest.category=b.dataset.sugCat; render(); });
    });

    $("btn-suggest-submit")?.addEventListener("click", async () => {
      if(_sugSaving) return;                       // 이중제출 가드(작업1)
      const s = window._suggest;
      const errEl = $("sug-err");
      if(!s.site||!s.category||!s.title.trim()||!s.detail.trim()){
        errEl.textContent="사업소, 분류, 제목, 상세 내용을 모두 입력해 주세요.";
        errEl.style.display="block"; return;
      }
      errEl.style.display="none";

      _sugSaving = true;
      const btn = $("btn-suggest-submit");
      const origHtml = btn ? btn.innerHTML : "";
      if(btn){ btn.disabled=true; btn.style.opacity="0.6"; btn.textContent = t("submittingSug"); }

      const payload = {
        site: s.site, category: s.category,
        title: s.title.trim(), detail: s.detail.trim(),
        anonymous: s.anonymous,
        name: s.anonymous ? "익명" : (s.name || state.currentUser?.displayName || "미입력"),
        phone: s.anonymous ? "-" : (s.phone || "미입력"),
        realEmail: state.currentUser ? state.currentUser.email : "비회원",
        realName: state.currentUser ? (state.currentUser.displayName || "이름없음") : "비회원",
        userId: state.currentUser ? state.currentUser.uid : "guest",
        status:"접수", createdAt: new Date().toLocaleString("ko-KR")
      };

      try {
        await push(ref(state.db,"suggestions"), payload);
        // 안전제안은 슬랙만(작업7): channels ["slack"] → GAS가 SMS 스킵. lang KO 고정(작업3).
        sendSlackAlert({ ...payload, lang:"ko", notifyType:"suggestion", channels:["slack"] });
        window._suggest.submitted = true;
        render();
      } catch(err) {
        errEl.textContent="접수 중 오류가 발생했습니다. 다시 시도해 주세요.";
        errEl.style.display="block";
        if(btn){ btn.disabled=false; btn.style.opacity="1"; btn.innerHTML=origHtml; }
      } finally {
        _sugSaving = false;
      }
    });
  }

  // ── 사고 접수 폼 ──
  if(view==="form"){
    const { form, errors } = state;

    document.querySelectorAll("[data-site-btn]").forEach(b => {
      b.addEventListener("click", () => { form.site=b.dataset.siteBtn; delete errors.site; render(); });
    });
    $("f-reporter")?.addEventListener("input",  e => { form.reporter=e.target.value; delete errors.reporter; });
    $("f-rank")?.addEventListener("change",     e => { form.rank=e.target.value; delete errors.rank; });
    $("f-phone")?.addEventListener("input",     e => { const v=fmt(e.target.value); form.phone=v; e.target.value=v; delete errors.phone; });
    $("f-acc-year")?.addEventListener("change", e => { form.accYear=e.target.value; delete errors.accYear; });
    $("f-acc-month")?.addEventListener("change",e => { form.accMonth=e.target.value; });
    $("f-acc-day")?.addEventListener("change",  e => { form.accDay=e.target.value; });
    $("f-acc-ampm")?.addEventListener("change", e => { form.accAmPm=e.target.value; });
    $("f-acc-hour")?.addEventListener("change", e => { form.accHour=e.target.value; delete errors.accHour; });
    $("f-acc-min")?.addEventListener("change",  e => { form.accMin=e.target.value; });
    $("f-location")?.addEventListener("input",  e => { form.location=e.target.value; delete errors.location; });
    $("f-situation")?.addEventListener("input", e => { form.situation=e.target.value; delete errors.situation; });
    $("f-action")?.addEventListener("input",    e => { form.actionTaken=e.target.value; });
    $("f-support")?.addEventListener("input",   e => { form.supportNeeded=e.target.value; });

    $("chk-complex")?.addEventListener("change", () => {
      form.isComplex = $("chk-complex").checked;
      form.accType=""; form.accDetail=""; form.accTypes=[]; form.accDetails=[];
      delete errors.accType; delete errors.accDetail;
      render();
    });

    document.querySelectorAll("[data-type-btn]").forEach(b => {
      b.addEventListener("click", () => {
        const tp = b.dataset.typeBtn;
        if(form.isComplex){
          if(form.accTypes.includes(tp)){
            form.accTypes = form.accTypes.filter(x=>x!==tp);
            // 해당 유형의 세부유형도 제거 (T는 config에서)
          } else {
            form.accTypes.push(tp);
          }
        } else {
          form.accType = tp; form.accDetail = "";
        }
        delete errors.accType;
        render();
      });
    });

    document.querySelectorAll("[data-detail-btn]").forEach(b => {
      b.addEventListener("click", () => {
        const d = b.dataset.detailBtn;
        if(form.isComplex){
          if(form.accDetails.includes(d)) form.accDetails=form.accDetails.filter(x=>x!==d);
          else form.accDetails.push(d);
        } else {
          form.accDetail = d;
        }
        delete errors.accDetail;
        render();
      });
    });

    document.querySelectorAll("[data-field]").forEach(b => {
      b.addEventListener("click", () => {
        form[b.dataset.field] = b.dataset.val;
        delete errors[b.dataset.field];
        render();
      });
    });

    document.querySelectorAll("[data-lv]").forEach(b => {
      b.addEventListener("click", () => { form.level=b.dataset.lv; delete errors.level; render(); });
    });

    document.querySelectorAll("[data-chk]").forEach(c => {
      c.addEventListener("change", () => {
        form.checks[+c.dataset.chk] = c.checked;
        if(form.checks.every(Boolean)) delete errors.checks;
      });
    });

    $("btn-submit")?.addEventListener("click",        () => handleSubmit(render));
    $("go-admin")?.addEventListener("click",          () => showLoginModal());
    $("go-myreport")?.addEventListener("click",       () => { state.view="myreport"; render(); });
    $("go-main-from-form")?.addEventListener("click", () => {
      if(state.isGuest){ state.isGuest=false; state.view="login"; }
      else { state.view="main"; }
      stopVoice();
      render();
    });
    $("btn-lang-toggle")?.addEventListener("click", () => {
      state.lang = state.lang==="ko" ? "zh" : "ko";
      localStorage.setItem("accLang", state.lang);
      form.accType=""; form.accDetail=""; form.accTypes=[]; form.accDetails=[];
      render();
    });
    $("btn-voice-start")?.addEventListener("click", () => startVoiceInput(render));

    const photoInput = $("photo-input");
    if(photoInput){
      photoInput.addEventListener("change", async e => {
        const files = Array.from(e.target.files);
        const remaining = 3 - form.photos.length;
        for(const file of files.slice(0, remaining)){
          const previewUrl = URL.createObjectURL(file);
          form.photosPreviews.push(previewUrl);
          form.photos.push("uploading");
          render();
          const url = await uploadPhotoDirectly(file);
          const idx = form.photos.indexOf("uploading");
          if(idx !== -1) form.photos[idx] = url || "";
          render();
        }
      });
    }

    document.querySelectorAll(".victim-name").forEach(el => {
      el.addEventListener("input", () => { form.victims[+el.dataset.vi].name=el.value; });
    });
    document.querySelectorAll(".victim-aff").forEach(el => {
      el.addEventListener("input", () => { form.victims[+el.dataset.vi].affiliation=el.value; });
    });
    document.querySelectorAll(".victim-unknown").forEach(el => {
      el.addEventListener("change", () => {
        form.victims[+el.dataset.vi].unknown=el.checked;
        if(el.checked){ form.victims[+el.dataset.vi].name="미확인"; form.victims[+el.dataset.vi].affiliation="미확인"; }
        else { form.victims[+el.dataset.vi].name=""; form.victims[+el.dataset.vi].affiliation=""; }
        render();
      });
    });
    document.querySelectorAll(".perp-name").forEach(el => {
      el.addEventListener("input", () => { form.perpetrators[+el.dataset.pi].name=el.value; });
    });
    document.querySelectorAll(".perp-aff").forEach(el => {
      el.addEventListener("input", () => { form.perpetrators[+el.dataset.pi].affiliation=el.value; });
    });
    document.querySelectorAll(".perp-unknown").forEach(el => {
      el.addEventListener("change", () => {
        form.perpetrators[+el.dataset.pi].unknown=el.checked;
        if(el.checked){ form.perpetrators[+el.dataset.pi].name="미확인"; form.perpetrators[+el.dataset.pi].affiliation="미확인"; }
        else { form.perpetrators[+el.dataset.pi].name=""; form.perpetrators[+el.dataset.pi].affiliation=""; }
        render();
      });
    });
  }

  // ── 완료 화면 ──
  if(view==="success"){
    $("btn-reset")?.addEventListener("click", () => {
      state.form = makeEmptyForm(); state.errors={}; state.submitted=null; state.view="form"; render();
    });
    $("btn-guest-to-login")?.addEventListener("click", () => { state.isGuest=false; state.view="login"; render(); });
    $("btn-go-myreport")?.addEventListener("click", () => {
      if(state.submitted) state.myReportPhone = state.submitted.phone;
      state.myReportSelected = null; state.view="myreport"; render();
    });
    $("btn-followup")?.addEventListener("click", async () => {
      const text = $("follow-up-text").value.trim();
      if(!text){ alert("후속조치 내용을 입력해 주세요."); return; }
      if(!state.submitted) return;
      const snap = Object.entries(state.entries).find(([,e])=>e.accNo===state.submitted.accNo);
      if(snap){
        const prev = snap[1].followUp||"";
        const now = new Date().toLocaleString("ko-KR");
        const updated = prev ? prev+"\n\n["+now+"]\n"+text : "["+now+"]\n"+text;
        await update(ref(state.db,`accidents/${snap[0]}`),{followUp:updated, status:"처리중"});
        // 후속조치 발송(작업6): slack+sms, lang KO 고정, notifyType followup.
        sendSlackAlert({ ...state.entries[snap[0]], followUp:updated, status:"처리중", lang:"ko", notifyType:"followup", channels:["slack","sms"] });
        const msg = $("followup-msg");
        if(msg){ msg.style.display="block"; setTimeout(()=>{ msg.style.display="none"; },3000); }
        $("follow-up-text").value="";
      }
    });
  }

  // ── 사고 상세 ──
  if(view==="accdetail"){
    $("btn-acc-back")?.addEventListener("click", () => {
      window._accDetailKey = null;
      history.replaceState(null,"",location.pathname);
      state.view = state.currentUser ? "main" : "login"; render();
    });
    $("btn-acc-admin")?.addEventListener("click", () => {
      state.view = state.isAdmin ? "admin" : "main"; render();
    });
    $("btn-acc-login")?.addEventListener("click", () => { state.view="login"; render(); });
  }

  // ── 내 접수 조회 ──
  if(view==="myreport"){
    $("btn-my-back")?.addEventListener("click", () => { state.view="form"; render(); });
    $("btn-my-search")?.addEventListener("click", () => {
      state.myReportPhone=$("my-phone").value; state.myReportSelected=null; render();
    });
    $("my-phone")?.addEventListener("keydown", e => {
      if(e.key==="Enter"){ state.myReportPhone=$("my-phone").value; state.myReportSelected=null; render(); }
    });
    $("my-phone")?.addEventListener("input", e => {
      const v=fmt(e.target.value); state.myReportPhone=v; e.target.value=v;
    });
  }

  // ── 관리자 ──
  if(view==="admin"){
    $("go-form")?.addEventListener("click", () => { state.view="main"; render(); });
    $("go-logout")?.addEventListener("click", async () => { await signOut(state.auth); state.view="login"; render(); });

    // 상세 토글·수정 버튼은 인라인 onclick(toggleDetail/toggleSugDetail/openEditModal)으로 통일(작업2 A안)
    // → 렌더-바인딩 타이밍 레이스 제거. 삭제 버튼은 제거(작업5).
    document.querySelectorAll(".tab-btn").forEach(b => {
      b.addEventListener("click", () => setAdminTab(b.dataset.tab));
    });

    // 검색은 render()로 통일(updateAdminTable 폐기, 작업2 C안). 리렌더 후 검색창 포커스 복원.
    if(state._focusSearch){
      const se = $("a-search");
      if(se){ se.focus(); const v=se.value; se.setSelectionRange(v.length, v.length); }
      state._focusSearch = false;
    }
    $("a-search")?.addEventListener("input", e => { state.filter.search=e.target.value; state._focusSearch=true; render(); });
    $("a-acctype")?.addEventListener("change", e => { state.filter.accType=e.target.value; render(); });
    $("a-level")?.addEventListener("change",   e => { state.filter.level=e.target.value; render(); });
    $("a-show-test")?.addEventListener("change", e => { state.filter.showTest=e.target.checked; render(); });
    $("btn-excel")?.addEventListener("click",  () => downloadExcel());

    document.querySelectorAll(".status-sel").forEach(s => {
      s.addEventListener("change", () => { update(ref(state.db,`accidents/${s.dataset.key}`),{status:s.value}); });
    });
    document.querySelectorAll(".sug-status-sel").forEach(s => {
      s.addEventListener("change", () => { update(ref(state.db,`suggestions/${s.dataset.key}`),{status:s.value}); });
    });

    // 로그인 모달
    const modal = $("login-modal");
    if(modal){
      modal.addEventListener("click", e => {
        if(e.target===modal){ modal.style.display="none"; state.view="form"; render(); }
      });
      $("modal-cancel")?.addEventListener("click", () => { modal.style.display="none"; state.view="form"; render(); });
    }

    // ── 마스터 관리 탭 ──
    if(state.isMaster && state.adminTab==="master"){
      const showMsg = (text, ok) => {
        const el = $("master-msg"); if(!el) return;
        el.textContent = text;
        el.style.background = ok ? "#f0faf0" : "#fff5f5";
        el.style.border = ok ? "1px solid #b8e0ba" : "1px solid #f5c6c6";
        el.style.color = ok ? "#2e7d32" : "#b71c1c";
        el.style.display = "block";
      };

      // 권한 변경
      document.querySelectorAll(".role-sel").forEach(sel => {
        sel.addEventListener("change", async () => {
          const res = await setUserRole(sel.dataset.uid, sel.value);
          if(res.ok) showMsg("권한이 변경되었습니다.", true);
          else { showMsg(res.msg, false); render(); }
        });
      });

      // 가입자 전화번호 저장 (입력 후 포커스 아웃 시)
      document.querySelectorAll(".user-phone").forEach(el => {
        el.addEventListener("change", () => setUserPhone(el.dataset.uid, el.value));
      });

      // 이메일로 권한 부여 / 회수
      $("btn-grant")?.addEventListener("click", async () => {
        const res = await grantRoleByEmail($("grant-email")?.value, $("grant-role")?.value);
        if(res.ok) showMsg("권한을 부여했습니다. 해당 계정이 로그인하면 적용됩니다.", true);
        else showMsg(res.msg, false);
      });
      document.querySelectorAll(".grant-revoke").forEach(b => {
        b.addEventListener("click", async () => {
          if(!confirm("이 권한 부여를 회수하시겠습니까?")) return;
          await revokeGrant(b.dataset.key);
          showMsg("권한 부여를 회수했습니다.", true);
        });
      });

      // 수신자 이름/번호 수정
      document.querySelectorAll(".rec-name-edit").forEach(el => {
        el.addEventListener("change", () => updateRecipientField(el.dataset.id, "name", el.value));
      });
      document.querySelectorAll(".rec-phone-edit").forEach(el => {
        el.addEventListener("change", () => updateRecipientField(el.dataset.id, "phone", el.value));
      });

      // 가입자 → 문자 수신 등록 (기본: 전체 사업장, 전 긴급도)
      document.querySelectorAll(".rec-user-add").forEach(b => {
        b.addEventListener("click", async () => {
          const res = await addRecipient(b.dataset.name, b.dataset.phone, [], {"1":true,"2":true,"3":true}, b.dataset.uid);
          if(res.ok) showMsg(`${b.dataset.name} 님을 문자 수신자로 등록했습니다. 아래에서 사업장·긴급도를 조정하세요.`, true);
          else showMsg(res.msg, false);
        });
      });
      // 가입자 → 문자 수신 해제
      document.querySelectorAll(".rec-user-remove").forEach(b => {
        b.addEventListener("click", async () => {
          if(!confirm("이 가입자를 문자 수신자에서 해제하시겠습니까?")) return;
          await removeRecipientByPhone(b.dataset.phone);
          showMsg("문자 수신을 해제했습니다.", true);
        });
      });

      // 수신자 사업장 / 긴급도 토글
      document.querySelectorAll(".rec-site-chip").forEach(b => {
        b.addEventListener("click", () => toggleRecipientSite(b.dataset.id, b.dataset.site));
      });
      document.querySelectorAll(".rec-lv-chip").forEach(b => {
        b.addEventListener("click", () => toggleRecipientLevel(b.dataset.id, b.dataset.lv));
      });
      document.querySelectorAll(".rec-toggle").forEach(c => {
        c.addEventListener("change", () => toggleRecipient(c.dataset.id, c.checked));
      });
      document.querySelectorAll(".rec-del").forEach(b => {
        b.addEventListener("click", () => {
          if(!confirm("이 수신자를 삭제하시겠습니까?")) return;
          deleteRecipient(b.dataset.id);
        });
      });

      // 외부 수신자(비가입자) 추가
      $("btn-ext-add")?.addEventListener("click", async () => {
        const sites = Array.from(document.querySelectorAll(".ext-site"))
          .filter(c => c.checked).map(c => c.value);
        const levels = {};
        document.querySelectorAll(".ext-lv").forEach(c => { levels[c.dataset.lv] = c.checked; });
        const res = await addRecipient($("ext-name")?.value, $("ext-phone")?.value, sites, levels, "");
        if(res.ok) showMsg("외부 수신자가 추가되었습니다.", true);
        else showMsg(res.msg, false);
      });
    }
  }
}

// ── window 전역 함수 (HTML onclick 속성에서 호출) ──
window.selectMyReport = function(key) {
  state.myReportSelected = state.myReportSelected===key ? null : key;
  render();
};

window.saveFollowUp = async function(key) {
  const el = document.getElementById(`followup-input-${key}`);
  const okEl = document.getElementById(`followup-ok-${key}`);
  if(!el) return;
  const text = el.value.trim();
  if(!text){ alert("후속조치 내용을 입력해 주세요."); return; }
  const prev = (state.entries[key]||{}).followUp || "";
  const now = new Date().toLocaleString("ko-KR");
  const updated = prev ? prev+"\n\n["+now+"]\n"+text : "["+now+"]\n"+text;
  try {
    await update(ref(state.db,`accidents/${key}`),{followUp:updated, status:"처리중"});
    // 후속조치 발송(작업6): slack+sms, lang KO 고정, notifyType followup.
    sendSlackAlert({ ...state.entries[key], followUp:updated, status:"처리중", lang:"ko", notifyType:"followup", channels:["slack","sms"] });
    el.value="";
    if(okEl){ okEl.style.display="block"; setTimeout(()=>{ okEl.style.display="none"; },3000); }
  } catch {
    alert("저장 중 오류가 발생했습니다. 다시 시도해 주세요.");
  }
};

window.removePhoto = function(idx) { removePhoto(idx); render(); };

window.addPerson = function(type) {
  if(type==="victims") state.form.victims.push({name:"",affiliation:"",unknown:false});
  else state.form.perpetrators.push({name:"",affiliation:"",unknown:false});
  render();
};

window.removePerson = function(type, idx) {
  if(type==="victims") state.form.victims.splice(idx,1);
  else state.form.perpetrators.splice(idx,1);
  render();
};

window.toggleDetail = toggleDetail;
window.toggleSugDetail = toggleSugDetail;   // 안전제안 상세 인라인 onclick용(작업2)
window.openEditModal = openEditModal;
window.editSelectType = editSelectType;

// ── Google 로그인 (GoogleAuthProvider는 auth 모듈에서) ──
async function handleGoogleLogin(errElId) {
  const errEl = document.getElementById(errElId);
  try {
    const { GoogleAuthProvider, signInWithPopup } =
      await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js");
    await signInWithPopup(state.auth, new GoogleAuthProvider());
  } catch(err) {
    if(errEl){ errEl.textContent="구글 로그인에 실패했습니다."; errEl.style.display="block"; }
  }
}
