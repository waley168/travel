// Google Forms 設定檔
// 請依照 GOOGLE_FORMS_SETUP.md 的指示填入正確的 ID

const FORMS_CONFIG = {
    likes: {
        // 按讚表單 ID (從表單網址取得)
        formId: 'YOUR_LIKES_FORM_ID_HERE',
        
        // 按讚試算表 ID (從試算表網址取得)
        sheetId: 'YOUR_LIKES_SHEET_ID_HERE',
        
        // 按讚試算表的 CSV 發布網址
        csvUrl: 'YOUR_LIKES_CSV_URL_HERE',
        
        // 表單欄位的 entry ID (從表單 HTML 取得)
        // ⚠️ 注意: 不包含 timestamp,因為 Google Forms 會自動記錄時間戳記
        entries: {
            tripId: 'entry.XXXXXXXX',    // 行程 ID 欄位
            spotId: 'entry.XXXXXXXX'     // 景點 ID 欄位
        }
    },
    
    comments: {
        // 留言表單 ID
        formId: 'YOUR_COMMENTS_FORM_ID_HERE',
        
        // 留言試算表 ID
        sheetId: 'YOUR_COMMENTS_SHEET_ID_HERE',
        
        // 留言試算表的 CSV 發布網址
        csvUrl: 'YOUR_COMMENTS_CSV_URL_HERE',
        
        // 表單欄位的 entry ID
        // ⚠️ 注意: 不包含 timestamp,因為 Google Forms 會自動記錄時間戳記
        entries: {
            tripId: 'entry.XXXXXXXX',     // 行程 ID 欄位
            spotId: 'entry.XXXXXXXX',     // 景點 ID 欄位
            nickname: 'entry.XXXXXXXX',   // 暱稱欄位
            comment: 'entry.XXXXXXXX'     // 留言內容欄位
        }
    }
};

// Google Forms 提交網址格式
// https://docs.google.com/forms/d/e/{formId}/formResponse
