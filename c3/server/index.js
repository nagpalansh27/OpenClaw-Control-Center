const express = require('express');
const path = require('path');
const { initDB, getDB } = require('./db/sqlite');
const { startScheduler } = require('./agents/scheduler');
const { runAgentTask, AGENTS } = require('./agents/worker');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Serve static files from public/
app.use(express.static(path.join(__dirname, '../public')));

// ========== API ROUTES ==========

// System status
app.get('/api/status', (req, res) => {
    const db = getDB();
    const taskCount = db.prepare('SELECT COUNT(*) as count FROM tasks').get();
    const outputCount = db.prepare('SELECT COUNT(*) as count FROM outputs').get();
    const recentTasks = db.prepare('SELECT agent_id, title, status, created_at FROM tasks ORDER BY created_at DESC LIMIT 5').all();
    res.json({
        uptime: Math.floor(process.uptime()),
        tasks: taskCount.count,
        outputs: outputCount.count,
        recentTasks,
        agents: Object.keys(AGENTS).length,
        memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
    });
});

// Get all agents
app.get('/api/agents', (req, res) => {
    res.json(AGENTS);
});

// Get tasks
app.get('/api/tasks', (req, res) => {
    const db = getDB();
    const tasks = db.prepare('SELECT * FROM tasks ORDER BY created_at DESC LIMIT 50').all();
    res.json(tasks);
});

// Get outputs
app.get('/api/outputs', (req, res) => {
    const db = getDB();
    const outputs = db.prepare('SELECT * FROM outputs ORDER BY created_at DESC LIMIT 50').all();
    res.json(outputs);
});

// Chat with agent
app.post('/api/chat', async (req, res) => {
    const { agent_id, message } = req.body;
    if (!agent_id || !message) return res.status(400).json({ error: 'agent_id and message required' });
    try {
        const result = await runAgentTask(agent_id, message);
        res.json({ agent_id, response: result });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Trigger task
app.post('/api/trigger/:agentId', async (req, res) => {
    try {
        const result = await runAgentTask(req.params.agentId, req.body.task || 'Generate a status update');
        res.json({ success: true, result });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});

// Get agent memory
app.get('/api/memory/:agentId', (req, res) => {
    const db = getDB();
    const memory = db.prepare('SELECT * FROM agent_memory WHERE agent_id = ? ORDER BY created_at DESC LIMIT 20').all(req.params.agentId);
    res.json(memory);
});

// Get standup reports
app.get('/api/standups', (req, res) => {
    const db = getDB();
    const standups = db.prepare("SELECT * FROM outputs WHERE type = 'standup_report' ORDER BY created_at DESC LIMIT 10").all();
    res.json(standups);
});

// SPA fallback
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

async function start() {
    await initDB();

    app.listen(PORT, '0.0.0.0', () => {
        console.log(`\n🚀 C3 OpenClaw running on http://localhost:${PORT}`);
        console.log(`📊 Dashboard: http://localhost:${PORT}`);
        console.log(`🤖 ${Object.keys(AGENTS).length} agents ready\n`);
    });

    // Start autonomous scheduler
    startScheduler();

    // Start Telegram bot
    try {
        const { startBot } = require('./telegram/bot');
        startBot();
    } catch (err) {
        console.log('📱 Telegram bot not configured (set TELEGRAM_BOT_TOKEN)');
    }
}

start().catch(console.error);
