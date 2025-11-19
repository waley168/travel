# 版本控制說明

## 自動版本號功能

為了避免瀏覽器快取影響,所有 CSS 和 JS 文件會自動添加版本號查詢參數。

## 使用方法

### 方法一:手動執行腳本

```bash
npm run version
```

或

```bash
node update-version.js
```

### 方法二:部署時自動執行

使用以下命令會自動更新版本並提交:

```bash
npm run deploy
```

這會執行:
1. 更新所有 HTML 文件中的版本號
2. `git add -A` 添加所有更改
3. `git commit -m '更新版本號'` 提交
4. `git push` 推送到遠端

## 原理

腳本會自動執行兩項任務:

### 1. 更新 HTML 文件中的版本號

將:
```html
<link rel="stylesheet" href="../common/styles.css">
<script src="../common/app.js"></script>
```

轉換為:
```html
<link rel="stylesheet" href="../common/styles.css?v=1763517059390">
<script src="../common/app.js?v=1763517059390">
```

### 2. 自動遞增 Service Worker 的快取版本

將:
```javascript
const CACHE_NAME = 'jeju-trip-v5';
```

更新為:
```javascript
const CACHE_NAME = 'jeju-trip-v6';
```

這確保 PWA 快取會正確更新,使用者能獲取最新版本。

版本號使用當前時間戳,確保每次更新都是唯一的。

## 注意事項

- ✅ 自動處理所有 `.html` 文件
- ✅ 自動處理相對路徑的 CSS 和 JS
- ✅ 自動遞增 Service Worker 快取版本
- ✅ 不會影響外部 CDN 連結 (如 Iconify)
- ✅ 支援重複執行,會自動替換舊版本號
- ✅ PWA 使用網路優先策略,確保 CSS/JS 即時更新
- ✅ 離線時自動降級使用快取版本

## 建議工作流程

每次更新 CSS 或 JS 後:

```bash
# 1. 更新代碼
# 2. 執行版本更新
npm run version

# 3. 提交並推送
git add -A
git commit -m "你的提交訊息"
git push
```

或者使用一鍵部署:

```bash
npm run deploy
```
