/** @typedef {{ id: string, label: string, hint: string, icon: string }} QuizMode */

/** @type {string} */
export const NB_KEY = 'hsk_mastery_notebook_v1';

/** @type {QuizMode[]} */
export const quizModes = [
    { id: 'cn-vi', label: 'Trung → Việt', hint: 'Xem chữ Hán, chọn nghĩa tiếng Việt', icon: 'fa-solid fa-arrow-right' },
    { id: 'vi-cn', label: 'Việt → Trung', hint: 'Xem nghĩa Việt, chọn chữ Hán đúng', icon: 'fa-solid fa-arrow-left' },
    { id: 'cn-en', label: 'Trung → Anh', hint: 'Xem chữ Hán, chọn nghĩa tiếng Anh', icon: 'fa-solid fa-arrow-right' },
    { id: 'en-cn', label: 'Anh → Trung', hint: 'Xem tiếng Anh, chọn chữ Hán đúng', icon: 'fa-solid fa-arrow-left' },
];

/** Số từ trong một phiên ôn */
export const wordCountOptions = [10, 20, 50, 100];

/** @typedef {{ id: string, label: string, file: string }} VoiceOption */

/** Giọng đọc: file MP3 trong `voices/` để nghe thử; đọc từ/câu dùng TTS trình duyệt theo preset tương ứng. */
/** @type {VoiceOption[]} */
export const voiceOptions = [
    { id: 'daoMing', label: 'Dao Ming', file: 'voices/DaoMingVoice1.mp3' },
    { id: 'guoChao', label: 'Guo Chao', file: 'voices/GuochaoVoice1.mp3' },
    { id: 'jing', label: 'Jing', file: 'voices/JingVoice1.mp3' },
    { id: 'jing2', label: 'Jing2', file: 'voices/Jing2.mp3' },
    { id: 'jing3', label: 'Jing3', file: 'voices/Jing3.mp3' },
    { id: 'jing4', label: 'Jing4', file: 'voices/Jing4.mp3' },
    { id: 'ming2', label: 'Ming2', file: 'voices/Ming2.mp3' },
    { id: 'ming3', label: 'Ming3', file: 'voices/Ming3.mp3' }
];

export const VOICE_KEY = 'hsk_mastery_voice_v1';
