import { SITES } from "../config.js";
import { state } from "../state.js";

export function renderSuggest() {
  const { lang } = state;
  const sug = window._suggest || {
    site:"", category:"", title:"", detail:"",
    anonymous:false, name:"", phone:"", submitted:false
  };

  if(sug.submitted) return `
<div class="page" style="max-width:580px;">
  <div class="success-wrap">
    <div class="success-icon">💡</div>
    <div class="success-title">${lang==="zh"?"建议已提交！":"제안이 접수되었습니다!"}</div>
    <div class="success-desc">${lang==="zh"?"感谢您的宝贵意见。<br>审核后将反映到改进活动中。":"소중한 의견 감사합니다.<br>검토 후 개선 활동에 반영하겠습니다."}</div>
    <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:1rem;">
      <button id="btn-suggest-another" style="padding:11px 24px;background:#2e7d32;color:#fff;
        border:none;border-radius:9px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;">
        ${lang==="zh"?"再次提交":"추가 제안하기"}
      </button>
      <button id="btn-suggest-back" style="padding:11px 24px;background:#f5f5f5;border:none;
        border-radius:9px;font-size:14px;color:#666;cursor:pointer;font-family:inherit;">
        ${lang==="zh"?"返回主页":"메인으로"}
      </button>
    </div>
  </div>
</div>`;

  const categories = lang==="zh"
    ? ["安全设施改善","作业环境改善","危险因素报告","业务流程改善","其他"]
    : ["안전설비 개선","작업환경 개선","위험요소 신고","업무프로세스 개선","기타"];
  const categoriesKo = ["안전설비 개선","작업환경 개선","위험요소 신고","업무프로세스 개선","기타"];

  const siteLabelsZh = {
    "광명1범퍼사업소":"光明1保险杠","광명2범퍼사업소":"光明2保险杠",
    "광명1서열사업소":"光明1序列","광명2서열사업소":"光明2序列",
    "광명JIT사업소":"光明JIT","광명장비사업소":"光明设备","기타":"其他"
  };

  return `
<div class="page" style="max-width:580px;">
  <div style="display:flex;align-items:center;gap:10px;margin-bottom:1.5rem;">
    <button id="btn-suggest-back-top" style="background:none;border:none;cursor:pointer;font-size:22px;color:#888;padding:4px;">‹</button>
    <div>
      <div style="font-size:18px;font-weight:700;">${lang==="zh"?"安全改进建议":"안전개선 제안"}</div>
      <div style="font-size:12px;color:#aaa;">${lang==="zh"?"现场改进想法·危险因素报告":"현장 개선 아이디어 · 위험요소 신고"}</div>
    </div>
  </div>

  <div class="card">
    <div class="section-title">📍 ${lang==="zh"?"基本信息":"기본 정보"}</div>
    <div class="field">
      <div class="label">${lang==="zh"?"事业所":"사업소"} <span class="req">*</span></div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;">
        ${SITES.map(s=>`
        <button type="button" class="radio-btn${sug.site===s?" on":""}" data-sug-site="${s}"
          style="font-size:13px;padding:7px 12px;">
          ${lang==="zh"?siteLabelsZh[s]||s:s}
        </button>`).join("")}
      </div>
    </div>
    <div class="field">
      <div class="label">${lang==="zh"?"建议分类":"제안 분류"} <span class="req">*</span></div>
      <div class="radio-row" style="flex-wrap:wrap;">
        ${categories.map((c,idx)=>`
        <button class="radio-btn${sug.category===categoriesKo[idx]||sug.category===c?" on":""}"
          data-sug-cat="${categoriesKo[idx]}">${c}</button>`).join("")}
      </div>
    </div>
  </div>

  <div class="card">
    <div class="section-title">💡 ${lang==="zh"?"建议内容":"제안 내용"}</div>
    <div class="field">
      <div class="label">${lang==="zh"?"建议标题":"제안 제목"} <span class="req">*</span></div>
      <input id="sug-title" class="input" value="${sug.title}"
        placeholder="${lang==="zh"?"请用一句话概括建议内容":"제안 내용을 한 줄로 요약해 주세요."}" maxlength="60"/>
    </div>
    <div class="field">
      <div class="label">${lang==="zh"?"详细内容":"상세 내용"} <span class="req">*</span></div>
      <textarea id="sug-detail" class="textarea" style="min-height:120px;"
        placeholder="${lang==="zh"?"请具体描述当前问题和改进方向。":"현재 문제점과 개선 방향을 구체적으로 작성해 주세요."}">${sug.detail}</textarea>
    </div>
  </div>

  <div class="card">
    <div class="section-title">👤 ${lang==="zh"?"建议人信息":"제안자 정보"}</div>
    <div class="field">
      <label style="display:flex;align-items:center;gap:10px;cursor:pointer;
        padding:10px 12px;background:${sug.anonymous?"#f0faf0":"#f5f8fc"};
        border:1.5px solid ${sug.anonymous?"#2e7d32":"#ddd"};border-radius:9px;">
        <input type="checkbox" id="sug-anon" ${sug.anonymous?"checked":""}
          style="width:17px;height:17px;accent-color:#2e7d32;cursor:pointer;"/>
        <div>
          <div style="font-size:14px;font-weight:600;color:${sug.anonymous?"#2e7d32":"#555"};">
            ${lang==="zh"?"匿名建议":"익명 제안"}
          </div>
          <div style="font-size:12px;color:#999;">
            ${lang==="zh"?"不公开姓名和联系方式。":"이름과 연락처를 공개하지 않습니다."}
          </div>
        </div>
      </label>
    </div>
    ${!sug.anonymous?`
    <div class="field">
      <div class="label">${lang==="zh"?"姓名":"성명"}</div>
      <input id="sug-name" class="input" value="${sug.name}"
        placeholder="${lang==="zh"?"姓名 (可选)":"성함 (선택)"}" maxlength="20"/>
    </div>
    <div class="field">
      <div class="label">${lang==="zh"?"联系方式":"연락처"}</div>
      <input id="sug-phone" class="input" value="${sug.phone}"
        placeholder="${lang==="zh"?"手机号码 (可选)":"010-0000-0000 (선택)"}" type="tel"/>
    </div>`:""}
  </div>

  <div id="sug-err" style="display:none;" class="err-banner"></div>

  <button id="btn-suggest-submit" class="submit-btn" style="background:#2e7d32;">
    <span style="font-size:18px;">💡</span> ${lang==="zh"?"提交建议":"제안 접수하기"}
  </button>
</div>`;
}
