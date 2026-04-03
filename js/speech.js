/**
 * Đọc tiếng Trung: Web Speech API + preset theo 3 giọng.
 * File MP3 trong `voices/` dùng để nghe thử mẫu khi chọn giọng.
 */

/** @type {SpeechSynthesisVoice[]} */
let zhVoicesCache = [];

function isZhVoice(v) {
    const lang = (v.lang || '').toLowerCase();
    return lang.startsWith('zh') || lang.startsWith('cmn') || lang.includes('chinese');
}

export function refreshZhVoices() {
    if (!('speechSynthesis' in window)) return [];
    zhVoicesCache = window.speechSynthesis.getVoices().filter(isZhVoice);
    return zhVoicesCache;
}

/** @type {Record<string, { rate: number, pitch: number, voiceIndex: number }>} */
const PRESETS = {
    daoMing: { rate: 0.9, pitch: 1, voiceIndex: 0 },
    guoChao: { rate: 0.82, pitch: 1.08, voiceIndex: 1 },
    jing: { rate: 0.88, pitch: 0.92, voiceIndex: 2 },
};

/**
 * @param {string} text
 * @returns {string[]}
 */
export function splitChineseChunks(text) {
    const t = text.replace(/\r\n/g, '\n').trim();
    if (!t) return [];
    const out = [];
    let buf = '';
    for (let k = 0; k < t.length; k++) {
        const ch = t[k];
        buf += ch;
        if (/[。！？；\n]/.test(ch)) {
            const s = buf.trim();
            if (s) out.push(s);
            buf = '';
        }
    }
    const last = buf.trim();
    if (last) out.push(last);
    return out.length ? out : [t];
}

let utteranceChainToken = 0;

/**
 * @param {string} text
 * @param {'daoMing'|'guoChao'|'jing'} voiceId
 * @param {{ onEnd?: () => void }} [opts]
 */
export function speakChinese(text, voiceId, opts = {}) {
    if (!text || !('speechSynthesis' in window)) {
        opts.onEnd?.();
        return;
    }
    stopVoiceSample();
    const preset = PRESETS[voiceId] || PRESETS.daoMing;
    refreshZhVoices();
    const voices = zhVoicesCache.length ? zhVoicesCache : refreshZhVoices();
    const chunks = splitChineseChunks(text);
    if (!chunks.length) {
        opts.onEnd?.();
        return;
    }

    window.speechSynthesis.cancel();
    const token = ++utteranceChainToken;

    let i = 0;
    const next = () => {
        if (token !== utteranceChainToken) return;
        if (i >= chunks.length) {
            opts.onEnd?.();
            return;
        }
        const u = new SpeechSynthesisUtterance(chunks[i]);
        u.lang = 'zh-CN';
        u.rate = preset.rate;
        u.pitch = preset.pitch;
        const vi = Math.min(preset.voiceIndex, Math.max(0, voices.length - 1));
        if (voices.length && voices[vi]) u.voice = voices[vi];
        u.onend = () => {
            i += 1;
            next();
        };
        u.onerror = () => {
            i += 1;
            next();
        };
        window.speechSynthesis.speak(u);
    };
    next();
}

export function stopSpeaking() {
    utteranceChainToken += 1;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}

/** @type {HTMLAudioElement | null} */
let sampleAudio = null;

/**
 * Phát file mẫu MP3 (nghe thử giọng). Đường dẫn tương đối trang.
 * @param {string} src
 */
export function playVoiceSample(src) {
    stopSpeaking();
    try {
        if (sampleAudio) {
            sampleAudio.pause();
            sampleAudio = null;
        }
        const a = new Audio(src);
        sampleAudio = a;
        a.play().catch(() => {});
    } catch {
        /* ignore */
    }
}

export function stopVoiceSample() {
    if (sampleAudio) {
        sampleAudio.pause();
        sampleAudio = null;
    }
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.addEventListener('voiceschanged', () => refreshZhVoices());
}
