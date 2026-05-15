const CACHE_NAME = 'expense-tracker-v1'

// Files to cache for offline use
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
]

// Install — cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS)
    })
  )
  self.skipWaiting()
})

// Activate — clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

// Fetch — serve from cache if offline
self.addEventListener('fetch', event => {
  // Only cache GET requests
  if (event.request.method !== 'GET') return

  // Don't cache API requests — always need fresh data
  if (event.request.url.includes('/api/') ||
      event.request.url.includes('localhost:8000') ||
      event.request.url.includes('railway.app')) {
    return
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      // Return cached version or fetch from network
      return cached || fetch(event.request).then(response => {
        // Cache new responses
        const clone = response.clone()
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, clone)
        })
        return response
      })
    }).catch(() => {
      // Offline fallback — return cached index.html
      if (event.request.destination === 'document') {
        return caches.match('/index.html')
      }
    })
  )
})
