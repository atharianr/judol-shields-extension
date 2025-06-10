if (process.env.NODE_ENV === 'development') require('./reload.js');
import axios from 'axios';
import Utils from './Utils';
import * as tf from '@tensorflow/tfjs';
import Constant from './constant';

console.log("[SCRIPT LOADED] BACKGROUND");

class BackgroundService {
    constructor() {
        this.model = null;

        this.init();
        this.setupMessageListener();
        this.loadModel();
    }

    async init() {
        await this.fetchAndCacheRegexes();
    }

    async fetchAndCacheRegexes() {
        console.log("[Background] Requesting regex list...");
        try {
            const response = await axios.get(`${Constant.API_BASE}/regex`);
            const regexList = response.data?.data?.regexList ?? [];

            const validRegexes = regexList
                .map(item => item.regex)
                .filter(pattern => typeof pattern === 'string' && pattern.trim());

            chrome.storage.local.set({ regexList: validRegexes });
        } catch (error) {
            console.warn("[Background] ❌ Error fetching regexes:", error);
        }
    }

    async analyzeRegex(request) {
        try {
            const response = await axios.post(`${Constant.API_BASE}/regex/analyze`, request);
            return response.data?.data ?? null;
        } catch (error) {
            console.warn("[Background] ❌ Failed to analyze regex:", error.response);
            return { error: true, message: error.message || 'Unknown error' };
        }
    }

    async analyzeWebsite(request) {
        try {
            const response = await axios.post(`${Constant.API_BASE}/analyze`, request);
            return response.data?.data ?? null;
        } catch (error) {
            console.warn("[Background] ❌ Failed to analyze website:", error.response);
            return { error: true, message: error.message || 'Unknown error' };
        }
    }

    async loadModel() {
        const modelURL = chrome.runtime.getURL(Constant.MODEL_PATH);
        console.log('[Background] Loading TF model...');
        this.model = await tf.loadGraphModel(modelURL);
        console.log('[Background] Model loaded.');
    }

    async classifyImageTensor(imageTensor) {
        if (!this.model) await this.loadModel();
        const prediction = this.model.predict(imageTensor);
        const data = await prediction.data();

        const results = Array.from(data).map((score, idx) => ({
            label: Constant.MODEL_LABELS[idx],
            score,
        }));

        prediction.dispose();

        results.sort((a, b) => b.score - a.score);
        return results[0];
    }

    setupMessageListener() {
        chrome.runtime.onInstalled.addListener(() => {
            chrome.contextMenus.create({
                id: Constant.CONTEXT_MENU_ID,
                title: "Laporkan teks ini ke JudolShields",
                contexts: ["selection"],
            });
        });

        chrome.contextMenus.onClicked.addListener(async (info, tab) => {
            if (info.menuItemId === Constant.CONTEXT_MENU_ID) {
                const selectedText = Utils.normalizeUnicode(info.selectionText);
                if (selectedText.length < Constant.MIN_SELECTION_LENGTH) {
                    chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        func: (message) => {
                            alert(message);
                        },
                        args: ["Ups! Teksnya masih terlalu pendek nih, coba pilih lebih dari 20 karakter yaa 😊"]
                    });
                    return;
                } else if (selectedText.length > Constant.MAX_SELECTION_LENGTH) {
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
            if (message.type === "analyzeWebsite") {
                (async () => {
                    const result = await this.analyzeWebsite(message.payload);
                    sendResponse(result);
                })();
                return true;
            }

            // New message handler for image classification
            if (message.type === "classifyImageUrl") {
                (async () => {
                    try {
                        const src = message.payload
                        const response = await fetch(src, { mode: 'cors' });
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
                        console.warn("[Background] classifyImageUrl error:", err?.message, err?.name, err?.stack);
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