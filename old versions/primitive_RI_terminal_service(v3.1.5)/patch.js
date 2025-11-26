(function() {
    // --- CONFIGURATION ---
    const SAFE_DATA = {
        isOffline: true,
        // UPDATED: Structure matches 'highlights' array format
        highlights: [{
            title: "Rhodes Console",
            subtitle: "OFFLINE",
            cover: "https://web.hycdn.cn/arknights/official/assets/images/bg.jpg",
            link: "#"
        }],
        newsList: [{ title: "Connection System Initializing...", date: "...", link: "#" }]
    };

    // --- UI COMPONENTS ---
    function initProgressBar() {
        const bar = document.createElement('div');
        bar.id = 'rhodes-progress';
        bar.style.cssText = `position: fixed; top: 0; left: 0; height: 3px; width: 0%; background: #29B6F6; z-index: 10000; box-shadow: 0 0 10px #29B6F6; transition: width 0.4s ease, opacity 0.4s ease;`;
        document.body.appendChild(bar);
        return bar;
    }

    function updateProgress(percent) {
        const bar = document.getElementById('rhodes-progress');
        if (bar) {
            bar.style.width = percent + '%';
            if (percent >= 100) {
                setTimeout(() => { bar.style.opacity = '0'; }, 600);
                setTimeout(() => { if(bar.parentNode) bar.parentNode.removeChild(bar); }, 1000);
            }
        }
    }

    function initClock() {
        const clockContainer = document.createElement('div');
        clockContainer.id = 'rhodes-clock';
        clockContainer.style.cssText = `position: fixed; bottom: 40px; left: 40px; z-index: 50; font-family: 'Oswald', sans-serif; line-height: 0.9; text-shadow: 0 4px 10px rgba(0,0,0,0.6); pointer-events: none; user-select: none;`;

        const timeEl = document.createElement('div');
        timeEl.style.cssText = `font-size: 4rem; font-weight: 700; color: #fff; letter-spacing: 2px; margin-bottom: 5px;`;

        const dateEl = document.createElement('div');
        dateEl.style.cssText = `font-size: 1.8rem; font-weight: 400; color: #999; padding-left: 6px; letter-spacing: 1px; text-transform: uppercase;`;

        clockContainer.appendChild(timeEl);
        clockContainer.appendChild(dateEl);
        document.body.appendChild(clockContainer);

        function updateTime() {
            const now = new Date();
            const h = String(now.getHours()).padStart(2, '0');
            const m = String(now.getMinutes()).padStart(2, '0');
            const s = String(now.getSeconds()).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const month = now.toLocaleString('en-US', { month: 'long' });
            const year = now.getFullYear();

            timeEl.textContent = `${h}:${m}:${s}`;
            dateEl.textContent = `${day} ${month}, ${year}`;
        }
        updateTime();
        setInterval(updateTime, 1000);
    }

    function updateWeatherUI(data) {
        let container = document.getElementById('rhodes-weather');
        if (!container) {
            container = document.createElement('div');
            container.id = 'rhodes-weather';
            container.style.cssText = `position: fixed; bottom: 40px; right: 40px; z-index: 50; font-family: 'Oswald', sans-serif; text-align: right; text-shadow: 0 2px 8px rgba(0,0,0,0.8); pointer-events: none; user-select: none; opacity: 0; transition: opacity 1s ease;`;
            document.body.appendChild(container);
        }

        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-GB'); 
        const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' });

        container.innerHTML = `
            <div style="font-size: 1.1rem; color: #29B6F6; letter-spacing: 1px; font-weight: 500;">
                <span style="color:#fff; font-weight:700;">${data.temp}°C</span> // ${data.condition} // ${data.city}
            </div>
            <div style="font-size: 0.7rem; color: #888; margin-top: 4px; font-family: sans-serif;">
                Last updated: ${timeStr}, ${dateStr}
            </div>
        `;
        setTimeout(() => { container.style.opacity = '1'; }, 100);
    }

    function initNotifications() {
        const style = document.createElement('style');
        style.textContent = `
            #rhodes-toast-container { position: fixed; top: 90px; right: 20px; width: auto; max-width: 400px; z-index: 9999; display: flex; flex-direction: column; align-items: flex-end; pointer-events: none; }
            .rhodes-toast { background: rgba(10, 10, 10, 0.85); backdrop-filter: blur(8px); color: #eee; font-family: 'Oswald', sans-serif; font-size: 0.85rem; letter-spacing: 0.5px; border-left: 3px solid #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.4); pointer-events: auto; overflow: hidden; display: flex; align-items: center; white-space: nowrap; opacity: 0; transform: translateX(20px); max-height: 0; margin-bottom: 0; padding: 0 16px; animation: toastSlideIn 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
            .rhodes-toast.success { border-left-color: #29B6F6; } .rhodes-toast.error { border-left-color: #ef5350; } .rhodes-toast.info { border-left-color: #fff; }
            .rhodes-toast-header { font-weight: 700; color: #aaa; margin-right: 8px; } .rhodes-toast.success .rhodes-toast-header { color: #29B6F6; } .rhodes-toast.error .rhodes-toast-header { color: #ef5350; }
            .rhodes-toast-msg { color: #fff; font-weight: 400; }
            @keyframes toastSlideIn { 0% { opacity: 0; transform: translateX(20px); max-height: 0; margin-bottom: 0; padding-top: 0; padding-bottom: 0; } 40% { max-height: 60px; margin-bottom: 8px; padding-top: 10px; padding-bottom: 10px; } 100% { opacity: 1; transform: translateX(0); max-height: 60px; margin-bottom: 8px; padding-top: 10px; padding-bottom: 10px; } }
            @keyframes toastFadeOut { 0% { opacity: 1; transform: translateX(0); max-height: 60px; margin-bottom: 8px; } 50% { opacity: 0; transform: translateX(10px); max-height: 60px; margin-bottom: 8px;} 100% { opacity: 0; transform: translateX(10px); max-height: 0; margin-bottom: 0; padding-top: 0; padding-bottom: 0; } }
        `;
        document.head.appendChild(style);
        const container = document.createElement('div');
        container.id = 'rhodes-toast-container';
        document.body.appendChild(container);
    }

    function showToast(message, type = 'info', title = 'SYSTEM') {
        const container = document.getElementById('rhodes-toast-container');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = `rhodes-toast ${type}`;
        toast.innerHTML = `<span class="rhodes-toast-header">// ${title}:</span><span class="rhodes-toast-msg">${message}</span>`;
        container.prepend(toast); 
        setTimeout(() => {
            toast.style.animation = 'toastFadeOut 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards';
            setTimeout(() => { if (container.contains(toast)) container.removeChild(toast); }, 600);
        }, 5000); 
    }

    // --- MAIN LOGIC ---
    async function requestData() {
        if(!document.getElementById('rhodes-progress')) initProgressBar();
        if (!document.getElementById('rhodes-clock')) initClock();
        if (!document.getElementById('rhodes-toast-container')) {
            initNotifications();
            setTimeout(() => showToast("Welcome back, Doctor.", "info", "LOGIN"), 800);
        }

        const headerTitle = document.querySelector('header h4');
        if (headerTitle) {
            headerTitle.innerText = "PRTS // Primitive Rhodes Island Terminal Service";
            headerTitle.style.fontSize = "1.1rem"; headerTitle.style.letterSpacing = "1px"; headerTitle.style.color = "#fff"; 
        }

        const oldNews = document.querySelector('.scrollarea');
        const oldHighlights = document.querySelector('.mantine-Carousel-container');

        if (!oldNews || !oldHighlights) {
            setTimeout(requestData, 200);
            return;
        }

        updateProgress(30);

        const newsContainer = oldNews.cloneNode(true);
        oldNews.parentNode.replaceChild(newsContainer, oldNews);
        const highlightsContainer = oldHighlights.cloneNode(true);
        oldHighlights.parentNode.replaceChild(highlightsContainer, oldHighlights);

        // Rhombuses (White)
        newsContainer.innerHTML = `
            <div style="display:flex; justify-content:center; align-items:center; height:100%; gap:12px; padding-top:80px;">
                <div style="width:10px; height:10px; background:#FFFFFF; transform:rotate(45deg); animation: rh-pulse 1.2s infinite ease-in-out;"></div>
                <div style="width:10px; height:10px; background:#FFFFFF; transform:rotate(45deg); animation: rh-pulse 1.2s infinite ease-in-out 0.2s;"></div>
                <div style="width:10px; height:10px; background:#FFFFFF; transform:rotate(45deg); animation: rh-pulse 1.2s infinite ease-in-out 0.4s;"></div>
                <style>@keyframes rh-pulse { 0%,100%{opacity:0.3;} 50%{opacity:1; box-shadow: 0 0 8px #FFFFFF;} }</style>
            </div>
        `;
        
        if (!chrome || !chrome.runtime || !chrome.runtime.sendMessage) {
            handleOffline("Runtime Detached", newsContainer, highlightsContainer);
            return;
        }

        showToast("Requesting Weather Data...", "info", "NETWORK");
        updateProgress(40);
        
        let isSystemOnline = false;

        try {
            const weatherData = await new Promise(resolve => {
                chrome.runtime.sendMessage({ type: 'FETCH_WEATHER' }, resolve);
            });
            if (weatherData && weatherData.success) {
                updateWeatherUI(weatherData);
                showToast("Weather Data Successfully Pulled", "success", "WEATHER");
                isSystemOnline = true;
            } else {
                showToast("Weather Data Unreachable", "error", "WEATHER");
            }
        } catch(e) {}

        showToast("Requesting System Data...", "info", "NETWORK");
        updateProgress(60);

        try {
            chrome.runtime.sendMessage({ type: 'FETCH_NEWS' }, (response) => {
                updateProgress(80);
                if (chrome.runtime.lastError || !response) {
                    handleOffline("Connection Failed", newsContainer, highlightsContainer, isSystemOnline);
                } else {
                    if (response.isOffline) {
                        handleOffline("Live Data Unreachable", newsContainer, highlightsContainer, isSystemOnline);
                    } else {
                        showToast("System Data Successfully Pulled", "success", "DATA");
                        renderData(response, newsContainer, highlightsContainer, isSystemOnline); // Pass online status
                        updateProgress(100);
                    }
                }
            });
        } catch (e) {
            handleOffline("Internal Error", newsContainer, highlightsContainer, isSystemOnline);
        }
    }

    // UPDATED: Handle Offline - Updates SAFE_DATA text dynamically
    function handleOffline(reason, newsContainer, highlightsContainer, isWeatherOnline) {
        showToast(reason, "error", "NETWORK");
        showToast("Using Local Cache", "info", "BACKUP");
        
        // Set Banner Text based on connection
        const statusText = isWeatherOnline ? "ONLINE" : "OFFLINE";
        SAFE_DATA.highlights[0].subtitle = statusText;

        if (isWeatherOnline) showToast("Terminal Online", "success", "SYSTEM");
        else showToast("Terminal Offline", "error", "SYSTEM");

        renderData(SAFE_DATA, newsContainer, highlightsContainer, isWeatherOnline);
        updateProgress(100);
    }

    // --- VERTICAL NEWS CAROUSEL ---
    function startNewsTicker(container, items) {
        if (!items || items.length === 0) return;
        container.innerHTML = '';
        
        const CARD_HEIGHT = 80; 
        const VISIBLE_ITEMS = 3;
        const TOTAL_HEIGHT = CARD_HEIGHT * VISIBLE_ITEMS;

        // UPDATED: CSS Injection to force height
        container.style.setProperty('height', `${TOTAL_HEIGHT}px`, 'important');
        container.style.setProperty('min-height', `${TOTAL_HEIGHT}px`, 'important');
        container.style.setProperty('max-height', `${TOTAL_HEIGHT}px`, 'important');
        container.style.setProperty('overflow', 'hidden', 'important');
        container.style.setProperty('display', 'block', 'important');
        container.style.setProperty('flex', 'none', 'important'); // Stop flexbox expansion

        const track = document.createElement('div');
        track.style.cssText = `display: flex; flex-direction: column; transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);`;
        container.appendChild(track);

        items.forEach(item => {
            const card = document.createElement('div');
            card.style.cssText = `
                background:rgba(30, 30, 30, 0.67); border-left:4px solid #fff; 
                padding:12px; margin-bottom: ${CARD_HEIGHT - 74}px; height: 74px; 
                cursor:pointer; transition: 0.2s; border-radius: 0 8px 8px 0;
                flex-shrink: 0; box-sizing: border-box;
            `;
            card.onmouseenter = () => card.style.background = 'rgba(50, 50, 50, 0.9)';
            card.onmouseleave = () => card.style.background = 'rgba(30, 30, 30, 0.67)';

            const dateColor = (item.date.includes("LIVE") || item.date.includes("UPCOMING")) ? "#29B6F6" : (item.date.includes("COMPLETED") ? "#ff9800" : "#aaa");

            card.innerHTML = `
                <div style="color:#fff; font-size:0.9rem; font-weight:500; line-height:1.2; font-family:sans-serif; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.title}</div>
                <div style="color:${dateColor}; font-size:0.7rem; font-family:monospace; margin-top:4px;">${item.date}</div>
            `;
            card.onclick = () => window.open(item.link, '_blank');
            track.appendChild(card);
        });

        if (items.length > VISIBLE_ITEMS) {
            let currentIndex = 0;
            setInterval(() => {
                currentIndex++;
                if (currentIndex > items.length - VISIBLE_ITEMS) currentIndex = 0;
                track.style.transform = `translateY(-${currentIndex * CARD_HEIGHT}px)`;
            }, 5000);
        }
    }

    function startCarousel(container, items) {
        if (!items || items.length === 0) return;
        let currentIndex = 0;
        container.innerHTML = '';
        
        // UPDATED: Rounded corners on Container + Overflow Hidden
        container.style.cssText = `position: relative; overflow: hidden; border-radius: 0 0 12px 12px;`;

        const banner = document.createElement('div');
        banner.style.cssText = `
            width: 100%; height: 100%; background-size: cover; background-position: center; 
            transition: background-image 0.5s ease-in-out; display: flex; align-items: flex-end; cursor: pointer;
            border-radius: 0 0 12px 12px; /* Double ensure rounding */
        `;

        const overlay = document.createElement('div');
        overlay.style.cssText = "width:100%; padding:20px; background:linear-gradient(to top, rgba(0,0,0,0.9), transparent); border-radius: 0 0 12px 12px;";
        
        const subtitle = document.createElement('div');
        subtitle.style.cssText = "color:#29B6F6; font-size:0.8rem; font-weight:bold; letter-spacing:1px; margin-bottom:4px; font-family:monospace;";
        
        const title = document.createElement('h2');
        title.style.cssText = "color:#fff; margin:0; font-family:'Oswald',sans-serif; font-size:1.6rem; text-shadow: 0 2px 4px black; line-height:1.2;";

        overlay.appendChild(subtitle);
        overlay.appendChild(title);
        banner.appendChild(overlay);
        container.appendChild(banner);

        const updateSlide = () => {
            const item = items[currentIndex];
            const imgCheck = new Image();
            imgCheck.src = item.cover;
            imgCheck.onload = () => { banner.style.backgroundImage = `url('${item.cover}')`; };
            imgCheck.onerror = () => { banner.style.backgroundImage = `url('https://web.hycdn.cn/arknights/official/assets/images/bg.jpg')`; };
            subtitle.innerText = `// ${item.subtitle || 'EVENT'}`;
            title.innerText = item.title;
            banner.onclick = () => window.open(item.link, '_blank');
        };

        updateSlide();
        setTimeout(() => showToast("Visual Module Loaded", "success", "DISPLAY"), 2200);

        if (items.length > 1) {
            setInterval(() => {
                currentIndex = (currentIndex + 1) % items.length;
                updateSlide();
            }, 10000);
        }
    }

    // UPDATED: Accepts isWeatherOnline to override the banner subtitle if needed
    function renderData(data, newsContainer, highlightsContainer, isWeatherOnline = false) {
        if (!newsContainer || !highlightsContainer) return;
        
        if (data.isOffline) {
            const badge = document.createElement('div');
            badge.textContent = '⚠ OFFLINE BACKUP';
            badge.style.cssText = "background:#ffc107; color:black; font-weight:bold; padding:4px; text-align:center; font-size:0.7rem; margin-bottom:10px; border-radius: 2px; font-family:sans-serif;";
            if(newsContainer.parentNode && !document.getElementById('offline-badge')) {
                badge.id = 'offline-badge';
                newsContainer.parentNode.insertBefore(badge, newsContainer);
            }
        }

        // Ensure Highlights reflect connection status
        const items = data.highlights || [];
        if (items.length > 0) {
            // If we are offline but weather is online, force the banner to say ONLINE
            if (isWeatherOnline && items[0].subtitle === "OFFLINE") {
                items[0].subtitle = "ONLINE";
            }
        }

        startNewsTicker(newsContainer, data.newsList || []);
        setTimeout(() => showToast("News Module Loaded", "success", "DATA"), 1500);
        startCarousel(highlightsContainer, items);
    }

    setTimeout(requestData, 500);
})();