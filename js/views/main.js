import { APP_NAME } from "../config.js";
import { state } from "../state.js";

export function renderMain() {
  const { lang, currentUser, isAdmin } = state;
  const userName = currentUser ? (currentUser.displayName || currentUser.email.split("@")[0]) : "";
  const userPhoto = currentUser && currentUser.photoURL;

  return `
<div style="height:100vh;display:flex;flex-direction:column;overflow:hidden;">

  <div style="background:#fff;border-bottom:1px solid #eef2f7;padding:6px 1rem;
    display:flex;align-items:center;justify-content:space-between;flex-shrink:0;">
    <div style="display:flex;align-items:center;gap:8px;">
      ${userPhoto
        ? `<img src="${userPhoto}" style="width:26px;height:26px;border-radius:50%;object-fit:cover;"/>`
        : `<div style="width:26px;height:26px;border-radius:50%;background:#1e2761;
            display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:700;">
            ${userName.charAt(0).toUpperCase()}
          </div>`}
      <div>
        <div style="font-size:12px;font-weight:600;color:#1a1a1a;">${userName}</div>
        <div style="font-size:10px;color:#aaa;">${isAdmin?"🛡️ 관리자":lang==="zh"?"普通用户":"일반 사용자"}</div>
      </div>
    </div>
    <button id="btn-logout"
      style="padding:4px 10px;background:#f5f5f5;border:none;border-radius:6px;
      font-size:11px;color:#888;cursor:pointer;font-family:inherit;">
      ${lang==="zh"?"退出":"로그아웃"}
    </button>
  </div>

  <div style="flex:1;overflow:hidden;display:flex;flex-direction:column;
    padding:0.5rem 1rem 0.3rem;max-width:500px;margin:0 auto;width:100%;">

    <div style="text-align:center;margin-bottom:0.4rem;flex-shrink:0;">
      <div style="width:40px;height:40px;border-radius:50%;background:#1e2761;
        margin:0 auto 0.25rem;display:flex;align-items:center;justify-content:center;font-size:20px;">
        🛡️
      </div>
      <div style="font-size:16px;font-weight:700;color:#1a1a1a;margin-bottom:2px;">${lang==="zh"?"现场安全管理系统":APP_NAME}</div>
      <div style="font-size:11px;color:#aaa;">${lang==="zh"?"光明事业部 安全·质量·物流 综合管理":"광명사업부 안전·품질·물류 통합관리"}</div>
    </div>

    <div style="flex:1;display:flex;flex-direction:column;gap:7px;justify-content:center;">

      <button id="btn-main-form" style="width:100%;padding:0;border:none;background:none;cursor:pointer;font-family:inherit;text-align:left;">
        <div style="background:#fff;border-radius:14px;border:1.5px solid #dce8f4;
          padding:1rem 1.1rem;display:flex;align-items:center;gap:1rem;
          box-shadow:0 2px 8px rgba(0,0,0,.07);">
          <div style="width:50px;height:50px;border-radius:12px;background:#fff0e0;
            display:flex;align-items:center;justify-content:center;font-size:26px;flex-shrink:0;">🚨</div>
          <div style="flex:1;">
            <div style="font-size:17px;font-weight:700;color:#1a1a1a;margin-bottom:3px;">${lang==="zh"?"现场事故报告":"현장 사고 접수"}</div>
            <div style="font-size:12px;color:#888;">${lang==="zh"?"立即报告事故·自动通知负责人":"사고 발생 즉시 접수 · 담당자 자동 알림"}</div>
          </div>
          <div style="color:#ccc;font-size:20px;">›</div>
        </div>
      </button>

      <button id="btn-main-manual" style="width:100%;padding:0;border:none;background:none;cursor:pointer;font-family:inherit;text-align:left;">
        <div style="background:#fff;border-radius:14px;border:1.5px solid #dce8f4;
          padding:1rem 1.1rem;display:flex;align-items:center;gap:1rem;
          box-shadow:0 2px 8px rgba(0,0,0,.07);">
          <div style="width:50px;height:50px;border-radius:12px;background:#e8eef7;
            display:flex;align-items:center;justify-content:center;font-size:26px;flex-shrink:0;">📋</div>
          <div style="flex:1;">
            <div style="font-size:17px;font-weight:700;color:#1a1a1a;margin-bottom:3px;">${lang==="zh"?"事故处理手册":"사고처리 매뉴얼"}</div>
            <div style="font-size:12px;color:#888;">${lang==="zh"?"各类事故处置程序·紧急联系方式":"사고 유형별 대응 절차 · 긴급 연락처"}</div>
          </div>
          <div style="color:#ccc;font-size:20px;">›</div>
        </div>
      </button>

      <button id="btn-main-suggest" style="width:100%;padding:0;border:none;background:none;cursor:pointer;font-family:inherit;text-align:left;">
        <div style="background:#fff;border-radius:14px;border:1.5px solid #dce8f4;
          padding:1rem 1.1rem;display:flex;align-items:center;gap:1rem;
          box-shadow:0 2px 8px rgba(0,0,0,.07);">
          <div style="width:50px;height:50px;border-radius:12px;background:#e8f5e9;
            display:flex;align-items:center;justify-content:center;font-size:26px;flex-shrink:0;">💡</div>
          <div style="flex:1;">
            <div style="font-size:17px;font-weight:700;color:#1a1a1a;margin-bottom:3px;">${lang==="zh"?"安全改进建议":"안전개선 제안"}</div>
            <div style="font-size:12px;color:#888;">${lang==="zh"?"现场改进想法·危险因素报告":"현장 개선 아이디어 · 위험요소 신고"}</div>
          </div>
          <div style="color:#ccc;font-size:20px;">›</div>
        </div>
      </button>

      ${isAdmin?`
      <button id="btn-main-admin" style="width:100%;padding:0;border:none;background:none;cursor:pointer;font-family:inherit;text-align:left;">
        <div style="background:#1e2761;border-radius:14px;
          padding:1rem 1.1rem;display:flex;align-items:center;gap:1rem;
          box-shadow:0 3px 10px rgba(0,0,0,.2);">
          <div style="width:50px;height:50px;border-radius:12px;background:rgba(255,255,255,.15);
            display:flex;align-items:center;justify-content:center;font-size:26px;flex-shrink:0;">🛡️</div>
          <div style="flex:1;">
            <div style="font-size:17px;font-weight:700;color:#fff;margin-bottom:3px;">${lang==="zh"?"管理员仪表盘":"관리자 대시보드"}</div>
            <div style="font-size:12px;color:rgba(255,255,255,.65);">${lang==="zh"?"全部事故现况·统计·管理":"전체 사고 현황 · 통계 · 관리"}</div>
          </div>
          <div style="color:rgba(255,255,255,.4);font-size:20px;">›</div>
        </div>
      </button>

      <button id="btn-main-risk" style="width:100%;padding:0;border:none;background:none;cursor:pointer;font-family:inherit;text-align:left;">
        <div style="background:#fff;border-radius:14px;border:1.5px solid #c9d9ef;
          padding:1rem 1.1rem;display:flex;align-items:center;gap:1rem;
          box-shadow:0 2px 8px rgba(0,0,0,.07);">
          <div style="width:50px;height:50px;border-radius:12px;background:#eaf0fb;
            display:flex;align-items:center;justify-content:center;font-size:26px;flex-shrink:0;">📑</div>
          <div style="flex:1;">
            <div style="font-size:17px;font-weight:700;color:#1a1a1a;margin-bottom:3px;">${lang==="zh"?"临时风险评估":"수시 위험성평가"}</div>
            <div style="font-size:12px;color:#888;">${lang==="zh"?"事故后法定风险评估·完成报告生成":"사고 후 법정 위험성평가 · 완료보고서 생성"}</div>
          </div>
          <div style="color:#ccc;font-size:20px;">›</div>
        </div>
      </button>`:""}

      <div style="display:flex;align-items:center;justify-content:center;gap:10px;padding:2px 0;">
        <button class="admin-link" id="go-myreport-main" style="font-size:13px;color:#999;">${lang==="zh"?"📋 我的报告查询":"📋 내 접수 조회"}</button>
        <span style="color:#ddd;font-size:14px;">|</span>
        <button id="btn-main-lang-bottom"
          style="padding:4px 12px;background:#f0f4ff;border:1.5px solid #dce8f4;border-radius:20px;
          font-size:12px;font-weight:700;color:#1e2761;cursor:pointer;font-family:inherit;">
          ${lang==="zh"?"🇰🇷 한국어":"🇨🇳 中文"}
        </button>
      </div>

    </div>
  </div>
</div>`;
}
