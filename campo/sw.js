// Offline cache for the field lot finder. Serve from cache at once, refresh it in the background when online.
const CACHE = 'zapotal-field-v1'
const FILES = ['./', 'index.html', 'app.js', 'data.js', 'manifest.webmanifest', 'icon-180.png', 'icon-192.png', 'icon-512.png']
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()))
})
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  )
})
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url)
  if (e.request.method !== 'GET' || url.origin !== location.origin || !url.pathname.includes('/campo/')) return
  e.respondWith(
    caches.open(CACHE).then(async (c) => {
      const hit = await c.match(e.request, { ignoreSearch: true })
      const net = fetch(e.request)
        .then((r) => { if (r.ok) c.put(e.request, r.clone()); return r })
        .catch(() => hit)
      return hit || net
    }),
  )
})
