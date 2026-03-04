'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
    const pathname = usePathname();

    const navItems = [
        { path: '/', id: 'office', icon: '🏠', label: 'Office', title: 'Hacker House' },
        { path: '/dashboard', id: 'dashboard', icon: '📊', label: 'Dashboard', title: 'Dashboard' },
        { path: '/orgchart', id: 'orgchart', icon: '🏛️', label: 'Org Chart', title: 'Org Chart' },
        { path: '/workspaces', id: 'workspace', icon: '📁', label: 'Agents', title: 'Workspaces' },
        { path: '/standup', id: 'standup', icon: '🎙️', label: 'Standup', title: 'Standup' },
        { path: '/comms', id: 'comms', icon: '💬', label: 'Comms', title: 'Comm Feed' },
        { path: '/terminal', id: 'terminal', icon: '⌨️', label: 'Terminal', title: 'Terminal' },
        { path: '/call', id: 'call', icon: '📞', label: 'Call', title: 'Voice Call' },
        { path: '/status', id: 'status', icon: '⚡', label: 'Status', title: 'System Status' },
    ];

    return (
        <nav className="sidebar">
            <div className="sidebar-logo">
                <div className="logo-icon">☠️</div>
                <div className="logo-text">C3</div>
            </div>
            <div className="sidebar-nav">
                {navItems.map((item) => (
                    <Link href={item.path} key={item.id} className={`nav-btn ${pathname === item.path ? 'active' : ''}`} title={item.title}>
                        <span className="nav-icon">{item.icon}</span><span className="nav-label">{item.label}</span>
                    </Link>
                ))}
            </div>
            <div className="sidebar-footer">
                <div className="gateway-indicator">
                    <span className="indicator-dot"></span>
                    <span className="indicator-text">Gateway</span>
                </div>
            </div>
        </nav>
    );
}
