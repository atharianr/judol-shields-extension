if (process.env.NODE_ENV === 'development') require('./reload.js');
import Analyzer from './analyzer.js';
import ObserverManager from './observer_manager.js';
import OverlayManager from './overlay_manager.js';
import Sanitizer from './sanitizer.js';
import Utils from './Utils.js';

console.log("[SCRIPT LOADED] CONTENT.JS");

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
            onReady(() => {
                console.log("[Content] DOM ready, beginning sanitization.");

                // Sanitize text and future mutations
                sanitizer.sanitizeAllTextNode(document.body);

                // Init mutation observer
                observerManager.setup();
            });
        });

        analyzer.analyze();
    });
}

init();
