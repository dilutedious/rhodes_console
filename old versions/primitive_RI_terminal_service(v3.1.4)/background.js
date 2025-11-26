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

// --- WEATHER MODULE ---
async function fetchWeather() {
    try {
        // 1. Get approximate location via IP
        const locRes = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(5000) });
        if (!locRes.ok) throw new Error("Location Check Failed");
        const locData = await locRes.json();
        
        const lat = locData.latitude;
        const lon = locData.longitude;
        const city = locData.city || "Unknown Location";

        // 2. Fetch Weather
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
        const weatherRes = await fetch(weatherUrl, { signal: AbortSignal.timeout(5000) });
        if (!weatherRes.ok) throw new Error("Weather API Failed");
        
        const wData = await weatherRes.json();
        const current = wData.current_weather;

        // 3. Decode WMO Weather Codes
        let condition = "Unknown";
        const code = current.weathercode;
        
        if (code === 0) condition = "Clear Sky";
        else if (code <= 3) condition = "Partly Cloudy";
        else if (code <= 48) condition = "Foggy";
        else if (code <= 67) condition = "Rainy";
        else if (code <= 77) condition = "Snowy";
        else if (code <= 82) condition = "Heavy Rain";
        else if (code <= 86) condition = "Snow Showers";
        else if (code <= 99) condition = "Thunderstorm";

        return {
            success: true,
            temp: current.temperature,
            condition: condition,
            city: city
        };

    } catch (e) {
        console.warn("[Rhodes BG] Weather Error:", e);
        return { success: false };
    }
}

// --- NEWS & IMAGES MODULE ---
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
        return [];
    }
}

async function fetchData() {
    try {
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
        return BACKUP_DATA;
    }
}

// --- LISTENER ---
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'FETCH_NEWS') {
        fetchData().then(data => sendResponse(data));
        return true;
    }
    if (request.type === 'FETCH_WEATHER') {
        fetchWeather().then(data => sendResponse(data));
        return true;
    }
});