import Utils from "./Utils";

export default class ObserverManager {
    constructor(sanitizer) {
        this.sanitizer = sanitizer;
    }

    setup() {
        let timeout = null;

        const processImages = () => {
            const images = document.querySelectorAll('img');
            images.forEach(img => {
                const src = img.src;
                if (Utils.shouldSkipImage?.(src)) return;
                this.sanitizer.sanitizeImageNode(img);
            });
        };


        const observer = new MutationObserver(mutations => {

            if (timeout) clearTimeout(timeout);

            timeout = setTimeout(() => {
                mutations.forEach(mutation => {
                    // Sanitize text
                    if (mutation.type === "characterData" && !Utils.isInsideEditable(mutation.target)) {
                        this.sanitizer.sanitizeTextNode(mutation.target);
                    }

                    // Sanitize and prepare added nodes
                    if (mutation.type === "childList") {
                        mutation.addedNodes.forEach(node => {
                            if (Utils.isInsideEditable(node)) return;

                            if (node.nodeType === Node.TEXT_NODE) {
                                this.sanitizer.sanitizeTextNode(node);
                            } else {
                                this.sanitizer.sanitizeAllTextNode(node);
                            }
                        });
                    }
                });

                processImages(); // process images in the whole document
            }, 100);
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true,
            attributes: true,
            attributeFilter: ['src']
        });

        // For website that have delayed DOM (custom DOM like YouTube)
        setInterval(() => {
            this.sanitizer.sanitizeAllTextNode(document.body);
        }, 1500);
    }
}