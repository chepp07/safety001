# 광명사업부 안전관리 시스템

현장 사고를 즉시 접수하고 실시간으로 관리하는 PWA(Progressive Web App)입니다.

---

## 주요 기능

| 기능 | 설명 |
|------|------|
| 사고 즉시 접수 | 4가지 사고 유형 × 3단계 긴급도 선택, 현장 사진 첨부(최대 3장) |
| 음성 입력 | Web Speech API로 녹음 → Claude AI가 보고서 형식으로 자동 정리 |
| 실시간 알림 | 접수 즉시 Slack + SMS 자동 발송 (Google Apps Script 경유) |
| 관리자 대시보드 | 실시간 현황 통계, 사고 필터링, 상태 관리, 엑셀 다운로드 |
| 내 접수 조회 | 연락처 입력으로 본인 접수 내역 조회 및 후속조치 2차 보고 |
| 안전개선 제안 | 현장 개선 아이디어 제출 (익명 가능) |
| 사고처리 매뉴얼 | 유형별 대응 절차 및 긴급 연락처 |
| 한국어 / 중국어 | 전체 UI 언어 전환 지원 |
| PWA | 홈 화면 추가, 오프라인 캐시 지원 |

---

## 사고 분류 체계

**사고 유형 (복합사고 = 중복 선택 가능)**

- **인사사고** — 골절/타박상, 화상, 끼임, 낙상 등 인명 피해
- **제품사고** — 파손, 오염, 이물질 혼입, 변형 등 제품 손상
- **공급사고** — 결품, 불량 입고, 이종 혼입, 납기 지연 등 공급망 이슈
- **차량사고** — 지게차/카트 충돌, 접촉, 추락 등 차량 관련

**긴급도 판단 기준**

| 레벨 | 기준 |
|------|------|
| Level 1 최긴급 | 인명피해 · 라인중단 · 고객사 즉시 대응 필요 |
| Level 2 긴급 | 생산 차질 가능 · 수습 후 30분 내 보고 |
| Level 3 일반 | 생산 영향 없음 · 정기 보고 포함 |

---

## 기술 스택

- **Frontend** — Vanilla JS (ES Modules), CSS, HTML — 빌드 도구 없음
- **Backend** — Firebase Realtime Database / Authentication
- **사진 업로드** — ImgBB API (직접 업로드)
- **알림** — Google Apps Script → Slack Webhook + SMS
- **AI 음성 정제** — Claude API (claude-sonnet-4-20250514)
- **PWA** — Service Worker, Web App Manifest

---

## 프로젝트 구조

```
safety001-main/
├── index.html          # 앱 진입점 (thin shell)
├── style.css           # 전체 스타일
├── manifest.json       # PWA 매니페스트
├── sw.js               # Service Worker (오프라인 캐시)
│
└── js/
    ├── main.js         # 진입점: 폼 초기화, Firebase 시작
    ├── config.js       # 모든 상수 (Firebase 설정, 번역 T 객체, ADMIN_EMAILS 등)
    ├── state.js        # 앱 전체 공유 상태 (단일 객체)
    ├── utils.js        # 순수 유틸 함수 (t(), genAccNo(), fmt() 등)
    ├── router.js       # render() 뷰 라우터
    ├── firebase.js     # Firebase 초기화 및 실시간 DB 리스너
    ├── events.js       # 이벤트 바인딩 (모든 뷰의 클릭/입력 핸들러)
    │
    ├── views/          # 뷰 렌더 함수 (HTML 문자열 반환)
    │   ├── login.js    # 로그인 / 회원가입
    │   ├── main.js     # 메인 메뉴
    │   ├── form.js     # 사고 접수 폼 (가장 큰 뷰)
    │   ├── admin.js    # 관리자 대시보드
    │   ├── success.js  # 접수 완료 화면
    │   ├── myreport.js # 내 접수 조회
    │   ├── manual.js   # 사고처리 매뉴얼
    │   └── suggest.js  # 안전개선 제안
    │
    └── features/       # 비즈니스 로직
        ├── voice.js    # 음성 입력 + AI 정제
        ├── photo.js    # 사진 업로드 / 삭제
        ├── submit.js   # 폼 제출 처리 + Slack 알림
        └── admin.js    # 관리자 기능 (필터, 수정, 엑셀, 상태 변경)
```

**뷰 흐름**

```
login → register
      → (게스트) form → success
main  → form    → success
      → myreport
      → manual
      → suggest
      → admin
accdetail  (SMS 링크 직접 접속: ?a=ACC-YYYYMMDD-###)
```

---

## 로컬 실행

빌드 불필요. 아래 명령어 한 줄로 실행합니다.

```bash
npx serve .
```

실행하면 `http://localhost:3000` 주소가 표시됩니다. 브라우저에서 열면 됩니다.

> ⚠️ ES Modules는 `file://` 프로토콜에서 동작하지 않으므로 **반드시 위 명령어로 서버를 띄운 후 접속**해야 합니다. 파일을 더블클릭해서 직접 열면 동작하지 않습니다.

---

## 배포

모든 파일(`index.html`, `style.css`, `js/`, `sw.js`, `manifest.json`, 아이콘)을 정적 호스팅에 업로드합니다.

- **GitHub Pages** — 저장소 Settings → Pages → Branch: main
- **Firebase Hosting** — `firebase deploy`
- **Netlify Drop** — 폴더를 드래그 앤 드롭

`sw.js`의 캐시 경로(`/safety001/...`)는 실제 배포 경로에 맞게 수정해야 합니다.

---

## Firebase 설정

`js/config.js`에서 `firebaseConfig`를 실제 프로젝트 값으로 교체합니다.

```js
export const firebaseConfig = {
  apiKey: "...",
  authDomain: "....firebaseapp.com",
  databaseURL: "https://...-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "...",
  storageBucket: "....appspot.com",
  messagingSenderId: "...",
  appId: "..."
};
```

Firebase Console에서 설정할 것:
1. **Authentication** — 이메일/비밀번호 + Google 로그인 활성화
2. **Realtime Database** — `accidents/`, `suggestions/` 경로 읽기/쓰기 권한
3. **Database 규칙** — 인증된 사용자만 쓰기 가능하도록 설정 권장

---

## 관리자 설정

`js/config.js`의 `ADMIN_EMAILS` 배열에 관리자 이메일을 추가합니다.

```js
export const ADMIN_EMAILS = [
  "admin@example.com",
  // ...
];
```

관리자 계정으로 로그인하면 대시보드 접근, 사고 수정/삭제, 상태 변경, 엑셀 다운로드가 가능합니다.

---

## 사고 번호 체계

```
ACC-YYYYMMDD-001
ACC-YYYYMMDD-002
...
```

당일 접수 순서대로 자동 부여됩니다 (`js/utils.js` → `genAccNo()`).

---

## 주요 환경변수 / 상수 위치

모두 `js/config.js`에서 관리합니다.

| 상수 | 설명 |
|------|------|
| `firebaseConfig` | Firebase 프로젝트 설정 |
| `ADMIN_EMAILS` | 관리자 이메일 목록 |
| `ADMIN_PW` | 관리자 비밀번호 (레거시) |
| `GAS_URL` | Google Apps Script 웹훅 URL |
| `IMGBB_KEY` | ImgBB 사진 업로드 API 키 |
| `SITES` | 사업소 목록 |
| `T` | 한국어/중국어 번역 문자열 전체 |
