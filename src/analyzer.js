import Utils from "./Utils";

const WHITELISTED_DOMAINS = ["google.com", "youtube.com", "localhost", "atharianr.dev"];

export default class Analyzer {
    constructor(overlayManager) {
        this.overlayManager = overlayManager;
    }

    analyze() {
        const domain = window.location.hostname;
        const fullUrl = window.location.href;

        if (window.location.protocol.includes("extension:") ||
            WHITELISTED_DOMAINS.some(allowed => domain.endsWith(allowed))) return;

        const cleaned = Utils.cleanHtml(document.head.innerHTML);
        this.overlayManager.show();

        console.log("[analyzeWebsite]")
        chrome.runtime.sendMessage({
            type: "analyzeWebsite",
            payload: { domain: fullUrl, header: cleaned }
        }, response => {
            console.log("[analyzeWebsite]", response);
            if (!response?.isJudol) {
                this.overlayManager.hide();
            } else {
                window.location.replace("https://shields.atharianr.dev/");
            }
        });
    }
}