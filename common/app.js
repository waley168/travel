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

// 固定日期標題功能
const fixedDayHeader = document.getElementById('fixedDayHeader');
const fixedDayTitle = document.getElementById('fixedDayTitle');
const dayCards = document.querySelectorAll('.day-card');

// 建立日期標題映射
const dayTitles = new Map();
dayCards.forEach(card => {
    const h3 = card.querySelector('h3');
    if (h3) {
        dayTitles.set(card, h3.textContent.trim());
    }
});

// 滾動監聽
let currentDayCard = null;
let ticking = false;

function updateFixedHeader() {
    const scrollY = window.scrollY || window.pageYOffset;
    const viewportMiddle = scrollY + window.innerHeight / 3;

    let foundCard = null;

    // 找出目前可見的日期卡片
    for (const card of dayCards) {
        const rect = card.getBoundingClientRect();
        const cardTop = rect.top + scrollY;
        const cardBottom = cardTop + rect.height;

        if (viewportMiddle >= cardTop && viewportMiddle <= cardBottom) {
            foundCard = card;
            break;
        }
    }

    // 更新固定標題
    if (foundCard && foundCard !== currentDayCard) {
        currentDayCard = foundCard;
        const title = dayTitles.get(foundCard);
        if (title) {
            fixedDayTitle.textContent = title;
            fixedDayHeader.classList.add('show');
            document.body.classList.add('has-fixed-header');
        }
    } else if (!foundCard && currentDayCard) {
        // 離開所有日期卡片區域
        fixedDayHeader.classList.remove('show');
        document.body.classList.remove('has-fixed-header');
        currentDayCard = null;
    }

    ticking = false;
}

function requestTick() {
    if (!ticking) {
        window.requestAnimationFrame(updateFixedHeader);
        ticking = true;
    }
}

// 監聽滾動事件
window.addEventListener('scroll', requestTick, { passive: true });

// 點擊固定標題滾動到對應卡片
fixedDayTitle.addEventListener('click', () => {
    if (currentDayCard) {
        currentDayCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
});

// 初始檢查
setTimeout(updateFixedHeader, 500);
