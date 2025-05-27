// instantImageBlur()

import Analyzer from './analyzer.js';
import ObserverManager from './observer_manager.js';
import OverlayManager from './overlay_manager.js';
import Sanitizer from './sanitizer.js';

console.log("[SCRIPT LOADED] CONTENT.JS");

// 5 output labels as specified
const LABELS = ["drawings", "hentai", "neutral", "porn", "sexy"];

async function classifyImageElementViaBackground(element) {
    try {
        // Convert image element to base64
        const canvas = document.createElement('canvas');
        canvas.width = element.naturalWidth;
        canvas.height = element.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(element, 0, 0);

        const base64 = canvas.toDataURL('image/jpeg');

        // Send base64 image to background for classification
        return new Promise((resolve) => {
            chrome.runtime.sendMessage({ type: "classifyImage", payload: base64 }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error("[Content] Error sending message to background:", chrome.runtime.lastError);
                    resolve(null);
                } else {
                    resolve(response);
                }
            });
        });
    } catch (err) {
        console.error("[Content] classifyImageElementViaBackground error:", err);
        return null;
    }
}

function blurImage(imgElement) {
    imgElement.style.filter = 'blur(16px)';
    imgElement.style.transition = 'filter 0.3s ease';
}

function unblurImage(imgElement) {
    imgElement.style.filter = '';
}


function onReady(callback) {
    if (document.readyState === "complete" || document.readyState === "interactive") {
        callback();
    } else {
        document.addEventListener("DOMContentLoaded", callback);
    }
}

function init() {
    injectTailwind();

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
            // Blur immediately after DOM is ready
            onReady(() => {
                const MIN_WIDTH = 100;
                const MIN_HEIGHT = 100;

                const images = document.querySelectorAll('img');

                images.forEach((img, i) => {
                    if (img.naturalWidth < MIN_WIDTH || img.naturalHeight < MIN_HEIGHT) {
                        return;
                    }

                    blurImage(img);  // Immediately blur the image

                    const handleClassification = () => {
                        classifyImageElementViaBackground(img).then(result => {
                            if (result) {
                                console.log(`🧠 [${i}] Prediction: ${result.label} (${(result.score * 100).toFixed(2)}%)`);

                                if (['hentai', 'porn', 'sexy'].includes(result.label)) {
                                    // Keep blurred
                                    console.log(`🔒 [${i}] Image kept blurred due to label: ${result.label}`);
                                } else {
                                    // Safe, unblur it
                                    unblurImage(img);
                                    console.log(`✅ [${i}] Image unblurred, safe content.`);
                                }
                            } else {
                                // In case of error, unblur to avoid false positives
                                unblurImage(img);
                            }
                        });
                    };

                    if (img.complete && img.naturalWidth !== 0) {
                        handleClassification();
                    } else {
                        img.onload = handleClassification;
                    }
                });


                sanitizer.sanitizeAll(document.body);
                observerManager.setup();
            });
        });

        analyzer.analyze();
    });
}

function injectTailwind() {
    const waitHead = () => {
        if (document.head) {
            if (!document.querySelector("#tailwind-injected")) {
                const link = document.createElement("link");
                link.id = "tailwind-injected";
                link.href = "https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css";
                link.rel = "stylesheet";
                document.head.appendChild(link);
            }
        } else {
            requestAnimationFrame(waitHead);
        }
    };
    waitHead();
}

// function instantImageBlur() {
//     const style = document.createElement('style');
//     style.textContent = `
//         img {
//             filter: blur(10px) !important;
//         }
//     `;
//     document.documentElement.appendChild(style);
// }

init();
