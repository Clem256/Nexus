import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ChevronDown, CircleCheck, GitBranch, LayoutGrid, List, Play, RefreshCw, Search, TriangleAlert } from 'lucide-react';
import { useNexus } from '../store';
import * as api from '../api';
import { actionsIcons, metaIcons, projectIcons, toneText } from '../ui';
import type { Category, MetaItem, Project, Tone } from '../types';

const CATEGORIES: { id: Category; label: string }[] = [
    { id: 'rust', label: 'Rust / Systems' },
    { id: 'web', label: 'Web / Frontend' },
    { id: 'backend', label: 'Backend Services' },
    { id: 'containerized', label: 'Containerized' },
];

type Sort = 'recent' | 'name' | 'status' | 'tasks';
const STATUS_RANK: Record<Project['status'], number> = { conflict: 0, online: 1, inactive: 2, library: 3 };

// Tailwind classes must appear in full so they are generated properly.
const GLOW: Record<Tone, string> = {
    primary: 'bg-primary/10 group-hover:bg-primary/15',
    secondary: 'bg-secondary/10 group-hover:bg-secondary/15',
    tertiary: 'bg-tertiary/10 group-hover:bg-tertiary/20',
    outline: 'bg-outline/5 group-hover:bg-outline/10',
    error: 'bg-error/10', neutral: 'bg-outline/5', surface: 'bg-outline/5',
};
const BAR: Record<Tone, string> = {
    primary: 'bg-primary shadow-[0_0_8px_rgba(78,222,163,0.7)]',
    secondary: 'bg-secondary shadow-[0_0_8px_rgba(123,208,255,0.6)]',
    tertiary: 'bg-tertiary shadow-[0_0_8px_rgba(255,185,95,0.7)]',
    outline: 'bg-outline',
    error: 'bg-error', neutral: 'bg-outline', surface: 'bg-outline',
};
const ACCENT_TEXT: Record<Tone, string> = {
    primary: 'text-primary', secondary: 'text-secondary', tertiary: 'text-tertiary', outline: 'text-outline',
    error: 'text-error', neutral: 'text-on-surface-variant', surface: 'text-on-surface',
};

function Meta({ item }: { item: MetaItem }) {
    const Icon = item.icon ? metaIcons[item.icon] : null;
    const cls = `${item.tone ? toneText[item.tone] : ''} flex items-center gap-1`;
    const body = (
        <>
            {item.dot && <span className={`w-1.5 h-1.5 rounded-full ${item.dot === 'primary' ? 'bg-primary' : 'bg-tertiary'}`} />}
            {Icon && <Icon className="w-3 h-3" />}
            {item.label}
        </>
    );
    return item.href ? (
        <a href={item.href} target="_blank" rel="noopener noreferrer" className={`${cls} hover:text-primary transition-colors`}>{body}</a>
    ) : (
        <span className={cls}>{body}</span>
    );
}

function ProjectCard({ project: p, pendingTasks }: { project: Project; pendingTasks: number }) {
    const { processes, resolveConflict, startProject } = useNexus();
    const collision = processes.find((x) => x.status === 'collision' && x.port === p.conflictPort);
    const Icon = projectIcons[p.icon];
    const pct = p.milestone.total ? Math.round((p.milestone.done / p.milestone.total) * 100) : 0;
    const complete = p.milestone.done === p.milestone.total;
    const accentText = ACCENT_TEXT[p.accent];
    const g = p.git;

    const gitRight: MetaItem | null = p.gitRight ?? null;

    return (
        <div className="project-card group flex flex-col justify-between rounded-xl bg-surface-container-low hover:bg-surface-container transition-all duration-200 shadow-md hover:shadow-xl p-space-lg relative overflow-hidden">
            <div className={`absolute -right-8 -top-8 w-28 h-28 rounded-full blur-2xl pointer-events-none transition-all ${GLOW[p.accent]}`} />
            <div className="flex flex-col gap-space-md relative z-10">
                {/* Header */}
                <div className="flex items-start justify-between gap-space-sm">
                    <div className="flex items-center gap-space-sm min-w-0">
                        <div className={`w-9 h-9 rounded-lg bg-surface-container-highest flex items-center justify-center shadow-sm shrink-0 ${accentText}`}>
                            <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <Link to={`/projects/${p.id}`} className="font-headline-md text-headline-md font-semibold text-on-surface truncate group-hover:text-primary transition-colors">{p.name}</Link>
                            <span className="font-code-sm text-code-sm text-outline truncate">{p.path}</span>
                        </div>
                    </div>
                    {p.status === 'online' && (
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary/10 text-primary font-code-sm text-code-sm shrink-0 shadow-sm">
                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(78,222,163,0.9)]" />
                            <span className="font-medium">:{p.port}</span>
                        </div>
                    )}
                    {p.status === 'conflict' && (
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-tertiary/15 text-tertiary font-code-sm text-code-sm shrink-0 shadow-sm">
                            <span className="w-2 h-2 rounded-full bg-tertiary animate-ping" />
                            <span className="font-semibold uppercase tracking-wider text-[10px]">Port Conflict :{p.conflictPort}</span>
                        </div>
                    )}
                    {p.status === 'library' && (
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-surface-container-highest text-on-surface-variant font-code-sm text-code-sm shrink-0">
                            <span className="font-medium">{p.badge}</span>
                        </div>
                    )}
                    {p.status === 'inactive' && (
                        <button
                            type="button"
                            onClick={() => startProject(p.id)}
                            className="flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container-highest hover:bg-primary-container text-on-surface-variant hover:text-on-primary-container font-code-sm text-code-sm transition-colors shrink-0"
                        >
                            <Play className="w-3 h-3 text-primary" fill="currentColor" />
                            <span>Start :{p.startPort}</span>
                        </button>
                    )}
                </div>

                {/* Stack */}
                <div className="flex flex-wrap gap-1.5">
                    {p.stack.map((t, i) => (
                        <span key={t.label} className={`font-code-sm text-code-sm px-2 py-0.5 rounded bg-surface-container-highest ${toneText[t.tone]} ${i === 0 ? 'font-medium' : ''}`}>{t.label}</span>
                    ))}
                </div>

                {/* Conflict banner */}
                {p.status === 'conflict' && (
                    <div className="flex items-center justify-between p-2 rounded bg-tertiary-container/20 text-on-surface gap-2">
                        <div className="flex items-center gap-1.5 text-body-sm font-body-sm min-w-0">
                            <TriangleAlert className="w-4 h-4 text-tertiary shrink-0" />
                            <span className="text-xs truncate">
                {collision ? `Bound by ${collision.command} (PID: ${collision.pid})` : `Port :${p.conflictPort} is already in use`}
              </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => window.confirm(`Kill PID ${collision?.pid} and rebind :${p.conflictPort}?`) && resolveConflict()}
                            className="font-code-sm text-code-sm px-2 py-0.5 rounded bg-tertiary text-on-tertiary font-semibold hover:bg-tertiary-fixed transition-colors shrink-0 whitespace-nowrap"
                        >
                            Kill &amp; Rebind
                        </button>
                    </div>
                )}

                {/* Git + meta */}
                <div className="flex flex-col gap-space-xs py-space-xs px-space-sm rounded bg-surface-container-lowest text-on-surface-variant">
                    <div className="flex items-center justify-between text-body-sm font-body-sm">
                        <div className="flex items-center gap-1.5 text-on-surface truncate">
                            <GitBranch className={`w-3.5 h-3.5 ${accentText}`} />
                            <span className="font-code-sm text-code-sm font-medium truncate">{g.branch}</span>
                        </div>
                        {gitRight ? (
                            <span className="font-code-sm text-code-sm shrink-0"><Meta item={gitRight} /></span>
                        ) : g.state === 'modified' ? (
                            <span className="font-code-sm text-code-sm text-tertiary flex items-center gap-1 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />+{g.modified} modified
              </span>
                        ) : (
                            <span className="font-code-sm text-code-sm text-primary flex items-center gap-1 shrink-0">
                <Check className="w-3 h-3" />{g.state === 'synced' ? 'Synced' : 'Clean'}
              </span>
                        )}
                    </div>
                    {p.row2 && (
                        <div className="flex items-center justify-between pt-0.5 text-outline font-code-sm text-code-sm">
                            <Meta item={p.row2.left} />
                            {p.row2.right && <span className={p.row2.right.tone ? toneText[p.row2.right.tone] : 'text-on-surface-variant'}>{p.row2.right.label}</span>}
                        </div>
                    )}
                </div>

                {/* Milestone */}
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between font-label-md text-label-md">
            <span className="text-on-surface-variant flex items-center gap-1">
              <CircleCheck className={`w-3 h-3 ${accentText}`} />
                {p.milestone.label}
            </span>
                        <span className={`font-code-sm text-code-sm font-semibold ${complete ? 'text-primary' : 'text-on-surface'}`}>
              {p.milestone.done} / {p.milestone.total}{' '}
                            <span className={`font-normal ${complete || pct >= 80 ? 'text-primary' : 'text-outline'}`}>({complete ? 'Complete' : `${pct}%`})</span>
            </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-surface-container-highest overflow-hidden" title={`${pendingTasks} pending task(s) in TODO.md`}>
                        <div className={`h-full rounded-full transition-all duration-500 ${BAR[p.accent]}`} style={{ width: `${pct}%` }} />
                    </div>
                </div>
            </div>

            {/* Quick actions */}
            <div className="flex items-center gap-space-sm pt-space-md mt-space-md border-t border-surface-container-highest/60 relative z-10">
                {p.quickActions.map((a, i) => {
                    const AIcon = actionsIcons[a.icon];
                    return (
                        <button
                            key={a.label}
                            type="button"
                            onClick={() => (i === 0 ? api.openInIde(p.id) : a.icon === 'external' && p.port ? window.open(`http://localhost:${p.port}`, '_blank') : api.openInTerminal(p.id))}
                            className="flex-1 h-8 rounded bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-body-md text-body-md font-medium flex items-center justify-center gap-space-xs transition-colors hover:text-primary"
                        >
                            <AIcon className={`w-4 h-4 ${a.tone ? toneText[a.tone] : i === 0 ? 'text-secondary' : 'text-primary'}`} />
                            <span>{a.label}</span>
                            {a.kbd && <kbd className="font-code-sm text-code-sm px-1 rounded bg-surface-container-lowest text-outline">{a.kbd}</kbd>}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export default function Projects() {
    const { workspace, projects, tasks, processes, scan, scanning } = useNexus();
    const [category, setCategory] = useState<Category | 'all'>('all');
    const [onlyOnline, setOnlyOnline] = useState(false);
    const [sort, setSort] = useState<Sort>('recent');
    const [view, setView] = useState<'grid' | 'list'>('grid');

    const pendingByProject = useMemo(() => {
        const m = new Map<string, number>();
        tasks.filter((t) => !t.done).forEach((t) => m.set(t.projectId, (m.get(t.projectId) ?? 0) + 1));
        return m;
    }, [tasks]);

    const visible = useMemo(() => {
        const list = projects.filter(
            (p) => (category === 'all' || p.categories.includes(category)) && (!onlyOnline || p.status === 'online'),
        );
        const sorted = [...list];
        if (sort === 'recent') sorted.sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt));
        if (sort === 'name') sorted.sort((a, b) => a.name.localeCompare(b.name));
        if (sort === 'status') sorted.sort((a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status]);
        if (sort === 'tasks') sorted.sort((a, b) => (pendingByProject.get(b.id) ?? 0) - (pendingByProject.get(a.id) ?? 0));
        return sorted;
    }, [projects, category, onlyOnline, sort, pendingByProject]);

    const running = processes.filter((p) => p.status === 'listening').length;
    const conflicts = processes.filter((p) => p.status === 'collision').length;
    const dirty = projects.reduce((n, p) => n + p.git.modified, 0);

    const chip = (active: boolean) =>
        active
            ? 'bg-primary text-on-primary font-medium'
            : 'bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface';
    const badge = (active: boolean) => (active ? 'bg-on-primary/20 text-on-primary' : 'bg-surface-container-lowest text-outline');

    const resetFilters = () => { setCategory('all'); setOnlyOnline(false); };

    return (
        <div className="flex flex-col w-full pb-12">
            <div className="flex flex-col gap-space-md mb-space-lg pt-space-xs">
                {/* Context bar */}
                <div className="flex flex-wrap items-center justify-between gap-space-md py-space-sm px-space-md rounded-lg bg-surface-container-low shadow-sm">
                    <div className="flex items-center gap-space-lg">
                        <div className="flex items-center gap-space-sm">
                            <span className="font-code-sm text-code-sm text-outline uppercase tracking-wider">Root</span>
                            <span className="font-code-md text-code-md text-primary font-medium bg-surface-container-lowest px-2 py-0.5 rounded">{workspace.root}</span>
                        </div>
                        <div className="hidden sm:flex items-center gap-space-xs text-on-surface-variant font-body-sm text-body-sm">
                            <span>Active daemons:</span>
                            <span className="font-code-sm text-code-sm text-primary font-semibold">{running} running</span>
                            <span className="text-outline">/</span>
                            <span className="font-code-sm text-code-sm text-tertiary">{conflicts} conflict</span>
                        </div>
                        <div className="hidden md:flex items-center gap-space-xs text-on-surface-variant font-body-sm text-body-sm">
                            <span>Git State:</span>
                            <span className="font-code-sm text-code-sm text-secondary font-medium">{dirty} dirty files</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-space-md">
                        <div className="flex items-center gap-space-xs text-outline font-code-sm text-code-sm">
                            <span>Watcher:</span>
                            <span className="inline-flex items-center gap-1 text-primary">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                                {workspace.watcher}
              </span>
                        </div>
                        <div className="h-3 w-px bg-surface-container-highest" />
                        <button
                            type="button"
                            onClick={scan}
                            className={`flex items-center gap-1 hover:text-primary transition-colors text-body-sm font-body-sm py-0.5 px-1.5 rounded hover:bg-surface-container ${scanning ? 'text-primary' : 'text-on-surface-variant'}`}
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} />
                            <span>Sync Workspace</span>
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md bg-surface-container p-space-md rounded-xl shadow-md">
                    <div className="flex items-center gap-space-xs overflow-x-auto pb-1 lg:pb-0">
                        <button type="button" onClick={() => setCategory('all')} className={`flex items-center gap-space-xs px-space-md py-1.5 rounded font-body-md text-body-md transition-all ${chip(category === 'all')}`}>
                            <span>All</span>
                            <span className={`font-code-sm text-code-sm px-1.5 rounded-full ${badge(category === 'all')}`}>{projects.length}</span>
                        </button>
                        {CATEGORIES.map((c) => (
                            <button key={c.id} type="button" onClick={() => setCategory(c.id)} className={`flex items-center gap-space-xs px-space-md py-1.5 rounded font-body-md text-body-md transition-all whitespace-nowrap ${chip(category === c.id)}`}>
                                <span>{c.label}</span>
                                <span className={`font-code-sm text-code-sm px-1.5 rounded-full ${badge(category === c.id)}`}>{projects.filter((p) => p.categories.includes(c.id)).length}</span>
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-space-md justify-between lg:justify-end">
                        <label className="flex items-center gap-space-sm cursor-pointer select-none">
                            <div className="relative">
                                <input type="checkbox" className="sr-only peer" checked={onlyOnline} onChange={(e) => setOnlyOnline(e.target.checked)} />
                                <div className="w-9 h-5 bg-surface-container-lowest rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-on-surface-variant peer-checked:after:bg-primary after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-container/30" />
                            </div>
                            <span className={`font-body-md text-body-md flex items-center gap-1.5 ${onlyOnline ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_6px_rgba(78,222,163,0.8)]" />
                Online Only
              </span>
                        </label>
                        <div className="h-4 w-px bg-surface-container-highest hidden sm:block" />
                        <div className="flex items-center gap-space-xs">
                            <span className="font-label-md text-label-md text-outline uppercase">Sort</span>
                            <div className="relative">
                                <select
                                    value={sort}
                                    onChange={(e) => setSort(e.target.value as Sort)}
                                    className="bg-surface-container-lowest text-on-surface font-body-sm text-body-sm rounded px-2.5 py-1 pr-7 appearance-none focus:outline-none focus:ring-1 focus:ring-secondary cursor-pointer"
                                >
                                    <option value="recent">Recently Modified</option>
                                    <option value="name">Name (A-Z)</option>
                                    <option value="status">Status Priority</option>
                                    <option value="tasks">Pending Tasks</option>
                                </select>
                                <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-outline" />
                            </div>
                        </div>
                        <div className="h-4 w-px bg-surface-container-highest" />
                        <div className="flex items-center p-0.5 rounded bg-surface-container-lowest">
                            <button type="button" title="Grid View" onClick={() => setView('grid')} className={`p-1 rounded transition-all ${view === 'grid' ? 'bg-surface-container text-primary shadow-sm' : 'text-outline hover:text-on-surface'}`}>
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                            <button type="button" title="Compact List View" onClick={() => setView('list')} className={`p-1 rounded transition-all ${view === 'list' ? 'bg-surface-container text-primary shadow-sm' : 'text-outline hover:text-on-surface'}`}>
                                <List className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Grid */}
            {visible.length > 0 ? (
                <div className={view === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-space-lg w-full' : 'grid grid-cols-1 gap-space-sm w-full'}>
                    {visible.map((p) => (
                        <ProjectCard key={p.id} project={p} pendingTasks={pendingByProject.get(p.id) ?? 0} />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 px-4 text-center rounded-xl bg-surface-container-low shadow-inner">
                    <div className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center text-outline mb-space-md">
                        <Search className="w-6 h-6" />
                    </div>
                    <span className="font-headline-md text-headline-md text-on-surface mb-1">No repositories found</span>
                    <p className="font-body-md text-body-md text-on-surface-variant max-w-sm mb-space-md">
                        No workspace match found for active filter tags or online criteria. Clear filters to reveal all {projects.length} projects.
                    </p>
                    <button type="button" onClick={resetFilters} className="h-8 px-space-md rounded bg-surface-container-high hover:bg-surface-container-highest text-primary font-body-md text-body-md font-medium transition-colors">
                        Reset Filters
                    </button>
                </div>
            )}
        </div>
    );
}