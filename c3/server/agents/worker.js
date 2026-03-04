const { getDB } = require('../db/sqlite');

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';
const OPENROUTER_KEY = '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';

const FALLBACK_MODELS = [
    'stepfun/step-3.5-flash:free',
    'z-ai/glm-4.5-air:free',
    'nvidia/nemotron-3-nano-30b-a3b:free',
];

const AGENTS = {
    claude: { name: 'Claude', emoji: '☠️', role: 'COO', model: 'stepfun/step-3.5-flash:free' },
    goku: { name: 'Goku', emoji: '🐉', role: 'Platform Architect', model: 'stepfun/step-3.5-flash:free' },
    naruto: { name: 'Naruto', emoji: '🍥', role: 'SEO Machine', model: 'stepfun/step-3.5-flash:free' },
    sasuke: { name: 'Sasuke', emoji: '⚡', role: 'Free Tools Builder', model: 'z-ai/glm-4.5-air:free' },
    sakura: { name: 'Sakura', emoji: '🌸', role: 'WhatsApp Growth', model: 'nvidia/nemotron-3-nano-30b-a3b:free' },
    kakashi: { name: 'Kakashi', emoji: '📖', role: 'Partnership Scout', model: 'z-ai/glm-4.5-air:free' },
    itachi: { name: 'Itachi', emoji: '🌙', role: 'B2B Sales Hunter', model: 'nvidia/nemotron-3-nano-30b-a3b:free' },
    light: { name: 'Light', emoji: '📓', role: 'Competitive Intel', model: 'stepfun/step-3.5-flash:free' },
    luffy: { name: 'Luffy', emoji: '🏴‍☠️', role: 'Brand Designer', model: 'z-ai/glm-4.5-air:free' },
    zoro: { name: 'Zoro', emoji: '⚔️', role: 'Copywriting', model: 'stepfun/step-3.5-flash:free' },
    gojo: { name: 'Gojo', emoji: '👁️', role: 'Customer Success', model: 'z-ai/glm-4.5-air:free' },
    yuji: { name: 'Yuji', emoji: '💪', role: 'Quality Assurance', model: 'nvidia/nemotron-3-nano-30b-a3b:free' },
    levi: { name: 'Levi', emoji: '🗡️', role: 'Code Reviewer', model: 'stepfun/step-3.5-flash:free' },
    vegeta: { name: 'Vegeta', emoji: '👑', role: 'Mobile Experience', model: 'z-ai/glm-4.5-air:free' },
    piccolo: { name: 'Piccolo', emoji: '🧠', role: 'Dashboard Dev', model: 'nvidia/nemotron-3-nano-30b-a3b:free' },
    tanjiro: { name: 'Tanjiro', emoji: '🔥', role: 'Onboarding Flow', model: 'stepfun/step-3.5-flash:free' },
    frieza: { name: 'Frieza', emoji: '❄️', role: 'Reminder Bot', model: 'nvidia/nemotron-3-nano-30b-a3b:free' },
    cell: { name: 'Cell', emoji: '🧬', role: 'Review Collector', model: 'z-ai/glm-4.5-air:free' },
    buu: { name: 'Buu', emoji: '🍬', role: 'Analytics Reporter', model: 'nvidia/nemotron-3-nano-30b-a3b:free' },
};

async function callOpenRouter(model, messages) {
    const modelsToTry = [model, ...FALLBACK_MODELS.filter(m => m !== model)];

    for (const m of modelsToTry) {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 45000);

            const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OPENROUTER_KEY}`,
                    'X-Title': 'C3 - Control Centre',
                },
                signal: controller.signal,
                body: JSON.stringify({ model: m, messages, max_tokens: 1024 }),
            });
            clearTimeout(timeout);

            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            return data.choices?.[0]?.message?.content || 'No response';
        } catch (err) {
            console.warn(`Model ${m} failed: ${err.message}`);
            continue;
        }
    }
    return null;
}

async function runAgentTask(agentId, taskDescription) {
    const agent = AGENTS[agentId];
    if (!agent) throw new Error(`Unknown agent: ${agentId}`);

    const db = getDB();

    // Get agent memory (last 5 interactions)
    const memory = db.prepare('SELECT role, content FROM agent_memory WHERE agent_id = ? ORDER BY created_at DESC LIMIT 5').all(agentId);

    const messages = [
        {
            role: 'system',
            content: `You are ${agent.name} ${agent.emoji}, the ${agent.role} of C3.
You work autonomously. Be specific, actionable, and produce real deliverables.
When generating content, produce COMPLETE, READY-TO-USE output.
Focus on your domain: ${agent.role}.
Current date: ${new Date().toISOString().split('T')[0]}`
        },
        ...memory.reverse().map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: taskDescription }
    ];

    console.log(`🤖 ${agent.emoji} ${agent.name} working on: ${taskDescription.substring(0, 60)}...`);

    const result = await callOpenRouter(agent.model, messages);

    if (result) {
        // Save to memory
        db.prepare('INSERT INTO agent_memory (agent_id, role, content, context) VALUES (?, ?, ?, ?)').run(agentId, 'user', taskDescription, 'task');
        db.prepare('INSERT INTO agent_memory (agent_id, role, content, context) VALUES (?, ?, ?, ?)').run(agentId, 'assistant', result, 'response');

        // Save output
        db.prepare('INSERT INTO outputs (agent_id, type, title, content) VALUES (?, ?, ?, ?)').run(agentId, 'task_output', taskDescription.substring(0, 100), result);

        // Track metric
        db.prepare('INSERT INTO metrics (agent_id, metric_type, value) VALUES (?, ?, ?)').run(agentId, 'task_completed', 1);

        console.log(`✅ ${agent.name} completed task (${result.length} chars)`);
    } else {
        console.log(`❌ ${agent.name} failed task`);
        db.prepare('INSERT INTO metrics (agent_id, metric_type, value) VALUES (?, ?, ?)').run(agentId, 'task_failed', 1);
    }

    return result;
}

module.exports = { runAgentTask, AGENTS, callOpenRouter };
