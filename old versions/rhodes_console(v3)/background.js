// --- BACKGROUND SERVICE WORKER ---

const BACKUP_DATA = {
    isOffline: true,
    highlights: [{
        title: "Rhodes Island System",
        subtitle: "ONLINE",
        cover: "https://web.hycdn.cn/arknights/official/assets/images/bg.jpg",
        link: "https://arknights.global"
    }],
    newsList: [
        { title: "Network Restricted: Loaded Backup", date: "SYSTEM", link: "#" },
        { title: "Arknights Official Site", date: "LINK", link: "https://www.arknights.global/" }
    ]
};

const WIKI_URL = 'https://arknights.fandom.com/wiki/Arknights_Wiki';
const GITHUB_ACTIVITY_URL = 'https://raw.githubusercontent.com/Kengxxiao/ArknightsGameData_YoStar/main/en_US/gamedata/excel/activity_table.json';

// Helper: Scrape the Wiki Main Page for Banner Images
async function fetchWikiImages() {
    try {
        const response = await fetch(WIKI_URL, {
            cache: 'no-cache',
            signal: AbortSignal.timeout(5000)
        });
        if (!response.ok) return [];

        const html = await response.text();
        const images = [];
        
        // Regex to find images hosted on the wiki that look like banners
        const imgRegex = /src="(https:\/\/static\.wikia\.nocookie\.net\/mrfz\/images\/[^"]+)"/g;
        
        let match;
        while ((match = imgRegex.exec(html)) !== null) {
            const url = match[1];
            // Filter for high-quality banner images
            if ((url.includes("Banner") || url.includes("Event") || url.includes("KV")) && !url.includes("icon")) {
                let cleanUrl = url;
                if (url.includes("/revision/")) {
                    cleanUrl = url.split("/revision/")[0]; 
                }
                images.push(cleanUrl);
            }
        }
        // Return unique images, max 5
        return [...new Set(images)].slice(0, 5);
    } catch (e) {
        console.warn("[Rhodes BG] Image scrape failed:", e);
        return [];
    }
}

async function fetchData() {
    try {
        console.log("[Rhodes BG] Fetching Data...");
        
        // 1. Fetch Text Data (Events) from GitHub (Reliable)
        const activityRes = await fetch(GITHUB_ACTIVITY_URL, { signal: AbortSignal.timeout(8000) });
        let newsList = [];
        
        if (activityRes.ok) {
            const json = await activityRes.json();
            const now = Date.now() / 1000;
            
            Object.values(json.basicInfo || {}).forEach(act => {
                if (act.name && act.displayType !== "UNVISIBLE" && act.endTime > now && act.startTime < (now + 2592000)) {
                    const isLive = act.startTime <= now;
                    newsList.push({
                        title: act.name,
                        date: isLive ? "LIVE EVENT" : "UPCOMING",
                        link: "https://arknights.fandom.com/wiki/Events"
                    });
                }
            });
            // Add some backup links if empty
            if (newsList.length === 0) {
                newsList.push({ title: "No Major Events Detected", date: "STATUS", link: "#" });
            }
        }

        // 2. Fetch Images from Wiki (Visuals)
        const bannerImages = await fetchWikiImages();
        
        // 3. Construct Highlights
        let highlights = [];
        
        if (bannerImages.length > 0) {
            // Map the images we found to generic slides
            highlights = bannerImages.map((img, index) => ({
                title: newsList[index] ? newsList[index].title : "Arknights Event",
                subtitle: index === 0 ? "FEATURED" : "HIGHLIGHT",
                cover: img,
                link: "https://arknights.fandom.com/wiki/Arknights_Wiki"
            }));
        } else {
            // Fallback if no images found
            highlights = BACKUP_DATA.highlights;
        }

        // Add static backup links to news
        newsList.push({ title: "Official News", date: "LINK", link: "https://www.arknights.global/news" });
        newsList.push({ title: "Wiki Database", date: "LINK", link: "https://arknights.fandom.com/" });

        return {
            isOffline: false,
            newsList: newsList,
            highlights: highlights
        };

    } catch (e) {
        console.warn("[Rhodes BG] Fetch Cycle Failed:", e);
        return BACKUP_DATA;
    }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'FETCH_NEWS') {
        fetchData().then(data => sendResponse(data));
        return true;
    }
});