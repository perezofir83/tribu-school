// Offline cache for the field lot finder. Network first (4 s limit) so updates arrive at once; cache when offline.
const CACHE = 'zapotal-field-v3'
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
      const net = fetch(e.request).then((r) => { if (r.ok) c.put(e.request, r.clone()); return r })
      const slow = new Promise((res) => setTimeout(res, 4000))
      try {
        const r = await Promise.race([net, slow.then(() => null)])
        if (r) return r
      } catch (err) {}
      return (await c.match(e.request, { ignoreSearch: true })) || net
    }),
  )
})
