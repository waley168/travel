// Google Forms 設定檔
// 請依照 GOOGLE_FORMS_SETUP.md 的指示填入正確的 ID

const FORMS_CONFIG = {
    likes: {
        // 按讚表單 ID (從表單網址取得)
        formId: '1JVSxrAPf-S4mB_LR_UJJXhmqnSgwe8qE8nkLnfAiyDQ',
        
        // 按讚試算表 ID (從試算表網址取得)
        sheetId: '1Z0rRNRZnd16Xakc3O3RXZ-tPC8Uc1TGqevygmXtkGIM',
        
        // 按讚試算表的 CSV 發布網址
        csvUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR0jFL2sgsEe1MKuPnjs1b-mXKTxHfsXiTOiA_jrM4VC3k1AnBj6z3-7EtSwREZIi0OnVE4Y34MMvbl/pub?output=csv',
        
        // 表單欄位的 entry ID (從表單 HTML 取得)
        // ⚠️ 注意: 不包含 timestamp,因為 Google Forms 會自動記錄時間戳記
        entries: {
            tripId: 'entry.2145170608',    // 行程 ID 欄位
            spotId: 'entry.3814469'        // 景點 ID 欄位
        }
    },
    
    comments: {
        // 留言表單 ID
        formId: '1-Kbs2BeH6wjVlJ8myeIO_ZShb0GcBH3myVIC-nmLh_U',
        
        // 留言試算表 ID
        sheetId: '1HzjmIsvi_okItcvDsBrb37y2PMuAH41lla6bBX9bmlI',
        
        // 留言試算表的 CSV 發布網址
        csvUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTh-kovXpHJ_hicOfYPtr-g4oA2W6wAFozF9LeSp45DARciPhRBjjCwqmBCPT4z3VOD4548C-GvxNH5/pub?output=csv',
        
        // 表單欄位的 entry ID
        // ⚠️ 注意: 不包含 timestamp,因為 Google Forms 會自動記錄時間戳記
        entries: {
            tripId: 'entry.231456966',      // 行程 ID 欄位
            spotId: 'entry.251970151',      // 景點 ID 欄位
            nickname: 'entry.1682345074',   // 暱稱欄位
            comment: 'entry.1573644665'     // 留言內容欄位
        }
    }
};

// Google Forms 提交網址格式
// https://docs.google.com/forms/d/e/{formId}/formResponse
