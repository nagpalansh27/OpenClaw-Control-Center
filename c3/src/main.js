/* ============================================
   C3 — CARIGAR CONTROL CENTRE v2
   Full CRUD + Office + Standup + Terminal + Editable Everything
   ============================================ */

import {
  getAgents, addAgent, updateAgent, deleteAgent,
  getTasks, addTask, deleteTask,
  getComms, addComm, deleteComm,
  getTargets, updateTarget,
  getModels, addModel, updateModel, deleteModel,
  getWorkspace, updateWorkspace,
  getStandups, addStandup, addStandupMessage,
  getStatusConfig, updateStatusConfig,
  DIVISIONS, resetAllData,
  readOpenClawConfig, readWorkspaceFile, readWorkspaceDir,
  fetchOpenRouterStatus, initData,
} from './services/data.js';
import { chatWithAgent } from './services/ollama.js';
import { speak, stopSpeaking, startListening, isSpeaking } from './services/voice.js';
import { HackerHouse } from './components/office.js';

let office = null;
let currentView = 'office';
let terminalHistory = [];
let terminalHistoryIdx = -1;
let chatHistory = JSON.parse(localStorage.getItem('c3_chat_history') || '{}');
function saveChatHistory() { localStorage.setItem('c3_chat_history', JSON.stringify(chatHistory)); }
let activeCallAgent = null;
let callRecognition = null;
let callMuted = false;

// ============================================
// MODAL SYSTEM
// ============================================

function showModal(title, contentHtml, onSubmit) {
  const existing = document.getElementById('c3-modal');
  if (existing) existing.remove();
  const overlay = document.createElement('div');
  overlay.id = 'c3-modal';
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-box">
      <div class="modal-header">
        <span class="modal-title">${title}</span>
        <button class="modal-close" onclick="closeModal()">✕</button>
      </div>
      <form id="modal-form" class="modal-body">${contentHtml}
        <div class="modal-actions">
          <button type="button" class="btn btn-ghost" onclick="closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Save</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('visible'));
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
  document.getElementById('modal-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd.entries());
    onSubmit(data);
    closeModal();
  });
}

window.closeModal = function () {
  const m = document.getElementById('c3-modal');
  if (m) { m.classList.remove('visible'); setTimeout(() => m.remove(), 200); }
};

function confirmAction(msg, cb) {
  showModal('⚠️ Confirm', `<p style="color:var(--text-secondary);margin-bottom:16px;">${msg}</p>`, cb);
}

// ============================================
// BOOT SEQUENCE
// ============================================

const BOOT_MESSAGES = [
  { text: '[C3] Initializing Control Centre v2.0...', cls: 'log-info' },
  { text: `[CORE] Loading agent roster... ${getAgents().length} agents found`, cls: 'log-ok' },
  { text: '[HOUSE] Starting Hacker House virtual office...', cls: 'log-ok' },
  { text: '[SYS] Reading ~/.openclaw/openclaw.json...', cls: 'log-info' },
  { text: '[MODEL] kimi-k2.5:cloud loaded ✓', cls: 'log-ok' },
  { text: '[CHAN] Telegram: active ✓ | Discord: standby ⚠', cls: 'log-warn' },
  { text: '[MEM] localStorage restored ✓', cls: 'log-ok' },
  { text: '[STANDUP] Meeting room ready ✓', cls: 'log-ok' },
  { text: '', cls: 'log-info' },
  { text: '☠️  C3 v2 READY — Welcome to the Hacker House', cls: 'log-ok' },
];

async function runBootSequence() {
  const bootLog = document.getElementById('boot-log');
  const bar = document.querySelector('.boot-progress-bar');
  const bootScreen = document.getElementById('boot-screen');
  const app = document.getElementById('app');
  for (let i = 0; i < BOOT_MESSAGES.length; i++) {
    const m = BOOT_MESSAGES[i];
    const line = document.createElement('div');
    line.className = `log-line ${m.cls}`;
    line.textContent = m.text;
    bootLog.appendChild(line);
    bootLog.scrollTop = bootLog.scrollHeight;
    if (bootLog.querySelectorAll('.log-line').length > 8) bootLog.querySelector('.log-line').remove();
    bar.style.width = `${((i + 1) / BOOT_MESSAGES.length) * 100}%`;
    await sleep(50 + Math.random() * 60);
  }
  await sleep(300);
  bootScreen.classList.add('fade-out');
  app.classList.remove('hidden');
  setTimeout(() => bootScreen.remove(), 600);
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ============================================
// NAVIGATION
// ============================================

function initNavigation() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const viewId = btn.dataset.view;
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
      document.getElementById(`view-${viewId}`).classList.add('active');
      currentView = viewId;

      // Manage office lifecycle
      if (viewId === 'office') {
        if (!office) { office = new HackerHouse(document.getElementById('view-office')); office.init(); }
        else { office.running = true; office.loop(0); }
      } else if (office) { office.running = false; }

      // Re-render views
      const renderers = { dashboard: renderDashboard, orgchart: renderOrgChart, comms: renderComms, workspace: renderWorkspace, standup: renderStandup, terminal: renderTerminal, status: renderStatus, call: renderCall };
      if (renderers[viewId]) renderers[viewId]();
    });
  });
}

// ============================================
// DASHBOARD
// ============================================

function renderDashboard() {
  const el = document.getElementById('view-dashboard');
  const agts = getAgents(), tks = getTasks(), tgts = getTargets(), mdls = getModels();
  const onl = agts.filter(a => a.status === 'online').length;
  const syn = agts.filter(a => a.status === 'syncing').length;

  el.innerHTML = `
    <div class="section-header"><div class="section-title">☠️ Dashboard</div><div class="section-subtitle">Live Overview</div></div>
    <div class="stats-row">
      <div class="stat-card"><div class="stat-value">${agts.length}</div><div class="stat-label">Total Agents</div></div>
      <div class="stat-card" data-color="green"><div class="stat-value">${onl}</div><div class="stat-label">✅ Online</div></div>
      <div class="stat-card" data-color="orange"><div class="stat-value">${syn}</div><div class="stat-label">🔄 Syncing</div></div>
      <div class="stat-card" data-color="cyan"><div class="stat-value">${DIVISIONS.length}</div><div class="stat-label">Divisions</div></div>
      <div class="stat-card" data-color="purple"><div class="stat-value">${mdls.length}</div><div class="stat-label">Models</div></div>
    </div>

    <div class="status-panel" style="margin-bottom:var(--gap-xl);">
      <div class="status-panel-title">⚡ Model Registry <button class="btn-icon" onclick="showAddModelModal()">＋</button></div>
      <div class="model-list">
        ${mdls.map(m => `<div class="model-badge" onclick="showEditModelModal('${m.id}')"><span class="dot"></span> ${m.name} <span class="badge-x" onclick="event.stopPropagation();removeModel('${m.id}')">✕</span></div>`).join('')}
      </div>
    </div>

    <div class="status-panel" style="margin-bottom:var(--gap-xl);">
      <div class="status-panel-title">📈 Growth Targets</div>
      ${tgts.map(t => {
    const pct = t.goal > 0 ? Math.min((t.current / t.goal) * 100, 100) : 0;
    const dc = t.format === 'lakh' ? `₹${(t.current / 100000).toFixed(1)}L` : `${t.unit}${t.current.toLocaleString()}`;
    const dg = t.format === 'lakh' ? `₹${(t.goal / 100000).toFixed(0)}L` : `${t.unit}${t.goal.toLocaleString()}`;
    return `<div class="progress-item" onclick="showEditTargetModal('${t.id}')" style="cursor:pointer;" title="Click to edit">
          <div class="progress-label"><span>${t.label}</span><span>${dc} / ${dg}</span></div>
          <div class="progress-bar"><div class="progress-fill ${t.color}" style="width:${pct}%"></div></div>
        </div>`;
  }).join('')}
    </div>

    <div class="section-header" style="margin-top:var(--gap-xl);">
      <div class="section-title">📋 Task Board</div>
      <button class="btn btn-small" onclick="showAddTaskModal()">＋ Add Task</button>
    </div>
    <div class="task-board">
      ${['p0', 'p1', 'p2'].map(k => {
    const labels = { p0: '🔴 P0 — Critical', p1: '🟡 P1 — Important', p2: '🔵 P2 — Backlog' };
    const items = tks[k] || [];
    return `<div class="task-column"><div class="task-column-title">${labels[k]} <span class="task-column-count">${items.length}</span></div>
          ${items.map(t => `<div class="task-item"><div class="task-item-title"><span class="task-priority ${k}">${t.priority}</span>${t.title}</div>
            <div class="task-item-agent">→ ${t.agent} <button class="btn-icon-tiny" onclick="removeTask('${t.id}')" title="Delete">✕</button></div></div>`).join('')}
        </div>`;
  }).join('')}
    </div>
  `;
  setTimeout(() => { el.querySelectorAll('.progress-fill').forEach(f => { const w = f.style.width; f.style.width = '0%'; requestAnimationFrame(() => { f.style.width = w; }); }); }, 100);
}

// Dashboard modal globals
window.showAddModelModal = () => {
  showModal('Add Model', `
    <label class="form-label">Name<input class="form-input" name="name" required placeholder="e.g. GPT-5o"></label>
    <label class="form-label">Provider<select class="form-input" name="provider"><option>OpenRouter (Free)</option><option>OpenAI</option><option>Anthropic</option><option>Custom</option></select></label>
    <label class="form-label">API Base URL<input class="form-input" name="baseUrl" placeholder="https://api.openai.com/v1"></label>
    <label class="form-label">API Key<input class="form-input" name="apiKey" type="password" placeholder="sk-... (optional for free models)"></label>
  `, d => { addModel({ ...d, status: 'active' }).then(() => renderDashboard()); });
};
window.showEditModelModal = (id) => {
  const m = getModels().find(m => m.id === id); if (!m) return;
  showModal(`Edit: ${m.name}`, `
    <label class="form-label">Name<input class="form-input" name="name" required value="${m.name}"></label>
    <label class="form-label">Provider<select class="form-input" name="provider">
      ${['OpenRouter (Free)', 'OpenAI', 'Anthropic', 'Custom'].map(p => `<option ${p === m.provider ? 'selected' : ''}>${p}</option>`).join('')}
    </select></label>
    <label class="form-label">API Base URL<input class="form-input" name="baseUrl" value="${m.baseUrl || ''}"></label>
    <label class="form-label">API Key<input class="form-input" name="apiKey" type="password" value="${m.apiKey || ''}" placeholder="sk-..."></label>
  `, d => { updateModel(id, d).then(() => renderDashboard()); });
};
window.removeModel = id => { deleteModel(id).then(() => renderDashboard()); };
window.showAddTaskModal = () => {
  const agts = getAgents();
  showModal('Add Task', `
    <label class="form-label">Title<input class="form-input" name="title" required placeholder="Task"></label>
    <label class="form-label">Agent<select class="form-input" name="agent">${agts.map(a => `<option value="${a.name}">${a.emoji} ${a.name}</option>`).join('')}</select></label>
    <label class="form-label">Priority<select class="form-input" name="priority"><option value="P0">P0</option><option value="P1" selected>P1</option><option value="P2">P2</option></select></label>
  `, d => { addTask(d.priority, d).then(() => renderDashboard()); });
};
window.removeTask = id => { deleteTask(id).then(() => renderDashboard()); };
window.showEditTargetModal = (id) => {
  const t = getTargets().find(t => t.id === id); if (!t) return;
  showModal(`Edit: ${t.label}`, `
    <label class="form-label">Current<input class="form-input" name="current" type="number" required value="${t.current}"></label>
    <label class="form-label">Goal<input class="form-input" name="goal" type="number" required value="${t.goal}"></label>
  `, d => { updateTarget(id, parseInt(d.current), parseInt(d.goal)).then(() => renderDashboard()); });
};

// ============================================
// ORG CHART
// ============================================

function renderOrgChart() {
  const el = document.getElementById('view-orgchart');
  const agts = getAgents();
  const mdls = getModels();
  el.innerHTML = `
    <div class="section-header">
      <div class="section-title">🏛️ Organization</div>
      <div style="display:flex;gap:8px;">
        <button class="btn btn-small" onclick="showApiKeyModal()">🔑 API Keys</button>
        <button class="btn btn-small" onclick="showAddAgentModal()">＋ Agent</button>
      </div>
    </div>
    <div class="org-flowchart">
      <div class="leader-nodes">
        <div class="leader-card ceo"><div class="leader-avatar">👨‍💼</div><div><div class="leader-role-badge">CEO</div><div class="leader-name">Ansh</div><div class="leader-desc">Vision · Strategy · Final Decisions</div></div></div>
        <div class="connect-dot"></div>
        <div class="leader-card coo"><div class="leader-avatar">☠️</div><div><div class="leader-role-badge">COO</div><div class="leader-name">Claude</div><div class="leader-desc">Research · Orchestration · Execution</div></div></div>
        <div class="connect-dot"></div>
      </div>
      <div class="divisions-flow">
        ${DIVISIONS.map((div, i) => {
    const da = agts.filter(a => a.division === div.id);
    return `<div class="division-flow-card" style="border-color:${div.color}">
            <div class="division-flow-connector" style="background:${div.color}"></div>
            <div class="division-flow-header" style="border-color:${div.color}">
              <span class="division-emoji">${div.emoji}</span>
              <span class="division-flow-name">${div.name}</span>
              <span class="division-flow-anime">${div.anime}</span>
            </div>
            <div class="division-flow-agents">
              ${da.map(a => `<div class="division-flow-agent" onclick="showEditAgentModal('${a.id}')">
                <span class="division-flow-agent-emoji">${a.emoji}</span>
                <div class="division-flow-agent-info">
                  <div class="division-flow-agent-name">${a.name}</div>
                  <div class="division-flow-agent-role">${a.role}</div>
                </div>
                <span class="status-dot ${a.status}"></span>
              </div>`).join('')}
            </div>
          </div>`;
  }).join('')}
      </div>
    </div>
  `;
}

window.showApiKeyModal = () => {
  const models = getModels();
  const content = `
    <div style="font-size:10px;color:var(--text-dim);margin-bottom:12px;">Free models work without keys. Adding an OpenRouter key gets better rate limits.</div>
    <label class="form-label">OpenRouter API Key (global)
      <input class="form-input" id="api-key-global" type="password" placeholder="sk-or-v1-..." value="${models[0]?.api_key || ''}" style="margin-bottom:8px;">
    </label>
    <div style="font-size:10px;color:var(--text-dim);margin-bottom:4px;">Get one free at <a href="https://openrouter.ai/keys" target="_blank" style="color:var(--amber);">openrouter.ai/keys</a></div>
    <div style="max-height:240px;overflow-y:auto;margin-top:8px;">
      ${models.map((m, i) => `
        <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border);">
          <span style="font-size:9px;color:var(--text-secondary);font-family:var(--font-mono);min-width:180px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${m.name}</span>
          <span style="font-size:9px;color:${m.api_key ? 'var(--green)' : 'var(--text-dim)'};">${m.api_key ? '🔑' : '🆓'}</span>
        </div>
      `).join('')}
    </div>
  `;
  showModal('🔑 API Key Management', content, (data) => {
    const key = document.getElementById('api-key-global')?.value?.trim() || '';
    // Apply key to all models
    models.forEach(m => {
      updateModel(m.id, { api_key: key });
    });
    // Update the OpenRouter service
    import('./services/ollama.js').then(mod => mod.setOpenRouterKey(key));
    renderOrgChart();
    renderStatus();
  });
};
window.showAddAgentModal = () => {
  showModal('Add Agent', `
    <label class="form-label">Name<input class="form-input" name="name" required></label>
    <label class="form-label">Emoji<input class="form-input" name="emoji" required maxlength="4"></label>
    <label class="form-label">Role<input class="form-input" name="role" required></label>
    <label class="form-label">Division<select class="form-input" name="division">${DIVISIONS.map(d => `<option value="${d.id}">${d.emoji} ${d.name}</option>`).join('')}</select></label>
    <label class="form-label">Anime<input class="form-input" name="anime" required></label>
    <label class="form-label">Model<input class="form-input" name="model" required></label>
    <label class="form-label">Power<input class="form-input" name="power" required></label>
    <label class="form-label">Status<select class="form-input" name="status"><option>online</option><option>syncing</option><option>idle</option></select></label>
  `, d => { addAgent(d).then(() => { renderOrgChart(); renderDashboard(); }); });
};
window.showEditAgentModal = (id) => {
  const a = getAgents().find(x => x.id === id); if (!a) return;
  showModal(`Edit: ${a.name}`, `
    <label class="form-label">Name<input class="form-input" name="name" required value="${a.name}"></label>
    <label class="form-label">Emoji<input class="form-input" name="emoji" required value="${a.emoji}"></label>
    <label class="form-label">Role<input class="form-input" name="role" required value="${a.role}"></label>
    <label class="form-label">Division<select class="form-input" name="division">${DIVISIONS.map(d => `<option value="${d.id}" ${d.id === a.division ? 'selected' : ''}>${d.emoji} ${d.name}</option>`).join('')}</select></label>
    <label class="form-label">Anime<input class="form-input" name="anime" required value="${a.anime}"></label>
    <label class="form-label">Model<input class="form-input" name="model" required value="${a.model}"></label>
    <label class="form-label">Power<input class="form-input" name="power" required value="${a.power}"></label>
    <label class="form-label">Status<select class="form-input" name="status">${['online', 'syncing', 'idle'].map(s => `<option ${s === a.status ? 'selected' : ''}>${s}</option>`).join('')}</select></label>
  `, d => { updateAgent(id, d).then(() => { renderOrgChart(); renderDashboard(); }); });
};
window.removeAgent = id => {
  const a = getAgents().find(x => x.id === id);
  confirmAction(`Delete agent <strong>${a?.name}</strong>?`, () => { deleteAgent(id).then(() => { renderOrgChart(); renderDashboard(); }); });
};

// ============================================
// AGENT WORKSPACES (per-agent SOUL + IDENTITY)
// ============================================

let selectedWorkspaceAgent = null;
let currentWsField = 'soul';

function renderWorkspace() {
  const el = document.getElementById('view-workspace');
  const agts = getAgents();
  if (!selectedWorkspaceAgent && agts.length) selectedWorkspaceAgent = agts[0].id;

  const ws = selectedWorkspaceAgent ? getWorkspace(selectedWorkspaceAgent) : null;
  const content = ws ? ws[currentWsField] || '' : '';
  const agent = agts.find(a => a.id === selectedWorkspaceAgent);

  el.innerHTML = `
    <div class="section-header"><div class="section-title">📁 Agent Workspaces</div><div class="section-subtitle">Edit SOUL & IDENTITY for each agent</div></div>
    <div class="workspace-layout">
      <div class="workspace-sidebar">
        <div class="ws-section-title">AGENTS</div>
        ${agts.map(a => `
          <div class="ws-file-item ${a.id === selectedWorkspaceAgent ? 'active' : ''}" onclick="selectWsAgent('${a.id}')">
            <span class="ws-file-icon">${a.emoji}</span> ${a.name}
            <span class="ws-file-size">${a.role}</span>
          </div>
        `).join('')}
      </div>
      <div class="workspace-panel">
        <div class="ws-tabs">
          <button class="ws-tab ${currentWsField === 'soul' ? 'active' : ''}" onclick="switchWsTab('soul')">💀 SOUL.md</button>
          <button class="ws-tab ${currentWsField === 'identity' ? 'active' : ''}" onclick="switchWsTab('identity')">🪪 IDENTITY.md</button>
        </div>
        <div class="ws-editor-header">
          <span>${agent ? `${agent.emoji} ${agent.name} / ${currentWsField.toUpperCase()}.md` : 'Select an agent'}</span>
          <button class="btn btn-small" onclick="saveCurrentWorkspace()">💾 Save</button>
        </div>
        <textarea class="ws-editor" id="ws-editor" spellcheck="false">${escapeHtml(content)}</textarea>
      </div>
    </div>
  `;
}

window.selectWsAgent = (id) => { selectedWorkspaceAgent = id; renderWorkspace(); };
window.switchWsTab = (field) => { saveCurrentWorkspaceQuiet(); currentWsField = field; renderWorkspace(); };
window.saveCurrentWorkspace = () => {
  const ed = document.getElementById('ws-editor');
  if (ed && selectedWorkspaceAgent) {
    updateWorkspace(selectedWorkspaceAgent, currentWsField, ed.value).then(() => {
      const btn = document.querySelector('.ws-editor-header .btn');
      if (btn) { btn.textContent = '✓ Saved!'; setTimeout(() => { btn.textContent = '💾 Save'; }, 1500); }
    });
  }
};
function saveCurrentWorkspaceQuiet() {
  const ed = document.getElementById('ws-editor');
  if (ed && selectedWorkspaceAgent) updateWorkspace(selectedWorkspaceAgent, currentWsField, ed.value);
}

// ============================================
// STANDUP MEETINGS
// ============================================

let activeStandupId = null;

function renderStandup() {
  const el = document.getElementById('view-standup');
  const sus = getStandups();
  if (!activeStandupId && sus.length) activeStandupId = sus[0].id;
  const active = sus.find(s => s.id === activeStandupId);

  el.innerHTML = `
    <div class="section-header">
      <div class="section-title">🎙️ Standup Meetings</div>
      <button class="btn btn-small" onclick="startNewStandup()">＋ New Meeting</button>
    </div>
    <div class="standup-layout">
      <div class="standup-sidebar">
        <div class="ws-section-title">MEETINGS</div>
        ${sus.map(s => `
          <div class="ws-file-item ${s.id === activeStandupId ? 'active' : ''}" onclick="selectStandup('${s.id}')">
            <span class="ws-file-icon">📋</span>
            <div><div style="font-size:11px;">${s.title}</div><div style="font-size:9px;color:var(--text-dim);">${s.date}</div></div>
          </div>
        `).join('')}
      </div>
      <div class="standup-panel">
        ${active ? `
          <div class="standup-title">${active.title}</div>
          <div class="standup-date">${active.date} · ${active.participants.length} participants</div>
          <div class="standup-participants">
            ${active.participants.map(p => { const a = getAgents().find(x => x.name === p); return `<span class="standup-participant">${a?.emoji || '⚙️'} ${p}</span>`; }).join('')}
          </div>
          <div class="standup-messages" id="standup-messages">
            ${active.messages.map(m => {
    const a = getAgents().find(x => x.name === m.agent);
    return `<div class="standup-msg">
                <div class="standup-msg-header"><span class="standup-msg-agent">${a?.emoji || '⚙️'} ${m.agent}</span><span class="standup-msg-role">${m.role}</span>
                  <button class="btn-icon-tiny standup-speak-btn" data-agentid="${a?.id || 'goku'}" data-text="${escapeHtml(m.body)}" title="Speak">🔈</button>
                </div>
                <div class="standup-msg-body">${m.body}</div>
              </div>`;
  }).join('')}
          </div>
          <div class="standup-input-row">
            <select id="standup-agent-select" class="form-input" style="width:200px;">
              ${getAgents().map(a => `<option value="${a.name}" data-role="${a.role}">${a.emoji} ${a.name}</option>`).join('')}
            </select>
            <input type="text" id="standup-input" class="form-input" placeholder="Type or speak agent update..." style="flex:1;" onkeydown="if(event.key==='Enter')addStandupMsg()">
            <button class="btn btn-small" id="standup-mic-btn" onclick="toggleStandupMic()" title="Voice input">🎤</button>
            <button class="btn btn-primary" onclick="addStandupMsg()">Send</button>
          </div>
        ` : '<div style="color:var(--text-dim);padding:40px;text-align:center;">No meetings yet. Start one!</div>'}
      </div>
    </div>
  `;

  // Attach voice playback to speak buttons
  el.querySelectorAll('.standup-speak-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const agentId = btn.dataset.agentid;
      const text = btn.dataset.text;
      if (isSpeaking()) { stopSpeaking(); btn.textContent = '🔈'; return; }
      btn.textContent = '🔊';
      speak(text, agentId).then(() => { btn.textContent = '🔈'; });
    });
  });
}

window.selectStandup = id => { activeStandupId = id; renderStandup(); };
window.startNewStandup = () => {
  const now = new Date();
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} IST`;
  showModal('New Standup Meeting', `
    <label class="form-label">Title<input class="form-input" name="title" required value="Daily Standup" placeholder="Meeting title"></label>
    <label class="form-label">Date<input class="form-input" name="date" value="${date}"></label>
    <div class="form-label">Participants (select agents)</div>
    <div class="standup-checkbox-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:4px;">
      ${getAgents().map(a => `<label style="display:flex;align-items:center;gap:4px;font-size:11px;color:var(--text-secondary);cursor:pointer;">
        <input type="checkbox" name="participants" value="${a.name}" checked style="accent-color:var(--amber);">${a.emoji} ${a.name}
      </label>`).join('')}
    </div>
  `, (data) => {
    const form = document.getElementById('modal-form');
    const checked = Array.from(form.querySelectorAll('input[name="participants"]:checked')).map(c => c.value);
    const su = { title: data.title, date: data.date, participants: checked, messages: [] };
    addStandup(su).then(() => {
      activeStandupId = su.id;
      renderStandup();
    });
  });
};
window.addStandupMsg = () => {
  const sel = document.getElementById('standup-agent-select');
  const inp = document.getElementById('standup-input');
  if (!inp.value.trim() || !activeStandupId) return;
  const agentName = sel.value;
  const opt = sel.selectedOptions[0];
  addStandupMessage(activeStandupId, { agent: agentName, role: opt.dataset.role || '', body: inp.value.trim() }).then(() => {
    renderStandup();
    setTimeout(() => { const msgs = document.getElementById('standup-messages'); if (msgs) msgs.scrollTop = msgs.scrollHeight; }, 50);
  });
};

// ============================================
// COMM FEED
// ============================================

function renderComms() {
  const el = document.getElementById('view-comms');
  const msgs = getComms();
  el.innerHTML = `
    <div class="section-header"><div class="section-title">💬 Comm Feed</div><button class="btn btn-small" onclick="showAddCommModal()">＋ Message</button></div>
    <div class="comm-feed">
      ${msgs.map(m => {
    const a = getAgents().find(x => x.name === m.agent);
    return `<div class="comm-message" data-division="${m.division}">
          <div class="comm-header">
            <span class="comm-agent">${a?.emoji || '⚙️'} ${m.agent}</span><span class="comm-role-badge">${m.role}</span>
            <span class="comm-time">${m.time}</span>
            <button class="btn-icon-tiny comm-delete" onclick="removeComm('${m.id}')">✕</button>
          </div><div class="comm-body">${m.body}</div></div>`;
  }).join('')}
    </div>
  `;
}

window.showAddCommModal = () => {
  const agts = getAgents();
  const now = new Date();
  const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  showModal('New Message', `
    <label class="form-label">Agent<select class="form-input" name="agent" id="comm-agent-sel" onchange="updateCommDetails()">
      ${agts.map(a => `<option value="${a.name}" data-role="${a.role}" data-div="${a.division}">${a.emoji} ${a.name}</option>`).join('')}
    </select></label>
    <input type="hidden" name="role" id="comm-role-in" value="${agts[0]?.role || ''}">
    <input type="hidden" name="division" id="comm-div-in" value="${agts[0]?.division || ''}">
    <input type="hidden" name="time" value="${time}">
    <label class="form-label">Message<textarea class="form-input form-textarea" name="body" required></textarea></label>
  `, d => { addComm(d).then(() => renderComms()); });
};
window.updateCommDetails = () => {
  const s = document.getElementById('comm-agent-sel'); const o = s.selectedOptions[0];
  document.getElementById('comm-role-in').value = o.dataset.role || '';
  document.getElementById('comm-div-in').value = o.dataset.div || '';
};
window.removeComm = id => { deleteComm(id).then(() => renderComms()); };

// ============================================
// FUNCTIONAL TERMINAL
// ============================================

function renderTerminal() {
  const el = document.getElementById('view-terminal');
  el.innerHTML = `
    <div class="section-header"><div class="section-title">⌨️ Terminal</div><div class="section-subtitle">C3 Command Interface</div></div>
    <div class="terminal-window">
      <div class="terminal-toolbar">
        <span class="terminal-dot red"></span><span class="terminal-dot yellow"></span><span class="terminal-dot green"></span>
        <span class="terminal-title">c3@controlcentre — zsh — commands</span>
      </div>
      <div class="terminal-body" id="terminal-body">
        <div class="terminal-line"><span class="info">Welcome to C3 Terminal v2.0</span></div>
        <div class="terminal-line"><span class="info">Commands: help, agents, status, models, tasks, whoami, clear, comms, standup, reset</span></div>
        <div class="terminal-line"><span class="output"></span></div>
      </div>
      <div class="terminal-input-row">
        <span class="terminal-prompt-text">c3@controlcentre ~$</span>
        <input type="text" id="terminal-input" class="terminal-input-field" placeholder="Type a command..." autofocus
          onkeydown="handleTerminalKey(event)">
      </div>
    </div>
  `;
  setTimeout(() => document.getElementById('terminal-input')?.focus(), 100);
}

window.handleTerminalKey = (e) => {
  if (e.key === 'Enter') {
    const inp = document.getElementById('terminal-input');
    const cmd = inp.value.trim();
    if (!cmd) return;
    terminalHistory.push(cmd);
    terminalHistoryIdx = terminalHistory.length;
    execTerminalCmd(cmd);
    inp.value = '';
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (terminalHistoryIdx > 0) { terminalHistoryIdx--; document.getElementById('terminal-input').value = terminalHistory[terminalHistoryIdx] || ''; }
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (terminalHistoryIdx < terminalHistory.length - 1) { terminalHistoryIdx++; document.getElementById('terminal-input').value = terminalHistory[terminalHistoryIdx] || ''; }
    else { terminalHistoryIdx = terminalHistory.length; document.getElementById('terminal-input').value = ''; }
  }
};

function termPrint(lines) {
  const body = document.getElementById('terminal-body');
  for (const l of lines) {
    const div = document.createElement('div');
    div.className = 'terminal-line';
    div.innerHTML = l;
    body.appendChild(div);
  }
  body.scrollTop = body.scrollHeight;
}

function execTerminalCmd(cmd) {
  const body = document.getElementById('terminal-body');
  termPrint([`<span class="prompt">c3@controlcentre ~$</span> <span class="cmd">${escapeHtml(cmd)}</span>`]);
  const parts = cmd.toLowerCase().split(/\s+/);
  const c = parts[0];

  if (c === 'help') {
    termPrint([
      '<span class="info">Available commands:</span>',
      '<span class="output">  agents        — List all agents</span>',
      '<span class="output">  agent &lt;name&gt;  — Show agent details</span>',
      '<span class="output">  models        — List models</span>',
      '<span class="output">  tasks         — Show task board</span>',
      '<span class="output">  status        — Gateway status</span>',
      '<span class="output">  comms         — Recent messages</span>',
      '<span class="output">  standup       — Last standup summary</span>',
      '<span class="output">  whoami        — Who are you?</span>',
      '<span class="output">  divisions     — List divisions</span>',
      '<span class="output">  clear         — Clear terminal</span>',
      '<span class="output">  reset         — Reset all data</span>',
      '<span class="output">  openrouter    — Check OpenRouter API status</span>',
    ]);
  } else if (c === 'agents') {
    const agts = getAgents();
    termPrint([`<span class="success">  ${agts.length} agents loaded</span>`, '<span class="info">  ┌──────────┬──────────────────────┬────────────┬─────────┐</span>',
      '<span class="info">  │ Agent    │ Role                 │ Model      │ Status  │</span>',
      '<span class="info">  ├──────────┼──────────────────────┼────────────┼─────────┤</span>',
    ...agts.map(a => `<span class="${a.status === 'online' ? 'success' : a.status === 'idle' ? 'error' : 'output'}">  │ ${a.name.padEnd(8)} │ ${a.role.substring(0, 20).padEnd(20)} │ ${(a.model || '').substring(0, 10).padEnd(10)} │ ${a.status.padEnd(7)} │</span>`),
      '<span class="info">  └──────────┴──────────────────────┴────────────┴─────────┘</span>',
    ]);
  } else if (c === 'agent' && parts[1]) {
    const name = parts.slice(1).join(' ');
    const a = getAgents().find(x => x.name.toLowerCase() === name);
    if (a) {
      termPrint([
        `<span class="success">  ${a.emoji} ${a.name} — ${a.role}</span>`,
        `<span class="output">  Division: ${a.division} | Anime: ${a.anime}</span>`,
        `<span class="output">  Model: ${a.model} | Status: ${a.status}</span>`,
        `<span class="output">  Power: "${a.power}"</span>`,
      ]);
    } else { termPrint([`<span class="error">  Agent "${name}" not found</span>`]); }
  } else if (c === 'models') {
    const mdls = getModels();
    termPrint([`<span class="success">  ${mdls.length} models:</span>`, ...mdls.map(m => `<span class="output">  • ${m.name} (${m.provider}) → ${m.baseUrl || 'default'}</span>`)]);
  } else if (c === 'tasks') {
    const tks = getTasks();
    termPrint([`<span class="info">  Task Board:</span>`]);
    for (const [k, items] of Object.entries(tks)) {
      termPrint([`<span class="${k === 'p0' ? 'error' : k === 'p1' ? 'output' : 'info'}">  ${k.toUpperCase()} (${items.length}):</span>`,
      ...items.map(t => `<span class="output">    • ${t.title} → ${t.agent}</span>`)]);
    }
  } else if (c === 'status') {
    const cfg = getStatusConfig();
    termPrint([
      `<span class="success">  ✓ Gateway running on :${cfg.gateway.port} (${cfg.gateway.mode})</span>`,
      `<span class="${cfg.channels.telegram ? 'success' : 'error'}">  ${cfg.channels.telegram ? '✓' : '✗'} Telegram: ${cfg.channels.telegram ? 'connected' : 'disabled'}</span>`,
      `<span class="${cfg.channels.discord ? 'success' : 'output'}">  ${cfg.channels.discord ? '✓' : '⚠'} Discord: ${cfg.channels.discord ? 'connected' : 'disabled'}</span>`,
      `<span class="output">  Model: ${cfg.primaryModel}</span>`,
    ]);
  } else if (c === 'comms') {
    const msgs = getComms().slice(0, 5);
    termPrint([`<span class="info">  Recent comms:</span>`, ...msgs.map(m => `<span class="output">  [${m.time}] ${m.agent}: ${m.body.substring(0, 60)}...</span>`)]);
  } else if (c === 'standup') {
    const sus = getStandups();
    if (sus.length) {
      const s = sus[0];
      termPrint([`<span class="info">  Last standup: ${s.title}</span>`, `<span class="output">  ${s.date} · ${s.participants.length} participants</span>`,
      ...s.messages.map(m => `<span class="output">  ${m.agent}: ${m.body.substring(0, 70)}...</span>`)]);
    } else { termPrint([`<span class="output">  No standups yet</span>`]); }
  } else if (c === 'whoami') {
    termPrint([
      `<span class="success">  👨‍💼 Ansh — CEO, C3</span>`,
      `<span class="output">  Co-founder & CTO · Nashik, Maharashtra</span>`,
      `<span class="output">  Running ${getAgents().length} agents across ${DIVISIONS.length} divisions</span>`,
    ]);
  } else if (c === 'divisions') {
    termPrint(DIVISIONS.map(d => `<span class="output">  ${d.emoji} ${d.name} (${d.anime}): ${getAgents().filter(a => a.division === d.id).length} agents</span>`));
  } else if (c === 'clear') {
    body.innerHTML = '';
    termPrint(['<span class="info">Terminal cleared</span>']);
  } else if (c === 'reset') {
    termPrint(['<span class="error">  ⚠ Resetting all data to defaults...</span>']);
    resetAllData().then(() => { renderDashboard(); renderOrgChart(); termPrint(['<span class="success">  ✓ Done. All views refreshed.</span>']); });
  } else if (c === 'openrouter' || c === 'models') {
    termPrint(['<span class="info">  Checking OpenRouter API...</span>']);
    fetchOpenRouterStatus().then(os => {
      if (os.running) {
        termPrint([`<span class="success">  ✓ OpenRouter online — ${os.models.length} free models available</span>`,
        ...os.models.slice(0, 10).map(m => `<span class="output">  • ${m.name} (${m.context ? Math.round(m.context / 1024) + 'K ctx' : ''})</span>`)]);
      } else { termPrint(['<span class="error">  ✗ OpenRouter unreachable. Check internet connection.</span>']); }
    });
  } else {
    termPrint([`<span class="error">  Unknown command: ${escapeHtml(cmd)}. Type 'help' for available commands.</span>`]);
  }
}

// ============================================
// STATUS (Editable)
// ============================================

function renderStatus() {
  const el = document.getElementById('view-status');
  const cfg = getStatusConfig();
  const mdls = getModels();

  el.innerHTML = `
    <div class="section-header"><div class="section-title">⚡ System Status</div><button class="btn btn-small btn-danger" onclick="resetEverything()">🔄 Reset All</button></div>
    <div class="status-grid">
      <div class="status-panel">
        <div class="status-panel-title">🔌 Gateway</div>
        <div class="status-row"><span class="status-key">Status</span><span class="status-val ok">● Running</span></div>
        <div class="status-row"><span class="status-key">Port</span><span class="status-val editable" onclick="editStatusField('gateway.port','${cfg.gateway.port}')">${cfg.gateway.port} ✏️</span></div>
        <div class="status-row"><span class="status-key">Mode</span><span class="status-val editable" onclick="editStatusField('gateway.mode','${cfg.gateway.mode}')">${cfg.gateway.mode} ✏️</span></div>
        <div class="status-row"><span class="status-key">Auth</span><span class="status-val">${cfg.gateway.auth}</span></div>
        <div class="status-row"><span class="status-key">Version</span><span class="status-val">${cfg.version}</span></div>
      </div>
      <div class="status-panel">
        <div class="status-panel-title">📡 Channels</div>
        <div class="status-row"><span class="status-key">Telegram</span><span class="status-val ${cfg.channels.telegram ? 'ok' : 'err'} editable" onclick="toggleChannel('telegram')">${cfg.channels.telegram ? '● Connected' : '○ Disabled'} ⟲</span></div>
        <div class="status-row"><span class="status-key">Discord</span><span class="status-val ${cfg.channels.discord ? 'ok' : 'warn'} editable" onclick="toggleChannel('discord')">${cfg.channels.discord ? '● Connected' : '○ Disabled'} ⟲</span></div>
      </div>
      <div class="status-panel">
        <div class="status-panel-title">🧠 Primary Model <button class="btn-icon" onclick="editPrimaryModel()">✏️</button></div>
        <div class="status-row"><span class="status-key">Model</span><span class="status-val ok">${cfg.primaryModel}</span></div>
        <div class="status-row"><span class="status-key">Context</span><span class="status-val">262K tokens</span></div>
        <div class="status-row"><span class="status-key">Provider</span><span class="status-val">OpenRouter (Free)</span></div>
      </div>
      <div class="status-panel">
        <div class="status-panel-title">⚡ Models <button class="btn-icon" onclick="showAddModelModal()">＋</button></div>
        ${mdls.map(m => `<div class="status-row">
          <span class="status-key editable" onclick="showEditModelModal('${m.id}')">${m.name} ✏️</span>
          <span class="status-val ok">${m.provider}${m.context ? ` · ${m.context}` : ''}${m.reasoning ? ' · 🧠' : ''}</span>
        </div>`).join('')}
      </div>
      <div class="status-panel" id="ollama-status-panel">
        <div class="status-panel-title">🌐 OpenRouter API</div>
        <div class="status-row"><span class="status-key">Status</span><span class="status-val" id="ollama-status-val">Checking...</span></div>
        <div id="ollama-models-list"></div>
      </div>
      <div class="status-panel">
        <div class="status-panel-title">🧪 Identity</div>
        <div class="status-row"><span class="status-key">COO</span><span class="status-val">Claude ☠️</span></div>
        <div class="status-row"><span class="status-key">Creature</span><span class="status-val">AI co-pilot</span></div>
        <div class="status-row"><span class="status-key">Agents</span><span class="status-val">${getAgents().length}</span></div>
      </div>
      <div class="status-panel">
        <div class="status-panel-title">👤 Operator</div>
        <div class="status-row"><span class="status-key">Name</span><span class="status-val">Ansh</span></div>
        <div class="status-row"><span class="status-key">Role</span><span class="status-val">Co-founder & CTO</span></div>
        <div class="status-row"><span class="status-key">Company</span><span class="status-val">C3</span></div>
        <div class="status-row"><span class="status-key">Timezone</span><span class="status-val">Asia/Calcutta</span></div>
      </div>
    </div>
  `;
  // Async: check OpenRouter API
  fetchOpenRouterStatus().then(os => {
    const sv = document.getElementById('ollama-status-val');
    const ml = document.getElementById('ollama-models-list');
    if (!sv) return;
    if (os.running) {
      sv.innerHTML = '<span class="ok">● Connected</span>';
      ml.innerHTML = os.models.slice(0, 8).map(m => {
        return `<div class="status-row"><span class="status-key">${m.name}</span><span class="status-val">${m.context ? Math.round(m.context / 1024) + 'K' : ''}</span></div>`;
      }).join('');
    } else {
      sv.innerHTML = '<span class="err">○ Offline</span>';
      ml.innerHTML = '<div class="status-row"><span class="status-key" style="color:var(--text-dim)">Check internet connection</span></div>';
    }
  });
}

window.editStatusField = (path, current) => {
  showModal(`Edit: ${path}`, `
    <label class="form-label">Value<input class="form-input" name="value" required value="${current}"></label>
  `, d => {
    const parts = path.split('.');
    const cfg = getStatusConfig();
    if (parts.length === 2) {
      if (!cfg[parts[0]]) cfg[parts[0]] = {};
      cfg[parts[0]][parts[1]] = isNaN(d.value) ? d.value : parseInt(d.value);
    }
    updateStatusConfig(cfg);
    renderStatus();
  });
};
window.toggleChannel = (ch) => {
  const cfg = getStatusConfig();
  cfg.channels[ch] = !cfg.channels[ch];
  updateStatusConfig(cfg);
  renderStatus();
};
window.editPrimaryModel = () => {
  const cfg = getStatusConfig();
  showModal('Primary Model', `
    <label class="form-label">Model ID<input class="form-input" name="primaryModel" required value="${cfg.primaryModel}"></label>
  `, d => { updateStatusConfig({ primaryModel: d.primaryModel }); renderStatus(); });
};
window.resetEverything = () => {
  confirmAction('Reset ALL data to defaults?', () => { resetAllData().then(() => { renderDashboard(); renderOrgChart(); renderComms(); renderStatus(); }); });
};

// ============================================
// OFFICE CHAT PANEL
// ============================================

let officeChatTargetId = null;
let officeChatMsgs = [];

function injectOfficeChat() {
  const viewEl = document.getElementById('view-office');
  if (!viewEl || viewEl.querySelector('.office-chat')) return;
  const chatPanel = document.createElement('div');
  chatPanel.className = 'office-chat';
  chatPanel.innerHTML = `
    <div class="office-chat-header">
      <span class="office-chat-title">💬 Agent Chat</span>
      <div style="display:flex;gap:4px;">
        <button class="btn-icon-tiny" onclick="broadcastToAll()" title="Broadcast to all agents">📢</button>
        <button class="btn-icon-tiny" onclick="toggleOfficeChat()" title="Minimize">▼</button>
      </div>
    </div>
    <div class="office-chat-body" id="office-chat-body"></div>
    <div class="office-chat-input">
      <select id="office-chat-agent" class="form-input" style="width:130px;font-size:10px;padding:4px;">
        <option value="__claude__">☠️ Claude (COO)</option>
        <option value="__all__">📢 All Agents</option>
        <optgroup label="Individual Agents">
          ${getAgents().map(a => `<option value="${a.id}">${a.emoji} ${a.name}</option>`).join('')}
        </optgroup>
      </select>
      <input type="text" id="office-chat-input" class="form-input" placeholder="Talk to agents..." style="flex:1;font-size:11px;padding:6px;" onkeydown="if(event.key==='Enter')sendOfficeChat()">
      <button class="btn btn-small btn-primary" onclick="sendOfficeChat()" style="padding:4px 8px;">→</button>
    </div>
  `;
  viewEl.appendChild(chatPanel);
  viewEl.classList.add('has-chat');

  // Restore chat history display
  const body = document.getElementById('office-chat-body');
  const agents = getAgents();
  for (const [agentId, msgs] of Object.entries(chatHistory)) {
    const agent = agents.find(a => a.id === agentId);
    if (!agent || msgs.length === 0) continue;
    for (const m of msgs.slice(-4)) {
      if (m.role === 'user') {
        body.innerHTML += `<div class="chat-msg chat-user"><span class="chat-sender">You</span>${escapeHtml(m.content)}</div>`;
      } else {
        body.innerHTML += `<div class="chat-msg chat-agent"><span class="chat-sender">${agent.emoji} ${agent.name}</span>${escapeHtml(m.content)}</div>`;
      }
    }
  }
  if (body.innerHTML) body.scrollTop = body.scrollHeight;
}

// Proximity chat: press E or click Talk near an agent
window.talkToNearbyAgent = (agentId) => {
  const sel = document.getElementById('office-chat-agent');
  const inp = document.getElementById('office-chat-input');
  const chat = document.querySelector('.office-chat');
  if (sel) sel.value = agentId;
  if (chat) chat.classList.remove('minimized');
  if (inp) { inp.focus(); inp.placeholder = `Talk to ${agentId}...`; }
};

window.toggleOfficeChat = () => {
  const chat = document.querySelector('.office-chat');
  if (chat) chat.classList.toggle('minimized');
};

window.sendOfficeChat = async () => {
  const inp = document.getElementById('office-chat-input');
  const sel = document.getElementById('office-chat-agent');
  const body = document.getElementById('office-chat-body');
  const msg = inp.value.trim();
  if (!msg) return;
  inp.value = '';

  const mode = sel.value;

  // Show user message
  body.innerHTML += `<div class="chat-msg chat-user"><span class="chat-sender">You</span>${escapeHtml(msg)}</div>`;
  body.scrollTop = body.scrollHeight;

  if (mode === '__all__') {
    // BROADCAST to all agents
    await broadcastMessage(msg);
  } else if (mode === '__claude__') {
    // DELEGATE through Claude COO
    await delegateThroughClaude(msg);
  } else {
    // Single agent chat
    const agent = getAgents().find(a => a.id === mode);
    if (!agent) return;
    await chatToSingleAgent(agent, msg);
  }
};

async function chatToSingleAgent(agent, msg) {
  const body = document.getElementById('office-chat-body');
  const typingEl = document.createElement('div');
  typingEl.className = 'chat-msg chat-agent';
  typingEl.innerHTML = `<span class="chat-sender">${agent.emoji} ${agent.name}</span><span class="chat-typing">typing...</span>`;
  body.appendChild(typingEl);
  body.scrollTop = body.scrollHeight;

  if (!chatHistory[agent.id]) chatHistory[agent.id] = [];
  chatHistory[agent.id].push({ role: 'user', content: msg });

  const fullText = await chatWithAgent(agent, msg, chatHistory[agent.id], (chunk, soFar) => {
    typingEl.innerHTML = `<span class="chat-sender">${agent.emoji} ${agent.name}</span>${escapeHtml(soFar)}`;
    body.scrollTop = body.scrollHeight;
  });

  chatHistory[agent.id].push({ role: 'assistant', content: fullText });
  saveChatHistory();
  addComm({ agent: agent.name, role: agent.role, division: agent.division, time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }), body: fullText });
}

async function delegateThroughClaude(msg) {
  const body = document.getElementById('office-chat-body');
  const agents = getAgents();

  // Claude analyzes and picks the best agent
  const claudeEl = document.createElement('div');
  claudeEl.className = 'chat-msg chat-agent';
  claudeEl.innerHTML = `<span class="chat-sender" style="color:var(--amber)">☠️ Claude (COO)</span><span class="chat-typing">analyzing task...</span>`;
  body.appendChild(claudeEl);
  body.scrollTop = body.scrollHeight;

  // Build a delegation prompt
  const agentList = agents.map(a => `${a.name} (${a.role}, ${a.division})`).join(', ');
  const delegationPrompt = `You are Claude, the COO of C3. The CEO Ansh says: "${msg}"

Available agents: ${agentList}

Analyze the task and respond in this format:
DELEGATE: [agent name]
REASON: [1 sentence why]
INSTRUCTION: [specific task instruction for that agent]

If the task needs multiple agents, pick the most relevant lead agent.`;

  // Use a fast model for Claude's decision
  const claudeAgent = { name: 'Claude', emoji: '☠️', role: 'COO', division: 'leadership', anime: 'C3', model: 'stepfun/step-3.5-flash:free', power: 'Orchestration' };

  const response = await chatWithAgent(claudeAgent, delegationPrompt, [], null);
  claudeEl.innerHTML = `<span class="chat-sender" style="color:var(--amber)">☠️ Claude (COO)</span>${escapeHtml(response)}`;
  body.scrollTop = body.scrollHeight;

  // Try to parse delegation
  const delegateMatch = response.match(/DELEGATE:\s*(\w+)/i);
  if (delegateMatch) {
    const targetName = delegateMatch[1].toLowerCase();
    const target = agents.find(a => a.name.toLowerCase() === targetName || a.id === targetName);
    if (target) {
      // Extract instruction or use original msg
      const instrMatch = response.match(/INSTRUCTION:\s*(.+)/i);
      const instruction = instrMatch ? instrMatch[1].trim() : msg;
      await chatToSingleAgent(target, instruction);
    }
  }

  addComm({ agent: 'Claude', role: 'COO', division: 'leadership', time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }), body: response });
}

async function broadcastMessage(msg) {
  const body = document.getElementById('office-chat-body');
  const agents = getAgents();

  // Header
  body.innerHTML += `<div class="chat-msg" style="background:rgba(232,197,71,0.08);border:1px solid rgba(232,197,71,0.2);text-align:center;font-size:10px;color:var(--amber);">📢 Broadcasting to ${agents.length} agents...</div>`;

  // Send to all agents in parallel batches of 3
  const batchSize = 3;
  for (let i = 0; i < agents.length; i += batchSize) {
    const batch = agents.slice(i, i + batchSize);
    await Promise.all(batch.map(async (agent) => {
      const el = document.createElement('div');
      el.className = 'chat-msg chat-agent';
      el.innerHTML = `<span class="chat-sender">${agent.emoji} ${agent.name}</span><span class="chat-typing">typing...</span>`;
      body.appendChild(el);
      body.scrollTop = body.scrollHeight;

      const reply = await chatWithAgent(agent, msg, [], (chunk, soFar) => {
        el.innerHTML = `<span class="chat-sender">${agent.emoji} ${agent.name}</span>${escapeHtml(soFar)}`;
        body.scrollTop = body.scrollHeight;
      });

      addComm({ agent: agent.name, role: agent.role, division: agent.division, time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }), body: reply });
    }));
  }

  body.innerHTML += `<div class="chat-msg" style="background:rgba(100,255,100,0.06);border:1px solid rgba(100,255,100,0.15);text-align:center;font-size:10px;color:var(--green);">✅ All ${agents.length} agents responded</div>`;
  body.scrollTop = body.scrollHeight;
}

window.broadcastToAll = () => {
  const inp = document.getElementById('office-chat-input');
  const sel = document.getElementById('office-chat-agent');
  if (sel) sel.value = '__all__';
  if (inp) { inp.focus(); inp.placeholder = 'Type message to broadcast to ALL agents...'; }
};

// ============================================
// AGENT VOICE CALL
// ============================================

function renderCall() {
  const el = document.getElementById('view-call');
  if (!el) return;
  const agts = getAgents();
  el.innerHTML = `
    <div class="section-header"><div class="section-title">📞 Agent Voice Call</div><div class="section-subtitle">1-on-1 voice conversation</div></div>
    <div class="call-container">
      <div class="call-agent-grid">
        ${agts.map(a => `
          <button class="call-agent-btn ${activeCallAgent?.id === a.id ? 'active' : ''}" onclick="startCall('${a.id}')">
            <span class="call-agent-emoji">${a.emoji}</span>
            <span class="call-agent-name">${a.name}</span>
            <span class="call-agent-role">${a.role}</span>
          </button>
        `).join('')}
      </div>
      <div class="call-area" id="call-area">
        ${activeCallAgent ? `
          <div class="call-active">
            <div class="call-avatar-ring pulsing">
              <div class="call-avatar">${activeCallAgent.emoji}</div>
            </div>
            <div class="call-name">${activeCallAgent.name}</div>
            <div class="call-role">${activeCallAgent.role}</div>
            <div class="call-model">${activeCallAgent.model}</div>
            <div class="call-status" id="call-status" style="font-size:10px;color:var(--green);margin:8px 0;">🟢 Connected</div>
            <div class="call-transcript" id="call-transcript"></div>
            <div class="call-controls">
              <button class="call-btn hangup" onclick="endCall()">📵 End Call</button>
            </div>
          </div>
        ` : `
          <div class="call-placeholder">
            <div class="call-placeholder-icon">📞</div>
            <div class="call-placeholder-text">Select an agent to start a voice call</div>
            <div class="call-placeholder-sub">Uses OpenRouter + Web Speech API</div>
          </div>
        `}
      </div>
    </div>
  `;
}

window.startCall = (agentId) => {
  const agent = getAgents().find(a => a.id === agentId);
  if (!agent) return;
  activeCallAgent = agent;
  if (!chatHistory[agentId]) chatHistory[agentId] = [];
  renderCall();

  const greeting = agentId === 'claude'
    ? `Hey Ansh, Claude here. Your COO is ready. Tell me what needs to be done and I'll delegate to the right agent.`
    : `Hey Ansh, it's ${agent.name}. What's up?`;

  const transcript = document.getElementById('call-transcript');
  if (transcript) transcript.innerHTML = `<div class="chat-msg chat-agent"><span class="chat-sender">${agent.emoji} ${agent.name}</span>${escapeHtml(greeting)}</div>`;
  speak(greeting, agentId).then(() => {
    if (activeCallAgent) startCallListening();
  });
};

let _callListenRetries = 0;

function startCallListening() {
  if (!activeCallAgent) return;

  const transcript = document.getElementById('call-transcript');
  const statusEl = document.getElementById('call-status');
  if (statusEl) statusEl.textContent = '🎤 Listening...';

  let gotSpeech = false;

  callRecognition = startListening(
    (text, isFinal) => {
      if (!activeCallAgent) return;
      gotSpeech = true;
      _callListenRetries = 0;

      let userBubble = transcript?.querySelector('.call-user-interim');
      if (!userBubble && transcript) {
        userBubble = document.createElement('div');
        userBubble.className = 'chat-msg chat-user call-user-interim';
        transcript.appendChild(userBubble);
      }
      if (userBubble) {
        userBubble.innerHTML = `<span class="chat-sender">You</span>${escapeHtml(text)}`;
        transcript.scrollTop = transcript.scrollHeight;
      }

      if (isFinal && text.trim()) {
        if (userBubble) userBubble.classList.remove('call-user-interim');
        callRecognition = null;

        const agent = activeCallAgent;
        const agentId = agent.id;
        chatHistory[agentId] = chatHistory[agentId] || [];
        chatHistory[agentId].push({ role: 'user', content: text.trim() });

        if (statusEl) statusEl.textContent = '🤔 Thinking...';
        const agentBubble = document.createElement('div');
        agentBubble.className = 'chat-msg chat-agent';
        agentBubble.innerHTML = `<span class="chat-sender">${agent.emoji} ${agent.name}</span><span class="chat-typing">thinking...</span>`;
        if (transcript) {
          transcript.appendChild(agentBubble);
          transcript.scrollTop = transcript.scrollHeight;
        }

        if (agentId === 'claude') {
          handleClaudeCallDelegation(agent, text.trim(), transcript, statusEl, agentBubble);
        } else {
          chatWithAgent(agent, text.trim(), chatHistory[agentId]).then(response => {
            chatHistory[agentId].push({ role: 'assistant', content: response });
            agentBubble.innerHTML = `<span class="chat-sender">${agent.emoji} ${agent.name}</span>${escapeHtml(response)}`;
            if (transcript) transcript.scrollTop = transcript.scrollHeight;
            if (statusEl) statusEl.textContent = '🔊 Speaking...';
            speak(response, agentId).then(() => {
              _callListenRetries = 0;
              if (activeCallAgent) startCallListening();
            });
          });
        }
      }
    },
    () => {
      callRecognition = null;
      if (activeCallAgent && !gotSpeech) {
        _callListenRetries++;
        // Wait longer between retries to avoid spamming
        const delay = Math.min(_callListenRetries * 1500, 5000);
        if (statusEl) statusEl.textContent = '🎤 Reconnecting mic...';
        setTimeout(() => { if (activeCallAgent) startCallListening(); }, delay);
      }
    }
  );
};

// Claude delegation during voice calls
async function handleClaudeCallDelegation(claude, userMsg, transcript, statusEl, claudeBubble) {
  const agents = getAgents().filter(a => a.id !== 'claude');
  const agentList = agents.map(a => `${a.name} (${a.role}, ${a.division})`).join(', ');

  if (statusEl) statusEl.textContent = '☠️ Claude analyzing task...';

  const delegationPrompt = `You are Claude, the COO of C3. The CEO Ansh says: "${userMsg}"

Available agents: ${agentList}

Analyze the task and respond in this EXACT format:
DELEGATE: [agent name]
REASON: [1 sentence why this agent is best]
INSTRUCTION: [specific task instruction for that agent]

If the task is a question for you directly, just respond naturally without the DELEGATE format.`;

  const delegationResponse = await chatWithAgent(claude, delegationPrompt, [], null);
  chatHistory['claude'] = chatHistory['claude'] || [];
  chatHistory['claude'].push({ role: 'user', content: userMsg });
  chatHistory['claude'].push({ role: 'assistant', content: delegationResponse });

  // Update Claude's bubble
  claudeBubble.innerHTML = `<span class="chat-sender">☠️ Claude</span>${escapeHtml(delegationResponse)}`;
  if (transcript) transcript.scrollTop = transcript.scrollHeight;

  // Try to parse the delegation
  const delegateMatch = delegationResponse.match(/DELEGATE:\s*(\w+)/i);
  if (delegateMatch) {
    const targetName = delegateMatch[1].toLowerCase();
    const target = agents.find(a => a.name.toLowerCase() === targetName || a.id === targetName);

    if (target) {
      const instrMatch = delegationResponse.match(/INSTRUCTION:\s*(.+)/i);
      const instruction = instrMatch ? instrMatch[1].trim() : userMsg;

      // Speak Claude's delegation decision
      const reasonMatch = delegationResponse.match(/REASON:\s*(.+)/i);
      const reason = reasonMatch ? reasonMatch[1].trim() : '';
      const claudeSpeech = `I'm delegating this to ${target.name}. ${reason}. Let me get their response.`;

      if (statusEl) statusEl.textContent = `📡 Delegating to ${target.name}...`;
      await speak(claudeSpeech, 'claude');

      // Show agent working
      const agentBubble = document.createElement('div');
      agentBubble.className = 'chat-msg chat-agent';
      agentBubble.innerHTML = `<span class="chat-sender">${target.emoji} ${target.name}</span><span class="chat-typing">working on it...</span>`;
      if (transcript) {
        transcript.appendChild(agentBubble);
        transcript.scrollTop = transcript.scrollHeight;
      }

      if (statusEl) statusEl.textContent = `🤔 ${target.name} is thinking...`;

      // Get the agent's actual response
      const agentResponse = await chatWithAgent(target, instruction, [], null);
      agentBubble.innerHTML = `<span class="chat-sender">${target.emoji} ${target.name}</span>${escapeHtml(agentResponse)}`;
      if (transcript) transcript.scrollTop = transcript.scrollHeight;

      // Log to comms
      addComm({ agent: 'Claude', role: 'COO', division: 'leadership', time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }), body: `Delegated to ${target.name}: ${instruction}` });
      addComm({ agent: target.name, role: target.role, division: target.division, time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }), body: agentResponse });

      // Claude summarizes back
      const summary = `${target.name} says: ${agentResponse.length > 200 ? agentResponse.substring(0, 200) + '...' : agentResponse}`;
      if (statusEl) statusEl.textContent = '🔊 Claude reporting back...';
      await speak(summary, 'claude');

      // Resume listening
      if (activeCallAgent && !callMuted) startCallListening();
      return;
    }
  }

  // No delegation — Claude responded directly
  if (statusEl) statusEl.textContent = '🔊 Claude speaking...';
  addComm({ agent: 'Claude', role: 'COO', division: 'leadership', time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }), body: delegationResponse });
  await speak(delegationResponse, 'claude');
  if (activeCallAgent && !callMuted) startCallListening();
}

window.endCall = () => {
  if (callRecognition) { callRecognition.stop(); callRecognition = null; }
  stopSpeaking();
  activeCallAgent = null;
  callMuted = false;
  renderCall();
};

// Standup voice
let standupMicActive = false;
window.toggleStandupMic = () => {
  const btn = document.getElementById('standup-mic-btn');
  const inp = document.getElementById('standup-input');
  if (standupMicActive) {
    standupMicActive = false;
    if (btn) btn.textContent = '🎤';
    return;
  }
  standupMicActive = true;
  if (btn) btn.textContent = '🔴';
  startListening(
    (text, isFinal) => { if (inp) inp.value = text; },
    () => { standupMicActive = false; if (btn) btn.textContent = '🎤'; }
  );
};

// ============================================
// UTILS
// ============================================

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ============================================
// INIT
// ============================================

async function init() {
  await runBootSequence();
  await initData();
  initNavigation();

  // Init hacker house as default view
  office = new HackerHouse(document.getElementById('view-office'));
  office.init();
  setTimeout(() => injectOfficeChat(), 500);

  // Pre-render other views
  renderDashboard();
  renderOrgChart();
  renderTerminal();
}

init();
