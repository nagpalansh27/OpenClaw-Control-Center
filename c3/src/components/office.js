/* ============================================
   C3 - OPEN FLOOR HACKER HOUSE
   No walls, compact, chat replaces CEO section
   ============================================ */
import { getAgents, DIVISIONS } from '../services/data.js';
import { CHAR_PALETTES, drawCharSprite } from './sprites.js';

const TS = 32; // tile size
const V = 0, F = 1, W = 2, CA = 3;
const MAP_W = 14, MAP_H = 14; // compact square

function makeMap() {
    const m = Array.from({ length: MAP_H }, () => Array(MAP_W).fill(F));
    for (let x = 0; x < MAP_W; x++) { m[0][x] = W; m[MAP_H - 1][x] = W; }
    for (let y = 0; y < MAP_H; y++) { m[y][0] = W; m[y][MAP_W - 1] = W; }
    // Carpet zones
    for (let y = 1; y <= 6; y++) for (let x = 1; x <= 6; x++) m[y][x] = CA;
    for (let y = 1; y <= 6; y++) for (let x = 7; x <= 12; x++) m[y][x] = CA;
    for (let y = 7; y <= 12; y++) for (let x = 1; x <= 6; x++) m[y][x] = CA;
    for (let y = 7; y <= 12; y++) for (let x = 7; x <= 12; x++) m[y][x] = CA;
    return m;
}
const MAP = makeMap();

const FURNITURE = [
    // Core (top-left)
    { x: 1, y: 2, type: 'desk' }, { x: 2, y: 2, type: 'monitor' },
    { x: 4, y: 2, type: 'desk' }, { x: 5, y: 2, type: 'monitor' },
    { x: 1, y: 4, type: 'desk' }, { x: 2, y: 4, type: 'monitor' },
    { x: 4, y: 4, type: 'desk' }, { x: 5, y: 4, type: 'monitor' },
    // Growth (top-right)
    { x: 8, y: 2, type: 'desk' }, { x: 9, y: 2, type: 'monitor' },
    { x: 11, y: 2, type: 'desk' }, { x: 12, y: 2, type: 'monitor' },
    { x: 8, y: 4, type: 'desk' }, { x: 9, y: 4, type: 'monitor' },
    { x: 11, y: 4, type: 'desk' }, { x: 12, y: 4, type: 'monitor' },
    // Ops (bottom-left)
    { x: 1, y: 9, type: 'desk' }, { x: 2, y: 9, type: 'monitor' },
    { x: 4, y: 9, type: 'desk' }, { x: 5, y: 9, type: 'monitor' },
    { x: 1, y: 11, type: 'desk' }, { x: 2, y: 11, type: 'monitor' },
    // Creative+Bots (bottom-right)
    { x: 8, y: 9, type: 'desk' }, { x: 9, y: 9, type: 'monitor' },
    { x: 11, y: 9, type: 'desk' }, { x: 12, y: 9, type: 'monitor' },
    { x: 8, y: 11, type: 'server' }, { x: 9, y: 11, type: 'server' },
    { x: 11, y: 11, type: 'desk' }, { x: 12, y: 11, type: 'monitor' },
    // Decor
    { x: 6, y: 6, type: 'plant' }, { x: 7, y: 6, type: 'coffee' },
    { x: 6, y: 12, type: 'plant' }, { x: 12, y: 12, type: 'plant' },
];

const ROOM_LABELS = [
    { x: 1, y: 1, label: '🛡️ Core', color: '#ff6b35' },
    { x: 8, y: 1, label: '⚔️ Growth', color: '#ff9f43' },
    { x: 1, y: 8, label: '🔧 Ops', color: '#b44dff' },
    { x: 8, y: 8, label: '🎨 Creative + 🤖 Bots', color: '#00d4ff' },
];

const WALKABLE = new Set([F, CA]);

function drawFurniture(ctx, fx, fy, type, frame) {
    const x = fx * TS, y = fy * TS;
    switch (type) {
        case 'desk':
            ctx.fillStyle = '#5a4a3a'; ctx.fillRect(x + 2, y + 6, TS - 4, TS - 8);
            ctx.fillStyle = '#7a6a5a'; ctx.fillRect(x + 2, y + 6, TS - 4, 3);
            break;
        case 'monitor':
            ctx.fillStyle = '#2a2a3a'; ctx.fillRect(x + 4, y + 2, TS - 8, TS - 10);
            ctx.fillStyle = `hsl(${200 + Math.sin(frame * 0.02 + fx) * 20},80%,${40 + Math.sin(frame * 0.03 + fy) * 10}%)`;
            ctx.globalAlpha = 0.6; ctx.fillRect(x + 5, y + 3, TS - 10, TS - 13); ctx.globalAlpha = 1;
            ctx.fillStyle = '#3a3a4a'; ctx.fillRect(x + TS / 2 - 2, y + TS - 8, 4, 4);
            break;
        case 'plant':
            ctx.fillStyle = '#5a4030'; ctx.fillRect(x + 8, y + TS - 8, TS - 16, 8);
            ctx.fillStyle = '#22c55e';
            ctx.beginPath(); ctx.arc(x + TS / 2, y + TS / 2 - 2, 7, 0, Math.PI * 2); ctx.fill();
            break;
        case 'server':
            ctx.fillStyle = '#1a1a2e'; ctx.fillRect(x + 3, y + 1, TS - 6, TS - 2);
            ctx.fillStyle = '#2a2a4a'; ctx.fillRect(x + 4, y + 2, TS - 8, TS - 4);
            for (let i = 0; i < 3; i++) {
                ctx.fillStyle = Math.sin(frame * 0.08 + i * 2 + fx) > 0 ? '#24e08a' : '#1a3a1a';
                ctx.fillRect(x + 6, y + 4 + i * 7, 4, 3);
            }
            break;
        case 'coffee':
            ctx.fillStyle = '#4a3a2a'; ctx.fillRect(x + 6, y + 8, TS - 12, TS - 10);
            ctx.fillStyle = '#7a6a5a'; ctx.fillRect(x + 6, y + 6, TS - 12, 4);
            break;
    }
}

function getFurnitureSet() {
    const s = new Set();
    for (const f of FURNITURE) s.add(`${f.x},${f.y}`);
    return s;
}

export class HackerHouse {
    constructor(container) {
        this.container = container;
        this.canvas = null; this.ctx = null;
        this.player = { x: 7, y: 7, dir: 'down', frame: 0 };
        this.npcs = []; this.keys = {};
        this.moveTimer = 0; this.tooltip = null;
        this.animFrame = 0; this.lastTime = 0;
        this.running = false; this.nearbyAgent = null;
        this.blocked = getFurnitureSet();
    }

    init() {
        this.container.innerHTML = `
      <div class="hh-wrapper">
        <div class="hh-header">
          <span class="hh-title">🏠 Hacker House</span>
          <span class="hh-controls">Arrow Keys to move</span>
        </div>
        <div class="hh-canvas-wrap"><canvas id="hh-canvas"></canvas>
          <div id="hh-tooltip" class="hh-tooltip hidden"></div>
        </div>
      </div>`;
        this.canvas = document.getElementById('hh-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.tooltip = document.getElementById('hh-tooltip');
        this.canvas.width = MAP_W * TS; this.canvas.height = MAP_H * TS;
        this.resize();
        this.placeAgents();
        this.bindKeys();
        this.running = true;
        this.loop(0);
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        // Fit the canvas to the available height, maintain aspect ratio
        const maxH = window.innerHeight - 80;
        const aspect = MAP_W / MAP_H;
        let h = maxH;
        let w = h * aspect;
        this.canvas.style.width = w + 'px';
        this.canvas.style.height = h + 'px';
    }

    placeAgents() {
        const agents = getAgents();
        const spots = {
            core: [{ x: 2, y: 3 }, { x: 5, y: 3 }, { x: 2, y: 5 }, { x: 5, y: 5 }],
            growth: [{ x: 9, y: 3 }, { x: 12, y: 3 }, { x: 9, y: 5 }, { x: 12, y: 5 }, { x: 10, y: 6 }, { x: 11, y: 6 }],
            creative: [{ x: 9, y: 10 }, { x: 12, y: 10 }],
            ops: [{ x: 2, y: 10 }, { x: 5, y: 10 }, { x: 2, y: 12 }],
            bots: [{ x: 9, y: 12 }, { x: 12, y: 12 }, { x: 11, y: 10 }],
        };
        this.npcs = [];
        const placed = {};
        for (const a of agents) {
            const divSpots = spots[a.division] || spots.core;
            const idx = (placed[a.division] || 0) % divSpots.length;
            placed[a.division] = (placed[a.division] || 0) + 1;
            const pos = divSpots[idx];
            this.npcs.push({ ...a, x: pos.x, y: pos.y, bob: Math.random() * 100 });
        }
    }

    bindKeys() {
        const h = (e, d) => {
            const k = e.key.toLowerCase();
            if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) {
                e.preventDefault(); this.keys[k] = d;
            }
            if (k === 'e' && d && this.nearbyAgent) {
                window.talkToNearbyAgent && window.talkToNearbyAgent(this.nearbyAgent.id);
            }
        };
        this._kd = e => h(e, true); this._ku = e => h(e, false);
        window.addEventListener('keydown', this._kd);
        window.addEventListener('keyup', this._ku);
    }

    getMove() {
        if (this.keys['arrowup']) return { dx: 0, dy: -1 };
        if (this.keys['arrowdown']) return { dx: 0, dy: 1 };
        if (this.keys['arrowleft']) return { dx: -1, dy: 0 };
        if (this.keys['arrowright']) return { dx: 1, dy: 0 };
        return null;
    }

    canWalk(x, y) {
        if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) return false;
        if (!WALKABLE.has(MAP[y][x])) return false;
        if (this.blocked.has(`${x},${y}`)) return false;
        if (this.npcs.find(n => n.x === x && n.y === y)) return false;
        return true;
    }

    update(dt) {
        this.moveTimer += dt;
        if (this.moveTimer > 130) {
            const mv = this.getMove();
            if (mv) {
                const nx = this.player.x + mv.dx, ny = this.player.y + mv.dy;
                if (this.canWalk(nx, ny)) { this.player.x = nx; this.player.y = ny; this.player.frame++; }
                this.moveTimer = 0;
            }
        }
        this.nearbyAgent = null;
        for (const n of this.npcs) {
            if (Math.abs(n.x - this.player.x) + Math.abs(n.y - this.player.y) <= 2) { this.nearbyAgent = n; break; }
        }
        if (this.nearbyAgent) {
            const a = this.nearbyAgent;
            this.tooltip.innerHTML = `<div class="hh-tip-name">${a.emoji} ${a.name}</div>
        <div class="hh-tip-role">${a.role}</div>
        <div class="hh-tip-status"><span class="status-dot ${a.status}"></span> ${a.status}</div>
        <button class="hh-tip-talk" onclick="window.talkToNearbyAgent && window.talkToNearbyAgent('${a.id}')">💬 Talk [E]</button>`;
            this.tooltip.classList.remove('hidden');
            const r = this.canvas.getBoundingClientRect();
            const s = r.width / this.canvas.width;
            this.tooltip.style.left = Math.min(a.x * TS * s + r.left, window.innerWidth - 220) + 'px';
            this.tooltip.style.top = Math.max(a.y * TS * s + r.top - 100, 10) + 'px';
        } else { this.tooltip.classList.add('hidden'); }
    }

    draw() {
        const ctx = this.ctx, ts = TS;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        for (let y = 0; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) {
            const t = MAP[y][x];
            if (t === W) {
                ctx.fillStyle = '#1e1e30'; ctx.fillRect(x * ts, y * ts, ts, ts);
                ctx.fillStyle = '#2a2a48'; ctx.fillRect(x * ts, y * ts, ts, 2);
            } else if (t === CA) {
                ctx.fillStyle = '#1a1a28'; ctx.fillRect(x * ts, y * ts, ts, ts);
                ctx.fillStyle = 'rgba(232,197,71,0.03)';
                if ((x + y) % 2 === 0) ctx.fillRect(x * ts, y * ts, ts, ts);
            } else {
                ctx.fillStyle = '#141420'; ctx.fillRect(x * ts, y * ts, ts, ts);
                ctx.strokeStyle = 'rgba(255,255,255,0.015)'; ctx.lineWidth = 0.5;
                ctx.strokeRect(x * ts, y * ts, ts, ts);
            }
        }

        ctx.font = 'bold 9px "Orbitron", sans-serif';
        for (const r of ROOM_LABELS) {
            ctx.fillStyle = r.color; ctx.globalAlpha = 0.6;
            ctx.fillText(r.label, r.x * ts, r.y * ts + ts - 2);
            ctx.globalAlpha = 1;
        }

        for (const f of FURNITURE) drawFurniture(ctx, f.x, f.y, f.type, this.animFrame);

        for (const n of this.npcs) {
            const cx = n.x * ts + ts / 2, cy = n.y * ts + ts / 2;
            const pal = CHAR_PALETTES[n.id] || CHAR_PALETTES.goku;
            drawCharSprite(ctx, cx, cy, n.id, pal, 'down', this.animFrame + n.bob);
            ctx.font = 'bold 7px "JetBrains Mono",monospace'; ctx.textAlign = 'center';
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            const tw = ctx.measureText(n.name).width;
            ctx.fillRect(cx - tw / 2 - 3, cy + 14, tw + 6, 10);
            ctx.fillStyle = '#e8e0cc'; ctx.fillText(n.name, cx, cy + 22);
            if (n === this.nearbyAgent) {
                ctx.strokeStyle = '#e8c547'; ctx.lineWidth = 1.5;
                ctx.globalAlpha = 0.4 + Math.sin(this.animFrame * 0.08) * 0.3;
                ctx.strokeRect(n.x * ts + 2, n.y * ts + 2, ts - 4, ts - 4);
                ctx.globalAlpha = 1;
            }
        }

        const px = this.player.x * ts + ts / 2, py = this.player.y * ts + ts / 2;
        const playerPal = { hair: '#1a1a2e', skin: '#f5c78a', top: '#e8c547', bottom: '#2d3748', accent: '#e8c547' };
        drawCharSprite(ctx, px, py, 'ansh', playerPal, 'down', this.animFrame);
        ctx.font = 'bold 7px "JetBrains Mono",monospace'; ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(232,197,71,0.7)';
        const ptw = ctx.measureText('Ansh (You)').width;
        ctx.fillRect(px - ptw / 2 - 3, py + 14, ptw + 6, 10);
        ctx.fillStyle = '#07070d'; ctx.fillText('Ansh (You)', px, py + 22);

        this.animFrame++;
    }

    loop(time) {
        if (!this.running) return;
        const dt = time - this.lastTime; this.lastTime = time;
        this.update(dt); this.draw();
        requestAnimationFrame(t => this.loop(t));
    }

    destroy() {
        this.running = false;
        if (this._kd) window.removeEventListener('keydown', this._kd);
        if (this._ku) window.removeEventListener('keyup', this._ku);
    }
}
