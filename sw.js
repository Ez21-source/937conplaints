// غيّر رقم الإصدار عند تعديل ملفات التطبيق
const VERSION = 'r937db-v127';
const APP_FILES = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'maskable-512.png', 'apple-touch-icon.png', 'favicon.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(APP_FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION && k !== 'r937db-fonts').map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.open('r937db-fonts').then(async c => {
      const hit = await c.match(e.request);
      const net = fetch(e.request).then(r => { if (r && (r.ok || r.type === 'opaque')) c.put(e.request, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    }));
    return;
  }
  if (url.origin !== location.origin) return;
  const isPage = e.request.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('index.html') || url.pathname.endsWith('sw.js');
  e.respondWith(caches.open(VERSION).then(async c => {
    if (isPage) {
      // الصفحة: من الإنترنت أولاً حتى تظهر التحديثات فوراً، ومن الجهاز إذا لم يتوفر اتصال
      try { const r = await fetch(e.request, {cache: 'no-store'}); if (r && r.ok) c.put(e.request, r.clone()); return r; }
      catch (err) { return (await c.match(e.request, {ignoreSearch: true})) || (await c.match('index.html')); }
    }
    const hit = await c.match(e.request, {ignoreSearch: true});
    const net = fetch(e.request).then(r => { if (r && r.ok) c.put(e.request, r.clone()); return r; }).catch(() => hit);
    return hit || net;
  }));
});
