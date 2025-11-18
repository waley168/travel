// Google Forms 後端系統
// 使用 Google Forms 提交資料,用 CSV API 讀取資料
// 設定檔請參考 forms-config.js

class TravelComments {
    constructor(tripId) {
        this.tripId = tripId;
        this.cache = new Map();
        this.hasLiked = new Set(); // 記錄已按讚的景點
    }

    // 載入所有景點的按讚數和留言
    async loadAll() {
        try {
            // 同時載入按讚數和留言
            const [likes, comments] = await Promise.all([
                this.loadLikesFromCSV(),
                this.loadCommentsFromCSV()
            ]);
            
            // 整合資料
            const spotsMap = new Map();
            
            // 處理按讚數
            likes.forEach(({ spotId, count }) => {
                if (!spotsMap.has(spotId)) {
                    spotsMap.set(spotId, { spotId, likes: 0, comments: [] });
                }
                spotsMap.get(spotId).likes = count;
            });
            
            // 處理留言
            comments.forEach(({ spotId, nickname, comment, timestamp }) => {
                if (!spotsMap.has(spotId)) {
                    spotsMap.set(spotId, { spotId, likes: 0, comments: [] });
                }
                spotsMap.get(spotId).comments.push({ nickname, comment, timestamp });
            });
            
            // 更新快取和 UI
            const spots = Array.from(spotsMap.values());
            spots.forEach(spot => {
                this.cache.set(spot.spotId, spot);
                this.updateUI(spot.spotId, spot);
            });
            
            return spots;
        } catch (error) {
            console.error('載入資料失敗:', error);
            return [];
        }
    }

    // 從 Google Sheets CSV 載入按讚數
    async loadLikesFromCSV() {
        try {
            const response = await fetch(FORMS_CONFIG.likes.csvUrl);
            const text = await response.text();
            const rows = this.parseCSV(text);
            
            console.log('按讚 CSV 資料:', rows); // 除錯用
            
            // 跳過標題列,統計每個景點的按讚數
            const likesMap = new Map();
            rows.slice(1).forEach(row => {
                const tripId = row[1]; // 第二欄是 tripId
                const spotId = row[2]; // 第三欄是 spotId
                
                if (tripId && tripId.trim() === this.tripId) {
                    likesMap.set(spotId, (likesMap.get(spotId) || 0) + 1);
                }
            });
            
            console.log('按讚統計:', likesMap); // 除錯用
            
            return Array.from(likesMap.entries()).map(([spotId, count]) => ({
                spotId,
                count
            }));
        } catch (error) {
            console.error('載入按讚數失敗:', error);
            return [];
        }
    }

    // 從 Google Sheets CSV 載入留言
    async loadCommentsFromCSV() {
        try {
            const response = await fetch(FORMS_CONFIG.comments.csvUrl);
            const text = await response.text();
            const rows = this.parseCSV(text);
            
            console.log('留言 CSV 資料:', rows); // 除錯用
            
            // 跳過標題列,篩選此行程的留言
            // 欄位順序: 時間戳記 | tripId | spotId | nickname | comment
            const comments = [];
            rows.slice(1).forEach(row => {
                const timestamp = row[0]; // 第一欄是 Google 自動產生的時間戳記
                const tripId = row[1];    // 第二欄是 tripId
                const spotId = row[2];    // 第三欄是 spotId
                const nickname = row[3];  // 第四欄是 nickname
                const comment = row[4];   // 第五欄是 comment
                
                if (tripId && tripId.trim() === this.tripId) {
                    comments.push({ spotId, nickname, comment, timestamp });
                }
            });
            
            console.log('留言資料:', comments); // 除錯用
            
            return comments;
        } catch (error) {
            console.error('載入留言失敗:', error);
            return [];
        }
    }

    // 解析 CSV 文字
    parseCSV(text) {
        const rows = [];
        let currentRow = [];
        let currentCell = '';
        let insideQuotes = false;
        
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            const nextChar = text[i + 1];
            
            if (char === '"' && !insideQuotes) {
                insideQuotes = true;
            } else if (char === '"' && insideQuotes && nextChar === '"') {
                currentCell += '"';
                i++; // 跳過下一個引號
            } else if (char === '"' && insideQuotes) {
                insideQuotes = false;
            } else if (char === ',' && !insideQuotes) {
                currentRow.push(currentCell);
                currentCell = '';
            } else if ((char === '\n' || char === '\r') && !insideQuotes) {
                if (currentCell || currentRow.length > 0) {
                    currentRow.push(currentCell);
                    rows.push(currentRow);
                    currentRow = [];
                    currentCell = '';
                }
                if (char === '\r' && nextChar === '\n') {
                    i++; // 跳過 \r\n 的 \n
                }
            } else {
                currentCell += char;
            }
        }
        
        // 處理最後一筆資料
        if (currentCell || currentRow.length > 0) {
            currentRow.push(currentCell);
            rows.push(currentRow);
        }
        
        return rows;
    }

    // 新增按讚 (提交到 Google Forms)
    async addLike(spotId) {
        // 防止重複按讚 (簡單的前端檢查)
        if (this.hasLiked.has(spotId)) {
            this.showMessage(spotId, '你已經按過讚了!', 'warning');
            return false;
        }

        try {
            // 建立表單資料
            const formData = new FormData();
            formData.append(FORMS_CONFIG.likes.entries.tripId, this.tripId);
            formData.append(FORMS_CONFIG.likes.entries.spotId, spotId);
            // Google Forms 會自動記錄時間戳記,不需要手動提交

            // 提交到 Google Forms
            const formUrl = `https://docs.google.com/forms/d/e/${FORMS_CONFIG.likes.formId}/formResponse`;
            
            // 使用 no-cors 模式 (無法讀取回應,但可以提交)
            await fetch(formUrl, {
                method: 'POST',
                mode: 'no-cors',
                body: formData
            });

            // 樂觀更新 UI
            const cached = this.cache.get(spotId) || { spotId, likes: 0, comments: [] };
            cached.likes += 1;
            this.cache.set(spotId, cached);
            this.updateUI(spotId, cached);
            this.hasLiked.add(spotId);
            this.showMessage(spotId, '按讚成功!', 'success');
            
            return true;
        } catch (error) {
            console.error('按讚失敗:', error);
            this.showMessage(spotId, '按讚失敗,請稍後再試', 'error');
            return false;
        }
    }

    // 新增留言 (提交到 Google Forms)
    async addComment(spotId, nickname, comment) {
        if (!nickname.trim() || !comment.trim()) {
            this.showMessage(spotId, '請填寫暱稱和留言內容', 'warning');
            return false;
        }

        try {
            // 建立表單資料
            const formData = new FormData();
            formData.append(FORMS_CONFIG.comments.entries.tripId, this.tripId);
            formData.append(FORMS_CONFIG.comments.entries.spotId, spotId);
            formData.append(FORMS_CONFIG.comments.entries.nickname, nickname.trim());
            formData.append(FORMS_CONFIG.comments.entries.comment, comment.trim());
            // Google Forms 會自動記錄時間戳記,不需要手動提交

            // 提交到 Google Forms
            const formUrl = `https://docs.google.com/forms/d/e/${FORMS_CONFIG.comments.formId}/formResponse`;
            
            // 使用 no-cors 模式 (無法讀取回應,但可以提交)
            await fetch(formUrl, {
                method: 'POST',
                mode: 'no-cors',
                body: formData
            });

            // 樂觀更新 UI (使用當前時間作為顯示)
            const timestamp = new Date().toISOString();
            const cached = this.cache.get(spotId) || { spotId, likes: 0, comments: [] };
            cached.comments.push({ nickname: nickname.trim(), comment: comment.trim(), timestamp });
            this.cache.set(spotId, cached);
            this.updateUI(spotId, cached);
            this.showMessage(spotId, '留言成功!', 'success');
            
            return true;
        } catch (error) {
            console.error('留言失敗:', error);
            this.showMessage(spotId, '留言失敗,請稍後再試', 'error');
            return false;
        }
    }

    // 更新 UI
    updateUI(spotId, data) {
        // 更新按讚數
        const likeBtn = document.querySelector(`[data-spot-id="${spotId}"] .like-btn`);
        const likeCount = document.querySelector(`[data-spot-id="${spotId}"] .like-count`);
        
        if (likeCount) {
            likeCount.textContent = data.likes || 0;
        }

        // 更新留言列表 (最新的在上方)
        const commentsList = document.querySelector(`[data-spot-id="${spotId}"] .comments-list`);
        
        if (commentsList && data.comments) {
            // 反轉陣列,讓最新的留言在最上方
            const sortedComments = [...data.comments].reverse();
            commentsList.innerHTML = sortedComments.map(c => `
                <div class="comment-item">
                    <div class="comment-header">
                        <strong>${this.escapeHtml(c.nickname)}</strong>
                        <span class="comment-time">${this.formatTime(c.timestamp)}</span>
                    </div>
                    <div class="comment-text">${this.escapeHtml(c.comment)}</div>
                </div>
            `).join('');
        }
    }

    // HTML 轉義防止 XSS
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 格式化時間
    formatTime(timestamp) {
        if (!timestamp) return '未知時間';
        
        // 處理 Google Sheets 的時間格式: "2025/11/18 下午 2:46:09"
        let date;
        
        // 嘗試直接解析
        date = new Date(timestamp);
        
        // 如果解析失敗,嘗試轉換格式
        if (isNaN(date.getTime())) {
            // 轉換 "下午/上午" 格式
            const converted = timestamp
                .replace('上午', 'AM')
                .replace('下午', 'PM')
                .replace(/\//g, '-');
            date = new Date(converted);
        }
        
        // 如果還是失敗,返回原始字串
        if (isNaN(date.getTime())) {
            return timestamp;
        }
        
        const now = new Date();
        const diff = now - date;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 1) return '剛剛';
        if (minutes < 60) return `${minutes}分鐘前`;
        if (hours < 24) return `${hours}小時前`;
        if (days < 7) return `${days}天前`;
        
        return date.toLocaleDateString('zh-TW', { 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // 顯示訊息提示
    showMessage(spotId, message, type = 'info') {
        // 在對應的景點區域顯示訊息
        const spotContainer = document.querySelector(`[data-spot-id="${spotId}"]`);
        if (!spotContainer) {
            console.log(`[${type.toUpperCase()}] ${message}`);
            return;
        }

        // 建立訊息元素
        const messageDiv = document.createElement('div');
        messageDiv.className = `message-toast message-${type}`;
        messageDiv.textContent = message;
        messageDiv.style.cssText = `
            position: fixed;
            top: 80px;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#ff9800'};
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            z-index: 10000;
            animation: slideDown 0.3s ease-out;
        `;

        document.body.appendChild(messageDiv);

        // 3秒後移除
        setTimeout(() => {
            messageDiv.style.animation = 'slideUp 0.3s ease-out';
            setTimeout(() => messageDiv.remove(), 300);
        }, 3000);
    }

    // 初始化所有景點的互動區域
    initializeSpots(spotIds) {
        spotIds.forEach(spotId => {
            this.setupSpotListeners(spotId);
        });
        
        // 載入所有資料
        this.loadAll();
    }

    // 設置單一景點的事件監聽
    setupSpotListeners(spotId) {
        const container = document.querySelector(`[data-spot-id="${spotId}"]`);
        if (!container) return;

        // 按讚按鈕
        const likeBtn = container.querySelector('.like-btn');
        if (likeBtn) {
            likeBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                likeBtn.disabled = true;
                likeBtn.classList.add('liked');
                
                await this.addLike(spotId);
                
                setTimeout(() => {
                    likeBtn.disabled = false;
                }, 2000);
            });
        }

        // 留言表單
        const commentForm = container.querySelector('.comment-form');
        if (commentForm) {
            commentForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const nicknameInput = commentForm.querySelector('.comment-nickname');
                const commentInput = commentForm.querySelector('.comment-input');
                const submitBtn = commentForm.querySelector('.comment-submit');
                
                const nickname = nicknameInput?.value || '匿名';
                const comment = commentInput?.value;
                
                if (!comment || comment.trim() === '') {
                    this.showMessage(spotId, '請輸入留言內容', 'warning');
                    return;
                }
                
                submitBtn.disabled = true;
                submitBtn.textContent = '送出中...';
                
                // 修正參數順序: (spotId, nickname, comment)
                await this.addComment(spotId, nickname, comment);
                
                // 清空表單
                commentInput.value = '';
                if (nicknameInput) nicknameInput.value = '';
                
                submitBtn.disabled = false;
                submitBtn.textContent = '送出留言';
            });
        }
    }
}

// 全域實例
window.TravelComments = TravelComments;
