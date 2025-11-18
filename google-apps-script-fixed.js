// Google Apps Script - 旅行留言與按讚 API (已修正 CORS)

function doGet(e) {
  const action = e.parameter.action;
  const tripId = e.parameter.tripId;
  
  if (action === 'getAll' && tripId) {
    return getAllData(tripId);
  }
  
  return createCORSResponse({
    success: false,
    error: 'Invalid action'
  });
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
    
    return createCORSResponse({
      success: false,
      error: 'Invalid action'
    });
    
  } catch (error) {
    return createCORSResponse({
      success: false,
      error: error.toString()
    });
  }
}

// 建立支援 CORS 的回應
function createCORSResponse(data) {
  const output = ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
  
  return output;
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
  
  return createCORSResponse(resultArray);
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
  
  return createCORSResponse({
    success: true,
    data: { spotId, likes, comments }
  });
}

function addComment(tripId, spotId, nickname, comment, timestamp) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Comments');
  
  sheet.appendRow([tripId, spotId, nickname, comment, timestamp]);
  
  // 回傳更新後的資料
  const likes = getLikes(tripId, spotId);
  const comments = getComments(tripId, spotId);
  
  return createCORSResponse({
    success: true,
    data: { spotId, likes, comments }
  });
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
