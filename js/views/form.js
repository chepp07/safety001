import { SITES, T } from "../config.js";
import { state } from "../state.js";
import { t } from "../utils.js";

export function renderForm() {
  const { lang, form, errors: e, saving, isGuest, isAdmin } = state;
  const accDetailMap = T[lang].accDetailMap;
  const accTypes = T[lang].accTypes;

  const siteLabelsZh = {
    "광명1범퍼사업소":"光明1保险杠","광명2범퍼사업소":"光明2保险杠",
    "광명1서열사업소":"光明1序列","광명2서열사업소":"光明2序列",
    "광명JIT사업소":"光明JIT","광명장비사업소":"光明设备","기타":"其他"
  };

  const accTypeOpts = accTypes.map(tp=>`
    <button class="radio-btn${form.isComplex ? (form.accTypes.includes(tp)?" on":"") : (form.accType===tp?" on":"")}"
      data-type-btn="${tp}">${tp}</button>`).join("");

  const getDetailDesc = (type, detailVal) => {
    const list = accDetailMap[type] || [];
    const found = list.find(d => d.val === detailVal);
    return found ? found.desc : "";
  };

  let selectedDetailDesc = "";
  if(!form.isComplex && form.accDetail){
    selectedDetailDesc = getDetailDesc(form.accType, form.accDetail);
  } else if(form.isComplex && form.accDetails.length > 0){
    const lastDetail = form.accDetails[form.accDetails.length - 1];
    for(const tp of form.accTypes){
      const desc = getDetailDesc(tp, lastDetail);
      if(desc){ selectedDetailDesc = desc; break; }
    }
  }

  const activeTypes = form.isComplex ? form.accTypes : (form.accType ? [form.accType] : []);
  const detailBtns = activeTypes.length > 0
    ? activeTypes.map(tp => {
        const details = accDetailMap[tp] || [];
        return `<div style="margin-bottom:8px;">
          <div style="font-size:11px;font-weight:700;color:#888;margin-bottom:6px;padding:2px 8px;background:#f0f4f8;border-radius:5px;display:inline-block;">${tp}</div>
          <div class="radio-row" style="flex-wrap:wrap;">
            ${details.map(d => {
              const isOn = form.isComplex ? form.accDetails.includes(d.val) : form.accDetail===d.val;
              return `<button class="radio-btn${isOn?" on":""}" data-detail-btn="${d.val}" data-detail-type="${tp}">${d.val}</button>`;
            }).join("")}
          </div>
        </div>`;
      }).join("")
    : `<div style="font-size:13px;color:#bbb;padding:4px 0;">${lang==="zh"?"请先选择事故类型。":"사고 유형을 먼저 선택해 주세요."}</div>`;

  const levelBtns = [
    {lv:"1", cls:"lv1", badge:lang==="zh"?"最紧急":"최긴급", desc:lang==="zh"?"人员伤亡·停线·客户需立即响应":"인명피해·라인중단·고객사 즉시 대응 필요"},
    {lv:"2", cls:"lv2", badge:lang==="zh"?"紧急":"긴급", desc:lang==="zh"?"可能影响生产·处理后30分钟内报告":"생산 차질 가능·수습 후 30분 내 보고"},
    {lv:"3", cls:"lv3", badge:lang==="zh"?"一般":"일반", desc:lang==="zh"?"不影响生产·含定期报告":"생산 영향 없음·정기 보고 포함"}
  ].map(l=>`
    <button class="level-btn ${l.cls}${form.level===l.lv?" on":""}" data-lv="${l.lv}">
      <span class="lv-badge">Level ${l.lv} ${l.badge}</span>
      <div class="level-btn-inner">
        <span style="font-size:14px;font-weight:600;color:#333;">Level ${l.lv} — ${l.badge}</span>
        <span class="lv-desc">${l.desc}</span>
      </div>
    </button>`).join("");

  const yesNoBtns = (field, val) => {
    const pairs = lang==="zh" ? [["예","是"],["아니오","否"]] : [["예","예"],["아니오","아니오"]];
    return pairs.map(([v, label])=>`
    <button class="radio-btn${val===v?" on":""}" data-field="${field}" data-val="${v}">${label}</button>`).join("");
  };

  const chkItems = T[lang].checks.map((txt,i)=>`
    <label class="chk-item">
      <input type="checkbox" data-chk="${i}" ${form.checks[i]?"checked":""}/>
      <span>${txt}</span>
    </label>`).join("");

  return `
<div class="header">
  <div style="display:flex;justify-content:flex-end;margin-bottom:8px;">
    <button id="btn-lang-toggle"
      style="padding:6px 16px;border:1.5px solid #dce8f4;border-radius:20px;
      background:#fff;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;
      color:#1e2761;display:flex;align-items:center;gap:6px;box-shadow:0 1px 4px rgba(0,0,0,.08);">
      ${t("langBtn")}
    </button>
  </div>
  <div class="icon-wrap">🚨</div>
  <div class="form-title">${t("formTitle")}</div>
  <div class="form-desc">${lang==="zh"
    ? "发生事故后请立即填写。<br>Level 1·2 请同时进行电话报告。"
    : "사고 발생 즉시 아래 항목을 입력해 주세요.<br>접수 즉시 담당자에게 자동으로 통보됩니다."}</div>
  <div class="notice-box">
    ${lang==="zh"
      ? "<b>※</b> 发生人员伤亡·停线时立即报告并控制现场<br><b>※</b> 照片必须保持现场原状拍摄后另行发送<br><b>※</b> 虚假·迟报对事故应对有致命影响"
      : "<b>※</b> 인명피해·라인중단 발생 시 즉시 보고 후 현장 통제<br><b>※</b> 사진은 반드시 현장 상태 그대로 촬영 후 별도 공유<br><b>※</b> 허위·지연 보고는 사고 대응에 치명적 영향을 줍니다"}
  </div>
</div>

<!-- 기본정보 -->
<div class="card">
  <div class="section-title">${t("secReporter")}</div>

  <div class="field">
    <div class="label">${lang==="zh"?"事业所":"사업소"} <span class="req">*</span></div>
    <div style="display:flex;flex-wrap:wrap;gap:6px;" id="site-btns-wrap">
      ${SITES.map(s=>`
      <button type="button" class="radio-btn${form.site===s?" on":""}" data-site-btn="${s}"
        style="font-size:13px;padding:7px 12px;">
        ${lang==="zh"?siteLabelsZh[s]||s:s}
      </button>`).join("")}
    </div>
    ${e.site?`<div class="err-msg">${e.site}</div>`:""}
  </div>

  <div class="field">
    <div class="label">${lang==="zh"?"报告人姓名":"접수자 성명"} <span class="req">*</span></div>
    <input id="f-reporter" class="input${e.reporter?" err":""}" value="${form.reporter}" placeholder="${lang==='zh'?'请输入姓名':'성함을 입력해 주세요'}" maxlength="20"/>
    ${e.reporter?`<div class="err-msg">${e.reporter}</div>`:""}
  </div>

  <div class="field">
    <div class="label">${lang==="zh"?"职级":"직급"} <span class="req">*</span></div>
    <select id="f-rank" class="select${e.rank?" err":""}">
      <option value="">${lang==="zh"?"请选择职级":"직급 선택"}</option>
      ${T[lang].ranks.map(r=>`<option value="${r}"${form.rank===r?" selected":""}>${r}</option>`).join("")}
    </select>
    ${e.rank?`<div class="err-msg">${e.rank}</div>`:""}
  </div>

  <div class="field">
    <div class="label">${lang==="zh"?"联系电话":"접수자 연락처"} <span class="req">*</span></div>
    <input id="f-phone" class="input${e.phone?" err":""}" value="${form.phone}" placeholder="${lang==='zh'?'手机号码':'010-0000-0000'}" type="tel"/>
    ${e.phone?`<div class="err-msg">${e.phone}</div>`:""}
  </div>

  <div class="field">
    <div class="label">${lang==="zh"?"事故发生时间":"사고 발생 일시"} <span class="req">*</span>
      <span style="font-size:11px;color:#aaa;font-weight:400;margin-left:4px;">${lang==="zh"?"自动填入当前时间，如需修改请编辑":"현재 시각 자동 입력 — 필요 시 수정"}</span>
    </div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;">
      <select id="f-acc-year" class="select${e.accYear?" err":""}" style="flex:1;min-width:80px;">
        <option value="">${lang==="zh"?"年":"년도"}</option>
        ${[2024,2025,2026,2027].map(y=>`<option value="${y}"${form.accYear===String(y)?" selected":""}>${lang==="zh"?y+"年":y+"년"}</option>`).join("")}
      </select>
      <select id="f-acc-month" class="select${e.accMonth?" err":""}" style="flex:1;min-width:60px;">
        <option value="">${lang==="zh"?"月":"월"}</option>
        ${Array.from({length:12},(_,i)=>i+1).map(m=>`<option value="${String(m).padStart(2,'0')}"${form.accMonth===String(m).padStart(2,'0')?" selected":""}>${lang==="zh"?m+"月":m+"월"}</option>`).join("")}
      </select>
      <select id="f-acc-day" class="select${e.accDay?" err":""}" style="flex:1;min-width:60px;">
        <option value="">${lang==="zh"?"日":"일"}</option>
        ${Array.from({length:31},(_,i)=>i+1).map(d=>`<option value="${String(d).padStart(2,'0')}"${form.accDay===String(d).padStart(2,'0')?" selected":""}>${lang==="zh"?d+"日":d+"일"}</option>`).join("")}
      </select>
    </div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-top:6px;">
      <select id="f-acc-ampm" class="select" style="flex:1;min-width:70px;">
        ${(lang==="zh"?[["오전","上午"],["오후","下午"]]:[["오전","오전"],["오후","오후"]]).map(([v,label])=>`<option value="${v}"${form.accAmPm===v?" selected":""}>${label}</option>`).join("")}
      </select>
      <select id="f-acc-hour" class="select${e.accHour?" err":""}" style="flex:1;min-width:60px;">
        <option value="">${lang==="zh"?"时":"시"}</option>
        ${Array.from({length:12},(_,i)=>i+1).map(h=>`<option value="${String(h).padStart(2,'0')}"${form.accHour===String(h).padStart(2,'0')?" selected":""}>${lang==="zh"?h+"时":h+"시"}</option>`).join("")}
      </select>
      <select id="f-acc-min" class="select${e.accMin?" err":""}" style="flex:1;min-width:60px;">
        <option value="">${lang==="zh"?"分":"분"}</option>
        ${Array.from({length:12},(_,i)=>i*5).map(m=>`<option value="${String(m).padStart(2,'0')}"${form.accMin===String(m).padStart(2,'0')?" selected":""}>${String(m).padStart(2,'0')}${lang==="zh"?"分":"분"}</option>`).join("")}
      </select>
    </div>
    ${e.accYear||e.accHour?`<div class="err-msg">${lang==="zh"?"请输入事故发生时间":"사고 발생 일시를 입력해 주세요."}</div>`:""}
  </div>

  <div class="field">
    <div class="label">${lang==="zh"?"事故发生地点":"사고 발생 위치"} <span class="req">*</span></div>
    <input id="f-location" class="input${e.location?" err":""}" value="${form.location}" placeholder="${lang==="zh"?"例: 1工厂对接区3号线":"예: 1공장 도킹존 3번 라인"}" maxlength="60"/>
    ${e.location?`<div class="err-msg">${e.location}</div>`:""}
  </div>
</div>

<!-- 사고분류 -->
<div class="card">
  <div class="section-title">${t("secClass")}</div>

  <div class="field" style="margin-bottom:14px;">
    <label style="display:flex;align-items:center;gap:10px;cursor:pointer;padding:10px 12px;background:${form.isComplex?"#fff3eb":"#f5f8fc"};border:1.5px solid ${form.isComplex?"#e05c00":"#ddd"};border-radius:9px;">
      <input type="checkbox" id="chk-complex" ${form.isComplex?"checked":""} style="width:17px;height:17px;accent-color:#e05c00;cursor:pointer;flex-shrink:0;"/>
      <div>
        <div style="font-size:14px;font-weight:600;color:${form.isComplex?"#e05c00":"#555"};">${lang==="zh"?"复合事故":"복합사고"}</div>
        <div style="font-size:12px;color:#999;margin-top:1px;">${lang==="zh"?"同时发生两种以上事故类型时勾选":"2가지 이상의 사고 유형이 동시에 발생한 경우 체크"}</div>
      </div>
    </label>
  </div>

  <div class="field">
    <div class="label">${lang==="zh"?"事故类型":"사고 유형"} <span class="req">*</span>
      ${form.isComplex?`<span style="font-size:11px;color:#e05c00;font-weight:400;margin-left:4px;">${lang==="zh"?"复合事故 — 可多选":"복합사고 — 중복선택 가능"}</span>`:""}
    </div>
    <div class="radio-row">${accTypeOpts}</div>
    ${e.accType?`<div class="err-msg">${e.accType}</div>`:""}
  </div>

  <div class="field">
    <div class="label">${lang==="zh"?"细分类型":"세부 유형"} <span class="req">*</span>
      ${form.isComplex?`<span style="font-size:11px;color:#e05c00;font-weight:400;margin-left:4px;">${lang==="zh"?"复合事故 — 可多选":"복합사고 — 중복선택 가능"}</span>`:""}
    </div>
    <div id="detail-btns-wrap">${detailBtns}</div>
    ${selectedDetailDesc ? `
    <div style="margin-top:8px;background:#f0f4ff;border-left:3px solid #1e2761;border-radius:0 8px 8px 0;
      padding:8px 12px;font-size:12px;color:#1e2761;line-height:1.6;">
      <span style="font-weight:700;">ℹ️ </span>${selectedDetailDesc}
    </div>` : ""}
    ${e.accDetail?`<div class="err-msg">${e.accDetail}</div>`:""}
  </div>
</div>

<!-- 긴급도 -->
<div class="card">
  <div class="section-title">${lang==="zh"?"⚡ 紧急程度判断":"⚡ 긴급도 판단"}</div>

  <div class="field">
    <div class="label">${lang==="zh"?"紧急程度":"긴급도 선택"} <span class="req">*</span></div>
    <div class="level-row">${levelBtns}</div>
    ${e.level?`<div class="err-msg">${e.level}</div>`:""}
  </div>

  <div class="field">
    <div class="label">${lang==="zh"?"停线情况":"라인중단 여부"} <span class="req">*</span></div>
    <div style="display:flex;flex-direction:column;gap:8px;">
      ${T[lang].lineStops.map(o=>`
      <button data-field="lineStop" data-val="${o.val}"
        style="width:100%;padding:10px 14px;border-radius:9px;border:1.5px solid ${form.lineStop===o.val?o.color:o.border};
               background:${form.lineStop===o.val?o.bg:"#fff"};
               cursor:pointer;font-family:inherit;text-align:left;display:flex;align-items:center;gap:10px;transition:all .15s;">
        <span style="width:10px;height:10px;border-radius:50%;background:${o.color};flex-shrink:0;"></span>
        <span style="font-size:13px;font-weight:${form.lineStop===o.val?"700":"500"};color:${form.lineStop===o.val?o.color:"#444"};">${lang==="zh"?{"라인중단발생":"停线发生","라인중단예상":"停线预期","미장착":"未装配","라인영향없음":"无停线影响"}[o.val]||o.val:o.val}</span>
        <span style="font-size:11px;color:#aaa;margin-left:4px;">${o.desc}</span>
      </button>`).join("")}
    </div>
    ${e.lineStop?`<div class="err-msg">${e.lineStop}</div>`:""}
  </div>

  <div class="field">
    <div class="label">${lang==="zh"?"客户影响":"고객사 영향 여부"} <span class="req">*</span></div>
    <div class="radio-row">${yesNoBtns("customerEffect", form.customerEffect)}</div>
    ${e.customerEffect?`<div class="err-msg">${e.customerEffect}</div>`:""}
  </div>
</div>

<!-- 인사사고 대상자 -->
${(form.isComplex ? form.accTypes.includes("인사사고") : form.accType==="인사사고")?`
<div class="card">
  <div class="section-title">🧑‍⚕️ ${lang==="zh"?"事故人员":"사고 대상자"}</div>

  <div class="field">
    <div class="label">${lang==="zh"?"事故类型":"사고 유형 구분"} <span class="req">*</span></div>
    <div class="radio-row">
      ${(lang==="zh"?[["단독사고","单方事故"],["쌍방사고","双方事故"]]:[["단독사고","단독사고"],["쌍방사고","쌍방사고"]]).map(([v,label])=>`
        <button class="radio-btn${form.accidentType===v?" on":""}" data-field="accidentType" data-val="${v}">${label}</button>`).join("")}
    </div>
    ${e.accidentType?`<div class="err-msg">${e.accidentType}</div>`:""}
  </div>

  <div class="field">
    <div class="label">${lang==="zh"?"受害者":"피해자"} <span class="req">*</span></div>
    <div id="victims-wrap">
      ${form.victims.map((v,i)=>`
      <div style="background:#fff8f8;border:1px solid #f5c6c6;border-radius:9px;padding:12px;margin-bottom:8px;">
        <div style="display:flex;gap:8px;margin-bottom:8px;align-items:center;">
          <input class="input victim-name" data-vi="${i}" value="${v.name}" placeholder="${lang==='zh'?'姓名':'성명'}" style="flex:1;" ${v.unknown?"disabled":""}/>
          <input class="input victim-aff" data-vi="${i}" value="${v.affiliation}" placeholder="${lang==='zh'?'所属':'소속'}" style="flex:1;" ${v.unknown?"disabled":""}/>
          ${i>0?`<button onclick="removePerson('victims',${i})" style="background:none;border:none;color:#ccc;font-size:18px;cursor:pointer;flex-shrink:0;">✕</button>`:""}
        </div>
        <label style="display:flex;align-items:center;gap:8px;font-size:13px;color:#888;cursor:pointer;">
          <input type="checkbox" class="victim-unknown" data-vi="${i}" ${v.unknown?"checked":""} style="accent-color:#e05c00;width:15px;height:15px;"/>
          인적사항 미확인
        </label>
      </div>`).join("")}
    </div>
    <button onclick="addPerson('victims')" style="width:100%;padding:9px;border:1.5px dashed #ddd;border-radius:9px;background:none;font-size:13px;color:#888;cursor:pointer;margin-top:4px;">${lang==="zh"?"+ 添加受害者":"+ 피해자 추가"}</button>
    ${e.victims?`<div class="err-msg">${e.victims}</div>`:""}
  </div>

  ${form.accidentType==="쌍방사고"?`
  <div class="field">
    <div class="label">${lang==="zh"?"肇事者":"가해자"} <span class="req">*</span></div>
    <div id="perps-wrap">
      ${form.perpetrators.map((p,i)=>`
      <div style="background:#f8f8ff;border:1px solid #c6c6f5;border-radius:9px;padding:12px;margin-bottom:8px;">
        <div style="display:flex;gap:8px;margin-bottom:8px;align-items:center;">
          <input class="input perp-name" data-pi="${i}" value="${p.name}" placeholder="성명" style="flex:1;" ${p.unknown?"disabled":""}/>
          <input class="input perp-aff" data-pi="${i}" value="${p.affiliation}" placeholder="소속" style="flex:1;" ${p.unknown?"disabled":""}/>
          ${i>0?`<button onclick="removePerson('perpetrators',${i})" style="background:none;border:none;color:#ccc;font-size:18px;cursor:pointer;flex-shrink:0;">✕</button>`:""}
        </div>
        <label style="display:flex;align-items:center;gap:8px;font-size:13px;color:#888;cursor:pointer;">
          <input type="checkbox" class="perp-unknown" data-pi="${i}" ${p.unknown?"checked":""} style="accent-color:#e05c00;width:15px;height:15px;"/>
          인적사항 미확인
        </label>
      </div>`).join("")}
    </div>
    <button onclick="addPerson('perpetrators')" style="width:100%;padding:9px;border:1.5px dashed #ddd;border-radius:9px;background:none;font-size:13px;color:#888;cursor:pointer;margin-top:4px;">${lang==="zh"?"+ 添加肇事者":"+ 가해자 추가"}</button>
    ${e.perpetrators?`<div class="err-msg">${e.perpetrators}</div>`:""}
  </div>`:""}
</div>`:""}

<!-- 상황 및 조치 -->
<div class="card">
  <div class="section-title" style="display:flex;align-items:center;justify-content:space-between;">
    <span>${t("secAction")}</span>
    <button id="btn-voice-start" ${form._voiceProcessing?"disabled":""}
      style="display:flex;align-items:center;gap:6px;padding:7px 14px;
      background:${form._voiceOn?"#e05c00":form._voiceProcessing?"#2e7d32":"#1e2761"};
      color:#fff;border:none;border-radius:20px;
      font-size:12px;font-weight:700;cursor:${form._voiceProcessing?"default":"pointer"};font-family:inherit;">
      ${form._voiceProcessing
        ? `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#fff;animation:pulse 0.6s infinite;"></span>
           ${lang==="zh"?"AI整理中...":"AI 정리 중..."}`
        : form._voiceOn
        ? `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#fff;animation:pulse 1s infinite;"></span>
           ${lang==="zh"?"识别中... (点击停止)":"인식 중... (탭하여 중지)"}`
        : `🎤 ${lang==="zh"?"语音快速输入":"음성으로 빠른 입력"}`}
    </button>
  </div>

  ${form._voiceProcessing ? `
  <div style="background:#f0faf0;border:1.5px solid #2e7d32;border-radius:9px;padding:12px 14px;margin-bottom:12px;line-height:1.6;">
    <div style="font-weight:700;color:#2e7d32;margin-bottom:4px;font-size:13px;">
      🤖 ${lang==="zh"?"AI正在整理语音内容，请稍候...":"AI가 음성 내용을 보고서 형식으로 정리 중..."}
    </div>
    <div style="font-size:11px;color:#888;">
      ${lang==="zh"?"识别的内容将自动整理为事故报告格式。":"인식된 내용을 사고 보고서 형식에 맞게 자동 정리합니다."}
    </div>
  </div>` : ""}

  ${form._voiceOn ? `
  <div style="background:#fff3eb;border:1.5px solid #e05c00;border-radius:9px;padding:12px 14px;margin-bottom:12px;font-size:13px;color:#e05c00;line-height:1.6;">
    <div style="font-weight:700;margin-bottom:8px;font-size:14px;">
      🎤 ${lang==="zh"?"请您说话！":"지금 말씀해 주세요!"}
    </div>
    <div style="background:#fff;border-radius:7px;padding:10px 12px;margin-bottom:8px;">
      <div style="font-size:11px;font-weight:700;color:#888;margin-bottom:6px;">
        💬 ${lang==="zh"?"请按以下顺序说明：":"아래 순서대로 말하면 됩니다"}
      </div>
      ${T[lang].voiceGuideItems.map((g,i)=>`
      <div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:5px;">
        <span style="background:#e05c00;color:#fff;font-size:10px;font-weight:700;
          min-width:18px;height:18px;border-radius:50%;display:flex;align-items:center;
          justify-content:center;flex-shrink:0;margin-top:1px;">${i+1}</span>
        <div style="font-size:12px;">
          <span style="font-weight:700;color:#333;">${g.label}</span>
          <span style="color:#aaa;"> — ${lang==="zh"?"例":"예"}) ${g.ex}</span>
        </div>
      </div>`).join("")}
    </div>
    <div style="font-size:11px;color:#aaa;text-align:center;">
      🤖 ${lang==="zh"?"说完后 AI 将自动整理为报告格式":"말씀 후 AI가 자동으로 보고서 형식으로 정리해 드립니다"}
    </div>
  </div>` : ""}

  <div class="field">
    <div class="label">${t("situation")} <span class="req">*</span></div>
    <textarea id="f-situation" class="textarea${e.situation?" err":""}"
      placeholder="${lang==="zh"?"请简要描述事故经过和当前状况。":"사고 발생 경위 및 현재 상황을 간략히 기술해 주세요."}">${form.situation}</textarea>
    ${e.situation?`<div class="err-msg">${e.situation}</div>`:""}
  </div>

  <div class="field">
    <div class="label">${t("action")}</div>
    <textarea id="f-action" class="textarea" placeholder="${lang==="zh"?"请填写已采取的即时措施。(无则填写'无')":"취한 즉시 조치를 입력해 주세요. (없으면 '없음' 입력)"}">${form.actionTaken}</textarea>
  </div>

  <div class="field">
    <div class="label">${t("support")}</div>
    <textarea id="f-support" class="textarea" placeholder="${lang==="zh"?"例：请求安全团队到场 (无则填写'无')":"예: 안전팀 현장 출동 요청, 대체품 긴급 수배 등 (없으면 '없음' 입력)"}">${form.supportNeeded}</textarea>
  </div>
</div>

<!-- 사진 첨부 -->
<div class="card">
  <div class="section-title">${lang==="zh"?"📷 现场照片":"📷 현장 사진 첨부"}</div>
  <div style="font-size:12px;color:#aaa;margin-bottom:12px;">${lang==="zh"?"最多可附3张 · 支持JPG, PNG, GIF":"최대 3장까지 첨부 가능 · JPG, PNG, GIF 지원"}</div>

  ${form.photosPreviews.length>0?`
  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
    ${form.photosPreviews.map((src,i)=>`
    <div style="position:relative;width:90px;height:90px;">
      <img src="${src}" style="width:90px;height:90px;object-fit:cover;border-radius:8px;border:1px solid #dce8f4;"/>
      <button onclick="removePhoto(${i})"
        style="position:absolute;top:-6px;right:-6px;width:20px;height:20px;
        background:#e05c00;color:#fff;border:none;border-radius:50%;
        font-size:12px;cursor:pointer;line-height:20px;text-align:center;padding:0;">✕</button>
      ${form.photos[i]==="uploading"?`
      <div style="position:absolute;inset:0;background:rgba(0,0,0,.45);border-radius:8px;
        display:flex;align-items:center;justify-content:center;">
        <div style="color:#fff;font-size:10px;font-weight:700;">업로드중...</div>
      </div>`:""}
    </div>`).join("")}
  </div>`:""}

  ${form.photosPreviews.length<3?`
  <label style="display:flex;align-items:center;justify-content:center;gap:8px;
    width:100%;padding:12px;border:1.5px dashed #ddd;border-radius:9px;
    background:#fafafa;cursor:pointer;font-size:14px;color:#888;transition:border-color .15s;">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
    ${lang==="zh"?"选择照片("+form.photosPreviews.length+"/3)":"사진 선택 ("+form.photosPreviews.length+"/3)"}
    <input type="file" id="photo-input" accept="image/*" multiple style="display:none;"/>
  </label>`:`
  <div style="text-align:center;font-size:13px;color:#aaa;padding:8px;">최대 3장 첨부 완료</div>`}
</div>

<!-- 확인사항 -->
<div class="card">
  <div class="section-title" style="margin-bottom:12px;">${lang==="zh"?"✅ 确认事项":"✅ 확인 사항"}</div>
  <div class="chk-list">${chkItems}</div>
  ${e.checks?`<div class="err-msg" style="margin-top:8px;">${e.checks}</div>`:""}
</div>

${e.submit?`<div class="err-banner">${e.submit}</div>`:""}

<button class="submit-btn" id="btn-submit" ${saving?"disabled":""}>
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2L11 13"/><path d="M22 2L15 22 11 13 2 9l20-7z"/></svg>
  ${saving?t("submitting"):t("submitBtn")}
</button>

<div class="admin-link-wrap" style="display:flex;justify-content:center;gap:16px;">
  <button class="admin-link" id="go-main-from-form">${lang==="zh"?(isGuest?"← 登录":"← 主页"):(isGuest?"← 로그인":"← 메인")}</button>
  ${!isGuest?`<button class="admin-link" id="go-myreport">${lang==="zh"?"📋 我的报告查询":"📋 내 접수 조회"}</button>`:""}
  ${!isGuest&&isAdmin?`<button class="admin-link" id="go-admin">${lang==="zh"?"管理员页面":"관리자 페이지"}</button>`:""}
</div>`;
}
