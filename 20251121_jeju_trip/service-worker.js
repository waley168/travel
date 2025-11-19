const CACHE_NAME = 'jeju-trip-v6';
const urlsToCache = [
  './index.html',
  './manifest.json',
  './theme.css',
  '../common/styles.css',
  '../common/app.js',
  '../common/forms-config.js',
  '../common/comments.js',
  '../common/comments.css',
  // 圖片檔案 (自動生成)
  './images/981park.jpg',
  './images/bakery1.jpg',
  './images/bakery2.jpg',
  './images/beach1.jpg',
  './images/beach2.jpg',
  './images/beach3.jpg',
  './images/cafe2.jpg',
  './images/cafe3.jpg',
  './images/cooking1.jpg',
  './images/cooking2-2.jpg',
  './images/cooking2.jpg',
  './images/farm1.jpg',
  './images/food1.jpg',
  './images/food2.jpg',
  './images/forest1.jpg',
  './images/garden1.jpg',
  './images/gun.jpg',
  './images/hotel1.jpg',
  './images/market1.jpg',
  './images/market2.jpg',
  './images/mountain1.jpg',
  './images/mountain2.jpg',
  './images/restaurant1.jpg',
  './images/seongsan.jpg',
  './images/shop1.jpg',
  './images/shop2.jpg',
  './images/street1.jpg',
  './images/sunrise1.jpg',
  './images/tea1.jpg',
  './images/view1.jpg',
  './images/view2.jpg',
  './images/waterfall1.jpg',
  './images/icon-192.png',
  './images/icon-512.png',
  // 外部資源
  'https://code.iconify.design/3/3.1.0/iconify.min.js'
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

// 快取策略：網路優先，失敗時使用快取 (Network First)
// 這樣可以確保帶版本號的新文件能即時更新
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);
  
  // 對於 CSS 和 JS 文件使用網路優先策略
  const isVersionedAsset = /\.(css|js)(\?v=\d+)?$/.test(requestUrl.pathname);
  
  if (isVersionedAsset) {
    // 網路優先：先嘗試從網路獲取，失敗時才用快取
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            // 更新快取
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
            return response;
          }
          return response;
        })
        .catch(() => {
          // 網路失敗，使用快取
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              console.log('從快取載入:', event.request.url);
              return cachedResponse;
            }
            // 嘗試匹配沒有查詢參數的版本
            const urlWithoutQuery = event.request.url.split('?')[0];
            return caches.match(urlWithoutQuery);
          });
        })
    );
  } else {
    // 其他資源使用快取優先策略
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          if (response) {
            return response;
          }
          
          const fetchRequest = event.request.clone();
          
          return fetch(fetchRequest).then((response) => {
            if (!response || response.status !== 200) {
              return response;
            }
            
            const shouldCache = 
              response.type === 'basic' || 
              response.type === 'cors' ||
              event.request.url.includes('/images/');
            
            if (shouldCache) {
              const responseToCache = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
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
  }
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
