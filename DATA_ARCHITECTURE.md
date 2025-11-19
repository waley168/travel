# 旅遊 PWA 數據驅動架構設計

## 📊 Google Sheets 數據結構設計

### Sheet 1: trips (旅程總覽)
```
| trip_id | trip_name | start_date | end_date | participants | cover_image | status | last_updated |
|---------|-----------|------------|----------|--------------|-------------|--------|--------------|
| 20251121_jeju | 濟州島5天4夜 | 2025-11-21 | 2025-11-25 | 達,岱臻,爸,媽 | cover.jpg | active | 2025-11-19 |
```

### Sheet 2: trip_info (旅程核心資訊)
```
| trip_id | info_type | label | value | icon | order |
|---------|-----------|-------|-------|------|-------|
| 20251121_jeju | people | 人員 | 4人(達、岱臻、爸、媽) | mdi:account-group | 1 |
| 20251121_jeju | car | 租車 | 樂天租車 | mdi:car | 2 |
| 20251121_jeju | hotel1 | 住宿1 | Hotel RegentMarine | mdi:office-building | 3 |
```

### Sheet 3: days (每日概要)
```
| trip_id | day_number | date | day_title | summary | theme_color |
|---------|------------|------|-----------|---------|-------------|
| 20251121_jeju | 1 | 2025-11-21 | 濟州市 | 機場取車、市區探索 | #D35400 |
| 20251121_jeju | 2 | 2025-11-22 | 濟州東部 | 倫敦貝果、城山日出峰 | #E67E22 |
```

### Sheet 4: itinerary (行程明細)
```
| trip_id | day_number | seq | time | location | location_url | naver_url | duration | travel_time | notes | note_detail | image |
|---------|------------|-----|------|----------|--------------|-----------|----------|-------------|-------|-------------|-------|
| 20251121_jeju | 1 | 1 | 11:30 | 樂天租車 | https://... | https://... | 30m | - | 取車 | 記得帶護照 | - |
| 20251121_jeju | 1 | 2 | 12:00 | Paris Baguette | https://... | https://... | 1hr | 10m | 午餐 | 推薦可頌 | bakery1.jpg |
```

### Sheet 5: tips (提示與警告)
```
| trip_id | day_number | tip_type | icon | content | order |
|---------|------------|----------|------|---------|-------|
| 20251121_jeju | 1 | pro-tip | mdi:lightbulb-on | 團長提示:今天主要在濟州市區... | 1 |
| 20251121_jeju | 4 | warning | mdi:alert | 龍頭海岸注意潮汐時間 | 1 |
```

### Sheet 6: interaction_spots (互動區配置)
```
| trip_id | day_number | spot_id | spot_name | enabled | order |
|---------|------------|---------|-----------|---------|-------|
| 20251121_jeju | 1 | day1_market | Day 1 行程 | true | 1 |
| 20251121_jeju | 2 | day2_seongsan | Day 2 行程 | true | 2 |
| 20251121_jeju | 3 | day3_seogwipo | Day 3 行程 | true | 3 |
```

### Sheet 7: comments (留言數據)
```
| id | trip_id | spot_id | nickname | comment | timestamp | status |
|----|---------|---------|----------|---------|-----------|--------|
| 1 | 20251121_jeju | day1_market | 達 | 東門市場超好逛! | 2025-11-22 20:30 | approved |
| 2 | 20251121_jeju | day2_seongsan | 岱臻 | 城山日出峰好美 | 2025-11-23 08:15 | approved |
```

### Sheet 8: likes (按讚數據)
```
| trip_id | spot_id | like_count | last_updated |
|---------|---------|------------|--------------|
| 20251121_jeju | day1_market | 15 | 2025-11-22 |
| 20251121_jeju | day2_seongsan | 23 | 2025-11-23 |
```

### Sheet 9: config (全域設定)
```
| key | value | description |
|-----|-------|-------------|
| data_version | 1.2.3 | 數據版本號 |
| last_updated | 2025-11-19 10:30:00 | 最後更新時間 |
| cache_duration | 3600 | 快取時長(秒) |
| google_form_likes | YOUR_FORM_ID | 按讚表單 ID |
| google_form_comments | YOUR_FORM_ID | 留言表單 ID |
| sheet_id | YOUR_SHEET_ID | Google Sheet ID |
```

---

## 📱 互動區整合設計

### 設計原則
1. **表單收集** → Google Forms (寫入)
2. **數據展示** → Google Sheets CSV (讀取)
3. **雙向同步** → Forms 自動寫入 Sheets

### 互動區數據流

```
用戶按讚/留言
    ↓
Google Forms 提交
    ↓
自動寫入 Google Sheets
    ↓
PWA 定期讀取 Sheets CSV
    ↓
更新互動區顯示
```

### Google Forms 設置

#### 按讚表單結構
```
表單問題:
1. trip_id (簡答)
2. spot_id (簡答)
3. action (選擇: like / unlike)
4. timestamp (自動填入)
```

#### 留言表單結構
```
表單問題:
1. trip_id (簡答)
2. spot_id (簡答)
3. nickname (簡答,選填)
4. comment (段落,必填)
5. timestamp (自動填入)
```

### 互動區 JavaScript 實現

```javascript
// common/interaction.js
class InteractionManager {
  constructor(tripId, config) {
    this.tripId = tripId;
    this.sheetId = config.sheet_id;
    this.likeFormId = config.google_form_likes;
    this.commentFormId = config.google_form_comments;
    this.cacheKey = `interaction_cache_${tripId}`;
    this.cacheDuration = 60000; // 1分鐘
  }

  // 讀取按讚數據 (從公開 Sheets)
  async fetchLikes() {
    const url = `https://docs.google.com/spreadsheets/d/${this.sheetId}/gviz/tq?tqx=out:csv&sheet=likes`;
    
    try {
      const response = await fetch(url);
      const csv = await response.text();
      const data = this.parseCSV(csv);
      
      // 過濾當前旅程
      return data.filter(item => item.trip_id === this.tripId);
    } catch (error) {
      console.error('獲取按讚數據失敗:', error);
      return this.getCachedLikes();
    }
  }

  // 讀取留言數據 (從公開 Sheets)
  async fetchComments() {
    const url = `https://docs.google.com/spreadsheets/d/${this.sheetId}/gviz/tq?tqx=out:csv&sheet=comments`;
    
    try {
      const response = await fetch(url);
      const csv = await response.text();
      const data = this.parseCSV(csv);
      
      // 過濾當前旅程且已審核
      return data.filter(item => 
        item.trip_id === this.tripId && 
        item.status === 'approved'
      );
    } catch (error) {
      console.error('獲取留言數據失敗:', error);
      return this.getCachedComments();
    }
  }

  // 提交按讚 (透過 Google Forms)
  async submitLike(spotId, action = 'like') {
    const formUrl = `https://docs.google.com/forms/d/e/${this.likeFormId}/formResponse`;
    
    const formData = new FormData();
    formData.append('entry.XXXXX', this.tripId);      // trip_id 欄位
    formData.append('entry.YYYYY', spotId);           // spot_id 欄位
    formData.append('entry.ZZZZZ', action);           // action 欄位
    
    try {
      await fetch(formUrl, {
        method: 'POST',
        body: formData,
        mode: 'no-cors'
      });
      
      // 提交成功,等待1秒後重新獲取數據
      setTimeout(() => this.refreshLikes(spotId), 1000);
      return true;
    } catch (error) {
      console.error('提交按讚失敗:', error);
      return false;
    }
  }

  // 提交留言 (透過 Google Forms)
  async submitComment(spotId, nickname, comment) {
    const formUrl = `https://docs.google.com/forms/d/e/${this.commentFormId}/formResponse`;
    
    const formData = new FormData();
    formData.append('entry.XXXXX', this.tripId);
    formData.append('entry.YYYYY', spotId);
    formData.append('entry.ZZZZZ', nickname || '匿名');
    formData.append('entry.AAAAA', comment);
    
    try {
      await fetch(formUrl, {
        method: 'POST',
        body: formData,
        mode: 'no-cors'
      });
      
      // 顯示成功訊息
      this.showMessage('留言已提交,審核後將顯示');
      
      // 等待後重新獲取
      setTimeout(() => this.refreshComments(spotId), 2000);
      return true;
    } catch (error) {
      console.error('提交留言失敗:', error);
      this.showMessage('提交失敗,請稍後再試', 'error');
      return false;
    }
  }

  // 渲染互動區
  async renderInteraction(spotId, container) {
    const [likes, comments] = await Promise.all([
      this.fetchLikes(),
      this.fetchComments()
    ]);
    
    const spotLikes = likes.find(l => l.spot_id === spotId);
    const spotComments = comments.filter(c => c.spot_id === spotId);
    
    container.innerHTML = `
      <div class="spot-interaction">
        <!-- 按讚區 -->
        <div class="like-section">
          <button class="like-btn" data-spot="${spotId}">
            <span class="iconify" data-icon="mdi:heart"></span>
            <span>${spotLikes?.like_count || 0} 個讚</span>
          </button>
        </div>
        
        <!-- 留言區 -->
        <div class="comments-section">
          <h4>💬 留言區</h4>
          <form class="comment-form" data-spot="${spotId}">
            <input type="text" class="comment-nickname" placeholder="暱稱 (選填)">
            <textarea class="comment-input" placeholder="分享你的想法..." required></textarea>
            <button type="submit">送出留言</button>
          </form>
          <div class="comments-list">
            ${spotComments.map(c => this.renderComment(c)).join('')}
          </div>
        </div>
      </div>
    `;
    
    this.bindEvents(container, spotId);
  }

  renderComment(comment) {
    const time = new Date(comment.timestamp).toLocaleDateString('zh-TW');
    return `
      <div class="comment-item">
        <div class="comment-header">
          <strong>${comment.nickname}</strong>
          <span class="comment-time">${time}</span>
        </div>
        <p class="comment-text">${comment.comment}</p>
      </div>
    `;
  }

  bindEvents(container, spotId) {
    // 按讚按鈕
    const likeBtn = container.querySelector('.like-btn');
    likeBtn?.addEventListener('click', () => {
      this.submitLike(spotId);
      likeBtn.disabled = true;
    });
    
    // 留言表單
    const form = container.querySelector('.comment-form');
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const nickname = form.querySelector('.comment-nickname').value;
      const comment = form.querySelector('.comment-input').value;
      
      this.submitComment(spotId, nickname, comment);
      form.reset();
    });
  }

  parseCSV(csv) {
    const lines = csv.split('\n');
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    
    return lines.slice(1)
      .filter(line => line.trim())
      .map(line => {
        const values = line.split(',').map(v => v.replace(/"/g, '').trim());
        const obj = {};
        headers.forEach((header, i) => {
          obj[header] = values[i] || '';
        });
        return obj;
      });
  }

  showMessage(text, type = 'success') {
    // 顯示提示訊息
    const msg = document.createElement('div');
    msg.className = `message ${type}`;
    msg.textContent = text;
    document.body.appendChild(msg);
    setTimeout(() => msg.remove(), 3000);
  }

  // 快取相關方法
  getCachedLikes() {
    const cache = localStorage.getItem(`${this.cacheKey}_likes`);
    return cache ? JSON.parse(cache) : [];
  }

  getCachedComments() {
    const cache = localStorage.getItem(`${this.cacheKey}_comments`);
    return cache ? JSON.parse(cache) : [];
  }
}

// 使用方式
const config = {
  sheet_id: 'YOUR_SHEET_ID',
  google_form_likes: 'YOUR_LIKES_FORM_ID',
  google_form_comments: 'YOUR_COMMENTS_FORM_ID'
};

const interactionManager = new InteractionManager('20251121_jeju', config);

// 初始化所有互動區
document.querySelectorAll('.spot-interaction').forEach(container => {
  const spotId = container.dataset.spotId;
  interactionManager.renderInteraction(spotId, container);
});
```

### Google Forms Entry ID 查找方法

1. 打開 Google Forms
2. 點擊「發送」→「連結」
3. 在瀏覽器檢查器中查看表單 HTML
4. 找到 `entry.XXXXXX` 這樣的欄位 ID
5. 替換到程式碼中

### 優化建議

#### 1. 審核機制
在 `comments` Sheet 中添加 `status` 欄位:
- `pending` - 待審核
- `approved` - 已審核
- `rejected` - 已拒絕

只顯示 `approved` 的留言

#### 2. 防止濫用
```javascript
// 本地記錄已按讚的 spot
const likedSpots = JSON.parse(localStorage.getItem('liked_spots') || '[]');

if (likedSpots.includes(spotId)) {
  alert('您已經按過讚了!');
  return;
}

// 按讚成功後記錄
likedSpots.push(spotId);
localStorage.setItem('liked_spots', JSON.stringify(likedSpots));
```

#### 3. 即時更新 (輪詢)
```javascript
// 每30秒檢查一次新留言
setInterval(() => {
  interactionManager.refreshComments();
}, 30000);
```

---

## 🔄 數據同步策略

### 方案一:漸進式增強 (推薦) - 公開 Google Sheets

#### 特點
- PWA 首次載入時內嵌靜態數據
- 聯網時自動檢查更新並同步
- 離線時使用快取數據
- **直接讀取公開的 Google Sheets (無需 Apps Script)**

#### 公開 Google Sheets 的優勢
✅ 無需編寫 Apps Script  
✅ 直接用 CSV/JSON 端點讀取  
✅ 實時更新 (修改後立即生效)  
✅ 團隊協作容易  
✅ 版本歷史記錄完整  

#### 實現步驟

1. **靜態數據作為基底**
```javascript
// data/20251121_jeju.json (內嵌在 PWA 中)
{
  "trip_id": "20251121_jeju",
  "version": "1.0.0",
  "last_updated": "2025-11-19",
  "data": { /* 完整數據 */ }
}
```

2. **直接讀取公開 Google Sheets**

##### 方式 A: CSV 格式 (最簡單)
```javascript
// Google Sheets 公開後的 CSV 端點
const SHEET_ID = 'YOUR_SHEET_ID';
const SHEET_URLS = {
  trips: `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=trips`,
  days: `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=days`,
  itinerary: `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=itinerary`,
  tips: `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=tips`,
};

// CSV 解析函數
function parseCSV(csv) {
  const lines = csv.split('\n');
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
  
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.replace(/"/g, '').trim());
    const obj = {};
    headers.forEach((header, i) => {
      obj[header] = values[i];
    });
    return obj;
  });
}

// 獲取數據
async function fetchSheetData(sheetName) {
  const response = await fetch(SHEET_URLS[sheetName]);
  const csv = await response.text();
  return parseCSV(csv);
}
```

##### 方式 B: JSON 格式 (更結構化)
```javascript
// Google Sheets JSON API (公開後可用)
const SHEET_ID = 'YOUR_SHEET_ID';
const API_KEY = 'YOUR_API_KEY'; // 可選,公開表單可不需要

async function fetchSheetAsJSON(sheetName, range = 'A:Z') {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${sheetName}!${range}?key=${API_KEY}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  // 轉換為物件陣列
  const headers = data.values[0];
  return data.values.slice(1).map(row => {
    const obj = {};
    headers.forEach((header, i) => {
      obj[header] = row[i] || '';
    });
    return obj;
  });
}
```

##### 方式 C: 使用 PapaParse 庫 (推薦)
```html
<!-- 在 HTML 中引入 -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js"></script>
```

```javascript
async function fetchSheetWithPapa(sheetName) {
  return new Promise((resolve, reject) => {
    Papa.parse(SHEET_URLS[sheetName], {
      download: true,
      header: true,
      complete: (results) => resolve(results.data),
      error: (error) => reject(error)
    });
  });
}
```

3. **PWA 端同步邏輯**
```javascript
// common/data-sync.js
class DataSync {
  constructor(tripId) {
    this.tripId = tripId;
    this.apiUrl = 'YOUR_GOOGLE_SCRIPT_URL';
    this.localKey = `trip_data_${tripId}`;
    this.versionKey = `trip_version_${tripId}`;
  }

  async fetchRemoteData() {
    try {
      const response = await fetch(this.apiUrl);
      return await response.json();
    } catch (error) {
      console.error('獲取遠端數據失敗:', error);
      return null;
    }
  }

  async syncData() {
    // 檢查是否在線
    if (!navigator.onLine) {
      return this.getLocalData();
    }

    // 獲取遠端數據
    const remoteData = await this.fetchRemoteData();
    if (!remoteData) {
      return this.getLocalData();
    }

    // 檢查版本
    const localVersion = localStorage.getItem(this.versionKey);
    const remoteVersion = remoteData.version;

    if (remoteVersion !== localVersion) {
      console.log(`數據更新: ${localVersion} → ${remoteVersion}`);
      
      // 更新本地數據
      localStorage.setItem(this.localKey, JSON.stringify(remoteData));
      localStorage.setItem(this.versionKey, remoteVersion);
      
      // 通知用戶有更新
      this.notifyUpdate(localVersion, remoteVersion);
      
      return remoteData;
    }

    return this.getLocalData();
  }

  getLocalData() {
    const data = localStorage.getItem(this.localKey);
    return data ? JSON.parse(data) : this.getEmbeddedData();
  }

  getEmbeddedData() {
    // 如果沒有本地數據,使用內嵌的靜態數據
    return window.EMBEDDED_TRIP_DATA || {};
  }

  notifyUpdate(oldVersion, newVersion) {
    // 顯示更新提示
    const notification = document.createElement('div');
    notification.className = 'data-update-notification';
    notification.innerHTML = `
      <div class="notification-content">
        <span class="iconify" data-icon="mdi:refresh"></span>
        <div>
          <strong>行程已更新!</strong>
          <p>版本 ${oldVersion} → ${newVersion}</p>
        </div>
        <button onclick="location.reload()">重新載入</button>
      </div>
    `;
    document.body.appendChild(notification);
    
    // 3秒後自動移除
    setTimeout(() => notification.remove(), 10000);
  }
}

// 使用方式
const dataSync = new DataSync('20251121_jeju');
dataSync.syncData().then(data => {
  // 使用數據渲染頁面
  renderPage(data);
});
```

4. **Service Worker 快取策略**
```javascript
// service-worker.js
const DATA_CACHE = 'trip-data-v1';
const STATIC_CACHE = 'trip-static-v1';

// 數據 API 使用網路優先
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  if (url.href.includes('script.google.com')) {
    // Google Sheets API: 網路優先
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(DATA_CACHE).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
  }
});
```

---

### 方案二:完全在線模式 (簡單)

#### 特點
- 每次開啟都從 Google Sheets 獲取最新數據
- 離線時使用 Service Worker 快取的數據
- 無需版本管理

#### 優點
- 實現簡單
- 數據永遠是最新的(有網路時)

#### 缺點
- 首次載入較慢
- 完全依賴網路

---

### 方案三:混合模式 (最佳用戶體驗)

#### 工作流程
1. **首次載入**: 使用內嵌靜態數據立即顯示
2. **背景同步**: 同時在背景獲取最新數據
3. **數據到達**: 顯示"有新版本"提示,用戶可選擇更新
4. **離線模式**: 使用上次同步的數據

#### 優點
- ✅ 極速載入(使用靜態數據)
- ✅ 數據新鮮(背景同步)
- ✅ 用戶控制(手動更新)
- ✅ 完美離線體驗

---

## 🎨 頁面渲染模組化

### 渲染引擎結構
```javascript
// common/renderer.js
class TripRenderer {
  constructor(container, data) {
    this.container = container;
    this.data = data;
  }

  render() {
    this.renderHeader();
    this.renderCoreInfo();
    this.renderSummary();
    this.renderDays();
  }

  renderHeader() {
    const { trip_name, participants } = this.data;
    return `<header><h1>${trip_name} (${participants})</h1></header>`;
  }

  renderDay(day) {
    const itinerary = this.data.itinerary
      .filter(item => item.day_number === day.day_number)
      .sort((a, b) => a.seq - b.seq);
    
    return `
      <details class="day-card" open>
        <summary>
          <h3>Day ${day.day_number}: ${day.date} - ${day.day_title}</h3>
          <p>${day.summary}</p>
          <span class="iconify chevron-icon" data-icon="mdi:chevron-right"></span>
        </summary>
        <div class="day-content">
          ${this.renderTimeline(itinerary)}
          ${this.renderTips(day.day_number)}
          ${this.renderInteraction(day.day_number)}
        </div>
      </details>
    `;
  }

  renderTimeline(items) {
    return `
      <table class="timeline">
        <thead>
          <tr><th>時間</th><th>活動</th><th>車程</th><th>停留</th><th>備註</th></tr>
        </thead>
        <tbody>
          ${items.map(item => this.renderTimelineRow(item)).join('')}
        </tbody>
      </table>
    `;
  }
}
```

---

## 📋 實施建議

### 第一階段:基礎架構 (1-2週)
1. ✅ 設計 Google Sheets 結構
2. ✅ 建立 Google Apps Script API
3. ✅ 實現基本的數據同步類
4. ✅ 測試數據讀取

### 第二階段:渲染模組化 (1-2週)
1. ✅ 開發 TripRenderer 類
2. ✅ 重構現有頁面為數據驅動
3. ✅ 測試各種數據結構

### 第三階段:同步優化 (1週)
1. ✅ 實現版本檢查
2. ✅ 添加更新通知
3. ✅ 優化快取策略

### 第四階段:生產環境 (持續)
1. ✅ 監控數據同步
2. ✅ 收集用戶反饋
3. ✅ 持續優化

---

## 🎯 推薦方案

**混合模式 + 漸進式增強**

理由:
1. 首次體驗極佳(靜態數據)
2. 數據可更新(遠端同步)
3. 離線完美運作
4. 用戶有控制權
5. 易於維護

---

## 🔧 技術棧

- **數據源**: Google Sheets + Apps Script
- **API**: RESTful JSON API
- **快取**: localStorage + Service Worker
- **渲染**: 原生 JavaScript 模板字串
- **版本**: Semantic Versioning (1.2.3)
- **同步**: Background Fetch API (可選)

---

## 🎁 公開 Google Sheets 的額外好處

### 1. 團隊協作
- 多人可同時編輯
- 即時看到彼此的修改
- 版本歷史記錄完整

### 2. 簡化部署
- 無需重新打包 PWA
- 修改後立即生效(1-2分鐘)
- 不需要重新 deploy GitHub Pages

### 3. 審核流程
```
留言提交 → Google Forms
    ↓
自動寫入 Sheets (status: pending)
    ↓
管理員在 Sheets 中改 status → approved
    ↓
PWA 下次同步時自動顯示
```

### 4. 數據分析
- 直接在 Google Sheets 中使用公式
- 可連接 Google Data Studio
- 匯出為 Excel 分析

---

## ⚡ 快速設置指南

### 步驟 1: 建立 Google Sheet
1. 複製提供的範本
2. 填入旅程數據
3. 點擊「檔案」→「共用」→「發布到網路」
4. 選擇「整個文件」→「發布」
5. 複製 Sheet ID (URL 中的長字串)

### 步驟 2: 建立 Google Forms
1. 建立「按讚表單」(3個欄位)
2. 建立「留言表單」(4個欄位)
3. 連結到相同的 Google Sheet
4. 複製 Form ID

### 步驟 3: 設定 PWA
```javascript
// config.js
const CONFIG = {
  sheet_id: 'YOUR_SHEET_ID_HERE',
  google_form_likes: 'YOUR_LIKES_FORM_ID',
  google_form_comments: 'YOUR_COMMENTS_FORM_ID'
};
```

### 步驟 4: 測試
1. 開啟 PWA
2. 數據應自動從 Sheets 載入
3. 測試按讚和留言功能
4. 在 Sheets 中確認數據已寫入

---

## 📝 下一步行動

我可以幫你:

### 立即可做
1. ✅ **建立 Google Sheets 範本** - 包含所有 9 個 sheets
2. ✅ **建立 Google Forms 範本** - 按讚和留言表單
3. ✅ **實現數據同步類** - 完整的讀取和快取邏輯
4. ✅ **實現互動區整合** - 完整的 InteractionManager 類

### 進階功能
5. ⭐ **重構現有頁面** - 從靜態 HTML 改為數據驅動
6. ⭐ **批次匯入工具** - 從現有 HTML 提取數據到 Sheets
7. ⭐ **管理後台** - 簡單的審核介面
8. ⭐ **數據備份機制** - 定期備份到 GitHub

需要我開始實作哪一部分? 🚀

---

## 💡 補充說明

### 關於互動區的即時性
- Google Forms 提交後,數據約 **2-5 秒**寫入 Sheets
- PWA 可設定每 **30-60 秒**重新獲取一次
- 或在用戶互動後主動刷新

### 關於數據隱私
- Google Sheets 公開僅限**檢視**
- 寫入仍需透過 Google Forms (有驗證)
- 可添加 honeypot 欄位防止機器人

### 關於效能
- CSV 格式非常輕量 (通常 < 10KB)
- Service Worker 會快取數據
- 離線時使用快取,不影響體驗
