if (process.env.NODE_ENV === 'development') require('./reload.js');
import Analyzer from './analyzer.js';
import Constant from './constant.js';
import ObserverManager from './observer_manager.js';
import OverlayManager from './overlay_manager.js';
import Sanitizer from './sanitizer.js';
import Utils from './Utils.js';

console.log("[SCRIPT LOADED] CONTENT");

// Ensure script runs when DOM is ready
function onReady(callback) {
    if (document.readyState === "complete" || document.readyState === "interactive") {
        callback();
    } else {
        document.addEventListener("DOMContentLoaded", callback);
    }
}

// Main initialization function
function init() {
    const sanitizer = new Sanitizer();
    const overlayManager = new OverlayManager();
    const analyzer = new Analyzer(overlayManager);
    const observerManager = new ObserverManager(sanitizer);

    chrome.storage.local.get(['featureEnabled'], (result) => {
        const isFeatureEnabled = result.featureEnabled ?? true;
        
        const currentHost = window.location.hostname;

        const isWhitelisted = Constant.WHITELISTED_DOMAINS_ALL_FEATURE.some(domain =>
            currentHost === domain || currentHost.endsWith("." + domain)
        );

        if (!isFeatureEnabled || isWhitelisted) {
            console.log("[Content] Skipping content script execution.");
            return;
        }

        console.log("[Content] Running content script.");

        requestIdleCallback(() => {
            processImages(sanitizer)
            observerManager.setup();
        });

        onReady(() => {
            processImages(sanitizer)
        });

        // Get regex list to background
        chrome.runtime.sendMessage({ type: "getRegexList" });

        sanitizer.loadFromCache(() => {
            onReady(() => {
                console.log("[Content] DOM ready, beginning sanitization.");

                // Sanitize text and future mutations
                sanitizer.sanitizeAllTextNode(document.body);
            });
        });

        analyzer.analyze();
    });
}

function processImages(sanitizer) {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        const src = img.src;
        if (Utils.shouldSkipImage?.(src)) return;
        sanitizer.sanitizeImageNode(img);
    });
}

init();