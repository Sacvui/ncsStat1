// Minimal WebR Service Worker stub
// This file exists to prevent 404 errors when WebR library checks for it
// The actual WebR instance uses PostMessage channel (channelType: 1) which doesn't require a service worker

self.addEventListener('install', (event) => {
    console.log('WebR Service Worker stub installed');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('WebR Service Worker stub activated');
    event.waitUntil(self.clients.claim());
});

// No fetch handler needed for PostMessage channel
