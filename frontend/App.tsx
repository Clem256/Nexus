/** Shared application shell: fixed sidebar (240px) + fixed header + <main> area. */
import { useEffect, useRef } from 'react';
import { NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { Bell, CircleCheck, FolderCode, LayoutGrid, Layers, Plus, RefreshCw, Router, Search, SlidersHorizontal, Terminal, User } from 'lucide-react';
import { useNexus } from './store';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import PortMonitor from './pages/PortMonitor';
import Tasks from './pages/Tasks';
import Settings from './pages/Settings';

const NAV = [
    { to: '/', label: 'Dashboard', Icon: LayoutGrid, end: true },
    { to: '/projects', label: 'Projects', Icon: FolderCode, badge: true },
    { to: '/tasks', label: 'Tasks & TODOs', Icon: CircleCheck },
    { to: '/ports', label: 'Port Monitor', Icon: Router },
    { to: '/settings', label: 'Settings', Icon: SlidersHorizontal },
] as const;

function pageTitle(pathname: string): string {
    if (pathname.startsWith('/projects')) return 'Projects';
    if (pathname.startsWith('/tasks')) return 'Tasks & TODOs';
    if (pathname.startsWith('/ports')) return 'Port Monitor';
    if (pathname.startsWith('/settings')) return 'Settings';
    return 'Dashboard';
}

function Sidebar() {
    const { workspace, projects, scan, scanning } = useNexus();
    return (
        <aside className="fixed left-0 top-0 h-full w-[240px] bg-surface-container-low z-50 flex flex-col justify-between shadow-[0_1px_8px_rgba(0,0,0,0.25)]">
            <div className="flex flex-col">
                <div className="h-14 px-gutter flex items-center justify-between bg-surface-container-low/80 backdrop-blur-md">
                    <div className="flex items-center gap-space-sm">
                        <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center">
                            <Layers className="w-4 h-4 text-primary" strokeWidth={2.2} />
                        </div>
                        <span className="font-headline-md text-headline-md tracking-tight text-on-surface font-bold">Nexus</span>
                    </div>
                    <span className="font-label-xs text-label-xs px-1.5 py-0.5 rounded bg-surface-container-highest text-on-surface-variant font-medium">
            {workspace.version}
          </span>
                </div>
                <nav className="flex flex-col gap-space-xs px-gutter-sm mt-space-md">
                    {NAV.map(({ to, label, Icon, ...rest }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={'end' in rest ? rest.end : false}
                            className={({ isActive }) =>
                                `flex items-center justify-between px-space-sm py-2 rounded transition-all ${
                                    isActive
                                        ? 'bg-surface-container-high text-primary font-medium border-l-2 border-primary shadow-[inset_0_0_12px_rgba(78,222,163,0.06)]'
                                        : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <div className="flex items-center gap-space-sm">
                                        <Icon className="w-[18px] h-[18px]" />
                                        <span className="font-body-md text-body-md">{label}</span>
                                    </div>
                                    {isActive ? (
                                        <span className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(78,222,163,0.8)]" />
                                    ) : 'badge' in rest && rest.badge ? (
                                        <span className="font-label-xs text-label-xs px-1.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant">
                      {projects.length}
                    </span>
                                    ) : null}
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>
            </div>
            <div className="p-gutter-sm bg-surface-container-low flex flex-col gap-space-sm">
                <div className="flex items-center justify-between px-space-sm py-1.5 rounded bg-surface-container-lowest text-on-surface-variant">
                    <div className="flex items-center gap-space-xs truncate">
                        <Terminal className="w-[15px] h-[15px] text-outline" />
                        <span className="font-code-sm text-code-sm truncate text-on-surface">{workspace.root}</span>
                    </div>
                    <button
                        type="button"
                        title="Rescan workspace"
                        onClick={scan}
                        className="hover:text-primary transition-colors flex items-center justify-center p-0.5 rounded"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} />
                    </button>
                </div>
                <div className="flex items-center justify-between px-space-sm py-1">
                    <div className="flex items-center gap-space-xs">
                        <span className={`w-2 h-2 rounded-full ${workspace.daemon.online ? 'bg-primary animate-pulse' : 'bg-error'}`} />
                        <span className="font-label-xs text-label-xs text-on-surface-variant tracking-wider uppercase">
              Daemon {workspace.daemon.online ? 'Online' : 'Offline'}
            </span>
                    </div>
                    <span className="font-code-sm text-code-sm text-outline">:{workspace.daemon.port}</span>
                </div>
            </div>
        </aside>
    );
}

function Header() {
    const { pathname } = useLocation();
    const { scan, scanning } = useNexus();
    const searchRef = useRef<HTMLInputElement>(null);

    // ⌘K / Ctrl+K: focus search input
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                searchRef.current?.focus();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    return (
        <header className="fixed top-0 left-[240px] right-0 h-14 bg-surface/85 backdrop-blur-xl z-40 flex items-center justify-between px-gutter shadow-[0_1px_8px_rgba(0,0,0,0.25)]">
            <div className="flex items-center gap-space-xs">
                <span className="font-headline-md text-headline-md font-semibold text-on-surface">Workspace</span>
                <span className="text-outline text-body-sm">/</span>
                <span className="font-headline-md text-headline-md font-semibold text-on-surface-variant">{pageTitle(pathname)}</span>
            </div>
            <div className="flex items-center gap-space-md">
                <div className="relative flex items-center">
                    <Search className="absolute left-2.5 w-4 h-4 text-outline pointer-events-none" />
                    <input
                        ref={searchRef}
                        type="text"
                        placeholder="Search projects, ports, or tasks..."
                        className="w-72 h-8 pl-8 pr-12 rounded bg-surface-container-lowest font-body-sm text-body-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-1 focus:ring-secondary"
                    />
                    <div className="absolute right-2 flex items-center pointer-events-none">
                        <kbd className="font-code-sm text-code-sm px-1 rounded bg-surface-container text-on-surface-variant">⌘K</kbd>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={scan}
                    className="h-8 px-space-sm rounded bg-primary-container text-on-primary-container font-medium font-body-md text-body-md flex items-center gap-space-xs hover:bg-primary hover:text-on-primary transition-colors"
                >
                    {scanning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    <span>Scan Folder</span>
                </button>
                <div className="flex items-center gap-space-xs text-on-surface-variant">
                    <button type="button" className="w-8 h-8 rounded flex items-center justify-center hover:bg-surface-container hover:text-on-surface transition-colors">
                        <Bell className="w-[18px] h-[18px]" />
                    </button>
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                        <User className="w-[18px] h-[18px] text-on-primary" />
                    </div>
                </div>
            </div>
        </header>
    );
}

export default function App() {
    return (
        <>
            <Sidebar />
            <div className="pl-[240px]">
                <Header />
                <main className="w-full pt-14 px-gutter bg-surface min-h-screen">
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/projects" element={<Projects />} />
                        <Route path="/projects/:id" element={<ProjectDetail />} />
                        <Route path="/tasks" element={<Tasks />} />
                        <Route path="/ports" element={<PortMonitor />} />
                        <Route path="/settings" element={<Settings />} />
                    </Routes>
                </main>
            </div>
        </>
    );
}