export default class Utils {
    static isEditableElement(element) {
        return element.tagName === "INPUT" ||
            element.tagName === "TEXTAREA" ||
            element.isContentEditable ||
            element.closest('[contenteditable="true"], input, textarea, [role="textbox"]');
    }

    static isInsideEditable(node) {
        if (!node.parentElement) return false;
        return !!node.parentElement.closest('input, textarea, [contenteditable="true"], [role="textbox"]');
    }

    static cleanHtml(html) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const originalHead = doc.head;
        const cleanDoc = document.implementation.createHTMLDocument();
        const cleanHead = cleanDoc.head;

        const title = originalHead.querySelector('title');
        if (title) cleanHead.appendChild(title.cloneNode(true));

        originalHead.querySelectorAll('meta').forEach(meta => {
            const name = meta.getAttribute('name');
            const property = meta.getAttribute('property');
            const allowedNames = ['description', 'keywords', 'google-site-verification'];
            const allowedProps = ['og:title', 'og:description', 'twitter:title', 'twitter:description'];

            if ((name && allowedNames.includes(name)) || (property && allowedProps.includes(property))) {
                cleanHead.appendChild(meta.cloneNode(true));
            }
        });

        originalHead.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"], link[rel="canonical"], link[rel="amphtml"]')
            .forEach(link => cleanHead.appendChild(link.cloneNode(true)));

        return cleanHead.innerHTML;
    }

    static normalizeUnicode(text) {
        const normalizedText = text.normalize("NFKC") ?? "";
        return normalizedText;
    }

    static injectTailwind() {
        const waitForHead = () => {
            if (document.head) {
                if (!document.querySelector("#tailwind-injected")) {
                    const link = document.createElement("link");
                    link.id = "tailwind-injected";
                    link.href = "https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css";
                    link.rel = "stylesheet";
                    document.head.appendChild(link);
                }
            } else {
                requestAnimationFrame(waitForHead);
            }
        };
        waitForHead();
    }

    static shouldSkipImage(src) {
        return src.startsWith('chrome://') ||
            src.startsWith('chrome-extension://') ||
            src.startsWith('moz-extension://') ||
            src.startsWith('edge://') ||
            src.startsWith('edge-extension://');
    }
}