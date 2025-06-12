const Constant = {
    API_BASE: "http://4.196.97.53:4527/api/v1",

    MODEL_LABELS: ["judol", "non_judol"],
    MODEL_PATH: "model/gambling-v2/model.json",

    WHITELISTED_DOMAINS: ["google.com", "youtube.com", "localhost", "atharianr.dev"],

    INSTANT_BLUR_STYLE_ID: "instant-blur-style",
    INSTANT_BLUR_STYLE_CSS: `
        img:not([data-judged]) {
            filter: blur(16px);
            transition: filter 0.3s ease;
        }
    `,

    CONTEXT_MENU_ID: "judolshields_report_context",

    MIN_SELECTION_LENGTH: 20,
    MAX_SELECTION_LENGTH: 900,

    MAX_WIDTH: 41,
    MAX_HEIGTH: 41,
};

export default Constant;
