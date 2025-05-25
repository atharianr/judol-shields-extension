import Utils from "./Utils";

export default class ObserverManager {
    constructor(sanitizer) {
        this.sanitizer = sanitizer;
    }

    setup() {
        let timeout = null;
        const observer = new MutationObserver(mutations => {
            if (timeout) clearTimeout(timeout);
            timeout = setTimeout(() => {
                mutations.forEach(mutation => {
                    if (mutation.type === "childList") {
                        mutation.addedNodes.forEach(node => {
                            if (Utils.isInsideEditable(node)) return;
                            node.nodeType === Node.TEXT_NODE
                                ? this.sanitizer.sanitizeTextNode(node)
                                : this.sanitizer.sanitizeAll(node);
                        });
                    } else if (mutation.type === "characterData" && !Utils.isInsideEditable(mutation.target)) {
                        this.sanitizer.sanitizeTextNode(mutation.target);
                    }
                });
            }, 100);
        });

        observer.observe(document.body, { childList: true, subtree: true, characterData: true });
        console.log("[setupObserver]");
    }
}