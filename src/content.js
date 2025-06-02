// instantImageBlur()

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
    Utils.injectTailwind();

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

// function instantImageBlur() {
//     const inject = () => {
//         if (document.head) {
//             if (!document.getElementById('instant-blur-style')) {
//                 const style = document.createElement('style');
//                 style.id = 'instant-blur-style';
//                 style.textContent = `
//                     img:not([data-judged]) {
//                         filter: blur(16px);
//                         transition: filter 0.3s ease;
//                     }
//                 `;
//                 document.head.appendChild(style);
//             }
//         } else {
//             requestAnimationFrame(inject); // try again on the next frame
//         }
//     };

//     inject(); // start checking
// }

init();
