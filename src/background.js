import axios from 'axios';
import Utils from './Utils';
import * as tf from '@tensorflow/tfjs';

console.log("[SCRIPT LOADED] BACKGROUND.JS");

class BackgroundService {
    constructor() {
        this.API_BASE = "https://regex.bism.app/api/v1";
        this.LABELS = ["judol", "non_judol"];
        this.model = null;

        this.init();
        this.setupMessageListener();
        this.loadModel();
    }

    async init() {
        console.log("[init]");
        await this.fetchAndCacheRegexes();
    }

    async fetchAndCacheRegexes() {
        console.log("[fetchAndCacheRegexes] Requesting regex list...");
        try {
            const response = await axios.get(`${this.API_BASE}/regex`);
            const regexList = response.data?.data?.regexList ?? [];

            const validRegexes = regexList
                .map(item => item.regex)
                .filter(pattern => typeof pattern === 'string' && pattern.trim());

            chrome.storage.local.set({ regexList: validRegexes }, () => {
                console.log("✅ Regexes cached successfully:", validRegexes);
            });
        } catch (error) {
            console.error("❌ Error fetching regexes:", error);
        }
    }

    async analyzeRegex(request) {
        console.log("[analyzeRegex] Analyzing request:", JSON.stringify(request, null, 2));
        try {
            const response = await axios.post(`${this.API_BASE}/regex/analyze`, request);
            return response.data?.data ?? null;
        } catch (error) {
            console.error("❌ Failed to analyze regex:", error.response);
            return { error: true, message: error.message || 'Unknown error' };
        }
    }

    async analyzeWebsite(request) {
        console.log("[analyzeWebsite] Analyzing request:", JSON.stringify(request, null, 2));
        try {
            const response = await axios.post(`${this.API_BASE}/analyze`, request);
            return response.data?.data ?? null;
        } catch (error) {
            console.error("❌ Failed to analyze website:", error.response);
            return { error: true, message: error.message || 'Unknown error' };
        }
    }

    async loadModel() {
        // const modelURL = chrome.runtime.getURL('model/nsfw/model.json');
        const modelURL = chrome.runtime.getURL('model/gambling-classification/model.json');
        console.log('[Background] Loading TF model...');
        this.model = await tf.loadGraphModel(modelURL);
        console.log('[Background] Model loaded.');
    }

    async classifyImageTensor(imageTensor) {
        if (!this.model) await this.loadModel();
        const prediction = this.model.predict(imageTensor);
        const data = await prediction.data();

        const results = Array.from(data).map((score, idx) => ({
            label: this.LABELS[idx],
            score,
        }));

        prediction.dispose();

        results.sort((a, b) => b.score - a.score);
        return results[0];
    }

    setupMessageListener() {
        chrome.runtime.onInstalled.addListener(() => {
            chrome.contextMenus.create({
                id: "judolshields_report_context",
                title: "Laporkan teks ini ke JudolShields",
                contexts: ["selection"],
            });
        });

        chrome.contextMenus.onClicked.addListener(async (info, tab) => {
            if (info.menuItemId === "judolshields_report_context") {
                const selectedText = Utils.normalizeUnicode(info.selectionText);
                
                if (selectedText.length < 20) {
                    chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        func: (message) => {
                            alert(message);
                        },
                        args: ["Ups! Teksnya masih terlalu pendek nih, coba pilih lebih dari 20 karakter yaa 😊"]
                    });
                    return;
                } else if (selectedText.length > 900) {
                    chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        func: (message) => {
                            alert(message);
                        },
                        args: ["Ups! Teksnya kepanjangan nih, pilih yang lebih singkat dulu yuk. Maksinal 900 karakter yaa 😊"]
                    });
                    return;
                }

                const request = { text: [selectedText] };
                const result = await this.analyzeRegex(request);

                console.log("[judolshields_report_context] result -> ", result);

                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: (message) => {
                        alert(message);
                    },
                    args: [result.message]
                });
            }
        });


        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            console.log("[onMessage] Received:", message.type);

            if (message.type === "analyzeWebsite") {
                (async () => {
                    const result = await this.analyzeWebsite(message.payload);
                    console.log("[onMessage] Responding with:", result);
                    sendResponse(result);
                })();
                return true;
            }

            // New message handler for image classification
            if (message.type === "classifyImageUrl") {
                (async () => {
                    try {
                        const response = await fetch(message.payload, { mode: 'cors' });
                        const blob = await response.blob();
                        const bitmap = await createImageBitmap(blob);

                        const offscreen = new OffscreenCanvas(224, 224);
                        const ctx = offscreen.getContext('2d');
                        ctx.drawImage(bitmap, 0, 0, 224, 224);

                        const imageData = ctx.getImageData(0, 0, 224, 224);
                        const tensor = tf.browser.fromPixels(imageData)
                            .toFloat()
                            .div(tf.scalar(255.0))
                            .expandDims();

                        const result = await this.classifyImageTensor(tensor);
                        tensor.dispose();

                        sendResponse(result);
                    } catch (err) {
                        console.error("[onMessage] classifyImageUrl error:", err);
                        sendResponse(null);
                    }
                })();
                return true;
            }

            return false;
        });
    }
}

// Instantiate the background service
new BackgroundService();