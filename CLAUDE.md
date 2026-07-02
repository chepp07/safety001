# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Progressive Web App (PWA) for workplace safety incident reporting at Gwangmyeong Business Division (광명사업부). Supports bilingual UI (Korean/Chinese) and real-time accident management.

## 하네스: 안전관리 PWA 개발 팀

**목표:** 빌드리스 ES Module PWA를 일관성(i18n 패리티·SW 캐시·경계면 정합) 깨짐 없이 안전하게 개발한다.

**트리거:** 이 앱(사고접수/관리자/위험성평가/안전제안/인증·역할/PWA)에 기능 추가·수정·리팩터링·버그수정 요청, 또는 "다시 실행/재실행/업데이트/수정/보완" 등 후속 요청 시 `safety-app-dev` 오케스트레이터 스킬을 사용한다. 단순 질문(코드 위치 찾기 등)은 직접 응답 가능.

> 팀(`.claude/agents/`): safety-architect, module-builder, firebase-pwa-engineer, safety-qa
> 스킬(`.claude/skills/`): module-development, i18n-parity, pwa-cache-sync, firebase-roles, safety-domain, safety-qa-verify, safety-app-dev(오케스트레이터)

**변경 이력:**
| 날짜 | 변경 내용 | 대상 | 사유 |
|------|----------|------|------|
| 2026-06-20 | 초기 하네스 구성 (4인 팀 + 6 스킬 + 오케스트레이터) | 전체 | 신규 구축 |

## Tech Stack & Architecture

**Modular ES Module SPA** — split into ~20 focused files under `js/`. No build step, no bundler. Dependencies load from CDN (Firebase 10.x from gstatic, ImgBB API).

**Entry point:** `index.new.html` → `<script type="module" src="js/main.js">`  
**Old monolith:** `index.html` (~3,400 lines) kept for reference until migration is complete.

**Backend:**
- Firebase Realtime Database — incident reports (`accidents/`) and safety suggestions (`suggestions/`)
- Firebase Authentication — email/password + Google OAuth
- Google Apps Script — Slack alert relay
- ImgBB API — photo uploads (up to 3 per incident, key in `config.js`)

**Firebase project:** `safety001-5091e` (region: `asia-southeast1`)

## Module Map

```
js/
  main.js          — entry point: init form, call initFirebase(), register SW
  config.js        — all constants: firebaseConfig, ADMIN_EMAILS, SITES, T (translations), IMGBB_KEY, GAS_URL
  state.js         — single shared mutable state object (db, auth, form, view, entries, …)
  utils.js         — pure helpers: t(), makeEmptyForm(), genAccNo(), fmt(), levelLabel(), getNowDefaults()
  router.js        — render() view switcher, popstate handler, app:render event listener
  firebase.js      — initFirebase(): Firebase init, setPersistence, onAuthStateChanged, _startListeners()
  events.js        — bindEvents() called after every render(); window.* globals for onclick attrs

  views/
    login.js       — renderLogin(), renderRegister(), renderSetupGuide()
    main.js        — renderMain()
    form.js        — renderForm() (~400 lines, largest view)
    admin.js       — renderAdmin() with makeCard() and makeSugRow() inner fns
    success.js     — renderSuccess()
    myreport.js    — renderMyReport(), renderAccDetail()
    manual.js      — renderManual()
    suggest.js     — renderSuggest()

  features/
    voice.js       — startVoiceInput(renderFn), stopVoice() — Speech API + Claude API refinement
    photo.js       — uploadPhotoDirectly(file), removePhoto(idx)
    submit.js      — handleSubmit(renderFn), sendSlackAlert(entry)
    admin.js       — updateAdminTable(), downloadExcel(), showLoginModal(), openEditModal(),
                     closeEditModal(), saveEditAndResend(), editSelectType(), setAdminTab(),
                     toggleDetail(), toggleSugDetail()
```

## Running / Deploying

No build required. Serve the static files directly:

```bash
npx serve .
# or
python -m http.server 8080
```

Open `index.new.html` for the modular version. The original `index.html` is the monolith reference.

Deploy by hosting all files (including `js/` directory) on any static host. Update `sw.js` ASSETS list if adding new JS files.

## View State Machine

```
login → register → main → form → success
                        → admin
                        → myreport
                        → manual
                        → suggest
accdetail (direct URL access via ?a=ACC-...)
```

`state.view` controls which view renders. `render()` in `router.js` reads `state.view` and calls the appropriate `render*()` function.

## Shared State Pattern

All modules import `{ state }` from `state.js` and mutate it directly. Firebase callbacks set `state.db`, `state.entries`, etc. — other modules immediately see the updated values on next access.

```js
// Example: submit.js sets state, router re-renders
state.submitted = entry;
state.view = "success";
renderFn();  // passed in as callback to avoid circular deps
```

## Key Business Logic

- **Accident numbering:** `ACC-YYYYMMDD-###` (sequential per day, `genAccNo()` in `utils.js`)
- **Severity levels:** Level 1 (최긴급/Emergency), Level 2 (긴급/Urgent), Level 3 (일반/General)
- **Accident types:** 인사사고, 제품사고, 공급사고, 차량사고 (complex accident = multiple types)
- **Admin access:** `ADMIN_EMAILS` array in `config.js` gates the admin view; no password required for email-based admins
- **Missing functions fixed:** `openEditModal`, `closeEditModal`, `saveEditAndResend`, `editSelectType`, `setAdminTab`, `toggleSugDetail` were absent in the original — all implemented in `js/features/admin.js`

## Localization

All UI strings are in the `T` object in `config.js`, keyed by `ko`/`zh`. `t(key)` in `utils.js` returns `T[state.lang][key]`. Language is persisted to `localStorage("accLang")`.

## Firebase Security

Firebase config is embedded in `config.js`. Database security rules on the Firebase console control actual data access — the admin email list in client code is a UI gate only.
