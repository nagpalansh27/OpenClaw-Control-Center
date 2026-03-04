import './styles/reset.css';
import './styles/theme.css';
import './styles/components.css';
import { Inter, JetBrains_Mono, Orbitron } from 'next/font/google';
import Sidebar from '@/components/Sidebar';
import BootScreen from '@/components/BootScreen';
import { DataProvider } from '@/lib/data';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });
const orbitron = Orbitron({ subsets: ['latin'], variable: '--font-orbitron' });

export const metadata = {
    title: 'C3 — Control Centre',
    description: 'Control Centre with OpenClaw Agent System',
    themeColor: '#07070d',
    manifest: '/manifest.json',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} ${orbitron.variable}`}>
            <body>
                <DataProvider>
                    <BootScreen />
                    <div id="app" className="app">
                        <div className="titlebar">
                            <div className="titlebar-drag"></div>
                            <div className="titlebar-title">
                                <span className="titlebar-icon">☠️</span>
                                <span>C3 — Control Centre</span>
                            </div>
                        </div>
                        <Sidebar />
                        <main className="main-content">
                            {children}
                        </main>
                        <div className="scanline-overlay"></div>
                    </div>
                </DataProvider>
            </body>
        </html>
    );
}
