const CACHE_NAME = 'safety001-v20';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './img/manual-vehicle.jpg',
  './js/main.js',
  './js/config.js',
  './js/state.js',
  './js/utils.js',
  './js/router.js',
  './js/firebase.js',
  './js/events.js',
  './js/views/login.js',
  './js/views/main.js',
  './js/views/manual.js',
  './js/views/suggest.js',
  './js/views/form.js',
  './js/views/success.js',
  './js/views/myreport.js',
  './js/views/admin.js',
  './js/views/risk.js',
  './js/views/master.js',
  './js/features/voice.js',
  './js/features/photo.js',
  './js/features/submit.js',
  './js/features/admin.js',
  './js/features/risk.js',
  './js/features/master.js',
];

// 설치 시 캐시 저장
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// 활성화 시 이전 캐시 삭제
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ── Firebase Auth 및 외부 요청은 캐시 제외 ──
self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Firebase Auth, Google, chrome-extension 요청은 그냥 통과
  if (
    url.includes('firebaseapp.com') ||
    url.includes('googleapis.com') ||
    url.includes('accounts.google.com') ||
    url.includes('securetoken.google.com') ||
    url.includes('identitytoolkit.google.com') ||
    url.includes('chrome-extension') ||
    url.startsWith('chrome') ||
    e.request.method !== 'GET'
  ) {
    return; // 캐시 처리 안 함 → 브라우저 기본 동작
  }

  // 나머지(앱 파일)는 항상 서버와 재검증(no-cache)하여 최신 JS를 받도록 한다.
  // 변경이 없으면 304로 빠르게 처리되고, 변경 시 즉시 새 파일을 받는다. 오프라인이면 캐시로 폴백.
  e.respondWith(
    fetch(e.request, { cache: 'no-cache' })
      .then(res => {
        // 유효한 응답만 캐시
        if(res && res.status === 200 && res.type === 'basic'){
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
