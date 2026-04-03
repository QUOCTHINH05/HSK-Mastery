import { createApp, ref, computed, onMounted, watch } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js';
import { NB_KEY, quizModes, wordCountOptions, voiceOptions, VOICE_KEY } from './config.js';
import { fetchCsv, parseRows } from './csv.js';
import {
    speakChinese,
    stopSpeaking,
    playVoiceSample,
    refreshZhVoices,
} from './speech.js';

createApp({
    setup() {
        const loading = ref(true);
        const loadError = ref('');
        const dictionary = ref([]);
        const currentView = ref('dashboard');
        const quizMode = ref('cn-vi');
        /** @type {import('vue').Ref<{ word: string, pinyin: string, meaning: string, english: string, level: number }[]>} */
        const notebook = ref(JSON.parse(localStorage.getItem(NB_KEY) || '[]'));
        const currentLevel = ref(1);
        const quizQueue = ref([]);
        const quizIndex = ref(0);
        const options = ref([]);
        const answered = ref(false);
        const selectedOption = ref(null);
        const wasLastCorrect = ref(false);
        /** Số từ trong phiên (10 | 20 | 50 | 100) */
        const sessionWordCount = ref(20);

        const validVoiceIds = new Set(voiceOptions.map((v) => v.id));
        const savedVoice = localStorage.getItem(VOICE_KEY);
        const selectedVoiceId = ref(validVoiceIds.has(savedVoice) ? savedVoice : voiceOptions[0].id);

        /** Văn bản tiếng Trung để đọc (màn Đọc văn bản) */
        const readerText = ref('');
        const readerSpeaking = ref(false);

        const currentQuestion = computed(() => quizQueue.value[quizIndex.value] || {});

        const modeLabel = computed(() => {
            const m = quizModes.find((x) => x.id === quizMode.value);
            return m ? m.label : '';
        });

        const selectedVoiceLabel = computed(() => {
            const v = voiceOptions.find((x) => x.id === selectedVoiceId.value);
            return v ? v.label : '';
        });

        onMounted(async () => {
            try {
                const files = [
                    { name: 'Từ vựng HSK1-4 - HSK1+2.csv', split: 'hsk12', level: 1 },
                    { name: 'Từ vựng HSK1-4 - HSK3.csv', level: 3 },
                    { name: 'Từ vựng HSK1-4 - HSK4.csv', level: 4 },
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

        const getWordCount = (lvl) => dictionary.value.filter((d) => d.level === lvl).length;

        const showView = (view) => {
            if (currentView.value === 'reader' && view !== 'reader') {
                stopSpeaking();
                readerSpeaking.value = false;
            }
            currentView.value = view;
        };

        const showToast = (msg) => {
            const toast = document.getElementById('toast');
            if (!toast) return;
            toast.textContent = msg;
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 2600);
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
            const words = dictionary.value.filter((d) => d.level === lvl);
            if (words.length < 4) {
                showToast('Không đủ từ vựng cho cấp độ này (cần ít nhất 4 từ).');
                return;
            }
            const target = Math.min(sessionWordCount.value, words.length);
            if (target < 4) {
                showToast('Không đủ từ để tạo bài trắc nghiệm.');
                return;
            }
            currentLevel.value = lvl;
            const shuffled = [...words].sort(() => Math.random() - 0.5);
            quizQueue.value = shuffled.slice(0, target);
            quizIndex.value = 0;
            generateOptions();
            showView('quiz');
            if (target < sessionWordCount.value) {
                showToast(`Cấp HSK ${lvl} hiện có ${words.length} từ — đã chọn ${target} từ cho phiên này.`);
            }
        };

        const generateOptions = () => {
            const correct = currentQuestion.value;
            const pool = dictionary.value.filter(
                (d) => d.level === currentLevel.value && d.word !== correct.word
            );
            const shuffled = [...pool].sort(() => Math.random() - 0.5);
            const need = 3;
            const wrong = [];
            const used = new Set();
            const keyFor = (d) => {
                if (quizMode.value === 'cn-vi' || quizMode.value === 'vi-cn') return d.meaning + '|' + d.word;
                if (quizMode.value === 'cn-en' || quizMode.value === 'en-cn') return d.english + '|' + d.word;
                return d.word;
            };
            used.add(keyFor(correct));
            for (const d of shuffled) {
                if (wrong.length >= need) break;
                const k = keyFor(d);
                if (used.has(k)) continue;
                used.add(k);
                wrong.push(d);
            }
            let picks = [correct, ...wrong];
            while (picks.length < 4 && pool.length > picks.length - 1) {
                const extra = pool.find((p) => !picks.some((x) => x.word === p.word));
                if (extra) picks.push(extra);
                else break;
            }
            picks = picks.slice(0, 4).sort(() => Math.random() - 0.5);
            options.value = picks;
            answered.value = false;
            selectedOption.value = null;
            wasLastCorrect.value = false;
        };

        const isCorrect = (opt) => opt.word === currentQuestion.value.word;

        const checkAnswer = (opt) => {
            if (answered.value) return;
            selectedOption.value = opt;
            answered.value = true;
            const ok = isCorrect(opt);
            wasLastCorrect.value = ok;
            if (ok) speak(currentQuestion.value.word);
            else addToNotebook(currentQuestion.value, true);
        };

        const getOptionClass = (opt) => {
            if (!answered.value) return 'border-slate-100 bg-white hover:border-teal-200 hover:bg-teal-50/50 text-slate-800';
            if (isCorrect(opt)) return 'border-emerald-400 bg-emerald-50 text-emerald-900';
            if (selectedOption.value === opt) return 'border-rose-400 bg-rose-50 text-rose-900';
            return 'border-slate-100 bg-slate-50/80 text-slate-400';
        };

        const nextQuestion = () => {
            if (quizIndex.value < quizQueue.value.length - 1) {
                quizIndex.value++;
                generateOptions();
            } else {
                showToast('Hoàn thành bài — giỏi lắm!');
                showView('dashboard');
            }
        };

        const exitQuiz = () => {
            if (confirm('Thoát bài làm hiện tại?')) showView('dashboard');
        };

        const notebookKey = (w, i) => `${w.word}-${w.level}-${i}`;

        const addToNotebook = (word, silent) => {
            const exists = notebook.value.some((w) => w.word === word.word && w.level === word.level);
            if (!exists) {
                notebook.value.push({ ...word });
                if (!silent) showToast(`Đã lưu «${word.word}» vào Cần ôn`);
            } else if (!silent) showToast('Từ này đã có trong danh sách');
        };

        const removeFromNotebook = (index) => {
            notebook.value.splice(index, 1);
        };

        const clearNotebook = () => {
            if (confirm('Xóa toàn bộ danh sách cần ôn?')) notebook.value = [];
        };

        /** Đọc chữ Hán / cụm (trắc nghiệm, sổ tay) — theo giọng đã chọn */
        const speak = (text) => {
            if (!text) return;
            speakChinese(String(text), /** @type {'daoMing'|'guoChao'|'jing'} */ (selectedVoiceId.value));
        };

        const previewVoice = (file) => {
            playVoiceSample(file);
        };

        const speakReader = () => {
            const t = readerText.value.trim();
            if (!t) {
                showToast('Nhập đoạn văn tiếng Trung cần đọc.');
                return;
            }
            if (!('speechSynthesis' in window)) {
                showToast('Trình duyệt không hỗ trợ đọc (Speech Synthesis).');
                return;
            }
            readerSpeaking.value = true;
            speakChinese(t, /** @type {'daoMing'|'guoChao'|'jing'} */ (selectedVoiceId.value), {
                onEnd: () => {
                    readerSpeaking.value = false;
                },
            });
        };

        const stopReader = () => {
            stopSpeaking();
            readerSpeaking.value = false;
        };

        watch(
            notebook,
            (v) => localStorage.setItem(NB_KEY, JSON.stringify(v)),
            { deep: true }
        );

        watch(selectedVoiceId, (v) => {
            localStorage.setItem(VOICE_KEY, v);
        });

        return {
            loading,
            loadError,
            quizModes,
            wordCountOptions,
            voiceOptions,
            selectedVoiceId,
            sessionWordCount,
            quizMode,
            modeLabel,
            selectedVoiceLabel,
            dictionary,
            notebook,
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
            getWordCount,
            showView,
            startLevel,
            checkAnswer,
            isCorrect,
            getOptionClass,
            nextQuestion,
            exitQuiz,
            optionLabel,
            optionTextClass,
            addToNotebook,
            removeFromNotebook,
            clearNotebook,
            speak,
            previewVoice,
            speakReader,
            stopReader,
            notebookKey,
        };
    },
}).mount('#app');
