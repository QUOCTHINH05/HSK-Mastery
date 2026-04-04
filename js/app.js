import { createApp, ref, computed, onMounted, watch } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js';
import { NB_KEY, quizModes, wordCountOptions, voiceOptions, VOICE_KEY } from './config.js';
import { fetchCsv, parseRows } from './csv.js';
import { speakChinese, stopSpeaking, playVoiceSample, refreshZhVoices, playEffect } from './speech.js';

const HSK_LEVELS = [1, 2, 3, 4];
const DICT_PAGE_SIZE = 100;
const PINYIN_KEY = 'hsk_mastery_show_pinyin_v1';
const savedShowPinyin = localStorage.getItem(PINYIN_KEY);
const showPinyin = ref(savedShowPinyin !== null ? savedShowPinyin === 'true' : true);
function toggleShowPinyin() {
    showPinyin.value = !showPinyin.value;
    localStorage.setItem(PINYIN_KEY, showPinyin.value);
}

function normalizeCollections(raw) {
    const empty = { 1: [], 2: [], 3: [], 4: [] };
    if (!raw) return empty;
    if (Array.isArray(raw)) {
        // Backward compatible from old notebook array format
        for (const w of raw) {
            const level = Number(w.level);
            if (!HSK_LEVELS.includes(level)) continue;
            if (!empty[level].some((x) => x.word === w.word)) empty[level].push(w);
        }
        return empty;
    }
    for (const level of HSK_LEVELS) {
        const arr = Array.isArray(raw[level]) ? raw[level] : [];
        empty[level] = arr.filter((w) => w && w.word);
    }
    return empty;
}

createApp({
    setup() {
        const loading = ref(true);
        const loadError = ref('');
        const dictionary = ref([]);
        const currentView = ref('dashboard');
        const quizMode = ref('cn-vi');

        const collections = ref(normalizeCollections(JSON.parse(localStorage.getItem(NB_KEY) || 'null')));

        const currentLevel = ref(1);
        const quizQueue = ref([]);
        const quizIndex = ref(0);
        const options = ref([]);
        const answered = ref(false);
        const selectedOption = ref(null);
        const wasLastCorrect = ref(false);
        const sessionWordCount = ref(20);

        const dictLevel = ref(1);
        const dictPage = ref(1);

        const validVoiceIds = new Set(voiceOptions.map((v) => v.id));
        const savedVoice = localStorage.getItem(VOICE_KEY);
        const selectedVoiceId = ref(validVoiceIds.has(savedVoice) ? savedVoice : (voiceOptions[0]?.id || 'daoMing'));

        const readerText = ref('');
        const readerSpeaking = ref(false);
        const isDarkMode = ref(document.documentElement.classList.contains('dark'));

        const currentQuestion = computed(() => quizQueue.value[quizIndex.value] || {});
        const modeLabel = computed(() => quizModes.find((x) => x.id === quizMode.value)?.label || '');
        const selectedVoiceLabel = computed(() => voiceOptions.find((x) => x.id === selectedVoiceId.value)?.label || '');

        const wordsByLevel = computed(() => {
            const map = { 1: [], 2: [], 3: [], 4: [] };
            for (const w of dictionary.value) {
                if (HSK_LEVELS.includes(w.level)) map[w.level].push(w);
            }
            return map;
        });

        const notebookTotal = computed(() => HSK_LEVELS.reduce((sum, level) => sum + collections.value[level].length, 0));

        const dictWords = computed(() => wordsByLevel.value[dictLevel.value] || []);
        const dictPageCount = computed(() => Math.max(1, Math.ceil(dictWords.value.length / DICT_PAGE_SIZE)));
        const dictVisibleWords = computed(() => {
            const start = (dictPage.value - 1) * DICT_PAGE_SIZE;
            return dictWords.value.slice(start, start + DICT_PAGE_SIZE);
        });
        const dictTabPages = computed(() => Array.from({ length: dictPageCount.value }, (_, i) => i + 1));

        onMounted(async () => {
            try {
                const files = [
                    { name: 'data/Từ vựng HSK1-4 - HSK1+2.csv', split: 'hsk12', level: 1 },
                    { name: 'data/Từ vựng HSK1-4 - HSK3.csv', level: 3 },
                    { name: 'data/Từ vựng HSK1-4 - HSK4.csv', level: 4 },
                ];
                const all = [];
                for (const f of files) {
                    const data = await fetchCsv(f.name);
                    all.push(...parseRows(data, f));
                }
                dictionary.value = all;
            } catch (e) {
                loadError.value = e.message || String(e);
            } finally {
                loading.value = false;
            }
            refreshZhVoices();
        });

        const getWordCount = (lvl) => wordsByLevel.value[lvl]?.length || 0;

        const showToast = (msg) => {
            const toast = document.getElementById('toast');
            if (!toast) return;
            toast.textContent = msg;
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 2600);
        };

        const toggleTheme = () => {
            isDarkMode.value = !isDarkMode.value;
        };

        const showView = (view) => {
            if (currentView.value === 'reader' && view !== 'reader') {
                stopSpeaking();
                readerSpeaking.value = false;
            }
            currentView.value = view;
        };

        const selectDictLevel = (level) => {
            dictLevel.value = level;
            dictPage.value = 1;
            showView('dictionary');
        };

        const selectDictPage = (page) => {
            if (page < 1 || page > dictPageCount.value) return;
            dictPage.value = page;
        };

        const optionLabel = (opt) => {
            if (quizMode.value === 'cn-vi') return opt.meaning;
            if (quizMode.value === 'vi-cn') return opt.word;
            if (quizMode.value === 'cn-en') return opt.english;
            return opt.word;
        };

        const optionTextClass = () => {
            if (quizMode.value === 'vi-cn' || quizMode.value === 'en-cn') return 'cn-font text-xl md:text-2xl';
            return 'text-base md:text-lg';
        };

        const startLevel = (lvl) => {
            const words = wordsByLevel.value[lvl] || [];
            if (words.length < 4) {
                showToast('Không đủ từ vựng cho cấp độ này (cần ít nhất 4 từ).');
                return;
            }
            const target = Math.min(sessionWordCount.value, words.length);
            currentLevel.value = lvl;
            quizQueue.value = [...words].sort(() => Math.random() - 0.5).slice(0, target);
            quizIndex.value = 0;
            generateOptions();
            showView('quiz');
            if (target < sessionWordCount.value) {
                showToast(`Cấp HSK ${lvl} hiện có ${words.length} từ — đã chọn ${target} từ cho phiên này.`);
            }
        };

        const generateOptions = () => {
            const correct = currentQuestion.value;
            const pool = dictionary.value.filter((d) => d.level === currentLevel.value && d.word !== correct.word);
            const shuffled = [...pool].sort(() => Math.random() - 0.5);
            const wrong = [];
            const used = new Set([correct.word]);
            for (const d of shuffled) {
                if (wrong.length >= 3) break;
                const key = `${d.word}|${quizMode.value.includes('en') ? d.english : d.meaning}`;
                if (used.has(key)) continue;
                used.add(key);
                wrong.push(d);
            }
            options.value = [correct, ...wrong].slice(0, 4).sort(() => Math.random() - 0.5);
            answered.value = false;
            selectedOption.value = null;
            wasLastCorrect.value = false;
        };

        const isCorrect = (opt) => opt.word === currentQuestion.value.word;

        const addToCollection = (word, silent = false) => {
            const level = Number(word.level);
            if (!HSK_LEVELS.includes(level)) return;
            const exists = collections.value[level].some((w) => w.word === word.word);
            if (exists) {
                if (!silent) showToast('Từ này đã có trong collections.');
                return;
            }
            collections.value[level].push({ ...word });
            if (!silent) showToast(`Đã thêm «${word.word}» vào collections HSK ${level}.`);
        };

        const checkAnswer = (opt) => {
            if (answered.value) return;
            selectedOption.value = opt;
            answered.value = true;
            const ok = isCorrect(opt);
            wasLastCorrect.value = ok;
            if (ok) {
                playEffect('right');
                setTimeout(() => {speak(currentQuestion.value.word);
                }, 1000);
            }
            else {playEffect('wrong'); addToCollection(currentQuestion.value, true);}
        };

        const getOptionClass = (opt) => {
            if (!answered.value) return 'border-slate-100 bg-white hover:border-teal-200 hover:bg-teal-50/50 text-slate-800';
            if (isCorrect(opt)) return 'border-emerald-400 bg-emerald-50 text-emerald-900';
            if (selectedOption.value === opt) return 'border-rose-400 bg-rose-50 text-rose-900';
            return 'border-slate-100 bg-slate-50/80 text-slate-400';
        };

        const nextQuestion = () => {
            if (quizIndex.value < quizQueue.value.length - 1) {
                quizIndex.value += 1;
                generateOptions();
            } else {
                showToast('Hoàn thành bài — giỏi lắm!');
                showView('dashboard');
            }
        };

        const exitQuiz = () => {
            if (confirm('Thoát bài làm hiện tại?')) showView('dashboard');
        };

        const removeFromCollection = (level, index) => {
            collections.value[level].splice(index, 1);
        };

        const clearCollection = (level) => {
            if (confirm(`Xóa toàn bộ collections HSK ${level}?`)) {
                collections.value[level] = [];
            }
        };

        const clearAllCollections = () => {
            if (!confirm('Xóa toàn bộ collections của tất cả cấp độ?')) return;
            for (const level of HSK_LEVELS) collections.value[level] = [];
        };

        const speak = (text) => {
            if (!text) return;
            speakChinese(String(text), selectedVoiceId.value);
        };

        const previewVoice = (file) => playVoiceSample(file);

        const speakReader = () => {
            const t = readerText.value.trim();
            if (!t) {
                showToast('Nhập đoạn văn tiếng Trung cần đọc.');
                return;
            }
            readerSpeaking.value = true;
            speakChinese(t, selectedVoiceId.value, {
                onEnd: () => {
                    readerSpeaking.value = false;
                },
            });
        };

        const stopReader = () => {
            stopSpeaking();
            readerSpeaking.value = false;
        };

        const notebookKey = (w, i) => `${w.word}-${w.level}-${i}`;

        watch(collections, (v) => localStorage.setItem(NB_KEY, JSON.stringify(v)), { deep: true });
        watch(selectedVoiceId, (v) => localStorage.setItem(VOICE_KEY, v));
        watch(isDarkMode, (v) => {
            document.documentElement.classList.toggle('dark', v);
            localStorage.setItem('hsk_mastery_theme_v1', v ? 'dark' : 'light');
        });
        watch(dictLevel, () => {
            if (dictPage.value > dictPageCount.value) dictPage.value = 1;
        });

        return {
            loading,
            loadError,
            quizModes,
            wordCountOptions,
            voiceOptions,
            selectedVoiceId,
            selectedVoiceLabel,
            sessionWordCount,
            quizMode,
            modeLabel,
            dictionary,
            collections,
            notebookTotal,
            currentView,
            currentLevel,
            quizQueue,
            quizIndex,
            options,
            currentQuestion,
            answered,
            selectedOption,
            wasLastCorrect,
            readerText,
            readerSpeaking,
            isDarkMode,
            dictLevel,
            dictPage,
            dictPageCount,
            dictVisibleWords,
            dictTabPages,
            getWordCount,
            showView,
            selectDictLevel,
            selectDictPage,
            startLevel,
            checkAnswer,
            isCorrect,
            getOptionClass,
            nextQuestion,
            exitQuiz,
            optionLabel,
            optionTextClass,
            addToCollection,
            removeFromCollection,
            clearCollection,
            clearAllCollections,
            speak,
            previewVoice,
            speakReader,
            stopReader,
            toggleTheme,
            notebookKey,
            HSK_LEVELS,
            showPinyin,
            toggleShowPinyin,
        };
    },
}).mount('#app');
