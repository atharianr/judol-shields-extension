import React from "react";
import { createRoot } from "react-dom/client";
import OverlayContent from "./components/OverlayContent.jsx";

export default class OverlayManager {
    constructor() {
        this.overlay = document.createElement("div");
        this.overlay.id = "loadingOverlay";
        Object.assign(this.overlay.style, {
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'white',
            display: 'none',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: '9999',
        });

        document.body.appendChild(this.overlay);

        // Use React to render into the overlay
        const root = createRoot(this.overlay);
        root.render(<OverlayContent />);
    }

    show() {
        this.overlay.style.display = 'flex';
    }

    hide() {
        this.overlay.style.display = 'none';
    }
}