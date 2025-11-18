# 新增旅行行程設定指南

本指南說明如何使用現有的共用功能快速建立新的旅行行程頁面。

## 📁 檔案結構說明

```
travel/
├── index.html                    # 首頁 - 顯示所有旅行清單
├── common/                       # 共用資源 (所有行程共用)
│   ├── styles.css               # PWA 基礎樣式
│   ├── app.js                   # PWA 功能 (Service Worker, 安裝提示)
│   ├── forms-config.js          # Google Forms 設定
│   ├── comments.js              # 留言與按讚功能
│   └── comments.css             # 留言區樣式
├── YYYYMMDD_trip_name/          # 個別行程資料夾 (日期開頭)
│   ├── index.html               # 行程頁面
│   ├── manifest.json            # PWA 設定
│   ├── service-worker.js        # Service Worker (離線快取)
│   ├── theme.css                # 行程專屬配色
│   └── images/                  # 行程圖片
└── GOOGLE_FORMS_SETUP.md        # Google Forms 後端設定教學
```

## 🆕 建立新行程的步驟

### 步驟 1: 複製範本資料夾

```bash
# 複製現有的濟州行程作為範本
cp -r 20251121_jeju_trip YYYYMMDD_new_trip

# 範例: 2025年12月東京行程
cp -r 20251121_jeju_trip 20251201_tokyo_trip
```

### 步驟 2: 更新 manifest.json

編輯 `YYYYMMDD_new_trip/manifest.json`:

```json
{
  "name": "東京 5 日遊",              // 修改行程名稱
  "short_name": "東京行",            // 修改簡短名稱
  "description": "東京 5 天 4 夜家庭旅遊行程",
  "start_url": "./index.html",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#e91e63",          // 修改主題色
  "icons": [
    {
      "src": "https://em-content.zobj.net/thumbs/240/google/350/mount-fuji_1f5fb.png",  // 修改圖示
      "sizes": "240x240",
      "type": "image/png"
    }
  ]
}
```

### 步驟 3: 更新 Service Worker

編輯 `YYYYMMDD_new_trip/service-worker.js`:

1. **更新快取名稱**:
```javascript
const CACHE_NAME = 'tokyo-trip-v1';  // 修改為新行程名稱
```

2. **更新圖片列表**:
```javascript
const urlsToCache = [
  './index.html',
  './manifest.json',
  './theme.css',
  '../common/styles.css',
  '../common/app.js',
  '../common/forms-config.js',
  '../common/comments.js',
  '../common/comments.css',
  // 圖片檔案 - 根據實際圖片更新
  './images/tokyo1.jpg',
  './images/tokyo2.jpg',
  // ... 其他圖片
];
```

### 步驟 4: 自訂配色 (theme.css)

編輯 `YYYYMMDD_new_trip/theme.css`:

```css
:root {
    /* 主題色系 - 根據行程特色調整 */
    --primary-color: #e91e63;      /* 東京 - 粉紅色 (櫻花) */
    --primary-dark: #c2185b;
    --primary-light: #f8bbd0;
    
    /* 或其他配色範例:
       沖繩: #00bcd4 (海洋藍)
       京都: #9c27b0 (紫色)
       首爾: #ff5722 (橘紅色)
       泰國: #ffc107 (金黃色)
    */
}
```

### 步驟 5: 編寫行程內容

編輯 `YYYYMMDD_new_trip/index.html`:

1. **更新標題和 meta 資訊**:
```html
<title>東京 5 日遊 | 旅行行程</title>
<meta name="description" content="東京 5 天 4 夜家庭旅遊詳細行程">
```

2. **更新行程內容**:
   - 修改每日行程的標題、時間、地點
   - 替換圖片路徑
   - 更新景點描述

3. **設定留言互動區 (可選)**:
```html
<!-- 在想要加入留言功能的景點加入 -->
<div class="spot-interaction" data-spot-id="day1_shibuya">
    <!-- 按讚按鈕 -->
    <button class="like-btn">
        <span class="like-icon">❤️</span>
        <span class="like-count">0</span>
    </button>
    
    <!-- 留言區 -->
    <div class="comments-section">
        <h4>💬 留言區</h4>
        <div class="comments-list"></div>
        <form class="comment-form">
            <input type="text" class="comment-nickname" placeholder="你的暱稱">
            <textarea class="comment-input" placeholder="分享你的想法..." rows="3"></textarea>
            <button type="submit" class="comment-submit">送出留言</button>
        </form>
    </div>
</div>
```

4. **初始化留言系統**:
```html
<script>
    // 使用行程資料夾名稱作為 tripId
    const commentsSystem = new TravelComments('20251201_tokyo_trip');
    commentsSystem.initializeSpots([
        'day1_shibuya',
        'day2_asakusa',
        'day3_harajuku',
        // ... 其他景點 ID
    ]);
</script>
```

### 步驟 6: 準備圖片

1. 將行程照片放入 `YYYYMMDD_new_trip/images/`
2. 建議使用 JPG 格式並壓縮以加快載入速度:

```bash
# macOS 批次轉換 (如果需要)
cd YYYYMMDD_new_trip/images
for img in *.{png,PNG,jpeg,JPEG}; do
    sips -s format jpeg -s formatOptions 80 "$img" --out "${img%.*}.jpg"
done
```

### 步驟 7: 更新首頁清單

編輯 `index.html`,新增行程卡片:

```html
<div class="trip-grid">
    <!-- 現有的濟州行程 -->
    <a href="./20251121_jeju_trip/" class="trip-card">
        <div class="trip-date">2025.11.21 - 2025.11.25</div>
        <div class="trip-title">濟州島 5天4夜</div>
        <div class="trip-info">
            <div class="trip-info-item">達、岱臻、爸、媽</div>
            <div class="trip-info-item">4人家庭旅遊</div>
            <div class="trip-info-item">支援離線瀏覽</div>
        </div>
    </a>
    
    <!-- 新增的東京行程 -->
    <a href="./20251201_tokyo_trip/" class="trip-card">
        <div class="trip-date">2025.12.01 - 2025.12.05</div>
        <div class="trip-title">東京 5天4夜</div>
        <div class="trip-info">
            <div class="trip-info-item">達、岱臻、爸、媽</div>
            <div class="trip-info-item">4人家庭旅遊</div>
            <div class="trip-info-item">支援離線瀏覽</div>
        </div>
    </a>
</div>
```

### 步驟 8: 設定 Google Forms (如需留言功能)

如果新行程需要留言和按讚功能,請參考 `GOOGLE_FORMS_SETUP.md`:

1. 使用現有的按讚和留言表單 (共用)
2. 新行程會透過 `tripId` 自動區分資料
3. 不需要建立新的表單!

**tripId 說明**:
- 濟州行程: `20251121_jeju_trip`
- 東京行程: `20251201_tokyo_trip`
- 資料夾名稱即為 tripId

### 步驟 9: 測試與部署

1. **本地測試**:
```bash
# 在專案根目錄啟動本地伺服器
python3 -m http.server 8000
# 或使用 VS Code 的 Live Server 擴充功能
```

2. **檢查清單**:
   - ✅ 所有圖片正常顯示
   - ✅ PWA 可離線瀏覽
   - ✅ 留言和按讚功能正常 (如有啟用)
   - ✅ 配色符合行程主題
   - ✅ 手機版排版正常

3. **部署到 GitHub Pages**:
```bash
git add .
git commit -m "新增東京行程"
git push
```

4. 等待約 1-2 分鐘,訪問新網址:
   - https://waley168.github.io/travel/20251201_tokyo_trip/

## 🎨 配色建議

根據目的地選擇適合的主題色:

| 目的地 | 主題色 | 色碼 | 特色 |
|--------|--------|------|------|
| 濟州島 | 橘色 | `#ff6f00` | 橘子、海岸 |
| 東京 | 粉紅 | `#e91e63` | 櫻花、現代 |
| 京都 | 紫色 | `#9c27b0` | 古典、神社 |
| 沖繩 | 藍色 | `#00bcd4` | 海洋、珊瑚 |
| 首爾 | 橘紅 | `#ff5722` | 活力、韓流 |
| 曼谷 | 金黃 | `#ffc107` | 寺廟、熱帶 |
| 北海道 | 藍白 | `#2196f3` | 雪景、冷色 |

## 📝 注意事項

1. **資料夾命名**: 必須使用 `YYYYMMDD_` 開頭,方便排序
2. **tripId 唯一性**: 使用資料夾名稱作為 tripId,確保資料不混淆
3. **圖片優化**: 建議單張圖片不超過 500KB
4. **Service Worker 版本**: 每次更新內容後記得升級版本號
5. **共用資源**: 不要修改 `common/` 資料夾中的檔案,除非要改善所有行程

## 🔧 進階功能

### 自動生成 Service Worker 圖片清單

如果圖片很多,可以用腳本自動生成:

```bash
# 在行程資料夾執行
ls images/*.jpg | sed 's/^/  ".\//' | sed 's/$/",/'
```

### 批次圖片壓縮

```bash
# 使用 ImageMagick (需先安裝)
mogrify -resize 1920x1920\> -quality 80 images/*.jpg
```

## 🎉 完成!

現在你已經建立了一個新的旅行行程頁面,並且共用了所有核心功能:
- ✅ PWA 離線瀏覽
- ✅ 留言和按讚功能
- ✅ 響應式設計
- ✅ 主題化配色
- ✅ 固定日期標題

未來新增更多行程時,重複以上步驟即可! 🚀
