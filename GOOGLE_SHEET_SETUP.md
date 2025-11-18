# Google Sheets API 設定教學

## 步驟 1: 建立 Google Sheet

1. 前往 https://sheets.google.com
2. 建立新的試算表,命名為「旅行留言與按讚」
3. 建立三個工作表:
   - **Likes** (按讚數)
   - **Comments** (留言)
   - **Config** (設定)

### Likes 工作表結構
| tripId | spotId | likes |
|--------|--------|-------|
| 20251121_jeju_trip | spot_seongsan | 5 |

### Comments 工作表結構
| tripId | spotId | nickname | comment | timestamp |
|--------|--------|----------|---------|-----------|
| 20251121_jeju_trip | spot_seongsan | 小明 | 風景超美! | 2025-11-18T10:30:00Z |

## 步驟 2: 建立 Google Apps Script

1. 在試算表中,點選「擴充功能」→「Apps Script」
2. 刪除預設程式碼,貼上以下程式碼:

```javascript
// Google Apps Script - 旅行留言與按讚 API

const SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();

function doGet(e) {
  const action = e.parameter.action;
  const tripId = e.parameter.tripId;
  
  if (action === 'getAll' && tripId) {
    return getAllData(tripId);
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    success: false,
    error: 'Invalid action'
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    if (action === 'addLike') {
      return addLike(data.tripId, data.spotId);
    } else if (action === 'addComment') {
      return addComment(data.tripId, data.spotId, data.nickname, data.comment, data.timestamp);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Invalid action'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function getAllData(tripId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const likesSheet = ss.getSheetByName('Likes');
  const commentsSheet = ss.getSheetByName('Comments');
  
  const result = {};
  
  // 讀取按讚數
  const likesData = likesSheet.getDataRange().getValues();
  for (let i = 1; i < likesData.length; i++) {
    const [trip, spot, likes] = likesData[i];
    if (trip === tripId) {
      if (!result[spot]) result[spot] = { spotId: spot, likes: 0, comments: [] };
      result[spot].likes = likes || 0;
    }
  }
  
  // 讀取留言
  const commentsData = commentsSheet.getDataRange().getValues();
  for (let i = 1; i < commentsData.length; i++) {
    const [trip, spot, nickname, comment, timestamp] = commentsData[i];
    if (trip === tripId) {
      if (!result[spot]) result[spot] = { spotId: spot, likes: 0, comments: [] };
      result[spot].comments.push({ nickname, comment, timestamp });
    }
  }
  
  const resultArray = Object.values(result);
  
  return ContentService.createTextOutput(JSON.stringify(resultArray))
    .setMimeType(ContentService.MimeType.JSON);
}

function addLike(tripId, spotId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Likes');
  const data = sheet.getDataRange().getValues();
  
  // 尋找現有記錄
  let found = false;
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === tripId && data[i][1] === spotId) {
      const currentLikes = data[i][2] || 0;
      sheet.getRange(i + 1, 3).setValue(currentLikes + 1);
      found = true;
      break;
    }
  }
  
  // 如果沒有記錄,新增一筆
  if (!found) {
    sheet.appendRow([tripId, spotId, 1]);
  }
  
  // 回傳更新後的資料
  const likes = getLikes(tripId, spotId);
  const comments = getComments(tripId, spotId);
  
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    data: { spotId, likes, comments }
  })).setMimeType(ContentService.MimeType.JSON);
}

function addComment(tripId, spotId, nickname, comment, timestamp) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Comments');
  
  sheet.appendRow([tripId, spotId, nickname, comment, timestamp]);
  
  // 回傳更新後的資料
  const likes = getLikes(tripId, spotId);
  const comments = getComments(tripId, spotId);
  
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    data: { spotId, likes, comments }
  })).setMimeType(ContentService.MimeType.JSON);
}

function getLikes(tripId, spotId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Likes');
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === tripId && data[i][1] === spotId) {
      return data[i][2] || 0;
    }
  }
  return 0;
}

function getComments(tripId, spotId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Comments');
  const data = sheet.getDataRange().getValues();
  
  const comments = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === tripId && data[i][1] === spotId) {
      comments.push({
        nickname: data[i][2],
        comment: data[i][3],
        timestamp: data[i][4]
      });
    }
  }
  return comments;
}
```

## 步驟 3: 部署 Web App

1. 點選「部署」→「新增部署作業」
2. 類型選擇「網頁應用程式」
3. 設定:
   - 說明: 旅行留言 API
   - 執行身分: **我**
   - 具有存取權的使用者: **任何人**
4. 點選「部署」
5. 複製「網頁應用程式網址」(類似: https://script.google.com/macros/s/...)

## 步驟 4: 更新前端設定

在 `common/comments.js` 第 4 行,將 `YOUR_GOOGLE_APPS_SCRIPT_URL_HERE` 替換為你的網址:

```javascript
const SHEET_API_URL = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';
```

## 步驟 5: 在 HTML 中使用

在每個需要留言功能的景點後加入:

```html
<div class="spot-interaction" data-spot-id="spot_seongsan">
    <div class="like-section">
        <button class="like-btn">
            <span>👍</span>
            <span>按讚</span>
        </button>
        <span class="like-count">0</span>
    </div>
    
    <div class="comments-section">
        <h4>💬 留言</h4>
        <form class="comment-form">
            <div class="comment-input-group">
                <input type="text" class="comment-nickname" placeholder="暱稱 (選填)" maxlength="20">
                <textarea class="comment-input" placeholder="寫下你的想法..." required maxlength="500"></textarea>
            </div>
            <button type="submit" class="comment-submit">送出留言</button>
        </form>
        <div class="comments-list"></div>
    </div>
</div>
```

在 HTML 底部加入初始化腳本:

```html
<script>
// 初始化留言系統
const commentsSystem = new TravelComments('20251121_jeju_trip');
commentsSystem.initializeSpots([
    'spot_seongsan',
    'spot_beach',
    // ... 其他景點 ID
]);
</script>
```

完成!
