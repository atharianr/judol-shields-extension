import axios from 'axios';

console.log("[SCRIPT LOADED] BACKGROUND.JS");

class BackgroundService {
    constructor() {
        this.API_BASE = "https://regex.bism.app/api/v1";
        this.init();
        this.setupMessageListener();
    }

    async init() {
        console.log("[init]");
        await this.fetchAndCacheRegexes();
    }

    async fetchAndCacheRegexes() {
        console.log("[fetchAndCacheRegexes] Requesting regex list...");
        try {
            const response = await axios.get(`${this.API_BASE}/regex`);
            const regexList = response.data?.data?.regexList ?? [];

            const validRegexes = regexList
                .map(item => item.regex)
                .filter(pattern => typeof pattern === 'string' && pattern.trim());

            chrome.storage.local.set({ regexList: validRegexes }, () => {
                console.log("✅ Regexes cached successfully:", validRegexes);
            });
        } catch (error) {
            console.error("❌ Error fetching regexes:", error);
        }
    }

    async analyzeWebsite(request) {
        console.log("[analyzeWebsite] Analyzing request:", JSON.stringify(request, null, 2));
        try {
            const response = await axios.post(`${this.API_BASE}/analyze`, request);
            return response.data?.data ?? null;
        } catch (error) {
            console.error("❌ Failed to analyze website:", error.response);
            return { error: true, message: error.message || 'Unknown error' };
        }
    }

    setupMessageListener() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            console.log("[onMessage] Received:", message.type);

            if (message.type === "analyzeWebsite") {
                (async () => {
                    const result = await this.analyzeWebsite(message.payload);
                    console.log("[onMessage] Responding with:", result);
                    sendResponse(result);
                })();
                return true; // keep sendResponse channel open
            }

            return false;
        });
    }
}

// Instantiate the background service
new BackgroundService();