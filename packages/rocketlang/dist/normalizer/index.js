/**
 * Normalizer - Convert Indic text to canonical form
 *
 * Handles:
 * - Transliteration (roman ↔ Devanagari)
 * - Code-switching normalization
 * - Synonym resolution
 */
// Verb mappings (Indic → English canonical)
const VERBS = {
    create: ['बनाओ', 'banao', 'bana', 'make', 'generate', 'உருவாக்கு', 'సృష్టించు'],
    read: ['पढ़ो', 'padho', 'படி', 'చదువు', 'open', 'show', 'दिखाओ', 'dikhao'],
    write: ['लिखो', 'likho', 'எழுது', 'రాయు', 'save'],
    edit: ['बदलो', 'badlo', 'change', 'modify', 'update', 'மாற்று', 'మార్చు'],
    delete: ['हटाओ', 'hatao', 'remove', 'நீக்கு', 'తొలగించు'],
    search: ['खोजो', 'khojo', 'find', 'தேடு', 'వెతుకు', 'ढूंढो', 'dhundho'],
    run: ['चलाओ', 'chalao', 'execute', 'இயக்கு', 'అమలు'],
    commit: ['commit करो', 'commit karo'],
    push: ['push करो', 'push karo'],
    pull: ['pull करो', 'pull karo'],
    install: ['install करो', 'install karo', 'डालो', 'dalo'],
    test: ['test करो', 'test karo', 'जांचो', 'jancho'],
    build: ['build करो', 'build karo'],
};
// Connector mappings
const CONNECTORS = {
    in: ['में', 'mein', 'inside', 'உள்ளே', 'లో'],
    from: ['से', 'se', 'இருந்து', 'నుండి'],
    to: ['को', 'ko', 'க்கு', 'కు'],
    for: ['के लिए', 'ke liye', 'க்காக', 'కోసం'],
    and: ['और', 'aur', 'மற்றும்', 'మరియు'],
    with: ['के साथ', 'ke saath', 'உடன்', 'తో'],
};
// Noun mappings
const NOUNS = {
    file: ['फ़ाइल', 'file', 'கோப்பு', 'ఫైల్'],
    folder: ['फ़ोल्डर', 'folder', 'directory', 'கோப்புறை', 'ఫోల్డర్'],
    function: ['फ़ंक्शन', 'function', 'func', 'செயல்பாடு', 'ఫంక్షన్'],
    class: ['क्लास', 'class', 'வகுப்பு', 'క్లాస్'],
    api: ['एपीआई', 'API', 'api'],
    component: ['कॉम्पोनेन्ट', 'component', 'கூறு', 'భాగం'],
    table: ['टेबल', 'table', 'அட்டவணை', 'పట్టిక'],
    database: ['डेटाबेस', 'database', 'db', 'தரவுத்தளம్', 'డేటాబేస్'],
};
/**
 * Normalize input text to canonical English form
 */
export function normalize(input) {
    let normalized = input.toLowerCase();
    // Normalize verbs
    for (const [canonical, variants] of Object.entries(VERBS)) {
        for (const variant of variants) {
            const regex = new RegExp(escapeRegex(variant.toLowerCase()), 'gi');
            normalized = normalized.replace(regex, canonical);
        }
    }
    // Normalize connectors
    for (const [canonical, variants] of Object.entries(CONNECTORS)) {
        for (const variant of variants) {
            const regex = new RegExp(escapeRegex(variant.toLowerCase()), 'gi');
            normalized = normalized.replace(regex, canonical);
        }
    }
    // Normalize nouns
    for (const [canonical, variants] of Object.entries(NOUNS)) {
        for (const variant of variants) {
            const regex = new RegExp(escapeRegex(variant.toLowerCase()), 'gi');
            normalized = normalized.replace(regex, canonical);
        }
    }
    return normalized.trim();
}
/**
 * Transliterate between scripts
 */
export function transliterate(text, from, to) {
    if (from === to)
        return text;
    if (from === 'devanagari' && to === 'roman') {
        return devanagariToRoman(text);
    }
    if (from === 'roman' && to === 'devanagari') {
        return romanToDevanagari(text);
    }
    return text;
}
/**
 * Detect script of input
 */
export function detectScript(text) {
    const devanagariRange = /[\u0900-\u097F]/;
    const tamilRange = /[\u0B80-\u0BFF]/;
    const teluguRange = /[\u0C00-\u0C7F]/;
    const hasDevanagari = devanagariRange.test(text);
    const hasTamil = tamilRange.test(text);
    const hasTelugu = teluguRange.test(text);
    const hasRoman = /[a-zA-Z]/.test(text);
    const scripts = [hasDevanagari, hasTamil, hasTelugu, hasRoman].filter(Boolean);
    if (scripts.length > 1)
        return 'mixed';
    if (hasDevanagari)
        return 'devanagari';
    if (hasTamil)
        return 'tamil';
    if (hasTelugu)
        return 'telugu';
    return 'roman';
}
// Helper functions
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
// Basic Devanagari to Roman transliteration
const DEVANAGARI_MAP = {
    // Vowels
    '\u0905': 'a', // अ
    '\u0906': 'aa', // आ
    '\u0907': 'i', // इ
    '\u0908': 'ee', // ई
    '\u0909': 'u', // उ
    '\u090A': 'oo', // ऊ
    '\u090F': 'e', // ए
    '\u0910': 'ai', // ऐ
    '\u0913': 'o', // ओ
    '\u0914': 'au', // औ
    // Consonants
    '\u0915': 'ka', // क
    '\u0916': 'kha', // ख
    '\u0917': 'ga', // ग
    '\u0918': 'gha', // घ
    '\u091A': 'cha', // च
    '\u091B': 'chha', // छ
    '\u091C': 'ja', // ज
    '\u091D': 'jha', // झ
    '\u091F': 'ta', // ट
    '\u0920': 'tha', // ठ
    '\u0921': 'da', // ड
    '\u0922': 'dha', // ढ
    '\u0923': 'na', // ण
    '\u0924': 'ta', // त
    '\u0925': 'tha', // थ
    '\u0926': 'da', // द
    '\u0927': 'dha', // ध
    '\u0928': 'na', // न
    '\u092A': 'pa', // प
    '\u092B': 'pha', // फ
    '\u092C': 'ba', // ब
    '\u092D': 'bha', // भ
    '\u092E': 'ma', // म
    '\u092F': 'ya', // य
    '\u0930': 'ra', // र
    '\u0932': 'la', // ल
    '\u0935': 'va', // व
    '\u0936': 'sha', // श
    '\u0937': 'sha', // ष
    '\u0938': 'sa', // स
    '\u0939': 'ha', // ह
    // Matras (vowel signs)
    '\u093E': 'a', // ा
    '\u093F': 'i', // ि
    '\u0940': 'ee', // ी
    '\u0941': 'u', // ु
    '\u0942': 'oo', // ू
    '\u0947': 'e', // े
    '\u0948': 'ai', // ै
    '\u094B': 'o', // ो
    '\u094C': 'au', // ौ
    // Special characters
    '\u0902': 'n', // ं (anusvara)
    '\u0903': 'h', // ः (visarga)
    '\u094D': '', // ् (virama/halant)
};
function devanagariToRoman(text) {
    let result = '';
    for (const char of text) {
        result += DEVANAGARI_MAP[char] || char;
    }
    return result;
}
function romanToDevanagari(text) {
    // Reverse mapping (simplified)
    const reverseMap = {};
    for (const [dev, rom] of Object.entries(DEVANAGARI_MAP)) {
        if (rom && !reverseMap[rom]) {
            reverseMap[rom] = dev;
        }
    }
    let result = text;
    // Sort by length descending to match longer patterns first
    const patterns = Object.keys(reverseMap).sort((a, b) => b.length - a.length);
    for (const pattern of patterns) {
        result = result.replace(new RegExp(pattern, 'gi'), reverseMap[pattern]);
    }
    return result;
}
//# sourceMappingURL=index.js.map