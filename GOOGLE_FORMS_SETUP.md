# Google Forms 後端設定指南

## 步驟 1: 建立「按讚」表單

1. 前往 https://forms.google.com
2. 建立新表單,命名為「旅行按讚記錄」
3. 新增以下問題(全部設為「簡答」):
   - 問題 1: `tripId` (標題: 行程 ID)
   - 問題 2: `spotId` (標題: 景點 ID)
   - 問題 3: `timestamp` (標題: 時間戳記)

4. **重要設定**:
   - 點擊「設定」→ 取消勾選「限制為 1 次回應」
   - 取消勾選「收集電子郵件地址」

5. 點擊「回應」→「建立試算表」→ 選擇「建立新試算表」
   - 試算表名稱: `旅行按讚記錄`

6. **記錄以下資訊**:
   ```
   表單 ID: 在瀏覽器網址列找到
   https://docs.google.com/forms/d/{FORM_ID}/edit
   
   試算表 ID: 開啟回應試算表,在網址列找到
   https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit
   ```

## 步驟 2: 建立「留言」表單

1. 建立新表單,命名為「旅行留言記錄」
2. 新增以下問題(全部設為「簡答」):
   - 問題 1: `tripId` (標題: 行程 ID)
   - 問題 2: `spotId` (標題: 景點 ID)
   - 問題 3: `nickname` (標題: 暱稱)
   - 問題 4: `comment` (標題: 留言內容,改為「簡答」或「段落」)
   - 問題 5: `timestamp` (標題: 時間戳記)

3. **重要設定**: 同步驟 1
4. 建立回應試算表: `旅行留言記錄`
5. **記錄表單 ID 和試算表 ID**

## 步驟 3: 取得表單欄位 ID

每個問題都有一個隱藏的 entry ID,需要透過檢查 HTML 取得:

1. 開啟表單的「預覽」模式
2. 按 F12 開啟開發者工具
3. 在表單輸入框上按右鍵 → 檢查元素
4. 找到 `name="entry.XXXXXXXX"` 的屬性值

**按讚表單的 entry IDs**:
```
tripId: entry._______ (待填入)
spotId: entry._______ (待填入)
timestamp: entry._______ (待填入)
```

**留言表單的 entry IDs**:
```
tripId: entry._______ (待填入)
spotId: entry._______ (待填入)
nickname: entry._______ (待填入)
comment: entry._______ (待填入)
timestamp: entry._______ (待填入)
```

## 步驟 4: 設定試算表為公開讀取

**按讚試算表**:
1. 開啟試算表
2. 點擊右上角「共用」
3. 將「一般存取權」改為「知道連結的任何人」→「檢視者」
4. 複製試算表 ID

**留言試算表**: 重複相同步驟

## 步驟 5: 發布試算表為 CSV

這是關鍵步驟,讓我們能用 fetch 讀取資料:

**按讚試算表**:
1. 點擊「檔案」→「共用」→「發布到網路」
2. 選擇「整份文件」→ 格式選「逗號分隔值 (.csv)」
3. 點擊「發布」
4. 複製產生的 CSV 網址

**留言試算表**: 重複相同步驟

## 完成後填入設定檔

將所有資訊填入 `common/forms-config.js`:

```javascript
const FORMS_CONFIG = {
    likes: {
        formId: 'YOUR_LIKES_FORM_ID',
        sheetId: 'YOUR_LIKES_SHEET_ID',
        csvUrl: 'YOUR_LIKES_CSV_URL',
        entries: {
            tripId: 'entry.XXXXXXXX',
            spotId: 'entry.XXXXXXXX',
            timestamp: 'entry.XXXXXXXX'
        }
    },
    comments: {
        formId: 'YOUR_COMMENTS_FORM_ID',
        sheetId: 'YOUR_COMMENTS_SHEET_ID',
        csvUrl: 'YOUR_COMMENTS_CSV_URL',
        entries: {
            tripId: 'entry.XXXXXXXX',
            spotId: 'entry.XXXXXXXX',
            nickname: 'entry.XXXXXXXX',
            comment: 'entry.XXXXXXXX',
            timestamp: 'entry.XXXXXXXX'
        }
    }
};
```

## 測試

完成設定後:
1. 在本地開啟 `jeju_trip_pwa.html`
2. 測試按讚和留言功能
3. 檢查對應的試算表是否有新增資料
4. 重新整理頁面,確認資料能正確讀取

## 優點

✅ 無 CORS 問題
✅ 無需部署後端
✅ Google 自動管理資料
✅ 可直接在試算表檢視/編輯資料
✅ 完全免費
