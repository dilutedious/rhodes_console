// --- BACKGROUND SERVICE WORKER ---

const BACKUP_DATA = {
    isOffline: true,
    highlights: [{
        title: "Rhodes Console",
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
const WIKI_EVENTS_URL = 'https://arknights.fandom.com/wiki/Events';

async function fetchWikiImages() {
    try {
        const response = await fetch(WIKI_EVENTS_URL, {
            cache: 'no-cache',
            signal: AbortSignal.timeout(6000)
        });
        if (!response.ok) return [];

        const html = await response.text();
        const images = [];
        const urlRegex = /(https:\/\/static\.wikia\.nocookie\.net\/[^\/]+\/images\/[^"]+\.(?:png|jpg))/g;
        
        let match;
        while ((match = urlRegex.exec(html)) !== null) {
            let url = match[1];
            if ((url.includes("Banner") || url.includes("Activity") || url.includes("Event") || url.includes("KV")) && 
                !url.includes("icon") && !url.includes("Button") && !url.includes("Logo")) {
                if (url.includes("/revision/")) url = url.split("/revision/")[0]; 
                images.push(url);
            }
        }
        return [...new Set(images)].slice(0, 5);
    } catch (e) {
        console.warn("[Rhodes BG] Image scrape failed:", e);
        return [];
    }
}

async function fetchData() {
    try {
        console.log("[Rhodes BG] Fetching...");
        const activityRes = await fetch(GITHUB_ACTIVITY_URL, { signal: AbortSignal.timeout(8000) });
        let newsList = [];
        
        if (activityRes.ok) {
            const json = await activityRes.json();
            const now = Date.now() / 1000;
            const activities = Object.values(json.basicInfo || {});
            activities.sort((a, b) => b.startTime - a.startTime);

            activities.forEach(act => {
                if (act.name && act.displayType !== "UNVISIBLE" && act.endTime > now && act.startTime < (now + 2592000)) {
                    const isLive = act.startTime <= now;
                    newsList.push({
                        title: act.name,
                        date: isLive ? "LIVE EVENT" : "UPCOMING",
                        link: "https://arknights.fandom.com/wiki/Events"
                    });
                }
            });
        }

        const bannerImages = await fetchWikiImages();
        let highlights = [];
        
        if (bannerImages.length > 0) {
            highlights = bannerImages.map((img, index) => ({
                title: newsList[index] ? newsList[index].title : "Arknights Event",
                subtitle: index === 0 ? "LATEST OPERATION" : "HIGHLIGHT",
                cover: img,
                link: "https://arknights.fandom.com/wiki/Events"
            }));
        } else {
            highlights = BACKUP_DATA.highlights;
        }

        if (newsList.length === 0) newsList = BACKUP_DATA.newsList;
        else {
            newsList.push({ title: "Official News", date: "LINK", link: "https://www.arknights.global/news" });
            newsList.push({ title: "Wiki Database", date: "LINK", link: "https://arknights.fandom.com/" });
        }

        return { isOffline: false, newsList, highlights };

    } catch (e) {
        console.warn("[Rhodes BG] Failed:", e);
        return BACKUP_DATA;
    }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'FETCH_NEWS') {
        fetchData().then(data => sendResponse(data));
        return true;
    }
});