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

    sanitizeTextNode(node) {
        if (node.nodeType !== Node.TEXT_NODE || !node.parentElement ||
            Utils.isEditableElement(node.parentElement) || Utils.isInsideEditable(node)) return;

        const parent = node.parentElement;
        const text = node.textContent;
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

    sanitizeAll(node) {
        if (node.nodeType === Node.ELEMENT_NODE && ["SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE"].includes(node.tagName)) return;
        if (node.nodeType === Node.TEXT_NODE) {
            this.sanitizeTextNode(node);
        } else {
            node.childNodes.forEach(child => this.sanitizeAll(child));
        }
    }
}