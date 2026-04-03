/**
 * @param {string|null|undefined} s
 */
export function norm(s) {
    return (s == null ? '' : String(s)).trim();
}

/**
 * @param {Record<string, string>[]} data
 * @param {{ name: string, level: number, split?: string }} fileKind
 */
export function parseRows(data, fileKind) {
    const seen = new Set();
    const out = [];
    for (const row of data) {
        const han = norm(row['HÁN TỰ'] || row['Hán tự']);
        const py = norm(row['PINYIN'] || row['Pinyin']);
        const vi = norm(row['NGHĨA'] || row['NGHĨA TIẾNG VIỆT'] || row['Nghĩa (tiếng việt)']);
        const en = norm(row['ENGLISH'] || row['NGHĨA TIẾNG ANH'] || row['English']);
        const stt = parseInt(row['STT'], 10);
        if (!han || !py) continue;
        if (!vi && !en) continue;
        let level = fileKind.level;
        if (fileKind.split === 'hsk12') {
            if (!Number.isFinite(stt)) continue;
            level = stt <= 150 ? 1 : 2;
        }
        const dedupeKey = `${level}|${han}`;
        if (seen.has(dedupeKey)) continue;
        seen.add(dedupeKey);
        out.push({ word: han, pinyin: py, meaning: vi || en, english: en || vi, level, stt });
    }
    return out;
}

/**
 * @param {string} name
 */
export async function fetchCsv(name) {
    const url = encodeURI(name);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${name}: ${res.status}`);
    const text = await res.text();
    return new Promise((resolve, reject) => {
        window.Papa.parse(text, {
            header: true,
            skipEmptyLines: true,
            complete: (r) => resolve(r.data),
            error: reject,
        });
    });
}
