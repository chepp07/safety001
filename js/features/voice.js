import { state } from "../state.js";
import { t } from "../utils.js";

let _recognition = null;

export function startVoiceInput(renderFn) {
  const { lang, form } = state;
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!SpeechRecognition){
    alert(lang==="zh"
      ? "此浏览器不支持语音识别。\n请使用Chrome浏览器。"
      : "이 브라우저는 음성 인식을 지원하지 않습니다.\n크롬(Chrome) 브라우저를 사용해 주세요.");
    return;
  }

  if(_recognition){
    _recognition.stop();
    _recognition = null;
    form._voiceOn = false;
    renderFn();
    return;
  }

  _recognition = new SpeechRecognition();
  _recognition.lang = t("voiceLang");
  _recognition.continuous = false;
  _recognition.interimResults = true;

  let finalTranscript = "";

  form._voiceOn = true;
  form._voiceStatus = lang==="zh" ? "正在识别语音..." : "음성 인식 중...";
  renderFn();

  _recognition.onresult = (e) => {
    let interim = "";
    finalTranscript = "";
    for(let i = 0; i < e.results.length; i++){
      if(e.results[i].isFinal) finalTranscript += e.results[i][0].transcript;
      else interim += e.results[i][0].transcript;
    }
    const ta = document.getElementById("f-situation");
    if(ta) ta.value = (finalTranscript || interim) + (interim && !finalTranscript ? " ···" : "");
  };

  _recognition.onerror = (e) => {
    if(e.error === "not-allowed"){
      alert(lang==="zh"
        ? "需要麦克风访问权限。\n请在浏览器设置中允许麦克风权限。"
        : "마이크 접근 권한이 필요합니다.\n브라우저 설정에서 마이크 권한을 허용해 주세요.");
    }
    _recognition = null;
    form._voiceOn = false;
    renderFn();
  };

  _recognition.onend = async () => {
    _recognition = null;
    if(!finalTranscript.trim()){
      form._voiceOn = false;
      renderFn();
      return;
    }

    form._voiceOn = false;
    form._voiceStatus = lang==="zh" ? "AI正在整理内容..." : "AI가 내용을 정리하는 중...";
    form._voiceProcessing = true;

    const ta = document.getElementById("f-situation");
    if(ta) ta.value = lang==="zh" ? "AI 정리 중..." : "AI가 정리 중...";
    renderFn();

    try {
      const prompt = `당신은 공장 현장 사고 보고서 작성을 돕는 AI입니다.
아래 음성 녹음 내용을 분석하여 사고 보고서의 "현재 상황" 항목에 맞게 정리해 주세요.

음성 내용: "${finalTranscript}"

규칙:
- 핵심 사실만 간결하게 정리 (2~4줄)
- 발생 위치, 사고 내용, 피해 상황, 현재 상태 순서로 작성
- 불명확한 내용은 그대로 포함 (임의로 추가하지 말 것)
- 불필요한 설명 없이 정리된 내용만 출력`;

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 500,
          system: "사고 보고서 현재상황 항목을 간결하게 정리해주는 AI입니다. 정리된 텍스트만 출력합니다.",
          messages: [{ role: "user", content: prompt }]
        })
      });

      const data = await res.json();
      const refined = data.content?.[0]?.text?.trim() || finalTranscript;

      form.situation = refined;
      form._voiceProcessing = false;
      form._voiceStatus = "";

      const ta2 = document.getElementById("f-situation");
      if(ta2) ta2.value = refined;
      renderFn();
    } catch(err) {
      form.situation = finalTranscript;
      form._voiceProcessing = false;
      form._voiceStatus = "";
      const ta2 = document.getElementById("f-situation");
      if(ta2) ta2.value = finalTranscript;
      renderFn();
    }
  };

  _recognition.start();
}

export function stopVoice() {
  if(_recognition){ _recognition.stop(); _recognition = null; }
}
