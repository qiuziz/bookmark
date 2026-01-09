// 简单的service worker，用于浏览器插件
self.addEventListener('install', (event) => {
  console.log('Service Worker installed');
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activated');
});

self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data);
});