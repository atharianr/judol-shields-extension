import Constant from "./constant";
import Utils from "./Utils";

export default class Analyzer {
    constructor(overlayManager) {
        this.overlayManager = overlayManager;
    }

    analyze() {
        const domain = window.location.hostname;
        const fullUrl = window.location.href;

        if (window.location.protocol.includes("extension:") ||
            Constant.WHITELISTED_DOMAINS.some(allowed => domain.endsWith(allowed))) return;

        Utils.injectTailwind();

        const cleaned = Utils.cleanHtml(document.head.innerHTML);
        this.overlayManager.show();

        console.log("[analyzeWebsite]")
        chrome.runtime.sendMessage({
            type: "analyzeWebsite",
            payload: { domain: fullUrl, header: cleaned }
        }, response => {
            console.log("[analyzeWebsite]", response);
            if (!response?.is_judol) {
                this.overlayManager.hide();
            } else {
                window.location.replace("https://shields.atharianr.dev/");
            }
        });
    }
}