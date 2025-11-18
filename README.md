# 🌏 旅行行程 PWA

使用 Progressive Web App (PWA) 技術建立的旅行行程網站,支援離線瀏覽、留言互動等功能。

## ✨ 功能特色

### 核心功能
- 📱 **PWA 離線瀏覽**: 安裝後可在無網路環境下查看行程
- 💬 **留言互動**: 使用 Google Forms 後端,無需登入即可留言
- ❤️ **按讚功能**: 為喜歡的景點按讚
- 🎨 **主題化設計**: 每個行程可自訂配色
- 📌 **固定日期標題**: 捲動時保持當日日期可見
- 📱 **響應式設計**: 完美適配手機、平板、桌面

### 技術特點
- ✅ 純前端實現,無需後端伺服器
- ✅ Google Forms 作為免費資料庫
- ✅ Service Worker 離線快取
- ✅ 模組化架構,共用核心功能
- ✅ 完全免費部署 (GitHub Pages)

## 📁 專案結構

```
travel/
├── index.html                    # 首頁 - 所有旅行清單
├── common/                       # 共用資源
│   ├── styles.css               # PWA 基礎樣式
│   ├── app.js                   # PWA 功能 (Service Worker, 安裝提示)
│   ├── forms-config.js          # Google Forms 設定
│   ├── comments.js              # 留言與按讚功能
│   └── comments.css             # 留言區樣式
├── YYYYMMDD_trip_name/          # 個別行程資料夾
│   ├── index.html               # 行程頁面
│   ├── manifest.json            # PWA 設定檔
│   ├── service-worker.js        # Service Worker
│   ├── theme.css                # 行程專屬配色
│   └── images/                  # 行程圖片
├── NEW_TRIP_SETUP.md            # 新增行程指南
├── GOOGLE_FORMS_SETUP.md        # Google Forms 設定教學
└── README.md                    # 本文件
```

## 🚀 快速開始

### 查看現有行程

訪問: https://waley168.github.io/travel/

### 新增行程

請參考 [NEW_TRIP_SETUP.md](./NEW_TRIP_SETUP.md) 完整指南。

簡易步驟:
```bash
# 1. 複製範本
cp -r 20251121_jeju_trip 20251201_new_trip

# 2. 更新設定檔 (manifest.json, service-worker.js, theme.css)

# 3. 編寫行程內容 (index.html)

# 4. 部署
git add .
git commit -m "新增行程"
git push
```

### 本地測試

```bash
# 方法 1: Python HTTP Server
python3 -m http.server 8000

# 方法 2: VS Code Live Server
# 安裝 Live Server 擴充功能後,右鍵選擇 "Open with Live Server"
```

## 🎨 已建立的行程

### 濟州島 5 日遊
- **日期**: 2025年11月21日 - 11月25日
- **網址**: https://waley168.github.io/travel/20251121_jeju_trip/
- **特色**: 橘色主題,32 張圖片,5 個互動景點

## 🔧 技術架構

### 前端技術
- Vanilla JavaScript (ES6+)
- CSS Variables (主題化)
- Service Worker API (離線快取)
- Fetch API (資料載入)

### 後端服務
- Google Forms (資料收集)
- Google Sheets (資料儲存)
- Google Sheets CSV API (資料讀取)

### 部署平台
- GitHub Pages (靜態網站託管)

## 📖 文件說明

| 文件 | 說明 |
|------|------|
| [NEW_TRIP_SETUP.md](./NEW_TRIP_SETUP.md) | 如何新增新的旅行行程 |
| [GOOGLE_FORMS_SETUP.md](./GOOGLE_FORMS_SETUP.md) | 如何設定 Google Forms 後端 |
| README.md | 專案總覽 (本文件) |

## 🎯 設計理念

### 為什麼選擇 PWA?
- **離線瀏覽**: 旅行時可能網路不穩,離線功能很重要
- **安裝到主畫面**: 像原生 APP 一樣方便
- **輕量快速**: 不需要下載大型 APP

### 為什麼使用 Google Forms?
- **完全免費**: 無需付費訂閱
- **無需後端**: 省去伺服器維護成本
- **簡單可靠**: Google 基礎設施保證穩定
- **資料透明**: 可直接在 Sheets 查看/編輯

### 為什麼模組化設計?
- **共用核心**: 避免重複程式碼
- **快速建立**: 複製範本即可建立新行程
- **統一體驗**: 所有行程有一致的使用體驗
- **易於維護**: 修改共用檔案即可更新所有行程

## 🛠️ 維護建議

### 定期更新
- 清理舊的 Service Worker 快取版本
- 壓縮新增的圖片以節省流量
- 定期檢查 Google Forms 連結是否有效

### 效能優化
- 圖片建議使用 JPG 格式,單張不超過 500KB
- Service Worker 快取不要包含太多檔案
- 使用 lazy loading 延遲載入圖片 (未來改進)

### 安全性
- 定期更新 Google Sheets 公開連結
- 檢查留言內容,刪除垃圾訊息
- 使用 `escapeHtml()` 防止 XSS 攻擊

## 📊 資料結構

### 按讚記錄 (Google Sheets)
```
時間戳記 | tripId | spotId
---------|--------|--------
2025/11/18 14:30 | 20251121_jeju_trip | day1_market
```

### 留言記錄 (Google Sheets)
```
時間戳記 | tripId | spotId | nickname | comment
---------|--------|--------|----------|--------
2025/11/18 14:31 | 20251121_jeju_trip | day1_market | 小明 | 這個市場好好逛!
```

## 🤝 貢獻

這是個人旅行專案,但歡迎提出改進建議!

## 📝 授權

本專案為私人使用,請勿用於商業用途。

## 🔗 相關連結

- [GitHub Repository](https://github.com/waley168/travel)
- [GitHub Pages 網站](https://waley168.github.io/travel/)
- [Service Worker 文件](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [PWA 指南](https://web.dev/progressive-web-apps/)

## 📮 聯絡方式

如有問題或建議,請透過 GitHub Issues 聯絡。

---

**最後更新**: 2025年11月18日
**版本**: 1.0.0
