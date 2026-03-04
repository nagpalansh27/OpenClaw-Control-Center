/* ============================================
   C3 - OPENROUTER CHAT SERVICE
   Send messages to agents via OpenRouter free models
   ============================================ */

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';
let OPENROUTER_KEY = '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';

// Fallback chain - if primary model fails, try alternatives
const FALLBACK_MODELS = [
    'stepfun/step-3.5-flash:free',
    'z-ai/glm-4.5-air:free',
    'nvidia/nemotron-3-nano-30b-a3b:free',
];

export function setOpenRouterKey(key) { OPENROUTER_KEY = key; }
export function getOpenRouterKey() { return OPENROUTER_KEY; }

// Agent personality prompts
function buildSystemPrompt(agent) {
    return `You are ${agent.name} ${agent.emoji}, the ${agent.role} of C3.
Your division: ${agent.division}. Your anime: ${agent.anime}.
Your power: "${agent.power}"

PERSONALITY RULES:
- Stay in character as ${agent.name} from ${agent.anime}
- Be concise (2-4 sentences max)
- Reference your anime personality naturally
- Focus on your domain: ${agent.role}
- Use your emoji ${agent.emoji} occasionally
- Be helpful, specific, and action-oriented
- You're talking to Ansh, the CEO/CTO of C3`;
}

async function callOpenRouter(model, messages, stream = false) {
    const headers = {
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'C3 - Control Centre',
    };
    if (OPENROUTER_KEY) headers['Authorization'] = `Bearer ${OPENROUTER_KEY}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
        method: 'POST',
        headers,
        signal: controller.signal,
        body: JSON.stringify({ model, messages, stream, max_tokens: 512 }),
    });
    clearTimeout(timeout);

    if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error?.message || `OpenRouter ${res.status}`);
    }
    return res;
}

/**
 * Send a message to an agent via OpenRouter with auto-fallback
 */
export async function chatWithAgent(agent, userMessage, history = [], onChunk = null) {
    const primaryModel = agent.model || 'stepfun/step-3.5-flash:free';
    const messages = [
        { role: 'system', content: buildSystemPrompt(agent) },
        ...history.slice(-6),
        { role: 'user', content: userMessage },
    ];

    // Build model attempt order: primary first, then fallbacks
    const modelsToTry = [primaryModel, ...FALLBACK_MODELS.filter(m => m !== primaryModel)];

    for (const model of modelsToTry) {
        try {
            const res = await callOpenRouter(model, messages, !!onChunk);

            if (onChunk) {
                // SSE streaming
                const reader = res.body.getReader();
                const decoder = new TextDecoder();
                let fullText = '';
                let buffer = '';

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';
                    for (const line of lines) {
                        if (!line.startsWith('data: ')) continue;
                        const data = line.slice(6).trim();
                        if (data === '[DONE]') continue;
                        try {
                            const obj = JSON.parse(data);
                            const delta = obj.choices?.[0]?.delta?.content || '';
                            if (delta) { fullText += delta; onChunk(delta, fullText); }
                        } catch { }
                    }
                }
                return fullText || 'No response';
            } else {
                const data = await res.json();
                return data.choices?.[0]?.message?.content || 'No response';
            }
        } catch (err) {
            console.warn(`Model ${model} failed: ${err.message}, trying fallback...`);
            continue; // Try next model
        }
    }

    return `⚠️ ${agent.name} couldn't respond - all models busy. Try again shortly.`;
}

/**
 * Quick one-shot (non-streaming)
 */
export async function quickAgentReply(agent, prompt) {
    return chatWithAgent(agent, prompt, [], null);
}
