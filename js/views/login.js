import { APP_NAME, CONFIGURED } from "../config.js";
import { state } from "../state.js";
import { isWebView } from "../utils.js";

export function renderLogin() {
  const { lang } = state;
  return `
<div style="min-height:100vh;display:flex;flex-direction:column;justify-content:center;
  padding:2rem 1rem;max-width:420px;margin:0 auto;">

  <div style="text-align:center;margin-bottom:2.5rem;">
    <div style="width:72px;height:72px;border-radius:50%;background:#1e2761;
      margin:0 auto 1rem;display:flex;align-items:center;justify-content:center;font-size:32px;">
      🛡️
    </div>
    <div style="font-size:20px;font-weight:700;color:#1a1a1a;margin-bottom:4px;">${lang==="zh"?"现场安全管理系统":APP_NAME}</div>
    <div style="font-size:13px;color:#888;">${lang==="zh"?"登录后可以使用。":"로그인 후 이용하실 수 있습니다."}</div>
  </div>

  ${window._pendingAccNo ? `
  <div style="background:#fff0e0;border:1.5px solid #fcd8a8;border-radius:10px;
    padding:12px 16px;margin-bottom:16px;font-size:13px;color:#e65100;line-height:1.7;">
    <div style="font-weight:700;margin-bottom:3px;">🚨 사고 알림으로 접속하셨습니다.</div>
    로그인 후 사고 상세 내용을 바로 확인할 수 있습니다.<br>
    <span style="font-size:11px;color:#aaa;">${window._pendingAccNo}</span>
  </div>` : ""}

  ${isWebView() ? `
  <div style="background:#fff8f0;border:1.5px solid #fcd8a8;border-radius:10px;
    padding:14px 16px;margin-bottom:16px;font-size:13px;color:#e65100;line-height:1.7;text-align:left;">
    <div style="font-weight:700;margin-bottom:4px;">📱 앱 환경 안내</div>
    Google 계정 로그인은 <strong>크롬 브라우저</strong>에서만 지원됩니다.<br>
    아래 이메일 로그인을 이용하시거나,<br>
    크롬 브라우저에서 접속해 주세요.<br>
    <a href="https://chepp07.github.io/safety001"
      style="color:#1e2761;font-weight:700;display:inline-block;margin-top:6px;">
      🌐 크롬으로 열기
    </a>
  </div>` : `
  <button id="btn-google-login"
    style="width:100%;padding:13px;border:1.5px solid #ddd;border-radius:10px;
    background:#fff;font-size:15px;font-weight:600;color:#333;cursor:pointer;
    font-family:inherit;display:flex;align-items:center;justify-content:center;gap:10px;
    margin-bottom:8px;transition:border-color .15s;">
    <svg width="20" height="20" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
    ${lang==="zh"?"使用Google账号登录":"Google 계정으로 로그인"}
  </button>
  <div style="font-size:11px;color:#bbb;text-align:center;margin-bottom:12px;">
    ※ 카카오톡·앱 내 브라우저에서는 크롬으로 열어 사용해 주세요
  </div>`}

  <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
    <div style="flex:1;height:1px;background:#eee;"></div>
    <span style="font-size:12px;color:#bbb;">${lang==="zh"?"或使用邮箱登录":"또는 이메일로 로그인"}</span>
    <div style="flex:1;height:1px;background:#eee;"></div>
  </div>

  <div class="card" style="margin-bottom:0;">
    <div class="field">
      <div class="label">${lang==="zh"?"邮箱":"이메일"}</div>
      <input id="login-email" class="input" type="email" placeholder="${lang==='zh'?'邮箱地址':'이메일 주소 입력'}"/>
    </div>
    <div class="field">
      <div class="label">${lang==="zh"?"密码":"비밀번호"}</div>
      <input id="login-pw" class="input" type="password" placeholder="${lang==='zh'?'请输入密码':'비밀번호 입력'}"/>
    </div>
    <div id="login-err" style="display:none;font-size:13px;color:#e05c00;margin-bottom:10px;"></div>
    <button id="btn-email-login" class="submit-btn">${lang==="zh"?"登录":"로그인"}</button>
  </div>

  <div style="text-align:center;margin-top:1.25rem;">
    <span style="font-size:13px;color:#888;">${lang==="zh"?"没有账号？":"계정이 없으신가요?"}</span>
    <button id="go-register" style="background:none;border:none;color:#1e2761;font-size:13px;
      font-weight:700;cursor:pointer;font-family:inherit;margin-left:6px;">${lang==="zh"?"注册账号":"회원가입"}</button>
  </div>

  <div style="margin-top:1.5rem;">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
      <div style="flex:1;height:1px;background:#eee;"></div>
      <span style="font-size:12px;color:#bbb;">${lang==="zh"?"紧急情况？":"긴급 상황이신가요?"}</span>
      <div style="flex:1;height:1px;background:#eee;"></div>
    </div>
    <button id="btn-guest-form"
      style="width:100%;padding:13px;border:1.5px solid #e05c00;border-radius:10px;
      background:#fff8f3;font-size:15px;font-weight:700;color:#e05c00;cursor:pointer;
      font-family:inherit;display:flex;align-items:center;justify-content:center;gap:8px;">
      ${lang==="zh"?"🚨 无需登录立即报告事故":"🚨 비회원으로 즉시 사고 접수"}
    </button>
    <div style="text-align:center;margin-top:8px;font-size:11px;color:#bbb;">
      ${lang==="zh"?"无需登录，仅可提交事故报告":"로그인 없이 사고 접수만 가능합니다"}
    </div>
  </div>

  <div style="text-align:center;margin-top:1.5rem;">
    <button id="btn-login-lang"
      style="padding:6px 18px;background:none;border:1.5px solid #eee;border-radius:20px;
      font-size:13px;color:#aaa;cursor:pointer;font-family:inherit;">
      ${lang==="zh"?"🇰🇷 한국어로 전환":"🇨🇳 切换中文"}
    </button>
  </div>
</div>`;
}

export function renderRegister() {
  const { lang } = state;
  return `
<div style="min-height:100vh;display:flex;flex-direction:column;justify-content:center;
  padding:2rem 1rem;max-width:420px;margin:0 auto;">

  <div style="text-align:center;margin-bottom:2rem;">
    <div style="width:72px;height:72px;border-radius:50%;background:#1e2761;
      margin:0 auto 1rem;display:flex;align-items:center;justify-content:center;font-size:32px;">
      🛡️
    </div>
    <div style="font-size:20px;font-weight:700;color:#1a1a1a;margin-bottom:4px;">${lang==="zh"?"注册账号":"회원가입"}</div>
    <div style="font-size:13px;color:#888;">${APP_NAME}</div>
  </div>

  ${isWebView() ? `
  <div style="background:#fff8f0;border:1.5px solid #fcd8a8;border-radius:10px;
    padding:14px 16px;margin-bottom:16px;font-size:13px;color:#e65100;line-height:1.7;text-align:left;">
    <div style="font-weight:700;margin-bottom:4px;">📱 앱 환경 안내</div>
    Google 계정 가입은 <strong>크롬 브라우저</strong>에서만 지원됩니다.<br>
    아래 이메일로 가입하시거나 크롬에서 접속해 주세요.<br>
    <a href="https://chepp07.github.io/safety001"
      style="color:#1e2761;font-weight:700;display:inline-block;margin-top:6px;">
      🌐 크롬으로 열기
    </a>
  </div>` : `
  <button id="btn-google-register"
    style="width:100%;padding:13px;border:1.5px solid #ddd;border-radius:10px;
    background:#fff;font-size:15px;font-weight:600;color:#333;cursor:pointer;
    font-family:inherit;display:flex;align-items:center;justify-content:center;gap:10px;
    margin-bottom:16px;">
    <svg width="20" height="20" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
    Google 계정으로 가입
  </button>`}

  <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
    <div style="flex:1;height:1px;background:#eee;"></div>
    <span style="font-size:12px;color:#bbb;">또는 이메일로 가입</span>
    <div style="flex:1;height:1px;background:#eee;"></div>
  </div>

  <div class="card" style="margin-bottom:0;">
    <div class="field">
      <div class="label">${lang==="zh"?"姓名":"이름"} <span class="req">*</span></div>
      <input id="reg-name" class="input" type="text" placeholder="${lang==="zh"?"请输入姓名":"성함을 입력해 주세요"}" maxlength="20"/>
    </div>
    <div class="field">
      <div class="label">${lang==="zh"?"邮箱":"이메일"} <span class="req">*</span></div>
      <input id="reg-email" class="input" type="email" placeholder="이메일 주소 입력"/>
    </div>
    <div class="field">
      <div class="label">${lang==="zh"?"手机号码":"휴대폰 번호"}</div>
      <input id="reg-phone" class="input" type="tel" inputmode="numeric" placeholder="${lang==="zh"?"用于事故短信通知(可选)":"사고 문자 알림 수신용 (선택)"}"/>
    </div>
    <div class="field">
      <div class="label">${lang==="zh"?"密码":"비밀번호"} <span class="req">*</span></div>
      <input id="reg-pw" class="input" type="password" placeholder="6자리 이상 입력"/>
    </div>
    <div class="field">
      <div class="label">${lang==="zh"?"确认密码":"비밀번호 확인"} <span class="req">*</span></div>
      <input id="reg-pw2" class="input" type="password" placeholder="비밀번호 재입력"/>
    </div>
    <div id="reg-err" style="display:none;font-size:13px;color:#e05c00;margin-bottom:10px;"></div>
    <button id="btn-email-register" class="submit-btn">${lang==="zh"?"注册":"회원가입"}</button>
  </div>

  <div style="text-align:center;margin-top:1.25rem;">
    <span style="font-size:13px;color:#888;">${lang==="zh"?"已有账号？":"이미 계정이 있으신가요?"}</span>
    <button id="go-login" style="background:none;border:none;color:#1e2761;font-size:13px;
      font-weight:700;cursor:pointer;font-family:inherit;margin-left:6px;">${lang==="zh"?"登录":"로그인"}</button>
  </div>
</div>`;
}

export function renderSetupGuide() {
  return `
<div class="setup-banner">
  <strong>⚙️ Firebase 연결 설정이 필요합니다</strong><br><br>
  이 파일을 실제로 사용하려면 Firebase 프로젝트를 연결해야 합니다.<br>
  <strong>1단계</strong> — <a href="https://console.firebase.google.com" target="_blank" style="color:#7a6000;">console.firebase.google.com</a> 접속 → 새 프로젝트 생성<br>
  <strong>2단계</strong> — Realtime Database 활성화 (테스트 모드로 시작)<br>
  <strong>3단계</strong> — 프로젝트 설정 → 앱 추가(웹) → SDK 설정 복사<br>
  <strong>4단계</strong> — <code>js/config.js</code>의 <code>firebaseConfig</code> 부분에 붙여넣기
</div>
<div class="card" style="text-align:center;color:#aaa;font-size:14px;padding:2rem;">
  Firebase 설정 후 이 화면이 사고접수 폼으로 바뀝니다.
</div>`;
}
