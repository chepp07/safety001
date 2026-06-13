import { state } from "./state.js";
import { makeEmptyForm, fmt } from "./utils.js";
import { render } from "./router.js";
import { startVoiceInput, stopVoice } from "./features/voice.js";
import { uploadPhotoDirectly, removePhoto } from "./features/photo.js";
import { handleSubmit } from "./features/submit.js";
import {
  updateAdminTable, downloadExcel, showLoginModal,
  setAdminTab, toggleDetail, toggleSugDetail, openEditModal, editSelectType
} from "./features/admin.js";
import { signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { ref, update, remove, push }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const $ = id => document.getElementById(id);

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
      const pw    = $("reg-pw").value;
      const pw2   = $("reg-pw2").value;
      const errEl = $("reg-err");
      if(!name||!email||!pw||!pw2){ errEl.textContent="모든 항목을 입력해 주세요."; errEl.style.display="block"; return; }
      if(pw!==pw2){ errEl.textContent="비밀번호가 일치하지 않습니다."; errEl.style.display="block"; return; }
      if(pw.length<6){ errEl.textContent="비밀번호는 6자리 이상이어야 합니다."; errEl.style.display="block"; return; }
      try {
        const cred = await createUserWithEmailAndPassword(state.auth, email, pw);
        await updateProfile(cred.user, { displayName: name });
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
    $("go-myreport-main")?.addEventListener("click", () => {
      if(state.currentUser) state.myReportPhone = state.currentUser.phoneNumber || "";
      state.view="myreport"; render();
    });
  }

  // ── 매뉴얼 ──
  if(view==="manual"){
    $("btn-manual-back")?.addEventListener("click",  () => { state.view="main"; render(); });
    $("btn-manual-back2")?.addEventListener("click", () => { state.view="main"; render(); });
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
      const s = window._suggest;
      const errEl = $("sug-err");
      if(!s.site||!s.category||!s.title.trim()||!s.detail.trim()){
        errEl.textContent="사업소, 분류, 제목, 상세 내용을 모두 입력해 주세요.";
        errEl.style.display="block"; return;
      }
      errEl.style.display="none";
      await push(ref(state.db,"suggestions"),{
        site: s.site, category: s.category,
        title: s.title.trim(), detail: s.detail.trim(),
        anonymous: s.anonymous,
        name: s.anonymous ? "익명" : (s.name || state.currentUser?.displayName || "미입력"),
        phone: s.anonymous ? "-" : (s.phone || "미입력"),
        realEmail: state.currentUser ? state.currentUser.email : "비회원",
        realName: state.currentUser ? (state.currentUser.displayName || "이름없음") : "비회원",
        userId: state.currentUser ? state.currentUser.uid : "guest",
        status:"접수", createdAt: new Date().toLocaleString("ko-KR")
      });
      window._suggest.submitted = true;
      render();
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

    document.querySelectorAll(".card-hd").forEach(el => {
      el.addEventListener("click", ev => {
        if(ev.target.closest(".status-sel")||ev.target.closest(".del-btn")||ev.target.closest(".edit-btn")) return;
        toggleDetail("detail-"+el.dataset.key);
      });
    });
    document.querySelectorAll(".edit-btn").forEach(b => {
      b.addEventListener("click", ev => { ev.stopPropagation(); openEditModal(b.dataset.key); });
    });
    document.querySelectorAll(".sug-hd").forEach(el => {
      el.addEventListener("click", ev => {
        if(ev.target.closest(".sug-status-sel")) return;
        toggleSugDetail("sug-"+el.dataset.key);
      });
    });
    document.querySelectorAll(".tab-btn").forEach(b => {
      b.addEventListener("click", () => setAdminTab(b.dataset.tab));
    });

    $("a-search")?.addEventListener("input", e => { state.filter.search=e.target.value; updateAdminTable(); });
    $("a-acctype")?.addEventListener("change", e => { state.filter.accType=e.target.value; render(); });
    $("a-level")?.addEventListener("change",   e => { state.filter.level=e.target.value; render(); });
    $("btn-excel")?.addEventListener("click",  () => downloadExcel());

    document.querySelectorAll(".status-sel").forEach(s => {
      s.addEventListener("change", () => { update(ref(state.db,`accidents/${s.dataset.key}`),{status:s.value}); });
    });
    document.querySelectorAll(".sug-status-sel").forEach(s => {
      s.addEventListener("change", () => { update(ref(state.db,`suggestions/${s.dataset.key}`),{status:s.value}); });
    });
    document.querySelectorAll(".del-btn").forEach(b => {
      b.addEventListener("click", () => {
        if(!confirm("이 사고 접수 건을 삭제하시겠습니까?")) return;
        remove(ref(state.db,`accidents/${b.dataset.key}`));
      });
    });

    // 로그인 모달
    const modal = $("login-modal");
    if(modal){
      modal.addEventListener("click", e => {
        if(e.target===modal){ modal.style.display="none"; state.view="form"; render(); }
      });
      $("modal-cancel")?.addEventListener("click", () => { modal.style.display="none"; state.view="form"; render(); });
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
