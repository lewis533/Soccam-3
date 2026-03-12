// L-App sw.js — delegates push to OneSignal, handles caching
importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

const CACHE = 'lapp-v15';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', e => {
    const url = new URL(e.request.url);
    // Never cache API or media calls
    if (url.hostname.includes('script.google.com') ||
        url.hostname.includes('cloudinary.com') ||
        url.hostname.includes('onesignal.com')) {
        e.respondWith(fetch(e.request));
        return;
    }
    // Network first for navigation
    if (e.request.mode === 'navigate') {
        e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
        return;
    }
    // Cache first for fonts
    if (url.hostname.includes('fonts.gstatic.com') ||
        url.hostname.includes('fonts.googleapis.com')) {
        e.respondWith(
            caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
                caches.open(CACHE).then(c => c.put(e.request, res.clone()));
                return res;
            }))
        );
        return;
    }
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});
