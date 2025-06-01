import Utils from "./Utils";

export default class ObserverManager {
    constructor(sanitizer, classifyFn) {
        this.sanitizer = sanitizer;
        this.classifyImageElement = classifyFn;
        this.classifiedImages = new WeakSet(); // prevents duplicate processing
        this.classifiedImagesCount = 0;
    }

    setup() {
        let timeout = null;

        const processImages = () => {
            console.log("[Observer] -> classifiedImages length", this.classifiedImagesCount);

            const images = document.querySelectorAll('img');
            images.forEach(img => {
                if (this.classifiedImages.has(img)) return; // already classified
                if (img.naturalWidth < 50 || img.naturalHeight < 50) return;

                this.classifiedImages.add(img); // mark as processed
                this.classifiedImagesCount++;

                img.style.filter = 'blur(16px)';
                img.style.transition = 'filter 0.3s ease';

                const handleClassification = () => {
                    this.classifyImageElement(img).then(result => {
                        if (result) {
                            console.log(`🧠 [Prediction] ${result.label} (${(result.score * 100).toFixed(2)}%)`);
                            // if (['hentai', 'porn', 'sexy'].includes(result.label)) {
                            if (result.label == 'judol') {
                                console.log(`🔒 Image kept blurred`);
                            } else {
                                img.style.filter = '';
                                console.log(`✅ Image unblurred (safe)`);
                            }
                        } else {
                            img.style.filter = '';
                        }
                    });
                };

                if (img.complete && img.naturalWidth !== 0) {
                    handleClassification();
                } else {
                    img.onload = handleClassification;
                }
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
                                this.sanitizer.sanitizeAll(node);
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

        console.log("[ObserverManager] Initialized");
    }
}