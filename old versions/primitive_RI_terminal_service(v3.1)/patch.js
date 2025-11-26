(function() {
    // --- Safe Fallback Data ---
    const SAFE_DATA = {
        isOffline: true,
        banner: { title: "Welcome Doctor", cover: "", link: "#" },
        newsList: [{ title: "Connection System Initializing...", date: "...", link: "#" }]
    };

    function requestData() {
        // 1. MODIFY HEADER TEXT
        const headerTitle = document.querySelector('header h4');
        if (headerTitle) {
            headerTitle.innerText = "PRTS // Primitive Rhodes Island Terminal Service";
            // Adjust styling slightly to fit the longer text if needed
            headerTitle.style.fontSize = "1.1rem"; 
            headerTitle.style.letterSpacing = "1px";
        }

        // 2. LOCATE CONTAINERS
        const oldNews = document.querySelector('.scrollarea');
        const oldHighlights = document.querySelector('.mantine-Carousel-container');

        if (!oldNews || !oldHighlights) {
            setTimeout(requestData, 200);
            return;
        }

        // 3. DISCONNECT REACT (Cloning)
        const newsContainer = oldNews.cloneNode(true);
        oldNews.parentNode.replaceChild(newsContainer, oldNews);

        const highlightsContainer = oldHighlights.cloneNode(true);
        oldHighlights.parentNode.replaceChild(highlightsContainer, oldHighlights);

        // 4. LOADING STATE
        newsContainer.innerHTML = `<div style="padding:20px; color:#aaa; text-align:center; font-family:monospace;">Connecting to Rhodes Network...</div>`;

        // 5. FETCH DATA
        if (!chrome || !chrome.runtime || !chrome.runtime.sendMessage) {
            renderData(SAFE_DATA, newsContainer, highlightsContainer);
            return;
        }

        try {
            chrome.runtime.sendMessage({ type: 'FETCH_NEWS' }, (response) => {
                if (chrome.runtime.lastError || !response) {
                    renderData(SAFE_DATA, newsContainer, highlightsContainer);
                } else {
                    renderData(response, newsContainer, highlightsContainer);
                }
            });
        } catch (e) {
            renderData(SAFE_DATA, newsContainer, highlightsContainer);
        }
    }

    // --- CAROUSEL LOGIC ---
    function startCarousel(container, items) {
        if (!items || items.length === 0) return;
        let currentIndex = 0;
        
        container.innerHTML = '';
        container.style.position = 'relative';
        container.style.overflow = 'hidden';

        const banner = document.createElement('div');
        banner.style.cssText = `width: 100%; height: 100%; background-size: cover; background-position: center; transition: background-image 0.5s ease-in-out; display: flex; align-items: flex-end; cursor: pointer;`;

        const overlay = document.createElement('div');
        overlay.style.cssText = "width:100%; padding:20px; background:linear-gradient(to top, rgba(0,0,0,0.9), transparent);";
        
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
        if (items.length > 1) {
            setInterval(() => {
                currentIndex = (currentIndex + 1) % items.length;
                updateSlide();
            }, 6000);
        }
    }

    function renderData(data, newsContainer, highlightsContainer) {
        if (!newsContainer || !highlightsContainer) return;
        newsContainer.innerHTML = '';
        
        if (data.isOffline) {
            const badge = document.createElement('div');
            badge.textContent = '⚠ OFFLINE BACKUP';
            badge.style.cssText = "background:#ffc107; color:black; font-weight:bold; padding:4px; text-align:center; font-size:0.7rem; margin-bottom:10px; border-radius: 2px; font-family:sans-serif;";
            newsContainer.appendChild(badge);
        }

        (data.newsList || []).forEach(item => {
            const card = document.createElement('div');
            card.style.cssText = `background:rgba(30, 30, 30, 0.67); border-left:4px solid #fff; padding:12px; margin-bottom:6px; cursor:pointer; transition: 0.2s;`;
            card.onmouseenter = () => card.style.background = 'rgba(50, 50, 50, 0.9)';
            card.onmouseleave = () => card.style.background = 'rgba(30, 30, 30, 0.67)';

            const dateColor = (item.date.includes("LIVE") || item.date.includes("UPCOMING")) ? "#29B6F6" : "#aaa";

            card.innerHTML = `
                <div style="color:#fff; font-size:0.9rem; font-weight:500; line-height:1.2; font-family:sans-serif;">${item.title}</div>
                <div style="color:${dateColor}; font-size:0.7rem; font-family:monospace; margin-top:4px;">${item.date}</div>
            `;
            card.onclick = () => window.open(item.link, '_blank');
            newsContainer.appendChild(card);
        });

        startCarousel(highlightsContainer, data.highlights);
    }

    setTimeout(requestData, 500);
})();