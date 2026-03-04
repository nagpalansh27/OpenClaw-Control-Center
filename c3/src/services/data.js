/* ============================================
   C3 — DATA LAYER WITH SUPABASE PERSISTENCE
   v3: All data stored in Supabase cloud
   ============================================ */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mzfeelpmkxomhttsgzcc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16ZmVlbHBta3hvbWh0dHNnemNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxNjY4MDcsImV4cCI6MjA4NDc0MjgwN30.ZzrO7Bhjss_STqXOKC66jMxIh-aBAOnWNZC3luNw6YM';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ---- DEFAULT DATA (used for seeding) ----

const DEFAULT_AGENTS = [
    { id: 'goku', name: 'Goku', emoji: '🐉', role: 'Platform Architect', division: 'core', anime: 'Dragon Ball Z', model: 'stepfun/step-3.5-flash:free', power: 'Building infinite-scale foundation', status: 'online' },
    { id: 'vegeta', name: 'Vegeta', emoji: '👑', role: 'Mobile Experience', division: 'core', anime: 'Dragon Ball Z', model: 'z-ai/glm-4.5-air:free', power: 'Flutter prince, beyond limits', status: 'online' },
    { id: 'piccolo', name: 'Piccolo', emoji: '🧠', role: 'Dashboard Dev', division: 'core', anime: 'Dragon Ball Z', model: 'nvidia/nemotron-3-nano-30b-a3b:free', power: 'Strategic analytics master', status: 'online' },
    { id: 'tanjiro', name: 'Tanjiro', emoji: '🔥', role: 'Onboarding Flow', division: 'core', anime: 'Demon Slayer', model: 'stepfun/step-3.5-flash:free', power: 'Kind-hearted user guidance', status: 'online' },
    { id: 'naruto', name: 'Naruto', emoji: '🍥', role: 'SEO Machine', division: 'growth', anime: 'Naruto', model: 'stepfun/step-3.5-flash:free', power: 'Never gives up on rankings', status: 'online' },
    { id: 'sasuke', name: 'Sasuke', emoji: '⚡', role: 'Free Tools Builder', division: 'growth', anime: 'Naruto', model: 'z-ai/glm-4.5-air:free', power: 'Precision engineering, dark magic', status: 'online' },
    { id: 'sakura', name: 'Sakura', emoji: '🌸', role: 'WhatsApp Growth', division: 'growth', anime: 'Naruto', model: 'nvidia/nemotron-3-nano-30b-a3b:free', power: 'Healing churn, boosting engagement', status: 'online' },
    { id: 'kakashi', name: 'Kakashi', emoji: '📖', role: 'Partnership Scout', division: 'growth', anime: 'Naruto', model: 'z-ai/glm-4.5-air:free', power: '10,000 garage connections', status: 'online' },
    { id: 'itachi', name: 'Itachi', emoji: '🌙', role: 'B2B Sales Hunter', division: 'growth', anime: 'Naruto', model: 'nvidia/nemotron-3-nano-30b-a3b:free', power: 'Silent, deadly, effective', status: 'online' },
    { id: 'light', name: 'Light', emoji: '📓', role: 'Competitive Intel', division: 'growth', anime: 'Death Note', model: 'stepfun/step-3.5-flash:free', power: 'Calculated strategic analysis', status: 'online' },
    { id: 'luffy', name: 'Luffy', emoji: '🏴‍☠️', role: 'Brand Designer', division: 'creative', anime: 'One Piece', model: 'z-ai/glm-4.5-air:free', power: 'Freedom to create', status: 'online' },
    { id: 'zoro', name: 'Zoro', emoji: '⚔️', role: 'Copywriting', division: 'creative', anime: 'One Piece', model: 'stepfun/step-3.5-flash:free', power: 'Three swords of persuasion', status: 'online' },
    { id: 'gojo', name: 'Gojo', emoji: '👁️', role: 'Customer Success', division: 'ops', anime: 'Jujutsu Kaisen', model: 'z-ai/glm-4.5-air:free', power: 'Infinite patience, domain expansion', status: 'online' },
    { id: 'yuji', name: 'Yuji', emoji: '💪', role: 'Quality Assurance', division: 'ops', anime: 'Jujutsu Kaisen', model: 'nvidia/nemotron-3-nano-30b-a3b:free', power: 'Black flash of testing', status: 'online' },
    { id: 'levi', name: 'Levi', emoji: '🗡️', role: 'Code Reviewer', division: 'ops', anime: 'Attack on Titan', model: 'stepfun/step-3.5-flash:free', power: 'Ruthless code quality', status: 'online' },
    { id: 'frieza', name: 'Frieza', emoji: '❄️', role: 'Reminder Bot', division: 'bots', anime: 'Automation', model: 'nvidia/nemotron-3-nano-30b-a3b:free', power: 'Scheduled precision', status: 'online' },
    { id: 'cell', name: 'Cell', emoji: '🧬', role: 'Review Collector', division: 'bots', anime: 'Automation', model: 'z-ai/glm-4.5-air:free', power: 'Perfect absorption of feedback', status: 'online' },
    { id: 'buu', name: 'Buu', emoji: '🍬', role: 'Analytics Reporter', division: 'bots', anime: 'Automation', model: 'nvidia/nemotron-3-nano-30b-a3b:free', power: 'Sweet data insights', status: 'online' },
    { id: 'claude', name: 'Claude', emoji: '☠️', role: 'COO — Task Delegator', division: 'leadership', anime: 'C3', model: 'stepfun/step-3.5-flash:free', power: 'Orchestration, delegation, strategy', status: 'online' },
];

export const DIVISIONS = [
    { id: 'core', name: 'Core Product', emoji: '🛡️', anime: 'Dragon Ball Z', color: 'var(--dbz)' },
    { id: 'growth', name: 'Growth Division', emoji: '⚔️', anime: 'Naruto', color: 'var(--naruto)' },
    { id: 'creative', name: 'Creative Guild', emoji: '🎨', anime: 'One Piece', color: 'var(--onepiece)' },
    { id: 'ops', name: 'Operations', emoji: '🔧', anime: 'Jujutsu Kaisen', color: 'var(--jjk)' },
    { id: 'bots', name: 'Automation Bots', emoji: '🤖', anime: 'Automation', color: 'var(--bots)' },
    { id: 'leadership', name: 'Leadership', emoji: '👔', anime: 'C3', color: 'var(--amber)' },
];

const DEFAULT_MODELS = [
    { id: 'stepfun/step-3.5-flash:free', name: 'Step 3.5 Flash (Free)', provider: 'OpenRouter', api_key: '', base_url: 'https://openrouter.ai/api/v1', status: 'active', context: '256K', reasoning: false },
    { id: 'z-ai/glm-4.5-air:free', name: 'GLM 4.5 Air (Free)', provider: 'OpenRouter', api_key: '', base_url: 'https://openrouter.ai/api/v1', status: 'active', context: '131K', reasoning: false },
    { id: 'nvidia/nemotron-3-nano-30b-a3b:free', name: 'Nemotron 3 Nano (Free)', provider: 'OpenRouter', api_key: '', base_url: 'https://openrouter.ai/api/v1', status: 'active', context: '256K', reasoning: false },
];

const DEFAULT_COMMS = [
    { id: 'c1', agent: 'Goku', role: 'Platform Architect', division: 'core', time: '13:05', body: 'Supabase schema migration for the club Phase 1 ready. Real-time subscriptions configured for service bookings.' },
    { id: 'c2', agent: 'Naruto', role: 'SEO Machine', division: 'growth', time: '12:58', body: 'Published 12 new pages for long-tail keywords. Backlink outreach to 50 automotive blogs initiated. Believe it! 🍥' },
    { id: 'c3', agent: 'Gojo', role: 'Customer Success', division: 'ops', time: '12:45', body: 'Handled 23 customer inquiries via WhatsApp. Average response time: 14 seconds. Domain expansion activated. ∞' },
    { id: 'c4', agent: 'Sasuke', role: 'Free Tools Builder', division: 'growth', time: '12:30', body: 'Deployed "Vehicle Service Cost Calculator" on getcarhelp.com. Already indexing in GSC.' },
    { id: 'c5', agent: 'Luffy', role: 'Brand Designer', division: 'creative', time: '12:15', body: 'New brand kit ready: logo variations, social templates, garage partner materials. Gomu Gomu no Design! 🏴‍☠️' },
    { id: 'c6', agent: 'Frieza', role: 'Reminder Bot', division: 'bots', time: '12:00', body: '[CRON] Sent 47 service reminders via WhatsApp. Open rate: 89%. 3 bookings confirmed.' },
    { id: 'c7', agent: 'System', role: 'C3 Core', division: 'system', time: '11:00', body: 'All systems operational. OpenRouter: connected ✓ | Supabase: synced ✓ | 6 free models loaded ✓' },
];

const DEFAULT_TARGETS = [
    { id: 'users', label: 'Active Users', current_val: 2340, goal: 10000, color: 'amber', unit: '', format: '' },
    { id: 'mrr', label: 'Monthly Revenue (MRR)', current_val: 320000, goal: 700000, color: 'green', unit: '₹', format: 'lakh' },
    { id: 'garages', label: 'Partner Garages', current_val: 18, goal: 50, color: 'cyan', unit: '', format: '' },
    { id: 'pods', label: 'GetUniverse Pods Deployed', current_val: 0, goal: 6, color: 'purple', unit: '', format: '' },
];

const DEFAULT_TASKS = [
    { id: 't1', title: 'Launch the club MVP', agent: 'Goku', priority: 'P0' },
    { id: 't2', title: 'WhatsApp Business API integration', agent: 'Sakura', priority: 'P0' },
    { id: 't3', title: '10K active customers target', agent: 'Naruto', priority: 'P0' },
    { id: 't4', title: 'Fleet telematics dashboard', agent: 'Piccolo', priority: 'P1' },
    { id: 't5', title: 'Partner garage onboarding flow', agent: 'Kakashi', priority: 'P1' },
    { id: 't6', title: 'B2B sales pipeline setup', agent: 'Itachi', priority: 'P1' },
    { id: 't7', title: 'Brand identity refresh', agent: 'Luffy', priority: 'P1' },
    { id: 't8', title: 'AI predictive maintenance', agent: 'Vegeta', priority: 'P2' },
    { id: 't9', title: 'Community content strategy', agent: 'Zoro', priority: 'P2' },
    { id: 't10', title: 'Analytics reporter upgrade', agent: 'Buu', priority: 'P2' },
];

const DEFAULT_STANDUPS = [
    {
        id: 'su1', title: 'Morning Standup: Q1 Growth Sprint', date: '2026-03-03 09:00 IST',
        participants: ['Goku', 'Naruto', 'Sakura', 'Piccolo', 'Gojo'],
        messages: [
            { agent: 'Goku', role: 'Platform Architect', body: 'Schema migration is done. We need credentials to deploy.' },
            { agent: 'Naruto', role: 'SEO Machine', body: 'SEO pages are live. Ranking #3 for "car service nashik".' },
            { agent: 'Sakura', role: 'WhatsApp Growth', body: 'WhatsApp flows converting at 12%. Best channel right now.' },
        ],
    },
];

const DEFAULT_STATUS_CONFIG = {
    gateway: { port: 18789, mode: 'local', auth: 'token' },
    channels: { telegram: true, discord: false },
    primaryModel: 'qwen/qwen3-coder:free',
    version: '2026.2.13',
};

function generateDefaultWorkspace(agent) {
    return {
        agent_id: agent.id,
        soul: `# SOUL.md — ${agent.name}\n\nYou are ${agent.name} ${agent.emoji}, the ${agent.role} of C3.\n\n## Core Mission\n${agent.power}\n\n## Personality\n- Division: ${agent.division}\n- Anime Origin: ${agent.anime}\n- Style: Direct, focused, results-driven\n\n## Capabilities\n- Primary model: ${agent.model}\n- Specialization: ${agent.role}\n- Status: ${agent.status}\n`,
        identity: `# IDENTITY.md — ${agent.name}\n\n- **Name:** ${agent.name}\n- **Emoji:** ${agent.emoji}\n- **Role:** ${agent.role}\n- **Division:** ${agent.division}\n- **Model:** ${agent.model}\n- **Anime:** ${agent.anime}\n- **Tagline:** "${agent.power}"\n`,
    };
}

// ---- LOCAL CACHE (for sync access in views) ----
let _agents = [];
let _tasks = [];
let _comms = [];
let _targets = [];
let _models = [];
let _workspaces = {};
let _standups = [];
let _statusConfig = { ...DEFAULT_STATUS_CONFIG };
let _initialized = false;

// ---- INIT: Load from Supabase, seed if empty ----
export async function initData() {
    if (_initialized) return;

    // Agents
    let { data: agts } = await supabase.from('c3_agents').select('*');
    if (!agts || agts.length === 0) {
        await supabase.from('c3_agents').upsert(DEFAULT_AGENTS);
        agts = DEFAULT_AGENTS;
    }
    // Ensure Claude (COO) exists — may be missing if DB was seeded before Claude was added
    const claudeAgent = DEFAULT_AGENTS.find(a => a.id === 'claude');
    if (claudeAgent && !agts.find(a => a.id === 'claude')) {
        await supabase.from('c3_agents').upsert([claudeAgent]);
        agts.push(claudeAgent);
        // Also create workspace for Claude
        const ws = generateDefaultWorkspace(claudeAgent);
        await supabase.from('c3_workspaces').upsert([ws]);
    }
    _agents = agts;

    // Tasks
    let { data: tks } = await supabase.from('c3_tasks').select('*');
    if (!tks || tks.length === 0) {
        await supabase.from('c3_tasks').upsert(DEFAULT_TASKS);
        tks = DEFAULT_TASKS;
    }
    _tasks = tks;

    // Comms
    let { data: cms } = await supabase.from('c3_comms').select('*').order('created_at', { ascending: false });
    if (!cms || cms.length === 0) {
        await supabase.from('c3_comms').upsert(DEFAULT_COMMS);
        cms = DEFAULT_COMMS;
    }
    _comms = cms;

    // Targets
    let { data: tgts } = await supabase.from('c3_targets').select('*');
    if (!tgts || tgts.length === 0) {
        await supabase.from('c3_targets').upsert(DEFAULT_TARGETS);
        tgts = DEFAULT_TARGETS;
    }
    _targets = tgts;

    // Models
    let { data: mdls } = await supabase.from('c3_models').select('*');
    if (!mdls || mdls.length === 0) {
        await supabase.from('c3_models').upsert(DEFAULT_MODELS);
        mdls = DEFAULT_MODELS;
    }
    _models = mdls;

    // Workspaces
    let { data: wss } = await supabase.from('c3_workspaces').select('*');
    if (!wss || wss.length === 0) {
        const defaults = _agents.map(a => generateDefaultWorkspace(a));
        await supabase.from('c3_workspaces').upsert(defaults);
        wss = defaults;
    }
    _workspaces = {};
    for (const w of wss) _workspaces[w.agent_id] = { soul: w.soul, identity: w.identity };

    // Standups
    let { data: sus } = await supabase.from('c3_standups').select('*').order('created_at', { ascending: false });
    if (!sus || sus.length === 0) {
        for (const s of DEFAULT_STANDUPS) {
            const { messages, ...standup } = s;
            await supabase.from('c3_standups').upsert([standup]);
            if (messages?.length) {
                await supabase.from('c3_standup_messages').insert(messages.map(m => ({ ...m, standup_id: s.id })));
            }
        }
        sus = DEFAULT_STANDUPS;
    }
    _standups = sus;

    // Load standup messages for each
    for (const s of _standups) {
        if (!s.messages) {
            const { data: msgs } = await supabase.from('c3_standup_messages').select('*').eq('standup_id', s.id).order('created_at');
            s.messages = msgs || [];
        }
    }

    // Config
    let { data: cfg } = await supabase.from('c3_config').select('*').eq('key', 'status');
    if (!cfg || cfg.length === 0) {
        await supabase.from('c3_config').upsert([{ key: 'status', value: DEFAULT_STATUS_CONFIG }]);
        _statusConfig = { ...DEFAULT_STATUS_CONFIG };
    } else {
        _statusConfig = cfg[0].value;
    }

    _initialized = true;
}

// ---- SYNC GETTERS (read from local cache) ----
export function getAgents() { return _agents; }
export function getTasks() {
    const grouped = { p0: [], p1: [], p2: [] };
    for (const t of _tasks) {
        const k = (t.priority || 'P1').toLowerCase();
        if (!grouped[k]) grouped[k] = [];
        grouped[k].push(t);
    }
    return grouped;
}
export function getComms() { return _comms; }
export function getTargets() {
    return _targets.map(t => ({ ...t, current: t.current_val ?? t.current ?? 0 }));
}
export function getModels() {
    return _models.map(m => ({ ...m, apiKey: m.api_key, baseUrl: m.base_url }));
}
export function getWorkspace(agentId) { return _workspaces[agentId] || null; }
export function getStandups() { return _standups; }
export function getStatusConfig() { return _statusConfig; }

// ---- AGENTS CRUD ----
export async function addAgent(agent) {
    agent.id = agent.id || 'agent_' + Date.now();
    await supabase.from('c3_agents').upsert([agent]);
    _agents.push(agent);
    const ws = generateDefaultWorkspace(agent);
    await supabase.from('c3_workspaces').upsert([ws]);
    _workspaces[agent.id] = { soul: ws.soul, identity: ws.identity };
    return agent;
}
export async function updateAgent(id, updates) {
    await supabase.from('c3_agents').update(updates).eq('id', id);
    const idx = _agents.findIndex(a => a.id === id);
    if (idx >= 0) Object.assign(_agents[idx], updates);
}
export async function deleteAgent(id) {
    await supabase.from('c3_agents').delete().eq('id', id);
    await supabase.from('c3_workspaces').delete().eq('agent_id', id);
    _agents = _agents.filter(a => a.id !== id);
    delete _workspaces[id];
}

// ---- WORKSPACE CRUD ----
export async function updateWorkspace(agentId, field, content) {
    if (!_workspaces[agentId]) _workspaces[agentId] = {};
    _workspaces[agentId][field] = content;
    await supabase.from('c3_workspaces').upsert([{ agent_id: agentId, [field]: content, updated_at: new Date().toISOString() }]);
}

// ---- TASKS CRUD ----
export async function addTask(priority, task) {
    task.id = task.id || 'task_' + Date.now();
    task.priority = priority;
    await supabase.from('c3_tasks').upsert([task]);
    _tasks.push(task);
}
export async function deleteTask(taskId) {
    await supabase.from('c3_tasks').delete().eq('id', taskId);
    _tasks = _tasks.filter(t => t.id !== taskId);
}

// ---- COMMS CRUD ----
export async function addComm(comm) {
    comm.id = comm.id || 'comm_' + Date.now();
    await supabase.from('c3_comms').upsert([comm]);
    _comms.unshift(comm);
}
export async function deleteComm(id) {
    await supabase.from('c3_comms').delete().eq('id', id);
    _comms = _comms.filter(c => c.id !== id);
}

// ---- TARGETS CRUD ----
export async function updateTarget(id, current, goal) {
    const updates = {};
    if (current !== undefined) updates.current_val = current;
    if (goal !== undefined) updates.goal = goal;
    await supabase.from('c3_targets').update(updates).eq('id', id);
    const t = _targets.find(t => t.id === id);
    if (t) { if (current !== undefined) t.current_val = current; if (goal !== undefined) t.goal = goal; }
}

// ---- MODELS CRUD ----
export async function addModel(model) {
    model.id = model.id || 'model_' + Date.now();
    const row = { ...model, api_key: model.apiKey || model.api_key, base_url: model.baseUrl || model.base_url };
    delete row.apiKey; delete row.baseUrl;
    await supabase.from('c3_models').upsert([row]);
    _models.push(row);
}
export async function updateModel(id, updates) {
    const row = { ...updates };
    if (row.apiKey) { row.api_key = row.apiKey; delete row.apiKey; }
    if (row.baseUrl) { row.base_url = row.baseUrl; delete row.baseUrl; }
    await supabase.from('c3_models').update(row).eq('id', id);
    const m = _models.find(m => m.id === id);
    if (m) Object.assign(m, row);
}
export async function deleteModel(id) {
    await supabase.from('c3_models').delete().eq('id', id);
    _models = _models.filter(m => m.id !== id);
}

// ---- STANDUPS CRUD ----
export async function addStandup(standup) {
    standup.id = standup.id || 'su_' + Date.now();
    const { messages, ...row } = standup;
    await supabase.from('c3_standups').upsert([row]);
    standup.messages = messages || [];
    _standups.unshift(standup);
}
export async function addStandupMessage(standupId, message) {
    await supabase.from('c3_standup_messages').insert([{ ...message, standup_id: standupId }]);
    const su = _standups.find(s => s.id === standupId);
    if (su) { if (!su.messages) su.messages = []; su.messages.push(message); }
}

// ---- CONFIG CRUD ----
export async function updateStatusConfig(updates) {
    Object.assign(_statusConfig, updates);
    await supabase.from('c3_config').upsert([{ key: 'status', value: _statusConfig, updated_at: new Date().toISOString() }]);
}

// ---- RESET ----
export async function resetAllData() {
    await supabase.from('c3_standup_messages').delete().neq('id', 0);
    await supabase.from('c3_standups').delete().neq('id', '');
    await supabase.from('c3_workspaces').delete().neq('agent_id', '');
    await supabase.from('c3_comms').delete().neq('id', '');
    await supabase.from('c3_tasks').delete().neq('id', '');
    await supabase.from('c3_targets').delete().neq('id', '');
    await supabase.from('c3_models').delete().neq('id', '');
    await supabase.from('c3_agents').delete().neq('id', '');
    await supabase.from('c3_config').delete().neq('key', '');
    _initialized = false;
    await initData();
}

// ---- OPENROUTER STATUS ----
export async function fetchOpenRouterStatus() {
    try {
        const res = await fetch('https://openrouter.ai/api/v1/models', { signal: AbortSignal.timeout(5000) });
        if (!res.ok) return { running: false, models: [] };
        const data = await res.json();
        const freeModels = (data.data || []).filter(m => m.id?.includes(':free')).slice(0, 20);
        return { running: true, models: freeModels.map(m => ({ name: m.id, context: m.context_length })) };
    } catch { return { running: false, models: [] }; }
}

// ---- OPENCLAW (keep for Electron) ----
export async function readOpenClawConfig() {
    if (!window.openclaw) return null;
    const r = await window.openclaw.readFile('openclaw.json');
    if (r.ok) try { return JSON.parse(r.content); } catch { return null; }
    return null;
}
export async function readWorkspaceFile(filename) {
    if (!window.openclaw) return null;
    const r = await window.openclaw.readFile(`workspace/${filename}`);
    return r.ok ? r.content : null;
}
export async function readWorkspaceDir() {
    if (!window.openclaw) return [];
    const r = await window.openclaw.readDir('workspace');
    return r.ok ? r.entries.filter(e => !e.isDir && e.name.endsWith('.md')) : [];
}
