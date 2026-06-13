import { T } from "./config.js";
import { state } from "./state.js";

export function t(key) {
  return T[state.lang][key] || T.ko[key] || key;
}

export function getNowDefaults() {
  const now = new Date();
  const h24 = now.getHours();
  const ampm = h24 < 12 ? "오전" : "오후";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const min = Math.floor(now.getMinutes() / 5) * 5;
  return {
    accYear:  String(now.getFullYear()),
    accMonth: String(now.getMonth()+1).padStart(2,"0"),
    accDay:   String(now.getDate()).padStart(2,"0"),
    accAmPm:  ampm,
    accHour:  String(h12).padStart(2,"0"),
    accMin:   String(min).padStart(2,"0"),
  };
}

export function makeEmptyForm() {
  const dt = getNowDefaults();
  return {
    site: "", accType: "", accDetail: "",
    isComplex: false,
    accTypes: [], accDetails: [],
    level: "", lineStop: "", customerEffect: "",
    reporter: "", rank: "", phone: "",
    ...dt,
    location: "", situation: "",
    actionTaken: "", supportNeeded: "",
    accidentType: "",
    victims: [{name:"", affiliation:"", unknown:false}],
    perpetrators: [{name:"", affiliation:"", unknown:false}],
    photos: [],
    photosPreviews: [],
    _voiceOn: false,
    _voiceProcessing: false,
    _voiceStatus: "",
    checks: [false, false, false]
  };
}

export function fmt(v) {
  v = v.replace(/\D/g, "");
  if(v.length<=3) return v;
  if(v.length<=7) return v.slice(0,3)+"-"+v.slice(3);
  return v.slice(0,3)+"-"+v.slice(3,7)+"-"+v.slice(7,11);
}

export function genAccNo() {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}`;
  const cnt = Object.values(state.entries).filter(e => e.accNo && e.accNo.startsWith("ACC-"+ymd)).length;
  return `ACC-${ymd}-${String(cnt+1).padStart(3,"0")}`;
}

export function levelLabel(lv) {
  if(lv==="1") return {text:"Level 1 최긴급", cls:"lv1-text"};
  if(lv==="2") return {text:"Level 2 긴급",   cls:"lv2-text"};
  if(lv==="3") return {text:"Level 3 일반",   cls:"lv3-text"};
  return {text:"-", cls:""};
}

export function isWebView() {
  const ua = navigator.userAgent.toLowerCase();
  return ua.includes('kakaotalk') ||
         ua.includes('naver') ||
         ua.includes('line/') ||
         ua.includes('wv') ||
         ua.includes('webview') ||
         (ua.includes('android') && !ua.includes('chrome')) ||
         ua.includes('fbav') ||
         ua.includes('instagram');
}
