import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronsUpDown, Clock, Code, ExternalLink, FileText, Filter, Folder, GitBranch, GripVertical, Plus, RefreshCw, Star, Terminal, Trash2, TriangleAlert, Zap } from 'lucide-react';
import { useNexus } from '../store';
import { toneText, useFlash } from '../ui';
import * as api from '../api';
import type { Priority, Project, Task, Tone } from '../types';

type PriorityFilter = 'ALL' | Priority;
const FILTER_LABEL: Record<PriorityFilter, string> = { ALL: 'All Priorities', URGENT: 'Urgent', HIGH: 'High', NORMAL: 'Normal', LOW: 'Low' };

const ACCENT_ICON_BG: Record<Tone, string> = {
    primary: 'bg-primary/10 text-primary', secondary: 'bg-secondary-container/10 text-secondary', tertiary: 'bg-tertiary-container/10 text-tertiary',
    outline: 'bg-surface-container-high text-outline', error: 'bg-error/10 text-error', neutral: 'bg-surface-container-high text-outline', surface: 'bg-surface-container-high text-outline',
};

function priorityChip(p: Priority) {
    if (p === 'URGENT') return 'bg-error-container text-error';
    if (p === 'HIGH') return 'bg-tertiary/10 text-tertiary';
    return 'bg-surface-container-highest text-on-surface-variant';
}

function dueChip(t: Task) {
    if (t.dueTone === 'error') return 'text-error bg-error-container/30 px-1.5 rounded';
    if (t.dueTone === 'tertiary') return 'text-tertiary bg-tertiary/10 px-1.5 rounded';
    if (t.dueTone === 'secondary') return 'text-secondary bg-secondary/10 px-1.5 rounded';
    return 'text-outline';
}

/** Parse "Fix auth bug #auth-daemon !high @today" → structured fields. */
function parseQuickAdd(raw: string, projects: Project[]) {
    let title = raw;
    let projectId: string | undefined;
    let priority: Priority | undefined;
    let due: string | undefined;
    title = title.replace(/#([\w-]+)/g, (m, name: string) => {
        const p = projects.find((x) => x.id === name || x.name === name);
        if (p) { projectId = p.id; return ''; }
        return m;
    });
    title = title.replace(/!(urgent|high|normal|low)\b/gi, (_, p: string) => { priority = p.toUpperCase() as Priority; return ''; });
    title = title.replace(/@(today|tomorrow)\b/gi, (_, d: string) => { due = d[0].toUpperCase() + d.slice(1).toLowerCase(); return ''; });
    return { title: title.replace(/\s+/g, ' ').trim(), projectId, priority, due };
}

export default function Tasks() {
    const { projects, tasks, toggleTask, addTask, deleteTask, reorderFocus, syncTodo } = useNexus();
    const navigate = useNavigate();
    const inputRef = useRef<HTMLInputElement>(null);

    const [filter, setFilter] = useState<PriorityFilter>('ALL');
    const [filterOpen, setFilterOpen] = useState(false);
    const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
    const [draft, setDraft] = useState('');
    const [qProject, setQProject] = useState<string>('');
    const [qPriority, setQPriority] = useState<Priority>('HIGH');
    const [dragId, setDragId] = useState<string | null>(null);
    const [syncing, flashSync] = useFlash(900);

    const groups = useMemo(
        () => projects.map((p) => ({ project: p, tasks: tasks.filter((t) => t.projectId === p.id) })).filter((g) => g.tasks.length > 0),
        [projects, tasks],
    );
    const selectedProject = qProject || groups[0]?.project.id || projects[0]?.id || '';
    const pending = tasks.filter((t) => !t.done);
    const doneToday = tasks.filter((t) => t.done && t.doneToday).length;
    const pendingProjects = new Set(pending.map((t) => t.projectId)).size;
    const focus = tasks.filter((t) => t.focus).sort((a, b) => a.focus!.order - b.focus!.order);
    const velocityTotal = doneToday + pending.length;
    const velocityPct = velocityTotal ? Math.round((doneToday / velocityTotal) * 100) : 0;
    const nameOf = (id: string) => projects.find((p) => p.id === id)?.name ?? id;
    const accentOf = (id: string): Tone => projects.find((p) => p.id === id)?.accent ?? 'primary';

    const submit = () => {
        const parsed = parseQuickAdd(draft, projects);
        if (!parsed.title) return;
        addTask({
            projectId: parsed.projectId ?? selectedProject,
            title: parsed.title,
            priority: parsed.priority ?? qPriority,
            due: parsed.due,
        });
        setDraft('');
    };

    const allCollapsed = groups.length > 0 && groups.every((g) => collapsed.has(g.project.id));
    const toggleGroup = (id: string) =>
        setCollapsed((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

    // TODO.md preview: first project with tasks
    const preview = groups[0];
    const previewOpen = preview?.tasks.filter((t) => !t.done) ?? [];
    const previewDone = preview?.tasks.filter((t) => t.done) ?? [];
    const previewLines = 3 + previewOpen.length + 2 + previewDone.length;

    return (
        <div className="flex flex-col w-full pb-10 gap-space-md pt-space-xs">
            <section className="flex flex-col gap-space-xs">
                {/* Summary */}
                <div className="w-full bg-surface-container-low/90 backdrop-blur-md rounded px-gutter py-2.5 flex flex-wrap items-center justify-between gap-space-md shadow-sm">
                    <div className="flex items-center gap-space-md flex-wrap">
                        <div className="flex items-center gap-space-sm">
                            <span className="font-headline-md text-headline-md font-semibold text-on-surface">{pending.length} Pending Tasks</span>
                            <span className="font-body-sm text-body-sm text-outline">across {pendingProjects} projects</span>
                            <span className="font-label-xs text-label-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold tracking-wide">{doneToday} Done Today</span>
                        </div>
                        <div className="hidden lg:flex items-center gap-space-xs text-outline font-code-sm text-code-sm">
                            <span className="text-surface-variant">/</span>
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface-container">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                <span className="text-on-surface-variant">TODO.md Sync:</span>
                                <span className="text-primary font-medium">Just now</span>
                                <span className="text-outline-variant font-label-xs">(auto-watch)</span>
                            </div>
                            <span className="px-1.5 py-0.5 rounded bg-surface-container-lowest text-outline text-label-xs font-code-sm font-normal">~/Dev/*/TODO.md</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-space-sm ml-auto">
                        <div className="relative inline-flex items-center">
                            <button type="button" onClick={() => setFilterOpen((v) => !v)} className="h-7 px-2.5 rounded bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors font-code-sm text-code-sm flex items-center gap-1.5">
                                <Filter className="w-3.5 h-3.5 text-outline" />
                                <span>Filter: {FILTER_LABEL[filter]}</span>
                                <ChevronDown className="w-3 h-3 text-outline" />
                            </button>
                            {filterOpen && (
                                <div className="absolute right-0 top-full mt-1 z-30 w-44 rounded-lg bg-surface-container-high shadow-[0_0_0_1px_#30363D,0_12px_32px_-4px_rgba(0,0,0,0.65)] py-1">
                                    {(Object.keys(FILTER_LABEL) as PriorityFilter[]).map((k) => (
                                        <button key={k} type="button" onClick={() => { setFilter(k); setFilterOpen(false); }} className={`w-full text-left px-3 py-1.5 font-code-sm text-code-sm hover:bg-surface-container-highest ${filter === k ? 'text-primary' : 'text-on-surface-variant'}`}>
                                            {FILTER_LABEL[k]}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <button type="button" onClick={() => { flashSync(); syncTodo(); }} className="h-7 px-2.5 rounded bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-primary transition-all font-code-sm text-code-sm flex items-center gap-1.5 active:scale-95">
                            <RefreshCw className={`w-3.5 h-3.5 text-primary ${syncing ? 'animate-spin' : ''}`} />
                            <span>Force Sync</span>
                        </button>
                    </div>
                </div>

                {/* Quick add */}
                <div className="w-full bg-surface-container-low rounded p-2 flex flex-col md:flex-row items-center gap-space-sm shadow-sm">
                    <div className="flex items-center gap-space-xs flex-1 w-full pl-2">
                        <Terminal className="w-4 h-4 text-primary shrink-0" strokeWidth={2.2} />
                        <input
                            ref={inputRef}
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && submit()}
                            placeholder='Add a new task (e.g., "Fix auth bug #auth-daemon !high")...'
                            className="w-full bg-transparent text-on-surface placeholder:text-outline font-body-md text-body-md focus:outline-none"
                        />
                        <span className="hidden sm:inline-block font-code-sm text-label-xs text-outline px-1.5 py-0.5 rounded bg-surface-container-lowest shrink-0">Press Enter ↵</span>
                    </div>
                    <div className="flex items-center gap-space-xs w-full md:w-auto justify-end overflow-x-auto">
                        <div className="relative">
                            <select value={selectedProject} onChange={(e) => setQProject(e.target.value)} className="appearance-none h-7 pl-2.5 pr-6 rounded bg-surface-container text-on-surface-variant font-code-sm text-code-sm hover:bg-surface-container-high transition-colors focus:outline-none cursor-pointer">
                                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                            <ChevronDown className="w-3 h-3 text-outline absolute right-2 top-2 pointer-events-none" />
                        </div>
                        <div className="relative">
                            <select value={qPriority} onChange={(e) => setQPriority(e.target.value as Priority)} className="appearance-none h-7 pl-2.5 pr-6 rounded bg-tertiary-container/20 text-tertiary font-code-sm text-code-sm font-medium hover:bg-tertiary-container/30 transition-colors focus:outline-none cursor-pointer">
                                <option value="HIGH">! HIGH</option><option value="URGENT">! URGENT</option><option value="NORMAL">~ NORMAL</option><option value="LOW">· LOW</option>
                            </select>
                            <ChevronDown className="w-3 h-3 text-tertiary absolute right-2 top-2 pointer-events-none" />
                        </div>
                        <button type="button" onClick={() => { setDraft((d) => `${d}${d && !d.endsWith(' ') ? ' ' : ''}#`); inputRef.current?.focus(); }} className="h-7 px-2 rounded bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors font-code-sm text-code-sm flex items-center gap-1">
                            <span className="text-outline">#</span><span>tag</span>
                        </button>
                        <button type="button" onClick={() => { setDraft((d) => `${d}${d && !d.endsWith(' ') ? ' ' : ''}@today`); inputRef.current?.focus(); }} className="h-7 px-2 rounded bg-surface-container text-secondary hover:text-on-surface hover:bg-surface-container-high transition-colors font-code-sm text-code-sm flex items-center gap-1">
                            <span className="text-secondary/70">@</span><span>today</span>
                        </button>
                        <button type="button" onClick={submit} className="h-7 px-3 rounded bg-primary text-on-primary hover:bg-primary-container font-headline-md text-code-sm font-semibold transition-colors flex items-center gap-1 shrink-0 shadow-sm active:scale-95">
                            <Plus className="w-3.5 h-3.5" strokeWidth={2.5} /><span>Add Task</span>
                        </button>
                    </div>
                </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
                {/* Left column */}
                <div className="lg:col-span-8 flex flex-col gap-space-md">
                    <div className="flex items-center justify-between px-space-xs">
                        <div className="flex items-center gap-space-sm">
                            <span className="font-headline-md text-headline-md font-semibold text-on-surface">Repositories &amp; Task Manifests</span>
                            <span className="font-code-sm text-code-sm px-1.5 rounded bg-surface-container-highest text-on-surface-variant">{groups.length} Manifests</span>
                        </div>
                        <button type="button" onClick={() => setCollapsed(allCollapsed ? new Set() : new Set(groups.map((g) => g.project.id)))} className="font-code-sm text-code-sm text-outline hover:text-on-surface transition-colors flex items-center gap-1">
                            <ChevronsUpDown className="w-3.5 h-3.5" /><span>Toggle All</span>
                        </button>
                    </div>

                    {groups.map(({ project: p, tasks: list }) => {
                        const open = list.filter((t) => !t.done && (filter === 'ALL' || t.priority === filter));
                        const done = list.filter((t) => t.done);
                        const pendingCount = list.filter((t) => !t.done).length;
                        const isCollapsed = collapsed.has(p.id);
                        return (
                            <div key={p.id} className="rounded bg-surface-container-low shadow-sm overflow-hidden flex flex-col">
                                <div onClick={() => toggleGroup(p.id)} className="flex items-center justify-between px-gutter py-2.5 bg-surface-container cursor-pointer select-none hover:bg-surface-container-high transition-colors">
                                    <div className="flex items-center gap-space-sm min-w-0">
                                        <ChevronDown className={`w-4 h-4 text-outline transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`} />
                                        <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${ACCENT_ICON_BG[p.accent]}`}><Folder className="w-3.5 h-3.5" /></div>
                                        <span className="font-code-lg text-code-lg font-semibold text-on-surface truncate">{p.name}</span>
                                        <div className="hidden sm:flex items-center gap-1">
                                            {p.dashboardTags.slice(0, 2).map((t) => <span key={t.label} className="font-code-sm text-label-xs px-1.5 rounded bg-surface-container-highest text-on-surface-variant">{t.label}</span>)}
                                        </div>
                                        {p.status === 'conflict' ? (
                                            <span className="font-code-sm text-label-xs px-1.5 rounded bg-tertiary-container/20 text-tertiary font-semibold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse" /><span>Port Conflict :{p.conflictPort}</span></span>
                                        ) : (
                                            <span className="font-code-sm text-code-sm px-1.5 rounded bg-surface-container-lowest text-secondary flex items-center gap-1"><GitBranch className="w-3 h-3 text-secondary" /><span>{p.git.branch}</span></span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-space-md shrink-0" onClick={(e) => e.stopPropagation()}>
                                        <span className="font-body-sm text-body-sm text-outline"><strong className="text-on-surface font-medium">{pendingCount}</strong> pending{done.length > 0 && <> <span className="text-surface-variant">•</span> {done.length} done</>}</span>
                                        <div className="hidden md:flex items-center gap-1.5 font-code-sm text-code-sm bg-surface-container-lowest px-2 py-0.5 rounded"><FileText className="w-3 h-3 text-outline" /><span className="text-on-surface-variant font-medium">TODO.md</span></div>
                                        <button type="button" title="Open in IDE" onClick={() => api.openInIde(p.id)} className="p-1 rounded hover:bg-surface-container text-outline hover:text-primary transition-colors"><ExternalLink className="w-3.5 h-3.5" /></button>
                                    </div>
                                </div>
                                {!isCollapsed && (
                                    <div className="flex flex-col">
                                        {[...open, ...done].map((t) => (
                                            <div key={t.id} className={`flex items-center justify-between px-gutter py-2 hover:bg-surface-container transition-colors group ${t.done ? 'bg-surface-container-low/50 opacity-60' : ''}`}>
                                                <div className="flex items-center gap-space-sm min-w-0">
                                                    <button type="button" aria-label="Toggle task" onClick={() => toggleTask(t.id)} className={`w-4 h-4 rounded-sm transition-colors flex items-center justify-center shrink-0 ${t.done ? 'bg-primary' : 'bg-surface-container-lowest hover:bg-surface-container-high'}`}>
                                                        {t.done && <svg className="w-3 h-3 text-on-primary" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>}
                                                    </button>
                                                    {!t.done && <span className={`font-code-sm text-label-xs px-1.5 rounded font-semibold shrink-0 ${priorityChip(t.priority)}`}>{t.priority}</span>}
                                                    <span className={`font-body-md text-body-md truncate ${t.done ? 'text-outline line-through' : `text-on-surface ${t.priority === 'URGENT' ? 'font-semibold' : t.priority === 'HIGH' ? 'font-medium' : ''}`}`}>{t.title}</span>
                                                    {t.scope && <span className={`font-code-sm text-label-xs px-1 rounded bg-surface-container-highest shrink-0 ${t.done ? 'text-outline' : 'text-on-surface-variant'}`}>[{t.scope}]</span>}
                                                    {!t.done && t.tag && <span className="font-code-sm text-code-sm text-outline shrink-0">#{t.tag}</span>}
                                                    {!t.done && t.port && <span className={`font-code-sm text-label-xs px-1.5 rounded shrink-0 ${t.dueTone === 'tertiary' ? 'bg-tertiary/10 text-tertiary' : 'bg-secondary/10 text-secondary'}`}>{t.port}</span>}
                                                </div>
                                                <div className="flex items-center gap-space-sm shrink-0">
                                                    <span className={`font-code-sm text-code-sm ${t.done ? 'text-outline' : dueChip(t)}`}>{t.done ? t.doneAt : t.due}</span>
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {!t.done && <button type="button" title="Jump to Workspace" onClick={() => navigate(`/projects/${p.id}`)} className="p-1 rounded text-outline hover:text-on-surface hover:bg-surface-container-high transition-colors"><Code className="w-3.5 h-3.5" /></button>}
                                                        <button type="button" title="Delete task" onClick={() => deleteTask(t.id)} className="p-1 rounded text-outline hover:text-error hover:bg-surface-container-high transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {open.length + done.length === 0 && <p className="px-gutter py-3 font-code-sm text-code-sm text-outline">No task matches this filter.</p>}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Right column */}
                <div className="lg:col-span-4 flex flex-col gap-space-md">
                    <div className="rounded bg-surface-container-low shadow-sm flex flex-col overflow-hidden">
                        <div className="px-gutter py-2.5 bg-surface-container flex items-center justify-between">
                            <div className="flex items-center gap-space-xs">
                                <Star className="w-4 h-4 text-tertiary" />
                                <span className="font-headline-md text-code-lg font-semibold text-on-surface">Today's Focus</span>
                                <span className="font-label-xs text-label-xs px-1.5 rounded-full bg-surface-container-highest text-on-surface-variant">{focus.length} items</span>
                            </div>
                            <span className="font-code-sm text-label-xs text-outline">Drag to reorder</span>
                        </div>
                        <div className="p-gutter-sm flex flex-col gap-space-xs">
                            {focus.map((t) => {
                                const accent = accentOf(t.projectId);
                                return (
                                    <div
                                        key={t.id}
                                        draggable
                                        onDragStart={() => setDragId(t.id)}
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={() => { if (dragId) reorderFocus(dragId, t.id); setDragId(null); }}
                                        onDragEnd={() => setDragId(null)}
                                        className={`rounded bg-surface-container p-2.5 flex items-start gap-space-sm hover:bg-surface-container-high transition-all cursor-grab active:cursor-grabbing group shadow-sm ${t.highlight ? 'bg-gradient-to-r from-error-container/20 to-transparent' : ''} ${dragId === t.id ? 'opacity-40' : ''} ${t.done ? 'opacity-50' : ''}`}
                                    >
                                        <GripVertical className="w-3.5 h-3.5 text-outline mt-1 shrink-0 opacity-40 group-hover:opacity-100" />
                                        <div className="flex flex-col flex-1 min-w-0 gap-1">
                                            <div className="flex items-center justify-between">
                                                <span className={`font-code-sm text-label-xs font-medium tracking-tight ${toneText[accent === 'outline' ? 'neutral' : accent]}`}>{nameOf(t.projectId)}</span>
                                                <span className={`font-code-sm text-label-xs px-1 rounded font-semibold ${priorityChip(t.priority)}`}>{t.priority}</span>
                                            </div>
                                            <p className={`font-body-md text-body-md font-medium leading-tight ${t.done ? 'line-through text-outline' : 'text-on-surface'}`}>{t.title}</p>
                                            <div className="flex items-center justify-between mt-1 text-outline font-code-sm text-label-xs">
                                                {t.focus?.hint ? (
                                                    <span className={`flex items-center gap-1 ${toneText[t.focus.hint.tone]}`}>
                            {t.focus.hint.icon === 'clock' ? <Clock className="w-3 h-3" /> : t.focus.hint.icon === 'alert' ? <TriangleAlert className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
                                                        <span>{t.focus.hint.label}</span>
                          </span>
                                                ) : <span className="text-outline">{t.focus?.note ?? ''}</span>}
                                                {t.port ? <span className="font-code-sm text-label-xs px-1 rounded bg-surface-container-highest text-on-surface-variant">{t.port}</span>
                                                    : t.tag ? <span className="opacity-0 group-hover:opacity-100 transition-opacity text-outline-variant">#{t.tag}</span> : null}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="px-gutter py-2.5 bg-surface-container flex flex-col gap-1.5">
                            <div className="flex items-center justify-between text-body-sm font-body-sm">
                                <span className="text-on-surface-variant">Daily Velocity</span>
                                <span className="font-code-sm text-code-sm font-semibold text-primary">{doneToday} of {velocityTotal} completed ({velocityPct}%)</span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-surface-container-lowest overflow-hidden"><div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${velocityPct}%` }} /></div>
                        </div>
                    </div>

                    {preview && (
                        <div className="rounded bg-surface-container-low shadow-sm flex flex-col overflow-hidden">
                            <div className="px-gutter py-2.5 bg-surface-container flex items-center justify-between">
                                <div className="flex items-center gap-space-xs min-w-0">
                                    <FileText className="w-4 h-4 text-primary shrink-0" />
                                    <span className="font-headline-md text-code-lg font-semibold text-on-surface truncate">Live TODO.md Disk</span>
                                </div>
                                <div className="flex items-center gap-space-xs shrink-0">
                                    <div className="flex items-center gap-1 font-label-xs text-label-xs px-1.5 py-0.5 rounded bg-surface-container-lowest text-primary"><span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" /><span>Watcher ON</span></div>
                                    <button type="button" onClick={() => api.openInIde(preview.project.id)} className="h-6 px-2 rounded bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface text-label-xs font-code-sm flex items-center gap-1 transition-colors"><ExternalLink className="w-3 h-3 text-secondary" /><span>Code</span></button>
                                </div>
                            </div>
                            <div className="px-gutter py-1.5 bg-surface-container-low flex items-center justify-between">
                                <div className="flex items-center gap-1.5 font-code-sm text-code-sm text-outline truncate"><Folder className="w-3.5 h-3.5 shrink-0" /><span className="text-on-surface font-medium truncate">{preview.project.name}/TODO.md</span></div>
                                <span className="font-code-sm text-label-xs text-outline px-1 rounded bg-surface-container">markdown</span>
                            </div>
                            <div className="bg-surface-container-lowest p-3 font-code-sm text-code-sm leading-relaxed overflow-x-auto select-text">
                                <div className="flex flex-col gap-0.5 text-on-surface">
                                    <div className="text-primary font-semibold"># {preview.project.name} Tasks</div>
                                    <div className="h-2" />
                                    <div className="text-secondary font-medium">## In Progress</div>
                                    {previewOpen.map((t) => (
                                        <div key={t.id} className="flex items-start gap-1">
                                            <span className="text-outline shrink-0">- [ ]</span>
                                            <span className="text-on-surface">
                        {t.scope && <span className={t.priority === 'HIGH' || t.priority === 'URGENT' ? 'text-tertiary font-semibold' : 'text-outline-variant'}>[{t.scope}] </span>}
                                                {t.title}
                                                {(t.priority === 'HIGH' || t.priority === 'URGENT') && <span className="text-tertiary"> !{t.priority.toLowerCase()}</span>}
                                                {(t.due === 'Today' || t.due === 'Tomorrow') && <span className="text-secondary"> @{t.due.toLowerCase()}</span>}
                      </span>
                                        </div>
                                    ))}
                                    <div className="h-2" />
                                    <div className="text-secondary font-medium">## Completed</div>
                                    {previewDone.map((t) => (
                                        <div key={t.id} className="flex items-start gap-1 opacity-50">
                                            <span className="text-primary shrink-0">- [x]</span>
                                            <span className="line-through text-outline"><span className="text-outline">[{t.scope}]</span> {t.title}{t.doneAt && <span className="text-outline-variant font-label-xs"> (done {t.doneAt})</span>}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="px-gutter py-1.5 bg-surface-container flex items-center justify-between font-code-sm text-label-xs text-outline">
                                <div className="flex items-center gap-space-sm"><span>Ln {previewLines}, Col 1</span><span>UTF-8</span><span>LF</span></div>
                                {preview.project.git.modified > 0 && <div className="flex items-center gap-1.5 text-tertiary"><span className="w-1.5 h-1.5 rounded-full bg-tertiary" /><span>{preview.project.git.modified} uncommitted changes in git</span></div>}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}