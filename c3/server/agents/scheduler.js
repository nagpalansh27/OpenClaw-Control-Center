const { getDB } = require('../db/sqlite');
const { runAgentTask, AGENTS, callOpenRouter } = require('./worker');

// Task intervals in ms
const COO_REVIEW_INTERVAL = 30 * 60 * 1000; // 30 min
const STANDUP_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours
const DAILY_PLANNING_INTERVAL = 24 * 60 * 60 * 1000; // daily

let intervals = [];

function startScheduler() {
    console.log('⏰ Scheduler started');

    // Initial kickoff after 2 min
    setTimeout(() => claudeCOOReview(), 2 * 60 * 1000);

    // COO Review every 30 min
    intervals.push(setInterval(() => claudeCOOReview(), COO_REVIEW_INTERVAL));

    // Standup every 6 hours
    intervals.push(setInterval(() => generateStandup(), STANDUP_INTERVAL));

    // Daily planning at startup + every 24h
    setTimeout(() => dailyPlanning(), 5 * 60 * 1000);
    intervals.push(setInterval(() => dailyPlanning(), DAILY_PLANNING_INTERVAL));
}

async function claudeCOOReview() {
    console.log('\n☠️ Claude COO reviewing task board...');
    const db = getDB();

    const pendingTasks = db.prepare('SELECT * FROM tasks WHERE status = ? LIMIT 10').all('pending');
    const recentOutputs = db.prepare('SELECT agent_id, type, title, created_at FROM outputs ORDER BY created_at DESC LIMIT 5').all();

    const prompt = `You are Claude, the COO of GetCarigar's AI team. Review the current state:

PENDING TASKS (${pendingTasks.length}):
${pendingTasks.map(t => `- [${t.agent_id}] ${t.title}`).join('\n') || 'None'}

RECENT OUTPUTS:
${recentOutputs.map(o => `- ${o.agent_id}: ${o.title} (${o.created_at})`).join('\n') || 'None'}

Pick ONE pending task and assign it. If no pending tasks, create ONE new task for the most idle agent.
Respond in JSON format: {"agent_id": "...", "task": "..."}
Keep tasks specific and actionable for GetCarigar.club (automotive service platform).`;

    const result = await callOpenRouter('stepfun/step-3.5-flash:free', [
        { role: 'system', content: 'You are Claude, COO. Respond ONLY with valid JSON.' },
        { role: 'user', content: prompt }
    ]);

    if (!result) { console.log('❌ COO review failed'); return; }

    try {
        // Extract JSON from response
        const jsonMatch = result.match(/\{[\s\S]*?\}/);
        if (!jsonMatch) throw new Error('No JSON found');
        const assignment = JSON.parse(jsonMatch[0]);

        if (assignment.agent_id && assignment.task) {
            // Create task
            db.prepare('INSERT INTO tasks (agent_id, title, description, status, assigned_by) VALUES (?, ?, ?, ?, ?)').run(
                assignment.agent_id, assignment.task.substring(0, 100), assignment.task, 'in_progress', 'claude'
            );

            console.log(`📋 Task assigned: ${assignment.agent_id} → ${assignment.task.substring(0, 60)}`);

            // Execute task
            const output = await runAgentTask(assignment.agent_id, assignment.task);

            // Mark complete
            if (output) {
                db.prepare("UPDATE tasks SET status = 'completed', result = ?, completed_at = CURRENT_TIMESTAMP WHERE agent_id = ? AND status = 'in_progress' ORDER BY created_at DESC LIMIT 1").run(output.substring(0, 5000), assignment.agent_id);
            }
        }
    } catch (err) {
        console.log('⚠️ Could not parse COO assignment:', err.message);
    }
}

async function generateStandup() {
    console.log('\n📊 Generating standup report...');
    const db = getDB();

    const recentTasks = db.prepare("SELECT * FROM tasks WHERE created_at > datetime('now', '-6 hours') ORDER BY created_at DESC").all();
    const recentOutputs = db.prepare("SELECT * FROM outputs WHERE created_at > datetime('now', '-6 hours') ORDER BY created_at DESC").all();

    const prompt = `Generate a brief standup report for GetCarigar's AI team.

TASKS COMPLETED (last 6 hours): ${recentTasks.filter(t => t.status === 'completed').length}
TASKS IN PROGRESS: ${recentTasks.filter(t => t.status === 'in_progress').length}
OUTPUTS GENERATED: ${recentOutputs.length}

Details:
${recentTasks.map(t => `- ${t.agent_id} (${t.status}): ${t.title}`).join('\n') || 'No activity'}

Write a 3-4 sentence summary of team progress. Be specific about what was accomplished.`;

    const report = await callOpenRouter('stepfun/step-3.5-flash:free', [
        { role: 'system', content: 'You are the standup report generator. Be concise and specific.' },
        { role: 'user', content: prompt }
    ]);

    if (report) {
        db.prepare('INSERT INTO outputs (agent_id, type, title, content) VALUES (?, ?, ?, ?)').run('claude', 'standup_report', `Standup ${new Date().toISOString()}`, report);
        console.log(`📊 Standup: ${report.substring(0, 100)}...`);
    }
}

async function dailyPlanning() {
    console.log('\n📋 Daily planning cycle...');
    const db = getDB();

    const agentIds = Object.keys(AGENTS).filter(id => id !== 'claude');

    // Create tasks for agents that haven't had tasks recently
    const activeAgents = db.prepare("SELECT DISTINCT agent_id FROM tasks WHERE created_at > datetime('now', '-24 hours')").all().map(r => r.agent_id);
    const idleAgents = agentIds.filter(id => !activeAgents.includes(id));

    if (idleAgents.length === 0) {
        console.log('All agents active, skipping daily planning');
        return;
    }

    // Pick up to 3 idle agents
    const toAssign = idleAgents.slice(0, 3);

    for (const agentId of toAssign) {
        const agent = AGENTS[agentId];
        const taskPrompt = getDefaultTask(agentId, agent);

        db.prepare('INSERT INTO tasks (agent_id, title, description, status, assigned_by) VALUES (?, ?, ?, ?, ?)').run(
            agentId, taskPrompt.substring(0, 100), taskPrompt, 'pending', 'scheduler'
        );
        console.log(`📋 Queued task for ${agent.name}: ${taskPrompt.substring(0, 50)}...`);

        // Space out API calls
        await new Promise(r => setTimeout(r, 5000));
    }
}

function getDefaultTask(agentId, agent) {
    const tasks = {
        naruto: 'Write an SEO-optimized blog post about "Top 5 Car Service Tips for Indian Monsoon Season" for getcarigar.club. Include meta title, description, and H1-H3 structure.',
        zoro: 'Write 3 compelling ad copy variations for GetCarigar targeting car owners in Tier 2 Indian cities. Include headline, body, and CTA for each.',
        sakura: 'Create 5 WhatsApp broadcast message templates for GetCarigar to re-engage dormant customers. Include personalization tokens.',
        kakashi: 'Draft a partnership outreach email to local garage chains proposing GetCarigar integration. Make it professional and highlight benefits.',
        luffy: 'Create brand guidelines for GetCarigar social media posts. Define tone of voice, color usage, and content pillars.',
        light: 'Analyze the competitive landscape for automotive service platforms in India. List top 5 competitors and their strengths/weaknesses.',
        itachi: 'Create a B2B sales pitch deck outline for GetCarigar targeting fleet management companies. Include key slides and talking points.',
        gojo: 'Design a customer success playbook for GetCarigar. Define onboarding steps, check-in cadence, and escalation procedures.',
        yuji: 'Create a QA checklist for the GetCarigar mobile app. Include functional tests, edge cases, and performance benchmarks.',
        levi: 'Write coding standards and review guidelines for the GetCarigar engineering team. Cover JS/React best practices.',
        goku: 'Design the database schema for a real-time service tracking feature in GetCarigar. Include tables, relationships, and indexes.',
        vegeta: 'Write Flutter widget specifications for a "Service Status Tracker" in the GetCarigar mobile app.',
        piccolo: 'Design a dashboard layout for GetCarigar garage partners showing daily bookings, revenue, and customer satisfaction.',
        tanjiro: 'Design an onboarding flow for new GetCarigar users. Include 5 screens with copy and UX notes.',
        frieza: 'Create a set of automated reminder templates for service due dates, payment reminders, and feedback requests.',
        cell: 'Design a review collection system for GetCarigar. Include email templates, SMS templates, and in-app prompts.',
        buu: 'Generate a weekly analytics report template for GetCarigar. Include KPIs, charts needed, and interpretation guidelines.',
        sasuke: 'Design a free "Car Service Cost Calculator" tool for getcarigar.club. Specify inputs, logic, and output format.',
    };
    return tasks[agentId] || `As ${agent.role}, produce one actionable deliverable for GetCarigar automotive platform today.`;
}

function stopScheduler() {
    intervals.forEach(i => clearInterval(i));
    intervals = [];
}

module.exports = { startScheduler, stopScheduler };
