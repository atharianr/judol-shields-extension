const ws = new WebSocket('ws://localhost:35729');

ws.onmessage = (event) => {
    if (event.data === 'reload') {
        chrome.runtime.reload(); // Reload the extension
        window.location.reload(); // Reload the tab (for content scripts)
    }
};
