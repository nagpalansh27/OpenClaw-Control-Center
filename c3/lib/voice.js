/* ============================================
   C3 — VOICE SERVICE (Speechify API)
   Realistic AI voices via Speechify TTS API
   Per-character voice profiles using unique voice IDs
   ============================================ */

const SPEECHIFY_API_KEY = 'D_2vnD2vc8I8KNqVOtpXAy-EzY8C1VVdg3KtzvZiyNo=';
const SPEECHIFY_BASE = 'https://api.speechify.ai';

// Each agent gets a unique Speechify voice ID for a distinct personality
// These map to Speechify's built-in voices (male/female, various styles)
const VOICE_PROFILES = {
    // Core Division — strong, technical voices
    goku: { voice_id: 'george', gender: 'male' },  // authoritative, powerful
    vegeta: { voice_id: 'henry', gender: 'male' },  // intense, proud
    piccolo: { voice_id: 'russell', gender: 'male' },  // deep, wise
    tanjiro: { voice_id: 'ankit', gender: 'male' },  // warm, kind
    // Growth Division — energetic, persuasive voices
    naruto: { voice_id: 'jack', gender: 'male' },  // energetic, loud
    sasuke: { voice_id: 'elijah', gender: 'male' },  // cool, calculated
    sakura: { voice_id: 'lisa', gender: 'female' },  // friendly, smart
    kakashi: { voice_id: 'oliver', gender: 'male' },  // calm, wise
    itachi: { voice_id: 'james', gender: 'male' },  // mysterious, quiet
    light: { voice_id: 'peter', gender: 'male' },  // strategic, sharp
    // Creative Guild — expressive voices
    luffy: { voice_id: 'nick', gender: 'male' },  // playful, free
    zoro: { voice_id: 'mark', gender: 'male' },  // serious, focused
    // Operations — professional voices
    gojo: { voice_id: 'collin', gender: 'male' },  // confident, smooth
    yuji: { voice_id: 'jesse', gender: 'male' },  // eager, energetic
    levi: { voice_id: 'charles', gender: 'male' },  // stern, precise
    // Automation Bots — distinct voices
    frieza: { voice_id: 'robert', gender: 'male' },  // cold, commanding
    cell: { voice_id: 'douglas', gender: 'male' },  // calculated, methodical
    buu: { voice_id: 'jacob', gender: 'male' },  // cheerful, bouncy
};

let currentAudio = null;
let _isSpeaking = false;

/**
 * Speak text as a specific agent character using Speechify API
 * @param {string} text - text to speak
 * @param {string} agentId - agent id for voice profile
 * @returns {Promise<void>}
 */
export async function speak(text, agentId = 'goku') {
    // Stop any currently playing audio
    stopSpeaking();

    const profile = VOICE_PROFILES[agentId] || VOICE_PROFILES.goku;

    // Truncate very long text to avoid excessive API usage
    const truncated = text.length > 500 ? text.substring(0, 500) + '...' : text;

    try {
        _isSpeaking = true;

        const res = await fetch(`${SPEECHIFY_BASE}/v1/audio/speech`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SPEECHIFY_API_KEY}`,
            },
            body: JSON.stringify({
                input: truncated,
                voice_id: profile.voice_id,
                audio_format: 'mp3',
            }),
        });

        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            console.warn('Speechify API error:', res.status, errData);
            // Fallback to browser TTS
            return fallbackSpeak(text, agentId);
        }

        const data = await res.json();

        if (data.audio_data) {
            // audio_data is base64-encoded MP3
            const audioBlob = base64ToBlob(data.audio_data, 'audio/mpeg');
            const audioUrl = URL.createObjectURL(audioBlob);

            return new Promise((resolve) => {
                currentAudio = new Audio(audioUrl);
                currentAudio.onended = () => {
                    _isSpeaking = false;
                    currentAudio = null;
                    URL.revokeObjectURL(audioUrl);
                    resolve();
                };
                currentAudio.onerror = () => {
                    _isSpeaking = false;
                    currentAudio = null;
                    URL.revokeObjectURL(audioUrl);
                    resolve();
                };
                currentAudio.play().catch(() => {
                    _isSpeaking = false;
                    resolve();
                });
            });
        } else {
            console.warn('No audio_data in Speechify response');
            _isSpeaking = false;
            return fallbackSpeak(text, agentId);
        }
    } catch (err) {
        console.warn('Speechify API failed, falling back to browser TTS:', err.message);
        _isSpeaking = false;
        return fallbackSpeak(text, agentId);
    }
}

/** Convert base64 string to Blob */
function base64ToBlob(base64, mimeType) {
    const byteChars = atob(base64);
    const byteNumbers = new Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) {
        byteNumbers[i] = byteChars.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
}

/** Stop all speech — both Speechify audio and browser TTS */
export function stopSpeaking() {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
    }
    _isSpeaking = false;
    if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
}

/** Check if currently speaking */
export function isSpeaking() {
    return _isSpeaking || (typeof speechSynthesis !== 'undefined' && speechSynthesis.speaking);
}

// ============================================
// FALLBACK: Browser Web Speech API
// Used when Speechify API is unavailable
// ============================================

const FALLBACK_PROFILES = {
    goku: { pitch: 0.9, rate: 1.1 },
    vegeta: { pitch: 0.7, rate: 1.0 },
    piccolo: { pitch: 0.5, rate: 0.85 },
    tanjiro: { pitch: 1.1, rate: 1.0 },
    naruto: { pitch: 1.3, rate: 1.2 },
    sasuke: { pitch: 0.8, rate: 0.9 },
    sakura: { pitch: 1.5, rate: 1.1 },
    kakashi: { pitch: 0.9, rate: 0.85 },
    itachi: { pitch: 0.6, rate: 0.8 },
    light: { pitch: 1.0, rate: 0.95 },
    luffy: { pitch: 1.4, rate: 1.25 },
    zoro: { pitch: 0.7, rate: 0.9 },
    gojo: { pitch: 1.1, rate: 1.05 },
    yuji: { pitch: 1.2, rate: 1.15 },
    levi: { pitch: 0.6, rate: 0.85 },
    frieza: { pitch: 1.6, rate: 0.9 },
    cell: { pitch: 0.8, rate: 0.95 },
    buu: { pitch: 1.8, rate: 1.1 },
};

function fallbackSpeak(text, agentId) {
    return new Promise((resolve) => {
        if (typeof speechSynthesis === 'undefined') { resolve(); return; }
        speechSynthesis.cancel();

        _isSpeaking = true;
        const profile = FALLBACK_PROFILES[agentId] || { pitch: 1, rate: 1 };
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.pitch = profile.pitch;
        utterance.rate = profile.rate;
        utterance.volume = 1;
        utterance.onend = () => { _isSpeaking = false; resolve(); };
        utterance.onerror = () => { _isSpeaking = false; resolve(); };
        speechSynthesis.speak(utterance);
    });
}

// ============================================
// SPEECH RECOGNITION (unchanged)
// ============================================

/**
 * Listen for voice input via SpeechRecognition
 * @param {function} onResult - callback with transcript text
 * @param {function} onEnd - callback on end
 * @returns {object|null} recognition instance (call .stop() to end)
 */
export function startListening(onResult, onEnd = null) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
        console.warn('SpeechRecognition not supported');
        return null;
    }

    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
        }
        const isFinal = event.results[event.results.length - 1].isFinal;
        onResult(transcript, isFinal);
    };

    recognition.onend = () => { if (onEnd) onEnd(); };
    recognition.onerror = (e) => { console.warn('Speech error:', e.error); if (onEnd) onEnd(); };
    recognition.start();
    return recognition;
}
