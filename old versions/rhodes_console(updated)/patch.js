(function() {
    // --- Safe Fallback Data ---
    const SAFE_DATA = {
        isOffline: true,
        banner: { title: "Welcome Doctor", cover: "", link: "#" },
        newsList: [{ title: "Connection System Initializing...", date: "...", link: "#" }]
    };

    function requestData() {
        // We look for the containers
        const oldNews = document.querySelector('.scrollarea');
        const oldHighlights = document.querySelector('.mantine-Carousel-container');

        // If they aren't there yet, wait a bit
        if (!oldNews || !oldHighlights) {
            setTimeout(requestData, 200);
            return;
        }

        // --- THE REACT FIX ---
        // We clone the containers and replace the originals. 
        // This effectively "cuts the wire" to React, so it stops throwing errors.
        const newsContainer = oldNews.cloneNode(true);
        oldNews.parentNode.replaceChild(newsContainer, oldNews);

        const highlightsContainer = oldHighlights.cloneNode(true);
        oldHighlights.parentNode.replaceChild(highlightsContainer, oldHighlights);
        // ---------------------

        // Set Loading State
        newsContainer.innerHTML = `<div style="padding:20px; color:#aaa; text-align:center; font-family:monospace;">Connecting to Rhodes Network...</div>`;

        // Check availability
        if (!chrome || !chrome.runtime || !chrome.runtime.sendMessage) {
            renderData(SAFE_DATA, newsContainer, highlightsContainer);
            return;
        }

        // Send Message to Background Script
        try {
            chrome.runtime.sendMessage({ type: 'FETCH_NEWS' }, (response) => {
                if (chrome.runtime.lastError) {
                    console.warn("Rhodes Patch: Background link error.");
                    renderData(SAFE_DATA, newsContainer, highlightsContainer);
                    return;
                }
                
                if (response) {
                    renderData(response, newsContainer, highlightsContainer);
                } else {
                    renderData(SAFE_DATA, newsContainer, highlightsContainer);
                }
            });
        } catch (e) {
            renderData(SAFE_DATA, newsContainer, highlightsContainer);
        }
    }

    function renderData(data, newsContainer, highlightsContainer) {
        if (!newsContainer || !highlightsContainer) return;

        newsContainer.innerHTML = '';
        
        // Offline Badge
        if (data.isOffline) {
            const badge = document.createElement('div');
            badge.textContent = '⚠ OFFLINE BACKUP';
            badge.style.cssText = "background:#ffc107; color:black; font-weight:bold; padding:4px; text-align:center; font-size:0.7rem; margin-bottom:10px; border-radius: 2px; font-family:sans-serif;";
            newsContainer.appendChild(badge);
        }

        // Render News
        // Defined explicitly to prevent syntax errors
        const listItems = data.newsList || [];
        
        listItems.forEach(item => {
            const card = document.createElement('div');
            card.style.cssText = `background:rgba(30,30,30,0.8); border-left:4px solid #fff; padding:12px; margin-bottom:6px; cursor:pointer; transition: 0.2s;`;
            
            // Hover effect
            card.onmouseenter = () => card.style.background = 'rgba(50,50,50,0.9)';
            card.onmouseleave = () => card.style.background = 'rgba(30,30,30,0.8)';

            card.innerHTML = `
                <div style="color:#fff; font-size:0.9rem; font-weight:500; line-height:1.2; font-family:sans-serif;">${item.title}</div>
                <div style="color:${data.isOffline ? '#aaa' : '#29B6F6'}; font-size:0.7rem; font-family:monospace; margin-top:4px;">${item.date}</div>
            `;
            
            card.onclick = () => window.open(item.link, '_blank');
            newsContainer.appendChild(card);
        });

        // Render Banner
        const bannerData = data.banner || SAFE_DATA.banner;
        highlightsContainer.innerHTML = '';
        
        const banner = document.createElement('div');
        const bg = bannerData.cover || "https://web.hycdn.cn/arknights/official/assets/images/bg.jpg";
        
        banner.style.cssText = `width:100%; height:100%; background-image:url('${bg}'); background-size:cover; background-position:center; display:flex; align-items:flex-end; cursor:pointer;`;
        
        banner.innerHTML = `
            <div style="width:100%; padding:15px; background:linear-gradient(to top, rgba(0,0,0,0.9), transparent);">
                <h2 style="color:#fff; margin:0; font-family:'Oswald',sans-serif; font-size:1.4rem; text-shadow: 0 2px 4px black;">${bannerData.title}</h2>
            </div>
        `;
        banner.onclick = () => window.open(bannerData.link, '_blank');
        highlightsContainer.appendChild(banner);
    }

    // Wait a brief moment for the page to settle before running
    setTimeout(requestData, 500);
})();