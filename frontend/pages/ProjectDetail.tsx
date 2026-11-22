import { useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
    Activity, ChevronDown, ChevronRight, Clock, Code, Copy, ExternalLink, Filter, Folder, GitBranch, GripVertical,
    Github, Globe, House, Plus, RefreshCw, Terminal, Ticket, TriangleAlert, Zap, Ellipsis,
} from 'lucide-react';
import { useNexus } from '../store';
import * as api from '../api';
import { projectIcons, toneText, useFlash } from '../ui';
import type { ConfiguredPort, EnvLink, Priority, ProjectProcess, Task } from '../types';

const PRIORITY_RANK: Record<Priority, number> = { URGENT: 0, HIGH: 1, NORMAL: 2, LOW: 3 };

function PriorityPill({ p }: { p: Priority }) {
    const cls =
        p === 'HIGH' || p === 'URGENT'
            ? 'bg-error-container text-on-error-container font-semibold'
            : p === 'NORMAL'
                ? 'bg-surface-container-highest text-secondary font-medium'
                : 'bg-surface-container-highest text-outline font-medium';
    return <span className={`font-label-xs text-label-xs px-1.5 py-0.5 rounded ${cls}`}>{p}</span>;
}

function PortStatus({ s }: { s: ConfiguredPort['status'] }) {
    return s === 'active' ? (
        <span className="font-label-xs text-label-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-medium">Active</span>
    ) : (
        <span className="font-label-xs text-label-xs px-2 py-0.5 rounded bg-surface-container-highest text-outline font-medium">Offline</span>
    );
}

function EnvRow({ l }: { l: EnvLink }) {
    const lead =
        l.kind === 'github' ? <Github className="w-4 h-4 text-on-surface-variant" />
            : l.kind === 'jira' ? <Ticket className="w-4 h-4 text-secondary" />
                : <span className={`w-2 h-2 rounded-full ${l.kind === 'staging' ? 'bg-primary' : 'bg-secondary'}`} />;
    return (
        <a href={l.href} target={l.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="flex items-center justify-between p-2 rounded bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors">
            <div className="flex items-center gap-2 min-w-0">
                {lead}
                <span className="truncate">{l.label}</span>
            </div>
            {l.badge ? (
                <span className={`font-label-xs text-label-xs ${toneText[l.badge.tone]} ${l.badge.mono ? 'font-mono' : ''}`}>{l.badge.label}</span>
            ) : (
                <ExternalLink className="w-3.5 h-3.5 text-outline" />
            )}
        </a>
    );
}

export default function ProjectDetail() {
    const { id } = useParams();
    const { projects, tasks, projectDetails, toggleTask, addTask, deleteTask, archiveCompleted, resolveConflict, processes, syncTodo } = useNexus();
    const project = projects.find((p) => p.id === id);
    const detail = id ? projectDetails[id] : undefined;

    const [procs, setProcs] = useState<ProjectProcess[]>(detail?.processes ?? []);
    useEffect(() => setProcs(detail?.processes ?? []), [detail]);
    const [title, setTitle] = useState('');
    const [priority, setPriority] = useState<Priority>('NORMAL');
    const [copied, flashCopied] = useFlash(1000);
    const [polling, flashPoll] = useFlash(800);
    const [filterOpen, setFilterOpen] = useState(false);

    if (!project) {
        return (
            <div className="py-20 text-center">
                <p className="font-headline-md text-headline-md text-on-surface mb-2">Project not found</p>
                <Link to="/projects" className="text-primary font-body-md hover:underline">← Back to projects</Link>
            </div>
        );
    }

    const Icon = projectIcons[project.icon];
    const mine = tasks.filter((t) => t.projectId === project.id);
    const open = mine.filter((t) => !t.done).sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]);
    const doneTasks = mine.filter((t) => t.done);
    const pct = mine.length ? Math.round((doneTasks.length / mine.length) * 100) : 0;
    const visibleOpen = filterOpen ? open.filter((t) => t.priority === 'HIGH' || t.priority === 'URGENT') : open;
    const link = (k: EnvLink['kind']) => detail?.envLinks.find((l) => l.kind === k);
    const totalMem = procs.reduce((n, p) => n + p.memoryMb, 0);
    const collision = processes.find((p) => p.status === 'collision' && p.port === project.conflictPort);
    const todoPath = detail?.todoPath ?? `${project.path}/TODO.md`;
    const uncommitted = detail?.uncommitted ?? project.git.modified;

    const onAdd = (e: FormEvent) => {
        e.preventDefault();
        const t = title.trim();
        if (!t) return;
        addTask({ projectId: project.id, title: t, priority });
        setTitle('');
    };

    const row = (t: Task, done: boolean) => (
        <div key={t.id} className={`group flex items-center justify-between px-space-sm py-2 rounded transition-colors ${done ? 'bg-surface-container/60 hover:bg-surface-container' : 'bg-surface-container hover:bg-surface-container-high'}`}>
            <div className="flex items-center gap-space-sm min-w-0">
        <span className={`text-outline cursor-grab ${done ? 'opacity-30' : 'opacity-40 group-hover:opacity-100'} transition-opacity`}>
          <GripVertical className="w-3.5 h-3.5" />
        </span>
                <input type="checkbox" checked={t.done} onChange={() => toggleTask(t.id)} className="w-3.5 h-3.5 rounded bg-surface-container-lowest border-0 accent-primary cursor-pointer" />
                <div className="flex items-center gap-2 truncate">
                    {t.scope && <span className={`font-code-sm text-code-sm font-medium ${done ? 'text-outline line-through' : toneText[t.scopeTone ?? 'outline']}`}>[{t.scope}]</span>}
                    <span className={`font-body-md text-body-md truncate ${done ? 'text-outline line-through' : 'text-on-surface'}`}>{t.title}</span>
                </div>
            </div>
            {done ? (
                <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="font-code-sm text-code-sm text-outline">{t.doneAt}</span>
                    <button type="button" title="Delete task" onClick={() => deleteTask(t.id)} className="text-outline hover:text-error opacity-0 group-hover:opacity-100 transition-opacity font-code-sm text-code-sm">✕</button>
                </div>
            ) : (
                <div className="flex items-center gap-space-sm shrink-0 ml-2">
                    <PriorityPill p={t.priority} />
                    {t.due && (
                        <span className={`font-code-sm text-code-sm flex items-center gap-1 ${t.dueTone === 'error' ? 'text-error' : 'text-on-surface-variant'}`}>
              {t.due === 'Today' && <Clock className="w-3 h-3" />}
                            <span>{t.due}</span>
            </span>
                    )}
                    <button type="button" title="Delete task" onClick={() => deleteTask(t.id)} className="text-outline hover:text-error opacity-0 group-hover:opacity-100 transition-opacity font-code-sm text-code-sm">✕</button>
                </div>
            )}
        </div>
    );

    return (
        <div className="flex flex-col w-full pb-10 gap-space-lg">
            {/* Breadcrumb + watcher */}
            <div className="flex items-center justify-between py-space-xs">
                <div className="flex items-center gap-space-xs text-on-surface-variant font-code-sm text-code-sm">
                    <Link to="/" className="hover:text-primary transition-colors flex items-center gap-1"><House className="w-3.5 h-3.5" /><span>Workspace</span></Link>
                    <ChevronRight className="w-3 h-3 text-outline" />
                    <Link to="/projects" className="hover:text-primary transition-colors">Projects</Link>
                    <ChevronRight className="w-3 h-3 text-outline" />
                    <span className="text-on-surface font-semibold bg-surface-container-high px-2 py-0.5 rounded">{project.name}</span>
                </div>
                <div className="flex items-center gap-space-md">
                    <div className="flex items-center gap-space-xs font-code-sm text-code-sm text-outline">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                        <span className="text-on-surface-variant">Watcher Active</span>
                        <span className="text-surface-bright">•</span>
                        <span>Synced just now</span>
                    </div>
                    <button type="button" title="Force Repository Refresh" onClick={() => { flashPoll(); syncTodo(); }} className="flex items-center gap-1 px-2 py-1 rounded bg-surface-container-high hover:bg-surface-bright text-on-surface-variant hover:text-on-surface font-code-sm text-code-sm transition-colors">
                        <RefreshCw className={`w-3 h-3 text-primary ${polling ? 'animate-spin' : ''}`} />
                        <span>Poll Now</span>
                    </button>
                </div>
            </div>

            {/* Hero */}
            <section className="w-full bg-surface-container-low rounded-xl p-space-lg flex flex-col lg:flex-row lg:items-center justify-between gap-space-lg shadow-sm">
                <div className="flex flex-col gap-space-sm min-w-0">
                    <div className="flex flex-wrap items-center gap-space-sm">
                        <div className="w-9 h-9 rounded bg-surface-container-high flex items-center justify-center text-primary shadow-inner"><Icon className="w-5 h-5" /></div>
                        <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">{project.name}</h1>
                        {project.version && <span className="font-code-sm text-code-sm px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-medium">{project.version}</span>}
                        {project.status === 'online' && (
                            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-code-sm text-code-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /><span>Online :{project.port}</span>
                            </div>
                        )}
                        {project.status === 'conflict' && (
                            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-tertiary/10 text-tertiary font-code-sm text-code-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse" /><span>Conflict :{project.conflictPort}</span>
                            </div>
                        )}
                        {(project.status === 'inactive' || project.status === 'library') && (
                            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant font-code-sm text-code-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-outline" /><span>{project.badge ?? 'Offline'}</span>
                            </div>
                        )}
                    </div>
                    <div className="flex flex-wrap items-center gap-space-sm">
                        <div className="flex items-center gap-1 px-2 py-1 rounded bg-surface-container-lowest text-on-surface-variant font-code-sm text-code-sm group">
                            <Folder className="w-3.5 h-3.5 text-outline group-hover:text-primary transition-colors" />
                            <span className="text-on-surface">{project.path}</span>
                            <button type="button" title="Copy Path" onClick={() => { navigator.clipboard?.writeText(project.path); flashCopied(); }} className="ml-1 p-0.5 hover:text-primary transition-colors">
                                {copied ? <span className="text-primary">✓</span> : <Copy className="w-3 h-3 text-outline hover:text-on-surface" />}
                            </button>
                        </div>
                        <div className="flex items-center gap-1 font-label-xs text-label-xs">
                            {project.stack.map((t) => (
                                <span key={t.label} className={`px-2 py-0.5 rounded bg-surface-container-high uppercase ${toneText[t.tone]}`}>{t.label}</span>
                            ))}
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-space-sm pt-0.5">
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-code-sm text-code-sm">
                            <GitBranch className="w-3.5 h-3.5 text-primary" /><span className="text-on-surface font-medium">{project.git.branch}</span>
                        </div>
                        {uncommitted > 0 && (
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-tertiary/10 text-tertiary font-code-sm text-code-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-tertiary" /><span>{uncommitted} uncommitted changes</span>
                            </div>
                        )}
                        {detail && (
                            <div className="flex items-center gap-1.5 text-outline font-code-sm text-code-sm">
                                <span className="px-1.5 py-0.5 rounded bg-surface-container-lowest text-on-surface-variant">{detail.lastCommit.sha}</span>
                                <span className="truncate max-w-[280px] text-on-surface-variant">{detail.lastCommit.message}</span>
                                <span className="text-outline text-label-xs">• {detail.lastCommit.when}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-space-sm shrink-0">
                    <div className="flex items-center gap-space-xs">
                        <button type="button" onClick={() => api.openInIde(project.id)} className="h-8 px-space-md rounded bg-primary text-on-primary font-medium font-body-md text-body-md flex items-center gap-1.5 hover:bg-primary-fixed transition-colors shadow-sm">
                            <Code className="w-4 h-4" /><span>Open in IDE</span>
                            <kbd className="font-code-sm text-label-xs px-1 bg-on-primary/15 rounded text-on-primary font-semibold ml-0.5">⌘O</kbd>
                        </button>
                        <button type="button" onClick={() => api.openInTerminal(project.id)} className="h-8 px-space-sm rounded bg-surface-container-high hover:bg-surface-bright text-on-surface font-body-md text-body-md flex items-center gap-1.5 transition-colors">
                            <Terminal className="w-4 h-4 text-on-surface-variant" /><span>Terminal</span>
                            <kbd className="font-code-sm text-label-xs px-1 bg-surface-container text-on-surface-variant rounded">^`</kbd>
                        </button>
                    </div>
                    <div className="flex items-center gap-1 bg-surface-container-lowest p-1 rounded">
                        {([
                            ['github', 'Repository', <Github key="g" className="w-3.5 h-3.5" />],
                            ['jira', 'Jira Board', <Ticket key="j" className="w-3.5 h-3.5" />],
                            ['staging', 'Staging Environment', <Globe key="s" className="w-3.5 h-3.5 text-secondary" />],
                            ['prod', 'Production Instance', <Zap key="p" className="w-3.5 h-3.5 text-primary" />],
                        ] as const).map(([k, label, ic]) => {
                            const l = link(k);
                            return l ? (
                                <a key={k} href={l.href} title={label} target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors">{ic}</a>
                            ) : null;
                        })}
                        <div className="w-px h-4 bg-surface-container-high" />
                        <button type="button" title="More Project Actions" className="w-7 h-7 rounded flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"><Ellipsis className="w-3.5 h-3.5" /></button>
                    </div>
                </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
                {/* Left column */}
                <div className="lg:col-span-7 flex flex-col gap-space-lg">
                    <section className="bg-surface-container-low rounded-xl p-space-lg flex flex-col gap-space-md shadow-sm">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-space-sm">
                                <h2 className="font-headline-md text-headline-md text-on-surface">Tasks &amp; Checklist</h2>
                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-primary/10 text-primary font-code-sm text-code-sm" title={`Path: ${todoPath}`}>
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary" /><span>Synced with TODO.md</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 text-on-surface-variant">
                                <button type="button" title="Reload TODO.md" onClick={() => syncTodo()} className="w-7 h-7 rounded hover:bg-surface-container-high hover:text-on-surface flex items-center justify-center transition-colors"><RefreshCw className="w-3.5 h-3.5" /></button>
                                <button type="button" title="Filter Tasks (high priority only)" onClick={() => setFilterOpen((v) => !v)} className={`w-7 h-7 rounded hover:bg-surface-container-high hover:text-on-surface flex items-center justify-center transition-colors ${filterOpen ? 'text-primary bg-surface-container-high' : ''}`}><Filter className="w-3.5 h-3.5" /></button>
                            </div>
                        </div>

                        <form onSubmit={onAdd} className="flex items-center gap-space-xs bg-surface-container-lowest p-1 rounded">
                            <div className="relative flex-1 flex items-center">
                                <Plus className="w-4 h-4 absolute left-3 text-outline pointer-events-none" />
                                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={`Add task to ${todoPath}...`} className="w-full h-8 pl-9 pr-3 bg-transparent font-body-sm text-body-sm text-on-surface placeholder:text-outline focus:outline-none" />
                            </div>
                            <div className="relative shrink-0">
                                <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className="appearance-none bg-surface-container-high text-on-surface-variant font-code-sm text-code-sm h-7 pl-2.5 pr-6 rounded focus:outline-none cursor-pointer">
                                    <option value="URGENT">URGENT</option><option value="HIGH">HIGH</option><option value="NORMAL">NORMAL</option><option value="LOW">LOW</option>
                                </select>
                                <ChevronDown className="w-3 h-3 text-outline absolute right-1.5 top-2 pointer-events-none" />
                            </div>
                            <button type="submit" className="w-7 h-7 rounded bg-primary text-on-primary flex items-center justify-center hover:bg-primary-fixed transition-colors shrink-0"><Plus className="w-4 h-4" strokeWidth={2.5} /></button>
                        </form>

                        <div className="flex flex-col gap-space-md mt-space-xs">
                            <div className="flex flex-col gap-space-xs">
                                <div className="flex items-center justify-between px-space-xs py-1">
                                    <span className="font-label-xs text-label-xs text-outline tracking-wider uppercase font-semibold">In Progress &amp; Priority ({visibleOpen.length})</span>
                                    <span className="font-code-sm text-code-sm text-outline">Priority Sorted</span>
                                </div>
                                {visibleOpen.map((t) => row(t, false))}
                                {visibleOpen.length === 0 && <p className="px-space-xs py-2 font-code-sm text-code-sm text-outline">Nothing pending.</p>}
                            </div>
                            <div className="flex flex-col gap-space-xs mt-space-sm">
                                <div className="flex items-center justify-between px-space-xs py-1">
                                    <span className="font-label-xs text-label-xs text-outline tracking-wider uppercase font-semibold">Completed ({doneTasks.length})</span>
                                    <button type="button" onClick={() => archiveCompleted(project.id)} className="font-code-sm text-code-sm text-primary hover:underline">Archive Completed</button>
                                </div>
                                {doneTasks.map((t) => row(t, true))}
                            </div>
                        </div>

                        <div className="pt-space-sm mt-space-xs flex flex-col gap-2">
                            <div className="flex items-center justify-between font-code-sm text-code-sm">
                                <span className="text-on-surface-variant font-medium">{doneTasks.length} of {mine.length} completed <span className="text-outline">({pct}%)</span></span>
                                <a href="#" onClick={(e) => { e.preventDefault(); api.openInIde(project.id); }} className="text-primary hover:underline flex items-center gap-1"><span>Open in Editor</span><ExternalLink className="w-3 h-3" /></a>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-surface-container-highest overflow-hidden"><div className="h-full bg-primary rounded-full transition-all duration-500 ease-out" style={{ width: `${pct}%` }} /></div>
                        </div>
                    </section>

                    <section className="bg-surface-container-low rounded-xl p-space-lg flex flex-col gap-space-md shadow-sm">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-space-sm">
                                <h3 className="font-headline-md text-headline-md text-on-surface">Commit Stream</h3>
                                <span className="font-code-sm text-code-sm text-outline">Branch: {project.git.branch}</span>
                            </div>
                            {detail && detail.aheadBy > 0 && <span className="font-label-xs text-label-xs px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-mono">{detail.aheadBy} commits ahead</span>}
                        </div>
                        <div className="flex flex-col gap-2 font-code-sm text-code-sm">
                            {(detail?.commits ?? []).map((c, i, arr) => (
                                <div key={c.sha} className="flex items-start gap-space-sm group p-1.5 rounded hover:bg-surface-container transition-colors">
                                    <div className="flex flex-col items-center mt-1">
                                        <span className={`w-2.5 h-2.5 rounded-full ${c.tone === 'primary' ? 'bg-primary ring-4 ring-primary/10' : c.tone === 'secondary' ? 'bg-secondary' : 'bg-surface-bright'}`} />
                                        {i < arr.length - 1 && <div className="w-0.5 h-8 bg-surface-container-highest my-0.5" />}
                                    </div>
                                    <div className="flex-1 flex items-center justify-between min-w-0">
                                        <div className="flex flex-col min-w-0">
                                            <span className={`truncate ${c.tone === 'primary' ? 'text-on-surface font-medium' : c.tone === 'secondary' ? 'text-on-surface' : 'text-on-surface-variant'}`}>{c.message}</span>
                                            <span className="text-outline text-label-xs truncate">{c.path}</span>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0 ml-2">
                                            <span className={`font-mono text-label-xs ${c.tone === 'primary' ? 'text-primary' : c.tone === 'secondary' ? 'text-secondary' : 'text-outline'}`}>{c.sha}</span>
                                            <span className="text-outline text-label-xs">{c.when}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {!detail && <p className="text-outline">No git history loaded for this project yet.</p>}
                        </div>
                    </section>
                </div>

                {/* Right column */}
                <div className="lg:col-span-5 flex flex-col gap-space-lg">
                    <section className="bg-surface-container-low rounded-xl p-space-lg flex flex-col gap-space-md shadow-sm">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-space-sm">
                                <h3 className="font-headline-md text-headline-md text-on-surface">Active Local Processes</h3>
                                <span className="font-label-xs text-label-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-medium flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />Live 2s</span>
                            </div>
                            <button type="button" onClick={() => procs.length && window.confirm('Kill all processes of this project?') && setProcs([])} className="font-code-sm text-code-sm text-error hover:bg-error-container hover:text-on-error-container px-2 py-0.5 rounded transition-colors font-medium">Kill All</button>
                        </div>
                        <div className="flex flex-col gap-space-xs font-code-sm text-code-sm">
                            {procs.map((p) => (
                                <div key={p.pid} className="flex flex-col p-space-sm rounded bg-surface-container gap-2 hover:bg-surface-container-high transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-space-sm">
                                            <span className="text-primary font-bold tracking-tight text-code-lg font-code-lg">:{p.port}</span>
                                            <span className="text-on-surface font-medium">{p.label}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {p.openUrl && <a href={p.openUrl} target="_blank" rel="noopener noreferrer" title={`Open ${p.openUrl}`} className="p-1 rounded text-outline hover:text-primary transition-colors"><ExternalLink className="w-3.5 h-3.5" /></a>}
                                            <button type="button" onClick={async () => { await api.killProcess(p.pid); setProcs((x) => x.filter((y) => y.pid !== p.pid)); }} className="px-2 py-0.5 rounded bg-error-container/20 hover:bg-error-container text-error hover:text-on-error-container text-label-xs font-semibold transition-colors">Kill</button>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between text-outline text-label-xs pt-1">
                                        <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-primary" /><span className="text-primary uppercase">LISTENING</span><span>•</span><span className="text-on-surface-variant font-mono">PID {p.pid}</span></div>
                                        <span className="text-on-surface-variant font-mono">{p.memoryMb.toFixed(1)} MB</span>
                                    </div>
                                </div>
                            ))}
                            {procs.length === 0 && <p className="text-outline px-1">No active process for this project.</p>}
                        </div>
                        <div className="flex items-center justify-between px-space-sm py-2 rounded bg-surface-container-lowest font-code-sm text-code-sm">
                            <div className="flex items-center gap-1 text-on-surface-variant"><Activity className="w-3.5 h-3.5 text-primary" /><span>Total Memory:</span><span className="text-on-surface font-medium font-mono">{totalMem.toFixed(1)} MB</span></div>
                            <div className="flex items-center gap-1 text-outline"><span>Uptime:</span><span className="text-on-surface-variant font-mono">{procs.length ? detail?.uptime ?? '—' : '—'}</span></div>
                        </div>
                    </section>

                    <section className="bg-surface-container-low rounded-xl p-space-lg flex flex-col gap-space-md shadow-sm">
                        <div className="flex flex-col">
                            <h3 className="font-headline-md text-headline-md text-on-surface">Configured Ports &amp; Endpoints</h3>
                            <p className="font-body-sm text-body-sm text-outline">Parsed dynamically from repository config tree</p>
                        </div>
                        <div className="flex flex-col gap-space-xs font-code-sm text-code-sm">
                            {(detail?.configuredPorts ?? []).map((c) => (
                                <div key={`${c.port}-${c.source}`} className="flex items-center justify-between p-space-sm rounded bg-surface-container">
                                    <div className="flex items-center gap-space-sm">
                                        <span className={`font-mono font-semibold ${c.status === 'active' ? 'text-primary' : c.status === 'conflict' ? 'text-tertiary' : 'text-outline'}`}>:{c.port}</span>
                                        <div className="flex flex-col"><span className="text-on-surface">{c.source}</span><span className="text-outline text-label-xs">{c.key}</span></div>
                                    </div>
                                    {c.status === 'conflict' ? (
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-1 font-label-xs text-label-xs px-2 py-0.5 rounded bg-tertiary/15 text-tertiary font-semibold"><TriangleAlert className="w-3 h-3" /><span>Conflict :{c.port}</span></div>
                                            <button type="button" onClick={() => collision && window.confirm(`Kill PID ${collision.pid}?`) && resolveConflict()} className="px-2 py-0.5 rounded bg-tertiary text-on-tertiary font-code-sm text-label-xs font-semibold hover:bg-tertiary-fixed transition-colors">Resolve</button>
                                        </div>
                                    ) : <PortStatus s={c.status} />}
                                </div>
                            ))}
                            {!detail && <p className="text-outline px-1">No port detected in this repository.</p>}
                        </div>
                        <div className="flex flex-col gap-space-sm pt-space-xs">
                            <div className="flex items-center justify-between">
                                <span className="font-label-xs text-label-xs text-outline tracking-wider uppercase font-semibold">Environment Shortcuts</span>
                                <span className="font-code-sm text-code-sm text-outline">{detail?.envLinks.length ?? 0} Mapped</span>
                            </div>
                            <div className="flex flex-col gap-1.5 font-code-sm text-code-sm">{(detail?.envLinks ?? []).map((l) => <EnvRow key={l.id} l={l} />)}</div>
                            <button type="button" onClick={() => window.prompt('Environment link URL')} className="w-full py-2 rounded bg-surface-container-lowest hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface font-code-sm text-code-sm flex items-center justify-center gap-1.5 transition-colors"><Plus className="w-3.5 h-3.5 text-primary" /><span>Add Environment Link</span></button>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}