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
        <button class="close-btn" id="closePrompt">稍後</button>
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

// 綁定行程總覽點擊事件
document.addEventListener('DOMContentLoaded', () => {
    const summaryDays = document.querySelectorAll('.summary-day');
    const dayCards = document.querySelectorAll('.day-card');
    
    summaryDays.forEach((day, index) => {
        day.style.cursor = 'pointer';
        day.addEventListener('click', () => {
            if (dayCards[index]) {
                smoothScrollTo(dayCards[index]);
            }
        });
    });
});
