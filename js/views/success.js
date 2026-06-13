import { state } from "../state.js";
import { levelLabel, t } from "../utils.js";

export function renderSuccess() {
  const { lang, isGuest, submitted: e } = state;
  const lv = e ? levelLabel(e.level) : {text:"-",cls:""};

  return `
<div class="success-wrap">
  <div class="success-icon">✅</div>
  <div class="success-title">${t("successTitle")}</div>
  <div class="success-desc">${lang==="zh"?"负责人将立即收到通知。<br>Level 1·2 请同时进行电话报告。":"담당자에게 즉시 통보됩니다.<br>Level 1·2 사고는 전화로 추가 보고를 병행해 주세요."}</div>

  ${isGuest?`
  <div style="background:#fff8f0;border:1.5px solid #fcd8a8;border-radius:10px;
    padding:12px 16px;margin-bottom:1rem;font-size:13px;color:#e65100;line-height:1.7;">
    💡 <strong>회원 가입 후 더 많은 기능을 이용할 수 있어요!</strong><br>
    내 접수 조회 · 후속조치 입력 · 사고처리 매뉴얼 · 안전개선 제안
  </div>`:""}

  ${e?`
  <div class="acc-no-badge">${e.accNo}</div>
  <div class="receipt">
    <strong>사업소</strong>: ${e.site}<br>
    <strong>접수자</strong>: ${e.reporter} ${e.rank} (${e.phone})<br>
    <strong>사고발생일시</strong>: ${e.accDateTime||"-"}<br>
    <strong>사고유형</strong>: ${e.accType} > ${e.accDetail}<br>
    <strong>긴급도</strong>: <span class="${lv.cls}">${lv.text}</span><br>
    <strong>라인중단</strong>: ${e.lineStop} &nbsp;|&nbsp; <strong>고객사 영향</strong>: ${e.customerEffect}<br>
    <strong>접수일시</strong>: ${e.createdAt}
  </div>
  <div style="background:#f5f8fc;border-radius:10px;padding:1rem;margin-bottom:1rem;text-align:left;">
    <div style="font-size:13px;font-weight:700;color:#e05c00;margin-bottom:10px;">📋 후속조치 추가 입력</div>
    <div style="font-size:12px;color:#888;margin-bottom:8px;">초기 접수 후 추가 조치사항이 있으면 입력해 주세요.</div>
    <textarea id="follow-up-text" class="textarea" placeholder="후속조치 내용을 입력해 주세요." style="min-height:80px;font-size:14px;"></textarea>
    <button id="btn-followup" style="width:100%;margin-top:8px;padding:10px;background:#1e2761;color:#fff;border:none;border-radius:9px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;">후속조치 저장</button>
    <div id="followup-msg" style="font-size:12px;color:#2e7d32;margin-top:6px;display:none;">✅ 후속조치가 저장되었습니다.</div>
  </div>`:""}

  <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;">
    <button class="reset-btn" id="btn-reset">${lang==="zh"?"新增事故报告":"새 사고 접수"}</button>
    ${isGuest?`
    <button id="btn-guest-to-login"
      style="padding:11px 28px;background:#1e2761;color:#fff;border:none;border-radius:9px;
      font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;">
      🔐 로그인 / 회원가입
    </button>`:`
    <button id="btn-go-myreport"
      style="padding:11px 28px;background:#1e2761;color:#fff;border:none;border-radius:9px;
      font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;">
      📋 내 접수 조회
    </button>`}
  </div>
</div>`;
}
