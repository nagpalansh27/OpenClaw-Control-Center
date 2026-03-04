'use client';
import { useEffect, useRef, useState } from 'react';
import { useData } from '@/lib/data';
import { CHAR_PALETTES, drawCharSprite } from '@/components/sprites';

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
    { x: 1, y: 2, type: 'desk' }, { x: 2, y: 2, type: 'monitor' },
    { x: 4, y: 2, type: 'desk' }, { x: 5, y: 2, type: 'monitor' },
    { x: 1, y: 4, type: 'desk' }, { x: 2, y: 4, type: 'monitor' },
    { x: 4, y: 4, type: 'desk' }, { x: 5, y: 4, type: 'monitor' },
    { x: 8, y: 2, type: 'desk' }, { x: 9, y: 2, type: 'monitor' },
    { x: 11, y: 2, type: 'desk' }, { x: 12, y: 2, type: 'monitor' },
    { x: 8, y: 4, type: 'desk' }, { x: 9, y: 4, type: 'monitor' },
    { x: 11, y: 4, type: 'desk' }, { x: 12, y: 4, type: 'monitor' },
    { x: 1, y: 9, type: 'desk' }, { x: 2, y: 9, type: 'monitor' },
    { x: 4, y: 9, type: 'desk' }, { x: 5, y: 9, type: 'monitor' },
    { x: 1, y: 11, type: 'desk' }, { x: 2, y: 11, type: 'monitor' },
    { x: 8, y: 9, type: 'desk' }, { x: 9, y: 9, type: 'monitor' },
    { x: 11, y: 9, type: 'desk' }, { x: 12, y: 9, type: 'monitor' },
    { x: 8, y: 11, type: 'server' }, { x: 9, y: 11, type: 'server' },
    { x: 11, y: 11, type: 'desk' }, { x: 12, y: 11, type: 'monitor' },
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
const BLOCKED = new Set(FURNITURE.map(f => `${f.x},${f.y}`));

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

export default function HackerHouse() {
    const canvasRef = useRef(null);
    const { agents, initialized } = useData();
    const [nearbyAgent, setNearbyAgent] = useState(null);
    const [tooltipPos, setTooltipPos] = useState({ left: 0, top: 0 });

    useEffect(() => {
        if (!initialized || !agents.length || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        canvas.width = MAP_W * TS;
        canvas.height = MAP_H * TS;

        let running = true;
        let animFrame = 0;
        let lastTime = 0;
        let moveTimer = 0;

        const player = { x: 7, y: 7, dir: 'down', frame: 0 };
        const keys = {};

        // Place Agents
        const spots = {
            core: [{ x: 2, y: 3 }, { x: 5, y: 3 }, { x: 2, y: 5 }, { x: 5, y: 5 }],
            growth: [{ x: 9, y: 3 }, { x: 12, y: 3 }, { x: 9, y: 5 }, { x: 12, y: 5 }, { x: 10, y: 6 }, { x: 11, y: 6 }],
            creative: [{ x: 9, y: 10 }, { x: 12, y: 10 }],
            ops: [{ x: 2, y: 10 }, { x: 5, y: 10 }, { x: 2, y: 12 }],
            bots: [{ x: 9, y: 12 }, { x: 12, y: 12 }, { x: 11, y: 10 }],
        };
        const npcs = [];
        const placed = {};
        for (const a of agents) {
            const divSpots = spots[a.division] || spots.core;
            const idx = (placed[a.division] || 0) % divSpots.length;
            placed[a.division] = (placed[a.division] || 0) + 1;
            const pos = divSpots[idx];
            npcs.push({ ...a, x: pos.x, y: pos.y, bob: Math.random() * 100 });
        }

        const handleKeyDown = (e) => {
            const k = e.key.toLowerCase();
            if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) {
                e.preventDefault(); keys[k] = true;
            }
        };

        const handleKeyUp = (e) => {
            const k = e.key.toLowerCase();
            if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) {
                keys[k] = false;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        const resize = () => {
            const maxH = window.innerHeight - 80;
            const aspect = MAP_W / MAP_H;
            let h = maxH;
            let w = h * aspect;
            if (canvas) {
                canvas.style.width = w + 'px';
                canvas.style.height = h + 'px';
            }
        };
        resize();
        window.addEventListener('resize', resize);

        const getMove = () => {
            if (keys['arrowup']) return { dx: 0, dy: -1 };
            if (keys['arrowdown']) return { dx: 0, dy: 1 };
            if (keys['arrowleft']) return { dx: -1, dy: 0 };
            if (keys['arrowright']) return { dx: 1, dy: 0 };
            return null;
        };

        const canWalk = (x, y) => {
            if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) return false;
            if (!WALKABLE.has(MAP[y][x])) return false;
            if (BLOCKED.has(`${x},${y}`)) return false;
            if (npcs.find(n => n.x === x && n.y === y)) return false;
            return true;
        };

        const update = (dt) => {
            moveTimer += dt;
            if (moveTimer > 130) {
                const mv = getMove();
                if (mv) {
                    const nx = player.x + mv.dx, ny = player.y + mv.dy;
                    if (canWalk(nx, ny)) { player.x = nx; player.y = ny; player.frame++; }
                    moveTimer = 0;
                }
            }

            let currentNearby = null;
            for (const n of npcs) {
                if (Math.abs(n.x - player.x) + Math.abs(n.y - player.y) <= 2) { currentNearby = n; break; }
            }

            setNearbyAgent(currentNearby);

            if (currentNearby) {
                const r = canvas.getBoundingClientRect();
                const s = r.width / canvas.width;
                setTooltipPos({
                    left: Math.min(currentNearby.x * TS * s + r.left, window.innerWidth - 220),
                    top: Math.max(currentNearby.y * TS * s + r.top - 100, 10)
                });
            }
        };

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (let y = 0; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) {
                const t = MAP[y][x];
                if (t === W) {
                    ctx.fillStyle = '#1e1e30'; ctx.fillRect(x * TS, y * TS, TS, TS);
                    ctx.fillStyle = '#2a2a48'; ctx.fillRect(x * TS, y * TS, TS, 2);
                } else if (t === CA) {
                    ctx.fillStyle = '#1a1a28'; ctx.fillRect(x * TS, y * TS, TS, TS);
                    ctx.fillStyle = 'rgba(232,197,71,0.03)';
                    if ((x + y) % 2 === 0) ctx.fillRect(x * TS, y * TS, TS, TS);
                } else {
                    ctx.fillStyle = '#141420'; ctx.fillRect(x * TS, y * TS, TS, TS);
                    ctx.strokeStyle = 'rgba(255,255,255,0.015)'; ctx.lineWidth = 0.5;
                    ctx.strokeRect(x * TS, y * TS, TS, TS);
                }
            }

            ctx.font = 'bold 9px "Orbitron", sans-serif';
            for (const r of ROOM_LABELS) {
                ctx.fillStyle = r.color; ctx.globalAlpha = 0.6;
                ctx.fillText(r.label, r.x * TS, r.y * TS + TS - 2);
                ctx.globalAlpha = 1;
            }

            for (const f of FURNITURE) drawFurniture(ctx, f.x, f.y, f.type, animFrame);

            for (const n of npcs) {
                const cx = n.x * TS + TS / 2, cy = n.y * TS + TS / 2;
                const pal = CHAR_PALETTES[n.id] || CHAR_PALETTES.goku;
                drawCharSprite(ctx, cx, cy, n.id, pal, 'down', animFrame + n.bob);
                ctx.font = 'bold 7px "JetBrains Mono",monospace'; ctx.textAlign = 'center';
                ctx.fillStyle = 'rgba(0,0,0,0.6)';
                const tw = ctx.measureText(n.name).width;
                ctx.fillRect(cx - tw / 2 - 3, cy + 14, tw + 6, 10);
                ctx.fillStyle = '#e8e0cc'; ctx.fillText(n.name, cx, cy + 22);
            }

            const px = player.x * TS + TS / 2, py = player.y * TS + TS / 2;
            const playerPal = { hair: '#1a1a2e', skin: '#f5c78a', top: '#e8c547', bottom: '#2d3748', accent: '#e8c547' };
            drawCharSprite(ctx, px, py, 'ansh', playerPal, 'down', animFrame);
            ctx.font = 'bold 7px "JetBrains Mono",monospace'; ctx.textAlign = 'center';
            ctx.fillStyle = 'rgba(232,197,71,0.7)';
            const ptw = ctx.measureText('Ansh (You)').width;
            ctx.fillRect(px - ptw / 2 - 3, py + 14, ptw + 6, 10);
            ctx.fillStyle = '#07070d'; ctx.fillText('Ansh (You)', px, py + 22);

            animFrame++;
        };

        const loop = (time) => {
            if (!running) return;
            const dt = time - lastTime; lastTime = time;
            update(dt); draw();
            requestAnimationFrame(loop);
        };

        requestAnimationFrame(loop);

        return () => {
            running = false;
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            window.removeEventListener('resize', resize);
        };
    }, [initialized, agents]);

    return (
        <div className="view-content active" style={{ display: 'flex' }}>
            <div className="hh-wrapper">
                <div className="hh-header">
                    <span className="hh-title">🏠 Hacker House</span>
                    <span className="hh-controls">Arrow Keys to move</span>
                </div>
                <div className="hh-canvas-wrap">
                    <canvas id="hh-canvas" ref={canvasRef}></canvas>
                    {nearbyAgent && (
                        <div
                            className="hh-tooltip"
                            style={{ left: `${tooltipPos.left}px`, top: `${tooltipPos.top}px` }}
                        >
                            <div className="hh-tip-name">{nearbyAgent.emoji} {nearbyAgent.name}</div>
                            <div className="hh-tip-role">{nearbyAgent.role}</div>
                            <div className="hh-tip-status">
                                <span className={`status-dot ${nearbyAgent.status}`}></span> {nearbyAgent.status}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
