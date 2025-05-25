import Analyzer from './analyzer.js';
import ObserverManager from './observer_manager.js';
import OverlayManager from './overlay_manager.js';
import Sanitizer from './sanitizer.js'; // Adjust path as needed

console.log("[SCRIPT LOADED] CONTENT.JS");

function init() {
    injectTailwind()

    chrome.storage.local.get(['featureEnabled'], (result) => {
        const isFeatureEnabled = result.featureEnabled ?? false;

        if (!isFeatureEnabled) {
            console.log("[Feature Disabled] Skipping content script execution.");
            return;
        }

        console.log("[Feature Enabled] Running content script.");

        const sanitizer = new Sanitizer();
        const overlayManager = new OverlayManager();
        const analyzer = new Analyzer(overlayManager);
        const observerManager = new ObserverManager(sanitizer);

        sanitizer.loadFromCache(() => {
            sanitizer.sanitizeAll(document.body);
            observerManager.setup();
        });

        analyzer.analyze();
    });
}

function injectTailwind() {
    if (!document.querySelector("#tailwind-injected")) {
        const link = document.createElement("link");
        link.id = "tailwind-injected";
        link.href = "https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css";
        link.rel = "stylesheet";
        document.head.appendChild(link);
    }
}

init();