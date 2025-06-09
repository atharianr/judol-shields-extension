import Constant from "./constant";
import Utils from "./Utils";

export default class Sanitizer {
    constructor() {
        this.regexList = [];
    }

    loadFromCache(callback) {
        chrome.storage.local.get("regexList", ({ regexList }) => {
            this.regexList = (regexList || []).map(p => new RegExp(p, "gi"));
            // console.log("✅ Loaded regexes from storage:", this.regexList);
            callback();
        });
    }

    async classifyImageElement(imgElement) {
        const src = imgElement.src;
        return new Promise((resolve) => {
            chrome.runtime.sendMessage({ type: "classifyImageUrl", payload: src }, (response) => {
                if (chrome.runtime.lastError) {
                    console.warn("[Sanitizer] Error classifying image:", chrome.runtime.lastError);
                    resolve(null);
                } else {
                    resolve(response);
                }
            });
        });
    }

    sanitizeTextNode(node) {
        if (node.nodeType !== Node.TEXT_NODE || !node.parentElement) return;

        // Find closest container to blur (span, div, p, h1-h6)
        const container = node.parentElement.closest("span, div, p, h1, h2, h3, h4, h5, h6");
        if (!container) return;

        // Skip if already blurred or editable
        if (
            Utils.isEditableElement(container) ||
            Utils.isInsideEditable(container) ||
            container.classList.contains("blurred-text-container") ||
            container.closest(".blurred-text-container")
        ) return;

        // Skip containers with images/videos/etc
        if (container.querySelector("img, video, iframe, svg, canvas, picture, object, embed")) return;

        const fullText = Utils.normalizeUnicode(container.innerText || '');
        if (!fullText.trim()) return;

        for (const regex of this.regexList) {
            regex.lastIndex = 0;
            if (regex.test(fullText)) {
                // Blur the container
                container.classList.add("blurred-text-container");
                Object.assign(container.style, {
                    filter: "blur(5px)",
                    backgroundColor: "rgba(0, 0, 0, 0.067)",
                    borderRadius: "4px",
                    padding: "2px",
                    pointerEvents: "auto" // enable event processing in blurred container
                });

                // Find closest <a> ancestor and disable its link behavior
                const anchor = container.closest("a");
                if (anchor) {
                    anchor.style.pointerEvents = "none";
                    anchor.style.cursor = "default";
                    anchor.removeAttribute("href");
                    anchor.removeAttribute("target");
                    anchor.removeAttribute("rel");
                    anchor.setAttribute("tabindex", "-1");
                    anchor.setAttribute("aria-disabled", "true");
                }

                break;
            }
        }
    }


    sanitizeAllTextNode(node) {
        if (!node) return;

        if (node.nodeType === Node.TEXT_NODE) {
            this.sanitizeTextNode(node);
        } else if (
            node.nodeType === Node.ELEMENT_NODE &&
            !["SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE"].includes(node.tagName)
        ) {
            // First sanitize any text nodes directly under this node
            node.childNodes.forEach(child => {
                this.sanitizeAllTextNode(child);
            });

            // Support Shadow DOM (just in case)
            if (node.shadowRoot) {
                this.sanitizeAllTextNode(node.shadowRoot);
            }
        }
    }


    sanitizeImageNode(img, index = 0) {
        // Immediately hide the image (no delay)
        this.hideImage(img)

        if (img.naturalWidth < Constant.MAX_WIDTH || img.naturalHeight < Constant.MAX_HEIGTH || img.dataset.alreadyProcessed !== undefined) {
            // If skipping, make it visible again
            this.showImage(img)
            return;
        }

        const classifyAndMaybeUnblur = () => {
            this.classifyImageElement(img).then(result => {
                if (result) {
                    if (result.label !== 'judol') {
                        this.markAsSafe(img);
                    } else {
                        this.markAsUnsafe(img);
                    }
                    img.dataset.alreadyProcessed = "true";
                    this.showImage(img)
                } else {
                    this.markAsSafe(img);
                    this.showImage(img)
                }
            });
        };

        if (img.complete && img.naturalWidth !== 0) {
            classifyAndMaybeUnblur();
        } else {
            img.onload = classifyAndMaybeUnblur;
        }
    }

    markAsSafe(imgElement) {
        imgElement.setAttribute('data-judged', 'true');
        imgElement.style.filter = '';
    }

    markAsUnsafe(imgElement) {
        imgElement.setAttribute('data-judged', 'true');
        imgElement.style.filter = 'blur(16px)';
    }

    hideImage(imgElement) {
        if (imgElement.parentNode?.nodeName === 'BODY') imgElement.hidden = true
        imgElement.style.visibility = 'hidden'
    }

    showImage(imgElement) {
        if (imgElement.parentNode?.nodeName === 'BODY') imgElement.hidden = false
        imgElement.style.visibility = 'visible'
    }
}