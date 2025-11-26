// --- BACKGROUND SERVICE WORKER ---

const BACKUP_DATA = {
    isOffline: true,
    banner: {
        title: "Welcome, Doctor.",
        cover: "https://web.hycdn.cn/arknights/official/assets/images/bg.jpg",
        link: "https://www.arknights.global/"
    },
    newsList: [
        { title: "Network Restricted: Loaded Backup Data", date: "SYSTEM", link: "#" },
        { title: "Arknights Official Site", date: "LINK", link: "https://www.arknights.global/" },
        { title: "Upcoming Banners", date: "GUIDE", link: "https://arknights.fandom.com/wiki/Headhunting/Banners/Upcoming" }
    ]
};

// Source A: Fandom Wiki (News Page)
const WIKI_URL = 'https://arknights.fandom.com/wiki/Arknights_Wiki';
// Source B: GitHub Raw Game Data (Activity Table for Live Events)
const GITHUB_ACTIVITY_URL = 'https://raw.githubusercontent.com/Kengxxiao/ArknightsGameData_YoStar/main/en_US/gamedata/excel/activity_table.json';

async function fetchWikiData() {
    // --- ATTEMPT 1: FANDOM WIKI (No Custom Headers) ---
    try {
        console.log("[Rhodes BG] Trying Fandom Wiki...");
        const response = await fetch(WIKI_URL, {
            method: 'GET',
            cache: 'no-cache',
            signal: AbortSignal.timeout(5000)
        });

        if (response.ok) {
            const html = await response.text();
            // Regex to find news links
            const linkRegex = /<a[^>]+href="(\/wiki\/[^"]+)"[^>]*title="([^"]+)"/g;
            const newsList = [];
            let match;
            
            while ((match = linkRegex.exec(html)) !== null) {
                const title = match[2];
                if (!title.includes(':') && !title.includes('User') && title.length > 5) {
                    newsList.push({ 
                        title, 
                        link: "https://arknights.fandom.com" + match[1], 
                        date: "WIKI LIVE" 
                    });
                }
            }

            // De-duplicate
            const unique = [];
            const seen = new Set();
            newsList.forEach(item => {
                if(!seen.has(item.title)) { seen.add(item.title); unique.push(item); }
            });

            if (unique.length > 0) {
                return {
                    isOffline: false,
                    newsList: unique.slice(0, 10),
                    banner: { title: unique[0].title, link: unique[0].link, cover: "https://web.hycdn.cn/arknights/official/assets/images/bg.jpg" }
                };
            }
        }
    } catch (e) {
        console.warn("[Rhodes BG] Wiki failed:", e);
    }

    // --- ATTEMPT 2: GITHUB GAME DATA (Very Reliable) ---
    try {
        console.log("[Rhodes BG] Trying GitHub Game Data...");
        const response = await fetch(GITHUB_ACTIVITY_URL, { signal: AbortSignal.timeout(8000) });
        
        if (response.ok) {
            const json = await response.json();
            const basicInfo = json.basicInfo || {};
            const now = Date.now() / 1000; // GitHub timestamps are seconds
            
            const activeEvents = [];
            
            // Loop through all activities to find what's running NOW
            Object.values(basicInfo).forEach(activity => {
                if (activity.endTime > now && activity.startTime < now && activity.name && activity.name.length > 2) {
                    activeEvents.push({
                        title: "[LIVE] " + activity.name,
                        link: "https://arknights.fandom.com/wiki/Events",
                        date: "IN PROGRESS"
                    });
                } else if (activity.startTime > now && activity.startTime < (now + 604800)) { // Starts in 7 days
                    activeEvents.push({
                        title: "[UPCOMING] " + activity.name,
                        link: "https://arknights.fandom.com/wiki/Events",
                        date: "COMING SOON"
                    });
                }
            });

            // Sort by start time (newest first)
            activeEvents.reverse();

            if (activeEvents.length > 0) {
                 return {
                    isOffline: false,
                    newsList: activeEvents.concat(BACKUP_DATA.newsList), // Combine with static links
                    banner: {
                        title: activeEvents[0].title,
                        link: activeEvents[0].link,
                        cover: "https://web.hycdn.cn/arknights/official/assets/images/bg.jpg"
                    }
                };
            }
        }
    } catch (e) {
        console.warn("[Rhodes BG] GitHub failed:", e);
    }

    // --- FAILSAFE ---
    return BACKUP_DATA;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'FETCH_NEWS') {
        fetchWikiData().then(data => sendResponse(data));
        return true;
    }
});