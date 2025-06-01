import Utils from "./Utils";

export default class Sanitizer {
    constructor() {
        this.regexList = [];
    }

    loadFromCache(callback) {
        chrome.storage.local.get("regexList", ({ regexList }) => {
            this.regexList = (regexList || []).map(p => new RegExp(p, "gi"));
            console.log("✅ Loaded regexes from storage:", this.regexList);
            callback();
        });
    }

    async classifyImageElement(imgElement) {
        const src = imgElement.src;
        return new Promise((resolve) => {
            chrome.runtime.sendMessage({ type: "classifyImageUrl", payload: src }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error("[Sanitizer] Error classifying image:", chrome.runtime.lastError);
                    resolve(null);
                } else {
                    resolve(response);
                }
            });
        });
    }


    sanitizeTextNode(node) {
        if (node.nodeType !== Node.TEXT_NODE || !node.parentElement ||
            Utils.isEditableElement(node.parentElement) ||
            Utils.isInsideEditable(node) ||
            node.parentElement.classList.contains("blurred-text")) return;

        const parent = node.parentElement;
        const text = Utils.normalizeUnicode(node.textContent);
        let currentIndex = 0, replaced = false;
        const fragments = [];

        this.regexList.forEach(regex => {
            regex.lastIndex = 0;
            let match;

            while ((match = regex.exec(text)) !== null) {
                const before = text.slice(currentIndex, match.index);
                if (before) fragments.push(document.createTextNode(before));

                const span = document.createElement("span");
                span.textContent = match[0];
                span.classList.add("blurred-text");
                Object.assign(span.style, {
                    filter: "blur(5px)",
                    backgroundColor: "#0001",
                    borderRadius: "4px"
                });
                fragments.push(span);

                currentIndex = match.index + match[0].length;
                replaced = true;
            }
        });

        if (!replaced) return;

        const after = text.slice(currentIndex);
        if (after) fragments.push(document.createTextNode(after));

        fragments.forEach(frag => parent.insertBefore(frag, node));
        parent.removeChild(node);
    }

    sanitizeAllTextNode(node) {
        if (node.nodeType === Node.ELEMENT_NODE && ["SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE"].includes(node.tagName)) return;
        if (node.nodeType === Node.TEXT_NODE) {
            this.sanitizeTextNode(node); // For Text
        } else {
            node.childNodes.forEach(child => this.sanitizeAllTextNode(child));
        }
    }

    sanitizeImageNode(img, index = 0) {
        if (img.naturalWidth < 50 || img.naturalHeight < 50 || img.dataset.blurred === "true") return;

        img.style.filter = 'blur(16px)';
        img.style.transition = 'filter 0.3s ease';
        img.dataset.blurred = "true";

        const classifyAndMaybeUnblur = () => {
            this.classifyImageElement(img).then(result => {
                if (result) {
                    if (result.label !== 'judol') {
                        this.markAsSafe(img);
                    } else {
                        this.markAsUnsafe(img);
                    }
                } else {
                    this.markAsSafe(img); // fallback
                }
            });
        };

        if (img.complete && img.naturalWidth !== 0) {
            classifyAndMaybeUnblur();
        } else {
            img.onload = classifyAndMaybeUnblur;
        }
    }

    blurImageTemporarily(img) {
        if (img.naturalWidth < 50 || img.naturalHeight < 50) return false;
        if (img.dataset.blurred === "true") return false;

        img.style.filter = 'blur(16px)';
        img.style.transition = 'filter 0.3s ease';
        img.dataset.blurred = "true"; // prevent duplicate processing
        return true;
    }

    unblurImage(img) {
        img.style.filter = '';
        img.dataset.blurred = "false";
    }

    markAsSafe(imgElement) {
        imgElement.setAttribute('data-judged', 'true');
        imgElement.style.filter = ''; // remove blur
    }

    markAsUnsafe(imgElement) {
        imgElement.setAttribute('data-judged', 'true');
        imgElement.style.filter = 'blur(16px)';
    }
}