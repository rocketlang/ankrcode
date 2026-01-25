/**
 * i18n Module
 * Internationalization for AnkrCode - Indic languages first
 */
// Message catalog
const messages = {
    en: {
        welcome: 'Welcome! I am AnkrCode, your AI coding assistant.',
        goodbye: 'Goodbye! Happy coding!',
        thinking: 'Thinking...',
        error: 'An error occurred',
        help_hint: 'Type /help for commands, or just start chatting!',
        file_created: 'File created: {path}',
        file_read: 'Read {lines} lines from {path}',
        file_edited: 'Edited {path}',
        command_executed: 'Command executed',
        task_started: 'Task started: {id}',
        no_api_key: 'API key not configured. Set {key} environment variable.',
    },
    hi: {
        welcome: 'नमस्ते! मैं AnkrCode हूं, आपका AI coding assistant। आज मैं आपकी क्या मदद कर सकता हूं?',
        goodbye: 'अलविदा! Happy coding!',
        thinking: 'सोच रहा हूं...',
        error: 'एक त्रुटि हुई',
        help_hint: 'कमांड के लिए /help टाइप करें, या बस बात करना शुरू करें!',
        file_created: 'फ़ाइल बनाई: {path}',
        file_read: '{path} से {lines} लाइनें पढ़ीं',
        file_edited: '{path} संपादित किया',
        command_executed: 'कमांड चलाई गई',
        task_started: 'कार्य शुरू: {id}',
        no_api_key: 'API key सेट नहीं है। {key} environment variable सेट करें।',
    },
    ta: {
        welcome: 'வணக்கம்! நான் AnkrCode, உங்கள் AI coding assistant.',
        goodbye: 'பிரியாவிடை! Happy coding!',
        thinking: 'யோசிக்கிறேன்...',
        error: 'ஒரு பிழை ஏற்பட்டது',
        help_hint: 'கட்டளைகளுக்கு /help தட்டச்சு செய்யுங்கள்!',
        file_created: 'கோப்பு உருவாக்கப்பட்டது: {path}',
        file_read: '{path} இலிருந்து {lines} வரிகள் படிக்கப்பட்டன',
        file_edited: '{path} திருத்தப்பட்டது',
        command_executed: 'கட்டளை இயக்கப்பட்டது',
        task_started: 'பணி தொடங்கியது: {id}',
        no_api_key: 'API key அமைக்கப்படவில்லை.',
    },
    te: {
        welcome: 'నమస్కారం! నేను AnkrCode, మీ AI coding assistant.',
        goodbye: 'వీడ్కోలు! Happy coding!',
        thinking: 'ఆలోచిస్తున్నాను...',
        error: 'ఒక లోపం సంభవించింది',
        help_hint: 'ఆదేశాల కోసం /help టైప్ చేయండి!',
        file_created: 'ఫైల్ సృష్టించబడింది: {path}',
        file_read: '{path} నుండి {lines} లైన్లు చదవబడ్డాయి',
        file_edited: '{path} సవరించబడింది',
        command_executed: 'ఆదేశం అమలు చేయబడింది',
        task_started: 'పని ప్రారంభమైంది: {id}',
        no_api_key: 'API key సెట్ చేయబడలేదు.',
    },
    kn: {
        welcome: 'ನಮಸ್ಕಾರ! ನಾನು AnkrCode, ನಿಮ್ಮ AI coding assistant.',
        goodbye: 'ವಿದಾಯ! Happy coding!',
        thinking: 'ಯೋಚಿಸುತ್ತಿದ್ದೇನೆ...',
        error: 'ದೋಷ ಸಂಭವಿಸಿದೆ',
        help_hint: 'ಆದೇಶಗಳಿಗಾಗಿ /help ಟೈಪ್ ಮಾಡಿ!',
        file_created: 'ಫೈಲ್ ರಚಿಸಲಾಗಿದೆ: {path}',
        file_read: '{path} ನಿಂದ {lines} ಸಾಲುಗಳನ್ನು ಓದಲಾಗಿದೆ',
        file_edited: '{path} ಸಂಪಾದಿಸಲಾಗಿದೆ',
        command_executed: 'ಆದೇಶ ಕಾರ್ಯಗತಗೊಂಡಿದೆ',
        task_started: 'ಕಾರ್ಯ ಪ್ರಾರಂಭವಾಯಿತು: {id}',
        no_api_key: 'API key ಹೊಂದಿಸಲಾಗಿಲ್ಲ.',
    },
    mr: {
        welcome: 'नमस्कार! मी AnkrCode आहे, तुमचा AI coding assistant.',
        goodbye: 'निरोप! Happy coding!',
        thinking: 'विचार करत आहे...',
        error: 'एक त्रुटी आली',
        help_hint: 'कमांडसाठी /help टाइप करा!',
        file_created: 'फाइल तयार केली: {path}',
        file_read: '{path} मधून {lines} ओळी वाचल्या',
        file_edited: '{path} संपादित केले',
        command_executed: 'कमांड चालवली',
        task_started: 'कार्य सुरू: {id}',
        no_api_key: 'API key सेट केलेली नाही.',
    },
    bn: {
        welcome: 'নমস্কার! আমি AnkrCode, আপনার AI coding assistant.',
        goodbye: 'বিদায়! Happy coding!',
        thinking: 'ভাবছি...',
        error: 'একটি ত্রুটি ঘটেছে',
        help_hint: 'কমান্ডের জন্য /help টাইপ করুন!',
        file_created: 'ফাইল তৈরি হয়েছে: {path}',
        file_read: '{path} থেকে {lines} লাইন পড়া হয়েছে',
        file_edited: '{path} সম্পাদিত হয়েছে',
        command_executed: 'কমান্ড কার্যকর হয়েছে',
        task_started: 'কাজ শুরু হয়েছে: {id}',
        no_api_key: 'API key সেট করা হয়নি.',
    },
    gu: {
        welcome: 'નમસ્તે! હું AnkrCode છું, તમારો AI coding assistant.',
        goodbye: 'આવજો! Happy coding!',
        thinking: 'વિચારી રહ્યો છું...',
        error: 'એક ભૂલ આવી',
        help_hint: 'આદેશો માટે /help ટાઈપ કરો!',
        file_created: 'ફાઇલ બનાવી: {path}',
        file_read: '{path} માંથી {lines} લાઇન વાંચી',
        file_edited: '{path} સંપાદિત કર્યું',
        command_executed: 'આદેશ ચલાવ્યો',
        task_started: 'કાર્ય શરૂ: {id}',
        no_api_key: 'API key સેટ નથી.',
    },
    ml: {
        welcome: 'നമസ്കാരം! ഞാൻ AnkrCode, നിങ്ങളുടെ AI coding assistant.',
        goodbye: 'വിട! Happy coding!',
        thinking: 'ചിന്തിക്കുന്നു...',
        error: 'ഒരു പിശക് സംഭവിച്ചു',
        help_hint: 'കമാൻഡുകൾക്കായി /help ടൈപ്പ് ചെയ്യുക!',
        file_created: 'ഫയൽ സൃഷ്ടിച്ചു: {path}',
        file_read: '{path} ൽ നിന്ന് {lines} വരികൾ വായിച്ചു',
        file_edited: '{path} എഡിറ്റ് ചെയ്തു',
        command_executed: 'കമാൻഡ് എക്സിക്യൂട്ട് ചെയ്തു',
        task_started: 'ടാസ്ക് ആരംഭിച്ചു: {id}',
        no_api_key: 'API key സെറ്റ് ചെയ്തിട്ടില്ല.',
    },
    pa: {
        welcome: 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ AnkrCode ਹਾਂ, ਤੁਹਾਡਾ AI coding assistant.',
        goodbye: 'ਅਲਵਿਦਾ! Happy coding!',
        thinking: 'ਸੋਚ ਰਿਹਾ ਹਾਂ...',
        error: 'ਇੱਕ ਗਲਤੀ ਹੋਈ',
        help_hint: 'ਕਮਾਂਡਾਂ ਲਈ /help ਟਾਈਪ ਕਰੋ!',
        file_created: 'ਫਾਈਲ ਬਣਾਈ: {path}',
        file_read: '{path} ਤੋਂ {lines} ਲਾਈਨਾਂ ਪੜ੍ਹੀਆਂ',
        file_edited: '{path} ਸੰਪਾਦਿਤ ਕੀਤਾ',
        command_executed: 'ਕਮਾਂਡ ਚਲਾਈ',
        task_started: 'ਕੰਮ ਸ਼ੁਰੂ: {id}',
        no_api_key: 'API key ਸੈੱਟ ਨਹੀਂ ਹੈ.',
    },
    or: {
        welcome: 'ନମସ୍କାର! ମୁଁ AnkrCode, ଆପଣଙ୍କ AI coding assistant.',
        goodbye: 'ବିଦାୟ! Happy coding!',
        thinking: 'ଭାବୁଛି...',
        error: 'ଏକ ତ୍ରୁଟି ଘଟିଲା',
        help_hint: 'ନିର୍ଦ୍ଦେଶ ପାଇଁ /help ଟାଇପ୍ କରନ୍ତୁ!',
        file_created: 'ଫାଇଲ୍ ସୃଷ୍ଟି ହେଲା: {path}',
        file_read: '{path} ରୁ {lines} ଧାଡ଼ି ପଢ଼ାଗଲା',
        file_edited: '{path} ସମ୍ପାଦିତ ହେଲା',
        command_executed: 'ନିର୍ଦ୍ଦେଶ ଚାଲିଲା',
        task_started: 'କାର୍ଯ୍ୟ ଆରମ୍ଭ: {id}',
        no_api_key: 'API key ସେଟ୍ ହୋଇନାହିଁ.',
    },
};
/**
 * Translate a message key
 */
export function t(lang, key, params) {
    const langMessages = messages[lang] || messages.en;
    let message = langMessages[key] || messages.en[key] || key;
    // Replace parameters
    if (params) {
        for (const [k, v] of Object.entries(params)) {
            message = message.replace(`{${k}}`, String(v));
        }
    }
    return message;
}
/**
 * Detect user's preferred language
 */
export function detectLanguage() {
    // Check environment variable
    const envLang = process.env.ANKRCODE_LANG || process.env.LANG || '';
    // Map common locale codes to our supported languages
    const langMap = {
        'hi': 'hi', 'hi_IN': 'hi', 'hindi': 'hi',
        'ta': 'ta', 'ta_IN': 'ta', 'tamil': 'ta',
        'te': 'te', 'te_IN': 'te', 'telugu': 'te',
        'kn': 'kn', 'kn_IN': 'kn', 'kannada': 'kn',
        'mr': 'mr', 'mr_IN': 'mr', 'marathi': 'mr',
        'bn': 'bn', 'bn_IN': 'bn', 'bengali': 'bn',
        'gu': 'gu', 'gu_IN': 'gu', 'gujarati': 'gu',
        'ml': 'ml', 'ml_IN': 'ml', 'malayalam': 'ml',
        'pa': 'pa', 'pa_IN': 'pa', 'punjabi': 'pa',
        'or': 'or', 'or_IN': 'or', 'odia': 'or',
        'en': 'en', 'en_US': 'en', 'en_IN': 'en', 'english': 'en',
    };
    const detected = envLang.split('.')[0].toLowerCase();
    return langMap[detected] || 'hi'; // Default to Hindi
}
/**
 * Get all supported languages
 */
export function getSupportedLanguages() {
    return Object.keys(messages);
}
/**
 * Get language display name
 */
export function getLanguageName(lang) {
    const names = {
        en: { native: 'English', english: 'English' },
        hi: { native: 'हिन्दी', english: 'Hindi' },
        ta: { native: 'தமிழ்', english: 'Tamil' },
        te: { native: 'తెలుగు', english: 'Telugu' },
        kn: { native: 'ಕನ್ನಡ', english: 'Kannada' },
        mr: { native: 'मराठी', english: 'Marathi' },
        bn: { native: 'বাংলা', english: 'Bengali' },
        gu: { native: 'ગુજરાતી', english: 'Gujarati' },
        ml: { native: 'മലയാളം', english: 'Malayalam' },
        pa: { native: 'ਪੰਜਾਬੀ', english: 'Punjabi' },
        or: { native: 'ଓଡ଼ିଆ', english: 'Odia' },
    };
    return names[lang] || names.en;
}
//# sourceMappingURL=index.js.map