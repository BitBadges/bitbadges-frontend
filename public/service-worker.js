// Define a unique cache name
const CACHE_NAME = 'my-pwa-cache-v1';

// List of URLs to cache
//TODO:
const urlsToCache = [
    // '/',
    // '/index.html',
    // '/css/styles.css',
    // '/js/main.js',
    // '/images/logo.png',
];

// Install the service worker
// self.addEventListener('install', (event) => {
//     event.waitUntil(
//         caches.open(CACHE_NAME).then((cache) => {
//             // Cache the specified URLs
//             return cache.addAll(urlsToCache);
//         })
//     );
// });

// // Activate the service worker
// self.addEventListener('activate', (event) => {
//     event.waitUntil(
//         caches.keys().then((cacheNames) => {
//             return Promise.all(
//                 cacheNames.map((cacheName) => {
//                     // Delete old caches if they exist
//                     if (cacheName !== CACHE_NAME) {
//                         return caches.delete(cacheName);
//                     }
//                 })
//             );
//         })
//     );
// });

// // Fetch resources from cache or network
// self.addEventListener('fetch', (event) => {
//     event.respondWith(
//         caches.match(event.request).then((response) => {
//             // If the resource is found in the cache, return it
//             if (response) {
//                 return response;
//             }
//             // Otherwise, fetch it from the network
//             return fetch(event.request);
//         })
//     );
// });
