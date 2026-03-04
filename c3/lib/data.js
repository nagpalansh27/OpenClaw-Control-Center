'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mzfeelpmkxomhttsgzcc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16ZmVlbHBta3hvbWh0dHNnemNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxNjY4MDcsImV4cCI6MjA4NDc0MjgwN30.ZzrO7Bhjss_STqXOKC66jMxIh-aBAOnWNZC3luNw6YM';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const DataContext = createContext(null);

// Default seed data setup omitted for brevity in snippet but fully integrated below
// Default Seed Data
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
];

export const DIVISIONS = [
    { id: 'core', name: 'Core Product', emoji: '🛡️', anime: 'Dragon Ball Z', color: 'var(--dbz)' },
    { id: 'growth', name: 'Growth Division', emoji: '⚔️', anime: 'Naruto', color: 'var(--naruto)' },
    { id: 'creative', name: 'Creative Guild', emoji: '🎨', anime: 'One Piece', color: 'var(--onepiece)' },
    { id: 'ops', name: 'Operations', emoji: '🔧', anime: 'Jujutsu Kaisen', color: 'var(--jjk)' },
    { id: 'bots', name: 'Automation Bots', emoji: '🤖', anime: 'Automation', color: 'var(--bots)' },
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

export function DataProvider({ children }) {
    const [agents, setAgents] = useState([]);
    const [tasks, setTasks] = useState({ p0: [], p1: [], p2: [] });
    const [comms, setComms] = useState([]);
    const [targets, setTargets] = useState([]);
    const [models, setModels] = useState([]);
    const [workspaces, setWorkspaces] = useState({});
    const [standups, setStandups] = useState([]);
    const [statusConfig, setStatusConfig] = useState(DEFAULT_STATUS_CONFIG);
    const [initialized, setInitialized] = useState(false);

    useEffect(() => {
        async function loadData() {
            // Agents
            let { data: agts } = await supabase.from('c3_agents').select('*');
            if (!agts || agts.length === 0) {
                await supabase.from('c3_agents').upsert(DEFAULT_AGENTS);
                agts = DEFAULT_AGENTS;
            }
            setAgents(agts);

            // Tasks
            let { data: tks } = await supabase.from('c3_tasks').select('*');
            if (!tks || tks.length === 0) {
                // Ensure defaults are written
                await supabase.from('c3_tasks').upsert(DEFAULT_TASKS);
                tks = DEFAULT_TASKS;
            }
            const groupedTasks = { p0: [], p1: [], p2: [] };
            for (const t of tks) {
                const k = (t.priority || 'P1').toLowerCase();
                if (!groupedTasks[k]) groupedTasks[k] = [];
                groupedTasks[k].push(t);
            }
            setTasks(groupedTasks);

            // Comms
            let { data: cms } = await supabase.from('c3_comms').select('*').order('created_at', { ascending: false });
            if (!cms || cms.length === 0) {
                await supabase.from('c3_comms').upsert(DEFAULT_COMMS);
                cms = DEFAULT_COMMS;
            }
            setComms(cms);

            // Targets
            let { data: tgts } = await supabase.from('c3_targets').select('*');
            if (!tgts || tgts.length === 0) {
                await supabase.from('c3_targets').upsert(DEFAULT_TARGETS);
                tgts = DEFAULT_TARGETS;
            }
            setTargets(tgts.map(t => ({ ...t, current: t.current_val ?? t.current ?? 0 })));

            // Models
            let { data: mdls } = await supabase.from('c3_models').select('*');
            if (!mdls || mdls.length === 0) {
                await supabase.from('c3_models').upsert(DEFAULT_MODELS);
                mdls = DEFAULT_MODELS;
            }
            setModels(mdls.map(m => ({ ...m, apiKey: m.api_key, baseUrl: m.base_url })));

            // Workspaces
            let { data: wss } = await supabase.from('c3_workspaces').select('*');
            if (!wss || wss.length === 0) {
                const defaults = agts.map(a => generateDefaultWorkspace(a));
                await supabase.from('c3_workspaces').upsert(defaults);
                wss = defaults;
            }
            const wsMap = {};
            for (const w of wss) wsMap[w.agent_id] = { soul: w.soul, identity: w.identity };
            setWorkspaces(wsMap);

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
            // Load standup messages for each
            for (const s of sus) {
                if (!s.messages) {
                    const { data: msgs } = await supabase.from('c3_standup_messages').select('*').eq('standup_id', s.id).order('created_at');
                    s.messages = msgs || [];
                }
            }
            setStandups(sus);

            // Config
            let { data: cfg } = await supabase.from('c3_config').select('*').eq('key', 'status');
            if (!cfg || cfg.length === 0) {
                await supabase.from('c3_config').upsert([{ key: 'status', value: DEFAULT_STATUS_CONFIG }]);
                setStatusConfig({ ...DEFAULT_STATUS_CONFIG });
            } else {
                setStatusConfig(cfg[0].value);
            }

            setInitialized(true);
        }

        loadData();
    }, []);

    const value = {
        initialized,
        agents, setAgents,
        tasks, setTasks,
        comms, setComms,
        targets, setTargets,
        models, setModels,
        workspaces, setWorkspaces,
        standups, setStandups,
        statusConfig, setStatusConfig,

        async addAgent(agent) {
            agent.id = agent.id || 'agent_' + Date.now();
            await supabase.from('c3_agents').upsert([agent]);
            setAgents(prev => [...prev, agent]);

            const ws = generateDefaultWorkspace(agent);
            await supabase.from('c3_workspaces').upsert([ws]);
            setWorkspaces(prev => ({ ...prev, [agent.id]: { soul: ws.soul, identity: ws.identity } }));
            return agent;
        },
        async updateAgent(id, updates) {
            await supabase.from('c3_agents').update(updates).eq('id', id);
            setAgents(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
        },
        async deleteAgent(id) {
            await supabase.from('c3_agents').delete().eq('id', id);
            await supabase.from('c3_workspaces').delete().eq('agent_id', id);
            setAgents(prev => prev.filter(a => a.id !== id));
            setWorkspaces(prev => {
                const newWs = { ...prev };
                delete newWs[id];
                return newWs;
            });
        },
        async updateWorkspace(agentId, field, content) {
            await supabase.from('c3_workspaces').upsert([{ agent_id: agentId, [field]: content, updated_at: new Date().toISOString() }]);
            setWorkspaces(prev => ({
                ...prev,
                [agentId]: { ...(prev[agentId] || {}), [field]: content }
            }));
        },
        async addTask(priority, task) {
            task.id = task.id || 'task_' + Date.now();
            task.priority = priority;
            await supabase.from('c3_tasks').upsert([task]);
            setTasks(prev => {
                const k = priority.toLowerCase();
                return { ...prev, [k]: [...(prev[k] || []), task] };
            });
        },
        async deleteTask(taskId) {
            await supabase.from('c3_tasks').delete().eq('id', taskId);
            setTasks(prev => ({
                p0: prev.p0.filter(t => t.id !== taskId),
                p1: prev.p1.filter(t => t.id !== taskId),
                p2: prev.p2.filter(t => t.id !== taskId),
            }));
        },
        async addComm(comm) {
            comm.id = comm.id || 'comm_' + Date.now();
            await supabase.from('c3_comms').upsert([comm]);
            setComms(prev => [comm, ...prev]);
        },
        async deleteComm(id) {
            await supabase.from('c3_comms').delete().eq('id', id);
            setComms(prev => prev.filter(c => c.id !== id));
        },
        async updateTarget(id, current, goal) {
            const updates = {};
            if (current !== undefined) updates.current_val = current;
            if (goal !== undefined) updates.goal = goal;
            await supabase.from('c3_targets').update(updates).eq('id', id);
            setTargets(prev => prev.map(t => t.id === id ? { ...t, current: current !== undefined ? current : t.current, goal: goal !== undefined ? goal : t.goal } : t));
        },
        async addModel(model) {
            model.id = model.id || 'model_' + Date.now();
            const row = { ...model, api_key: model.apiKey || model.api_key, base_url: model.baseUrl || model.base_url };
            delete row.apiKey; delete row.baseUrl;
            await supabase.from('c3_models').upsert([row]);
            setModels(prev => [...prev, { ...row, apiKey: row.api_key, baseUrl: row.base_url }]);
        },
        async updateModel(id, updates) {
            const row = { ...updates };
            if (row.apiKey) { row.api_key = row.apiKey; delete row.apiKey; }
            if (row.baseUrl) { row.base_url = row.baseUrl; delete row.baseUrl; }
            await supabase.from('c3_models').update(row).eq('id', id);
            setModels(prev => prev.map(m => m.id === id ? { ...m, ...updates, apiKey: row.api_key || m.apiKey, baseUrl: row.base_url || m.baseUrl } : m));
        },
        async deleteModel(id) {
            await supabase.from('c3_models').delete().eq('id', id);
            setModels(prev => prev.filter(m => m.id !== id));
        },
        async addStandup(standup) {
            standup.id = standup.id || 'su_' + Date.now();
            const { messages, ...row } = standup;
            await supabase.from('c3_standups').upsert([row]);
            const finalStandup = { ...standup, messages: messages || [] };
            setStandups(prev => [finalStandup, ...prev]);
        },
        async updateStatusConfig(updates) {
            const newConfig = { ...statusConfig, ...updates };
            await supabase.from('c3_config').upsert([{ key: 'status', value: newConfig, updated_at: new Date().toISOString() }]);
            setStatusConfig(newConfig);
        },
        async fetchOpenRouterStatus() {
            try {
                const res = await fetch('https://openrouter.ai/api/v1/models', { signal: AbortSignal.timeout(5000) });
                if (!res.ok) return { running: false, models: [] };
                const data = await res.json();
                const freeModels = (data.data || []).filter(m => m.id?.includes(':free')).slice(0, 20);
                return { running: true, models: freeModels.map(m => ({ name: m.id, context: m.context_length })) };
            } catch { return { running: false, models: [] }; }
        }
    };

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
}

export function useData() {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
}
