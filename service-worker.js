const CACHE = "batatacore-v2-20260715";
const OFFLINE = "/offline.html";
const CORE = [
  "/", "/index.html", OFFLINE, "/manifest.webmanifest",
  "/css/index.css", "/css/tema.css", "/css/modern.css", "/css/portal.css",
  "/js/app.js", "/js/config.js", "/img/batatalogo2.png", "/img/batataescrita.png",
  "/img/favicon.ico", "/html/eventos.html", "/html/privacidade.html", "/html/termos.html"
];
self.addEventListener("install", event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)).then(() => self.skipWaiting())));
self.addEventListener("activate", event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;
  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request).then(response => { const copy=response.clone(); caches.open(CACHE).then(cache=>cache.put(event.request,copy)); return response; }).catch(() => caches.match(event.request).then(cached => cached || caches.match(OFFLINE))));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => { if(response.ok){ const copy=response.clone(); caches.open(CACHE).then(cache=>cache.put(event.request,copy)); } return response; })));
});
