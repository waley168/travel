// Google Sheets 留言和按讚功能
// 請將 SHEET_API_URL 替換為你的 Google Apps Script Web API URL

const SHEET_API_URL = 'https://script.google.com/macros/s/AKfycbw4xpYlKJcGWf9WjNJYAUkL2Ykb8kTwJEKSeIM_oIrlIGeurvx7cvxzJ1H4brSQVxrW/exec';

class TravelComments {
    constructor(tripId) {
        this.tripId = tripId;
        this.cache = new Map();
    }

    // 載入所有景點的按讚數和留言
    async loadAll() {
        try {
            // 使用 JSONP 繞過 CORS
            const data = await this.fetchJSONP(`${SHEET_API_URL}?action=getAll&tripId=${this.tripId}`);
            
            // 更新快取
            data.forEach(spot => {
                this.cache.set(spot.spotId, spot);
                this.updateUI(spot.spotId, spot);
            });
            
            return data;
        } catch (error) {
            console.error('載入資料失敗:', error);
            return [];
        }
    }

    // JSONP 請求函數
    fetchJSONP(url) {
        return new Promise((resolve, reject) => {
            const callbackName = 'jsonp_callback_' + Date.now();
            const script = document.createElement('script');
            
            // 設定全域 callback 函數
            window[callbackName] = (data) => {
                delete window[callbackName];
                document.body.removeChild(script);
                resolve(data);
            };
            
            // 處理錯誤
            script.onerror = () => {
                delete window[callbackName];
                document.body.removeChild(script);
                reject(new Error('JSONP request failed'));
            };
            
            // 加入 callback 參數並載入腳本
            script.src = url + '&callback=' + callbackName;
            document.body.appendChild(script);
        });
    }

    // 按讚
    async addLike(spotId) {
        try {
            const response = await fetch(SHEET_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'addLike',
                    tripId: this.tripId,
                    spotId: spotId
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.cache.set(spotId, data.data);
                this.updateUI(spotId, data.data);
            }
            
            return data;
        } catch (error) {
            console.error('按讚失敗:', error);
            return { success: false, error: error.message };
        }
    }

    // 新增留言
    async addComment(spotId, comment, nickname = '匿名') {
        if (!comment || comment.trim() === '') {
            return { success: false, error: '留言不能為空' };
        }

        try {
            const response = await fetch(SHEET_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'addComment',
                    tripId: this.tripId,
                    spotId: spotId,
                    nickname: nickname.trim(),
                    comment: comment.trim(),
                    timestamp: new Date().toISOString()
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.cache.set(spotId, data.data);
                this.updateUI(spotId, data.data);
            }
            
            return data;
        } catch (error) {
            console.error('留言失敗:', error);
            return { success: false, error: error.message };
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

        // 更新留言列表
        const commentsList = document.querySelector(`[data-spot-id="${spotId}"] .comments-list`);
        
        if (commentsList && data.comments) {
            commentsList.innerHTML = data.comments.map(c => `
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
        const date = new Date(timestamp);
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
            day: '2-digit' 
        });
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
                    alert('請輸入留言內容');
                    return;
                }
                
                submitBtn.disabled = true;
                submitBtn.textContent = '送出中...';
                
                const result = await this.addComment(spotId, comment, nickname);
                
                if (result.success) {
                    commentInput.value = '';
                    if (nicknameInput) nicknameInput.value = '';
                } else {
                    alert('留言失敗: ' + (result.error || '未知錯誤'));
                }
                
                submitBtn.disabled = false;
                submitBtn.textContent = '送出留言';
            });
        }
    }
}

// 全域實例
window.TravelComments = TravelComments;
