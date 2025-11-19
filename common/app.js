// 共用 PWA 功能腳本 - 適用於所有旅行行程

// Service Worker 註冊
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
            .then(reg => console.log('Service Worker 已註冊'))
            .catch(err => console.log('Service Worker 註冊失敗:', err));
    });
}

// PWA 安裝提示
let deferredPrompt;
const installPromptDiv = document.createElement('div');
installPromptDiv.id = 'installPrompt';
installPromptDiv.className = 'install-prompt hidden';
installPromptDiv.innerHTML = `
    <div class="install-prompt-text">
        <strong><span class="mdi mdi-download"></span>安裝到手機</strong>
        <small>離線也能隨時查看行程</small>
    </div>
    <div>
        <button class="install-btn" id="installBtn">安裝</button>
        <button id="closePrompt">稍後</button>
    </div>
`;
document.body.insertBefore(installPromptDiv, document.querySelector('.container'));

// 離線狀態提示
const offlineDiv = document.createElement('div');
offlineDiv.id = 'offlineIndicator';
offlineDiv.className = 'offline-indicator';
offlineDiv.innerHTML = '<span class="mdi mdi-wifi-off"></span> 目前處於離線模式';
document.body.insertBefore(offlineDiv, document.querySelector('.container'));

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installPromptDiv.classList.remove('hidden');
});

document.addEventListener('click', async (e) => {
    if (e.target.id === 'installBtn') {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`使用者選擇: ${outcome}`);
            deferredPrompt = null;
            installPromptDiv.classList.add('hidden');
        }
    }
    if (e.target.id === 'closePrompt') {
        installPromptDiv.classList.add('hidden');
    }
});

// 離線/在線狀態檢測
window.addEventListener('online', () => {
    offlineDiv.classList.remove('show');
});

window.addEventListener('offline', () => {
    offlineDiv.classList.add('show');
});

// 檢查初始狀態
if (!navigator.onLine) {
    offlineDiv.classList.add('show');
}

// 如果已經安裝，隱藏安裝提示
if (window.matchMedia('(display-mode: standalone)').matches) {
    installPromptDiv.classList.add('hidden');
}

// 固定日期標題的顯示邏輯
const fixedDayHeader = document.getElementById('fixedDayHeader');
const fixedDayTitle = document.getElementById('fixedDayTitle');
const scrollToTopBtn = document.getElementById('scrollToTop');
let currentDay = '';

window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    
    // 顯示/隱藏回到頂端按鈕
    if (scrollToTopBtn) {
        if (scrolled > 500) {
            scrollToTopBtn.classList.add('show');
        } else {
            scrollToTopBtn.classList.remove('show');
        }
    }
    
    // 固定標題邏輯 - 使用 .day-card
    const dayCards = document.querySelectorAll('.day-card');
    let activeDay = '';
    
    dayCards.forEach(card => {
        const rect = card.getBoundingClientRect();
        // 當卡片在視窗上方 1/3 處時
        if (rect.top <= 150 && rect.bottom >= 150) {
            const dayTitle = card.querySelector('h3')?.textContent;
            if (dayTitle) {
                activeDay = dayTitle;
            }
        }
    });
    
    if (activeDay && activeDay !== currentDay) {
        currentDay = activeDay;
        if (fixedDayTitle) {
            fixedDayTitle.textContent = currentDay;
        }
        if (fixedDayHeader && scrolled > 200) {
            fixedDayHeader.classList.add('show');
        }
    } else if (!activeDay || scrolled <= 200) {
        if (fixedDayHeader) {
            fixedDayHeader.classList.remove('show');
        }
        currentDay = '';
    }
});

// 平滑捲動到指定元素
function smoothScrollTo(element) {
    if (element) {
        const headerOffset = 80;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    }
}

// 回到頂端
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// 動態生成行程選單並綁定事件
document.addEventListener('DOMContentLoaded', () => {
    const summaryDays = document.querySelectorAll('.summary-day');
    const dayCards = document.querySelectorAll('.day-card');
    const dayMenuList = document.getElementById('dayMenuList');
    const menuBtn = document.getElementById('menuBtn');
    const closeMenuBtn = document.getElementById('closeMenuBtn');
    const dayMenu = document.getElementById('dayMenu');
    const dayMenuOverlay = document.getElementById('dayMenuOverlay');
    
    // 綁定行程總覽點擊事件
    summaryDays.forEach((day, index) => {
        day.style.cursor = 'pointer';
        day.addEventListener('click', () => {
            if (dayCards[index]) {
                smoothScrollTo(dayCards[index]);
            }
        });
    });
    
    // 動態生成選單項目
    if (dayMenuList && summaryDays.length > 0) {
        summaryDays.forEach((summaryDay, index) => {
            const strong = summaryDay.querySelector('strong');
            const description = summaryDay.textContent.replace(strong?.textContent || '', '').trim();
            
            const menuItem = document.createElement('div');
            menuItem.className = 'day-menu-item';
            menuItem.innerHTML = `
                <div class="day-icon">
                    <span class="iconify" data-icon="mdi:calendar-blank"></span>
                </div>
                <div class="day-info">
                    <strong>${strong?.textContent || `Day ${index + 1}`}</strong>
                    <p>${description}</p>
                </div>
            `;
            
            // 點擊選單項目滑動到對應天數
            menuItem.addEventListener('click', () => {
                if (dayCards[index]) {
                    smoothScrollTo(dayCards[index]);
                    closeMenu();
                }
            });
            
            dayMenuList.appendChild(menuItem);
        });
    }
    
    // 開啟選單
    function openMenu() {
        if (dayMenu && dayMenuOverlay) {
            dayMenu.classList.add('show');
            dayMenuOverlay.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }
    
    // 關閉選單
    function closeMenu() {
        if (dayMenu && dayMenuOverlay) {
            dayMenu.classList.remove('show');
            dayMenuOverlay.classList.remove('show');
            document.body.style.overflow = '';
        }
    }
    
    // 綁定選單按鈕
    if (menuBtn) {
        menuBtn.addEventListener('click', openMenu);
    }
    
    if (closeMenuBtn) {
        closeMenuBtn.addEventListener('click', closeMenu);
    }
    
    if (dayMenuOverlay) {
        dayMenuOverlay.addEventListener('click', closeMenu);
    }
    
    // 選單手勢滑動功能
    if (dayMenu) {
        let touchStartX = 0;
        let touchStartY = 0;
        let touchCurrentX = 0;
        let isDragging = false;
        
        dayMenu.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            isDragging = false;
            dayMenu.style.transition = 'none';
        }, { passive: true });
        
        dayMenu.addEventListener('touchmove', (e) => {
            touchCurrentX = e.touches[0].clientX;
            const touchCurrentY = e.touches[0].clientY;
            const deltaX = touchCurrentX - touchStartX;
            const deltaY = Math.abs(touchCurrentY - touchStartY);
            
            // 只有當水平滑動大於垂直滑動時才觸發
            if (Math.abs(deltaX) > deltaY && Math.abs(deltaX) > 10) {
                isDragging = true;
                // 只允許向右滑動
                if (deltaX > 0) {
                    dayMenu.style.transform = `translateX(${deltaX}px)`;
                    // 根據滑動距離調整遮罩透明度
                    const opacity = 1 - (deltaX / dayMenu.offsetWidth);
                    dayMenuOverlay.style.opacity = Math.max(0, opacity * 0.5);
                }
            }
        }, { passive: true });
        
        dayMenu.addEventListener('touchend', () => {
            dayMenu.style.transition = 'transform 0.3s ease, right 0.3s ease';
            const deltaX = touchCurrentX - touchStartX;
            
            // 如果滑動超過選單寬度的 30%,則關閉選單
            if (isDragging && deltaX > dayMenu.offsetWidth * 0.3) {
                closeMenu();
            } else {
                // 否則彈回原位
                dayMenu.style.transform = '';
                dayMenuOverlay.style.opacity = '';
            }
            
            isDragging = false;
            touchStartX = 0;
            touchCurrentX = 0;
        });
    }
    
    // 監聽滾動更新選單中的活動項目
    window.addEventListener('scroll', () => {
        const menuItems = document.querySelectorAll('.day-menu-item');
        let activeIndex = -1;
        
        dayCards.forEach((card, index) => {
            const rect = card.getBoundingClientRect();
            if (rect.top <= 150 && rect.bottom >= 150) {
                activeIndex = index;
            }
        });
        
        menuItems.forEach((item, index) => {
            if (index === activeIndex) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    });
    
    // ========== 瀏覽狀態記憶功能 ==========
    
    // 獲取當前頁面的唯一標識 (使用路徑作為 key)
    const pageKey = window.location.pathname.replace(/\//g, '_');
    const scrollPosKey = `scrollPos_${pageKey}`;
    const dayCardStateKey = `dayCardState_${pageKey}`;
    
    // 恢復 day-card 的展開/收合狀態
    function restoreDayCardStates() {
        try {
            const savedStates = localStorage.getItem(dayCardStateKey);
            if (savedStates) {
                const states = JSON.parse(savedStates);
                dayCards.forEach((card, index) => {
                    if (states[index] !== undefined) {
                        card.open = states[index];
                    }
                });
            }
        } catch (e) {
            console.error('恢復 day-card 狀態失敗:', e);
        }
    }
    
    // 儲存 day-card 的展開/收合狀態
    function saveDayCardStates() {
        try {
            const states = [];
            dayCards.forEach(card => {
                states.push(card.open);
            });
            localStorage.setItem(dayCardStateKey, JSON.stringify(states));
        } catch (e) {
            console.error('儲存 day-card 狀態失敗:', e);
        }
    }
    
    // 恢復上次瀏覽位置
    function restoreScrollPosition() {
        try {
            const savedScrollPos = localStorage.getItem(scrollPosKey);
            if (savedScrollPos) {
                const scrollPos = parseInt(savedScrollPos, 10);
                // 使用 setTimeout 確保頁面完全載入後再滾動
                setTimeout(() => {
                    window.scrollTo({
                        top: scrollPos,
                        behavior: 'auto' // 使用 auto 避免動畫延遲
                    });
                }, 100);
            }
        } catch (e) {
            console.error('恢復滾動位置失敗:', e);
        }
    }
    
    // 儲存當前滾動位置 (使用節流避免頻繁寫入)
    let scrollSaveTimer = null;
    function saveScrollPosition() {
        if (scrollSaveTimer) {
            clearTimeout(scrollSaveTimer);
        }
        scrollSaveTimer = setTimeout(() => {
            try {
                const scrollPos = window.pageYOffset || document.documentElement.scrollTop;
                localStorage.setItem(scrollPosKey, scrollPos.toString());
            } catch (e) {
                console.error('儲存滾動位置失敗:', e);
            }
        }, 500); // 500ms 節流
    }
    
    // 監聽 day-card 的展開/收合事件
    dayCards.forEach(card => {
        card.addEventListener('toggle', saveDayCardStates);
    });
    
    // 監聽滾動事件來儲存位置
    window.addEventListener('scroll', saveScrollPosition, { passive: true });
    
    // 監聽頁面離開事件,確保儲存狀態
    window.addEventListener('beforeunload', () => {
        saveScrollPosition();
        saveDayCardStates();
    });
    
    // 頁面可見性變化時也儲存狀態
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            saveScrollPosition();
            saveDayCardStates();
        }
    });
    
    // 頁面載入完成後恢復狀態
    restoreDayCardStates();
    restoreScrollPosition();
    
    // ========== 字體大小和主題切換功能 ==========
    
    const fontSizeSmallBtn = document.getElementById('fontSizeSmall');
    const fontSizeMediumBtn = document.getElementById('fontSizeMedium');
    const fontSizeLargeBtn = document.getElementById('fontSizeLarge');
    const themeToggleBtn = document.getElementById('themeToggle');
    
    // 從 localStorage 讀取設定
    const savedFontSize = localStorage.getItem('fontSize') || 'medium';
    const savedTheme = localStorage.getItem('theme') || 'light';
    
    // 應用字體大小
    function applyFontSize(size) {
        document.body.classList.remove('font-small', 'font-medium', 'font-large');
        document.body.classList.add(`font-${size}`);
        
        // 更新按鈕狀態
        [fontSizeSmallBtn, fontSizeMediumBtn, fontSizeLargeBtn].forEach(btn => {
            btn?.classList.remove('active');
        });
        
        if (size === 'small') fontSizeSmallBtn?.classList.add('active');
        if (size === 'medium') fontSizeMediumBtn?.classList.add('active');
        if (size === 'large') fontSizeLargeBtn?.classList.add('active');
        
        localStorage.setItem('fontSize', size);
    }
    
    // 應用主題
    function applyTheme(theme) {
        if (theme === 'dark') {
            document.body.classList.add('dark-mode');
            if (themeToggleBtn) {
                themeToggleBtn.querySelector('.iconify').setAttribute('data-icon', 'mdi:white-balance-sunny');
                themeToggleBtn.title = '切換淺色模式';
            }
        } else {
            document.body.classList.remove('dark-mode');
            if (themeToggleBtn) {
                themeToggleBtn.querySelector('.iconify').setAttribute('data-icon', 'mdi:weather-night');
                themeToggleBtn.title = '切換深色模式';
            }
        }
        localStorage.setItem('theme', theme);
    }
    
    // 初始化設定
    applyFontSize(savedFontSize);
    applyTheme(savedTheme);
    
    // 綁定字體大小按鈕
    fontSizeSmallBtn?.addEventListener('click', () => applyFontSize('small'));
    fontSizeMediumBtn?.addEventListener('click', () => applyFontSize('medium'));
    fontSizeLargeBtn?.addEventListener('click', () => applyFontSize('large'));
    
    // 綁定主題切換按鈕
    themeToggleBtn?.addEventListener('click', () => {
        const currentTheme = localStorage.getItem('theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        applyTheme(newTheme);
    });
});
