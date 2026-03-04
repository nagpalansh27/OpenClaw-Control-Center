'use client';
import { useState, useEffect } from 'react';

const BOOT_MESSAGES = [
    { text: '[C3] Initializing Control Centre v2.0...', cls: 'log-info' },
    { text: '[CORE] Loading agent roster... 18 agents found', cls: 'log-ok' },
    { text: '[HOUSE] Starting Hacker House virtual office...', cls: 'log-ok' },
    { text: '[SYS] Reading ~/.openclaw/openclaw.json...', cls: 'log-info' },
    { text: '[MODEL] kimi-k2.5:cloud loaded ✓', cls: 'log-ok' },
    { text: '[CHAN] Telegram: active ✓ | Discord: standby ⚠', cls: 'log-warn' },
    { text: '[MEM] localStorage restored ✓', cls: 'log-ok' },
    { text: '[STANDUP] Meeting room ready ✓', cls: 'log-ok' },
    { text: '', cls: 'log-info' },
    { text: '☠️  C3 v2 READY — Welcome to the Hacker House', cls: 'log-ok' },
];

export default function BootScreen() {
    const [booted, setBooted] = useState(false);
    const [messages, setMessages] = useState([]);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        // Only run boot sequence once per session
        if (sessionStorage.getItem('c3_booted')) {
            setBooted(true);
            return;
        }

        let isCancelled = false;
        const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

        async function runSequence() {
            for (let i = 0; i < BOOT_MESSAGES.length; i++) {
                if (isCancelled) return;
                const m = BOOT_MESSAGES[i];

                setMessages((prev) => {
                    const next = [...prev, m];
                    if (next.length > 8) return next.slice(next.length - 8);
                    return next;
                });

                setProgress(((i + 1) / BOOT_MESSAGES.length) * 100);
                await sleep(50 + Math.random() * 60);
            }

            await sleep(300);
            if (!isCancelled) {
                setBooted(true);
                sessionStorage.setItem('c3_booted', 'true');
            }
        }

        runSequence();

        return () => {
            isCancelled = true;
        };
    }, []);

    if (booted) return null;

    return (
        <div id="boot-screen" className={booted ? 'fade-out' : ''}>
            <div className="boot-content">
                <div className="boot-logo">☠️</div>
                <div className="boot-title">C3</div>
                <div className="boot-subtitle">CONTROL CENTRE</div>
                <div className="boot-progress">
                    <div className="boot-progress-bar" style={{ width: `${progress}%` }}></div>
                </div>
                <div className="boot-log" id="boot-log">
                    {messages.map((m, idx) => (
                        <div key={idx} className={`log-line ${m.cls}`}>
                            {m.text}
                        </div>
                    ))}
                </div>
            </div>
            <div className="scanline-overlay"></div>
        </div>
    );
}
