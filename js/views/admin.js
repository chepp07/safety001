import { state } from "../state.js";
import { renderMasterTab } from "./master.js";

export function renderAdmin() {
  const { entries, suggestions, filter, adminTab } = state;

  const list = Object.entries(entries);
  const total = list.length;
  const lv1 = list.filter(([,e])=>e.level==="1").length;
  const lv2 = list.filter(([,e])=>e.level==="2").length;
  const lv3 = list.filter(([,e])=>e.level==="3").length;
  const lineStop = list.filter(([,e])=>
    e.lineStop==="라인중단발생"||e.lineStop==="라인중단예상"||e.lineStop==="미장착"
  ).length;

  let filtered = list.filter(([,e])=>{
    if(filter.accType!=="전체" && e.accType!==filter.accType) return false;
    if(filter.level!=="전체" && String(e.level)!==String(filter.level)) return false;
    if(filter.search && !(e.reporter||"").includes(filter.search) &&
       !(e.site||"").includes(filter.search) &&
       !(e.accDetail||"").includes(filter.search)) return false;
    return true;
  });
  filtered.sort((a,b)=>(b[1].createdAt||"").localeCompare(a[1].createdAt||""));

  const lvC = {
    "1":{bg:"#fff5f5",color:"#b71c1c",bd:"#f5c6c6"},
    "2":{bg:"#fff8f0",color:"#e65100",bd:"#fcd8a8"},
    "3":{bg:"#f0faf0",color:"#2e7d32",bd:"#b8e0ba"}
  };

  function makeCard(key, e) {
    const ls = lvC[e.level]||{bg:"#f5f5f5",color:"#999",bd:"#ddd"};
    const lvLabel = ["","최긴급","긴급","일반"][+e.level]||"";

    let lineTag = "";
    if(e.lineStop==="라인중단발생")
      lineTag='<span style="font-size:10px;background:#fff0f0;color:#b71c1c;font-weight:700;padding:1px 6px;border-radius:4px;">중단발생</span>';
    else if(e.lineStop==="라인중단예상")
      lineTag='<span style="font-size:10px;background:#fff8f0;color:#e65100;font-weight:700;padding:1px 6px;border-radius:4px;">중단예상</span>';
    else if(e.lineStop==="미장착")
      lineTag='<span style="font-size:10px;background:#fffde7;color:#7b5e00;font-weight:700;padding:1px 6px;border-radius:4px;">미장착</span>';
    else
      lineTag='<span style="font-size:10px;background:#f0faf0;color:#2e7d32;font-weight:700;padding:1px 6px;border-radius:4px;">영향없음</span>';

    const custTag = e.customerEffect==="예"
      ? '<span style="font-size:10px;background:#fff3e0;color:#e65100;font-weight:700;padding:1px 6px;border-radius:4px;">고객사영향</span>'
      : "";
    const detailTag = e.accDetail
      ? '<span style="font-size:11px;color:#888;background:#f0f4f8;padding:1px 6px;border-radius:5px;">'+e.accDetail+'</span>'
      : "";
    const statusOpts = ["접수","처리중","완료","보류"].map(st =>
      '<option'+(e.status===st?' selected':'')+'>'+st+'</option>'
    ).join("");
    const situation = (e.situation||"-").replace(/\n/g,"<br>");
    const actionHtml = e.actionTaken
      ? '<div style="margin-bottom:6px;"><div style="color:#aaa;margin-bottom:3px;">즉시 조치</div>'
        +'<div style="background:#fff;border:1px solid #dce8f4;border-radius:7px;padding:8px 10px;color:#333;line-height:1.6;">'+e.actionTaken.replace(/\n/g,"<br>")+'</div></div>'
      : "";
    const followHtml = e.followUp
      ? '<div style="margin-bottom:6px;"><div style="color:#aaa;margin-bottom:3px;">후속조치</div>'
        +'<div style="background:#f0faf0;border:1px solid #b8e0ba;border-radius:7px;padding:8px 10px;color:#2e7d32;line-height:1.6;">'+e.followUp.replace(/\n/g,"<br>")+'</div></div>'
      : "";

    let photoHtml = "";
    if(e.photos && e.photos.length>0){
      const photoArr = Array.isArray(e.photos) ? e.photos : JSON.parse(e.photos||"[]");
      photoHtml = '<div><div style="color:#aaa;margin-bottom:4px;">현장 사진</div>'
        +'<div style="display:flex;gap:6px;flex-wrap:wrap;">'
        +photoArr.filter(Boolean).map(u =>
          '<a href="'+u+'" target="_blank"><img src="'+u+'" style="width:70px;height:70px;object-fit:cover;border-radius:7px;border:1px solid #dce8f4;"/></a>'
        ).join("")
        +'</div></div>';
    }

    return '<div style="background:#fff;border-radius:12px;border:1px solid #eef2f7;margin-bottom:10px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.05);">'
      +'<div style="padding:11px 14px;cursor:pointer;display:flex;align-items:flex-start;gap:10px;" class="card-hd" data-key="'+key+'">'
        +'<div style="flex-shrink:0;margin-top:1px;"><span style="display:inline-block;padding:3px 8px;border-radius:20px;font-size:11px;font-weight:700;background:'+ls.bg+';color:'+ls.color+';border:1px solid '+ls.bd+';white-space:nowrap;">Lv'+(e.level||"?")+' '+lvLabel+'</span></div>'
        +'<div style="flex:1;min-width:0;">'
          +'<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:4px;">'
            +'<span style="font-weight:700;font-size:13px;color:#1a1a1a;">'+(e.site||"-")+'</span>'
            +'<span style="font-size:12px;color:#555;">'+(e.accType||"-")+'</span>'
            +detailTag
          +'</div>'
          +'<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">'
            +lineTag+custTag
            +'<span style="font-size:11px;color:#aaa;">'+(e.reporter||"")+' '+(e.rank||"")+'</span>'
            +'<span style="font-size:11px;color:#bbb;">'+(e.createdAt||"").slice(0,16)+'</span>'
          +'</div>'
        +'</div>'
        +'<div style="flex-shrink:0;display:flex;flex-direction:column;align-items:flex-end;gap:5px;" onclick="event.stopPropagation()">'
          +'<select class="status-sel" data-key="'+key+'" style="border:1px solid #ddd;border-radius:6px;padding:3px 6px;font-size:11px;cursor:pointer;font-family:inherit;max-width:68px;">'+statusOpts+'</select>'
          +'<div style="display:flex;gap:4px;">'
            +'<button class="del-btn" data-key="'+key+'" style="background:none;border:1px solid #eee;border-radius:5px;cursor:pointer;color:#ccc;font-size:12px;padding:2px 6px;">✕</button>'
            +'<button class="edit-btn" data-key="'+key+'" style="background:#e05c00;border:none;border-radius:5px;cursor:pointer;color:#fff;font-size:11px;padding:2px 7px;font-family:inherit;font-weight:600;">수정</button>'
          +'</div>'
        +'</div>'
      +'</div>'
      +'<div id="detail-'+key+'" style="display:none;border-top:1px dashed #eef2f7;padding:12px 14px;background:#f9fbfd;font-size:12px;">'
        +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px;">'
          +'<div><span style="color:#aaa;">사고번호</span> <strong>'+(e.accNo||"-")+'</strong></div>'
          +'<div><span style="color:#aaa;">발생위치</span> <strong>'+(e.location||"-")+'</strong></div>'
          +'<div><span style="color:#aaa;">발생일시</span> <strong>'+(e.accDateTime||"-")+'</strong></div>'
          +'<div><span style="color:#aaa;">연락처</span> <strong>'+(e.phone||"-")+'</strong></div>'
        +'</div>'
        +'<div style="margin-bottom:6px;"><div style="color:#aaa;margin-bottom:3px;">현재 상황</div>'
          +'<div style="background:#fff;border:1px solid #dce8f4;border-radius:7px;padding:8px 10px;color:#333;line-height:1.6;">'+situation+'</div></div>'
        +actionHtml+followHtml+photoHtml
        +'<div style="margin-top:8px;">'
          +'<button class="edit-btn" data-key="'+key+'" style="padding:6px 14px;background:#e05c00;color:#fff;border:none;border-radius:7px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">✏️ 내용 수정 + 재발송</button>'
        +'</div>'
      +'</div>'
    +'</div>';
  }

  const accCards = filtered.length===0
    ? '<div class="card" style="text-align:center;padding:2.5rem;color:#bbb;font-size:14px;">접수된 사고가 없습니다.</div>'
    : filtered.map(([k,e])=>makeCard(k,e)).join("");

  function makeSugRow(key, s) {
    const statusOpts = ["접수","검토중","완료","보류"].map(st =>
      '<option'+(s.status===st?' selected':'')+'>'+st+'</option>'
    ).join("");
    const nameCell = s.anonymous ? '<span style="color:#aaa;">익명</span>' : (s.name||"-");
    const realInfo = (s.anonymous && s.realEmail)
      ? '<div style="margin-top:10px;background:#fff8f0;border:1px solid #fcd8a8;border-radius:8px;padding:10px 12px;">'
        +'<div style="font-size:11px;font-weight:700;color:#e05c00;margin-bottom:4px;">🔑 관리자 전용 — 실제 계정 정보</div>'
        +'<div style="font-size:13px;color:#333;">이름: <strong>'+(s.realName||"미입력")+'</strong></div>'
        +'<div style="font-size:13px;color:#333;">이메일: <strong>'+s.realEmail+'</strong></div></div>'
      : "";

    return '<tr style="border-bottom:1px solid #eef2f7;cursor:pointer;" class="sug-hd" data-key="'+key+'">'
      +'<td style="padding:10px 11px;font-size:12px;color:#888;white-space:nowrap;">'+(s.createdAt||"").slice(0,16)+'</td>'
      +'<td style="padding:10px 11px;font-weight:600;">'+(s.site||"-")+'</td>'
      +'<td style="padding:10px 11px;"><span style="background:#e8f5e9;color:#2e7d32;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:700;">'+(s.category||"-")+'</span></td>'
      +'<td style="padding:10px 11px;color:#333;">'+(s.title||"-")+'</td>'
      +'<td style="padding:10px 11px;font-size:13px;">'+nameCell+'</td>'
      +'<td style="padding:10px 11px;font-size:12px;background:#fff8f0;">'
        +'<div style="color:#e05c00;font-weight:600;">'+(s.realEmail||'<span style="color:#ccc;font-size:11px;">이전 데이터</span>')+'</div>'
        +'<div style="color:#aaa;font-size:11px;">'+(s.realName||"")+'</div></td>'
      +'<td style="padding:10px 11px;" onclick="event.stopPropagation()">'
        +'<select class="sug-status-sel" data-key="'+key+'" style="border:1px solid #ddd;border-radius:6px;padding:3px 6px;font-size:12px;cursor:pointer;font-family:inherit;">'+statusOpts+'</select></td>'
      +'</tr>'
      +'<tr id="sug-'+key+'" style="display:none;background:#f9fbfd;">'
        +'<td colspan="7" style="padding:14px 16px;font-size:13px;line-height:1.7;border-top:1px dashed #dce8f4;">'
          +'<div style="font-weight:700;color:#2e7d32;margin-bottom:8px;">💡 상세 내용</div>'
          +'<div style="background:#fff;border:1px solid #dce8f4;border-radius:8px;padding:10px 12px;color:#333;">'+(s.detail||"-").replace(/\n/g,"<br>")+'</div>'
          +realInfo
        +'</td>'
      +'</tr>';
  }

  const sugRows = Object.entries(suggestions)
    .sort((a,b)=>(b[1].createdAt||"").localeCompare(a[1].createdAt||""))
    .map(([k,s])=>makeSugRow(k,s)).join("");

  const sugHtml = Object.keys(suggestions).length===0
    ? '<div class="card" style="text-align:center;padding:2.5rem;color:#aaa;font-size:14px;">아직 접수된 안전개선 제안이 없습니다.</div>'
    : '<div class="card" style="padding:0;overflow:hidden;"><div style="overflow-x:auto;">'
      +'<table style="width:100%;border-collapse:collapse;font-size:13px;">'
      +'<thead style="background:#f5f8fc;"><tr style="border-bottom:1px solid #dce8f4;">'
      +'<th style="padding:9px 11px;text-align:left;font-weight:600;color:#888;white-space:nowrap;">접수일시</th>'
      +'<th style="padding:9px 11px;text-align:left;font-weight:600;color:#888;">사업소</th>'
      +'<th style="padding:9px 11px;text-align:left;font-weight:600;color:#888;">분류</th>'
      +'<th style="padding:9px 11px;text-align:left;font-weight:600;color:#888;">제목</th>'
      +'<th style="padding:9px 11px;text-align:left;font-weight:600;color:#888;">제안자</th>'
      +'<th style="padding:9px 11px;text-align:left;font-weight:600;color:#e05c00;">🔑 실제 계정</th>'
      +'<th style="padding:9px 11px;text-align:left;font-weight:600;color:#888;">상태</th>'
      +'</tr></thead><tbody>'+sugRows+'</tbody></table></div></div>'
      +'<div style="font-size:12px;color:#bbb;margin-top:7px;text-align:right;">총 '+Object.keys(suggestions).length+'건</div>';

  const tabAccStyle  = adminTab==="accidents"   ? "color:#1e2761;border-bottom:2px solid #1e2761;" : "color:#aaa;border-bottom:2px solid transparent;";
  const tabSugStyle  = adminTab==="suggestions" ? "color:#2e7d32;border-bottom:2px solid #2e7d32;" : "color:#aaa;border-bottom:2px solid transparent;";

  const mainContent = adminTab==="accidents"
    ? '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:8px;margin-bottom:1.25rem;">'
        +'<div style="background:#e8eef7;border-radius:9px;padding:10px 13px;"><div style="font-size:12px;color:#3a5a8a;margin-bottom:3px;">총 접수</div><div style="font-size:24px;font-weight:700;color:#1a3a6b;">'+total+'</div></div>'
        +'<div style="background:#fff5f5;border-radius:9px;padding:10px 13px;"><div style="font-size:12px;color:#b71c1c;margin-bottom:3px;">최긴급(Lv1)</div><div style="font-size:24px;font-weight:700;color:#b71c1c;">'+lv1+'</div></div>'
        +'<div style="background:#fff8f0;border-radius:9px;padding:10px 13px;"><div style="font-size:12px;color:#e65100;margin-bottom:3px;">긴급(Lv2)</div><div style="font-size:24px;font-weight:700;color:#e65100;">'+lv2+'</div></div>'
        +'<div style="background:#f0faf0;border-radius:9px;padding:10px 13px;"><div style="font-size:12px;color:#2e7d32;margin-bottom:3px;">일반(Lv3)</div><div style="font-size:24px;font-weight:700;color:#2e7d32;">'+lv3+'</div></div>'
        +'<div style="background:#FCEBEB;border-radius:9px;padding:10px 13px;"><div style="font-size:12px;color:#A32D2D;margin-bottom:3px;">라인중단</div><div style="font-size:24px;font-weight:700;color:#791F1F;">'+lineStop+'</div></div>'
      +'</div>'
      +'<div style="display:flex;gap:7px;flex-wrap:wrap;margin-bottom:10px;">'
        +'<input id="a-search" value="'+filter.search+'" placeholder="사업소 / 접수자 / 세부유형" style="padding:7px 10px;border:1px solid #ddd;border-radius:8px;font-size:13px;min-width:160px;font-family:inherit;flex:1;"/>'
        +'<select id="a-acctype" style="padding:7px 10px;border:1px solid #ddd;border-radius:8px;font-size:13px;font-family:inherit;">'
          +["전체","인사사고","제품사고","공급사고","차량사고"].map(s=>'<option'+(filter.accType===s?' selected':'')+'>'+s+'</option>').join("")
        +'</select>'
        +'<select id="a-level" style="padding:7px 10px;border:1px solid #ddd;border-radius:8px;font-size:13px;font-family:inherit;">'
          +'<option value="전체">전체 긴급도</option>'
          +'<option value="1"'+(filter.level==="1"?' selected':'')+'>Level 1 최긴급</option>'
          +'<option value="2"'+(filter.level==="2"?' selected':'')+'>Level 2 긴급</option>'
          +'<option value="3"'+(filter.level==="3"?' selected':'')+'>Level 3 일반</option>'
        +'</select>'
      +'</div>'
      +'<div id="admin-table">'+accCards+'</div>'
      +'<div id="admin-count" style="font-size:12px;color:#bbb;margin-top:4px;text-align:right;">총 '+filtered.length+'건</div>'
    : adminTab==="master" ? renderMasterTab()
    : sugHtml;

  // 수정 모달 (원본에서 누락된 부분 — 여기서 구현)
  const editModal = `
<div id="edit-modal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:200;align-items:center;justify-content:center;overflow-y:auto;padding:20px;">
  <div style="background:#fff;border-radius:14px;padding:1.75rem;width:100%;max-width:500px;max-height:90vh;overflow-y:auto;">
    <div style="font-size:16px;font-weight:700;margin-bottom:1.25rem;">✏️ 사고 접수 수정 + 재발송</div>
    <div class="field">
      <div class="label">사고 유형</div>
      <select id="edit-acctype" class="select">
        ${["인사사고","제품사고","공급사고","차량사고"].map(t=>`<option value="${t}">${t}</option>`).join("")}
      </select>
    </div>
    <div class="field">
      <div class="label">긴급도</div>
      <select id="edit-level" class="select">
        <option value="1">Level 1 최긴급</option>
        <option value="2">Level 2 긴급</option>
        <option value="3">Level 3 일반</option>
      </select>
    </div>
    <div class="field">
      <div class="label">라인중단 여부</div>
      <select id="edit-linestop" class="select">
        ${["라인중단발생","라인중단예상","미장착","라인영향없음"].map(v=>`<option value="${v}">${v}</option>`).join("")}
      </select>
    </div>
    <div class="field">
      <div class="label">현재 상황</div>
      <textarea id="edit-situation" class="textarea" style="min-height:100px;"></textarea>
    </div>
    <div class="field">
      <div class="label">즉시 조치</div>
      <textarea id="edit-action" class="textarea" style="min-height:80px;"></textarea>
    </div>
    <div class="field">
      <div class="label">처리 상태</div>
      <select id="edit-status" class="select">
        ${["접수","처리중","완료","보류"].map(v=>`<option value="${v}">${v}</option>`).join("")}
      </select>
    </div>
    <div style="display:flex;gap:8px;margin-top:1rem;">
      <button id="btn-edit-save" class="submit-btn" style="flex:1;font-size:14px;padding:11px;">💾 저장 + 재발송</button>
      <button id="btn-edit-cancel" style="flex:0 0 auto;padding:11px 18px;background:#f5f5f5;border:none;border-radius:9px;font-size:14px;color:#666;cursor:pointer;font-family:inherit;">취소</button>
    </div>
  </div>
</div>`;

  return '<div style="padding-bottom:2rem;">'
    +'<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:1.5rem;">'
      +'<div><div style="font-size:17px;font-weight:700;">🛡️ 관리자 대시보드</div><div style="font-size:13px;color:#888;margin-top:2px;">실시간 현황 관리</div></div>'
      +'<div style="display:flex;gap:7px;flex-wrap:wrap;">'
        +'<button onclick="location.reload()" style="padding:7px 12px;border:1px solid #ddd;border-radius:8px;background:#fff;font-size:13px;cursor:pointer;font-family:inherit;">새로고침</button>'
        +'<button id="btn-excel" style="padding:7px 12px;border:1px solid #1d6f42;border-radius:8px;background:#fff;font-size:13px;cursor:pointer;font-family:inherit;color:#1d6f42;font-weight:500;">⬇ 엑셀 다운로드</button>'
        +'<button id="go-form" style="padding:7px 12px;border:1px solid #ddd;border-radius:8px;background:#fff;font-size:13px;cursor:pointer;font-family:inherit;">접수 폼 보기</button>'
        +'<button id="go-logout" style="padding:7px 12px;border:1px solid #ddd;border-radius:8px;background:#f5f5f5;font-size:13px;cursor:pointer;color:#999;font-family:inherit;">로그아웃</button>'
      +'</div>'
    +'</div>'
    +'<div style="display:flex;gap:0;margin-bottom:1.25rem;border-bottom:2px solid #eef2f7;">'
      +'<button id="tab-accidents" class="tab-btn" data-tab="accidents" style="padding:10px 20px;border:none;background:none;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;margin-bottom:-2px;'+tabAccStyle+'">🚨 사고접수 ('+total+')</button>'
      +'<button id="tab-suggestions" class="tab-btn" data-tab="suggestions" style="padding:10px 20px;border:none;background:none;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;margin-bottom:-2px;'+tabSugStyle+'">💡 안전개선 제안 ('+Object.keys(suggestions).length+')</button>'
      +(state.isMaster ? '<button id="tab-master" class="tab-btn" data-tab="master" style="padding:10px 20px;border:none;background:none;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;margin-bottom:-2px;'+(adminTab==="master"?"color:#5b3ba8;border-bottom:2px solid #5b3ba8;":"color:#aaa;border-bottom:2px solid transparent;")+'">🪪 마스터 관리</button>' : '')
    +'</div>'
    +mainContent
    // 관리자 로그인 모달
    +'<div id="login-modal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:100;align-items:center;justify-content:center;">'
      +'<div style="background:#fff;border-radius:14px;padding:2rem 1.75rem;width:300px;text-align:center;">'
        +'<div style="font-size:22px;margin-bottom:8px;">🔐</div>'
        +'<div style="font-size:16px;font-weight:700;margin-bottom:4px;">관리자 로그인</div>'
        +'<div style="font-size:13px;color:#888;margin-bottom:1rem;">비밀번호를 입력해 주세요</div>'
        +'<input id="modal-pw" type="password" class="input" placeholder="비밀번호" style="margin-bottom:8px;"/>'
        +'<div id="modal-err" style="font-size:12px;color:#c0392b;margin-bottom:8px;display:none;"></div>'
        +'<button id="modal-login" class="submit-btn" style="font-size:14px;padding:11px;">로그인</button>'
        +'<button id="modal-cancel" style="margin-top:8px;width:100%;padding:9px;background:#f5f5f5;border:none;border-radius:9px;font-size:13px;cursor:pointer;color:#888;font-family:inherit;">취소</button>'
      +'</div>'
    +'</div>'
    +editModal
  +'</div>';
}
