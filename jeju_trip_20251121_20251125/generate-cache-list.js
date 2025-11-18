// 自動生成 Service Worker 快取列表的腳本
const fs = require('fs');
const path = require('path');

const imagesDir = './images';
const outputFile = './service-worker.js';

// 讀取 images 資料夾中的所有檔案
const imageFiles = fs.readdirSync(imagesDir)
  .filter(file => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file))
  .map(file => `  './images/${file}'`);

console.log('找到的圖片檔案:');
imageFiles.forEach(file => console.log(file));

// 生成 Service Worker 內容
const serviceWorkerContent = `const CACHE_NAME = 'jeju-trip-v1';
const urlsToCache = [
  './jeju_trip_pwa.html',
  './manifest.json',
  // 圖片檔案 (自動生成)
${imageFiles.join(',\n')},
  // 外部資源
  'https://cdn.jsdelivr.net/npm/@mdi/font@7.4.47/css/materialdesignicons.min.css',
  'https://cdn.jsdelivr.net/npm/@mdi/font@7.4.47/fonts/materialdesignicons-webfont.woff2'
];

// 安裝 Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('已開啟快取');
        // 使用 addAll 會在任一資源失敗時全部失敗
        // 改用個別 add 來處理可能不存在的資源
        return Promise.all(
          urlsToCache.map(url => {
            return cache.add(url).catch(err => {
              console.log('快取失敗:', url, err);
            });
          })
        );
      })
  );
  // 強制跳過等待,立即啟用新的 Service Worker
  self.skipWaiting();
});

// 快取策略：先從快取讀取，如果沒有則從網路取得並快取
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // 快取命中，回傳快取資源
        if (response) {
          return response;
        }
        
        // 複製請求
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest).then((response) => {
          // 檢查是否為有效回應
          if (!response || response.status !== 200) {
            return response;
          }
          
          // 只快取 same-origin 或圖片資源
          const shouldCache = 
            response.type === 'basic' || 
            response.type === 'cors' ||
            event.request.url.includes('/images/');
          
          if (shouldCache) {
            // 複製回應
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
          }
          
          return response;
        }).catch(err => {
          console.log('網路請求失敗:', event.request.url, err);
          return undefined;
        });
      })
  );
});

// 更新 Service Worker 時清除舊快取
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
`;

// 寫入檔案
fs.writeFileSync(outputFile, serviceWorkerContent);
console.log(`\n✅ Service Worker 已生成: ${outputFile}`);
console.log(`📦 共快取 ${imageFiles.length} 個圖片檔案`);
