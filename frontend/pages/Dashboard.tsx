import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Ban, ChevronRight, ChevronUp, CircleX, Clock, Code, DollarSign, GitBranch, Plus, Server, Terminal, BookOpen, MoreVertical } from 'lucide-react';
import { useNexus } from '../store';
import * as api from '../api';
import { priorityClasses, toneText } from '../ui';
import type { Project } from '../types';

function RuntimeState({ project }: { project: Project }) {
    if (project.status === 'online') {
        return (
            <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_6px_rgba(78,222,163,0.8)]" />
                <span className="font-code-sm text-code-sm text-primary font-medium">Online :{project.port}</span>
            </div>
        );
    }
    if (project.status === 'conflict') {
        return (
            <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse shadow-[0_0_6px_rgba(255,185,95,0.8)]" />
                <span className="font-code-sm text-code-sm text-tertiary font-medium">Conflict :{project.conflictPort}</span>
            </div>
        );
    }
    return (
        <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-outline" />
            <span className="font-code-sm text-code-sm text-outline font-medium">Offline</span>
        </div>
    );
}

function BranchStatus({ project }: { project: Project }) {
    const { git } = project;
    return (
        <div className="inline-flex items-center gap-1.5 font-code-sm text-code-sm px-2 py-0.5 rounded bg-surface-container-lowest text-on-surface">
            <GitBranch className="w-3.5 h-3.5 text-secondary" />
            <span>{git.branch}</span>
            {git.state === 'clean' && <span className="text-primary font-bold">✓</span>}
            {git.state === 'modified' && <span className="text-tertiary text-[10px]">● +{git.modified}</span>}
            {git.state === 'synced' && <span className="text-outline text-[10px]">synced</span>}
        </div>
    );
}

export default function Dashboard() {
    const { workspace, projects, tasks, processes, killProcess, killIdle, resolveConflict, toggleTask, addTask } = useNexus();
    const [draft, setDraft] = useState('');

    const online = processes.filter((p) => p.status === 'listening');
    const conflicts = processes.filter((p) => p.status === 'collision');
    const conflict = conflicts[0];
    const pending = tasks.filter((t) => !t.done);
    const highPriority = pending.filter((t) => t.priority === 'HIGH' || t.priority === 'URGENT').length;
    const dirtyFiles = projects.reduce((n, p) => n + p.git.modified, 0);
    const monitored = projects.filter((p) => p.status === 'online' || p.status === 'conflict');
    const priorities = tasks.filter((t) => t.focus).sort((a, b) => a.focus!.order - b.focus!.order);
    const completed = priorities.filter((t) => t.done).length;

    const projectName = (id: string) => projects.find((p) => p.id === id)?.name ?? id;
    const conflictProject = conflict ? projects.find((p) => p.id === conflict.projectId) : undefined;

    const onSubmit = (e: FormEvent) => {
        e.preventDefault();
        const title = draft.trim();
        if (!title) return;
        addTask({ projectId: projects[0]?.id ?? '', title, priority: 'NORMAL', focus: true });
        setDraft('');
    };

    const onKill = async (pid: number, port: number) => {
        if (window.confirm(`Terminate process bound to port ${port}?`)) await killProcess(pid);
    };

    return (
        <div className="flex flex-col w-full pb-12 gap-space-lg">
            {/* Section 1: metrics */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
                <div className="bg-surface-container-low rounded-xl p-space-md shadow-sm relative overflow-hidden hover:bg-surface-container transition-all">
                    <div className="flex items-center justify-between">
                        <span className="font-label-xs text-label-xs uppercase tracking-wider text-outline">Workspace Repos</span>
                        <div className="w-7 h-7 rounded bg-surface-container-high flex items-center justify-center text-primary">
                            <BookOpen className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-space-md flex items-baseline gap-space-sm">
                        <span className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-bold">{projects.length}</span>
                        <span className="font-code-sm text-code-sm px-1.5 py-0.5 rounded bg-surface-container-high text-primary flex items-center gap-0.5">
              <ChevronUp className="w-3 h-3" strokeWidth={2.5} />+{workspace.reposAddedThisMonth}
            </span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">this month</span>
                    </div>
                    <div className="mt-space-sm pt-space-xs flex items-center gap-space-xs text-outline font-code-sm text-code-sm">
                        <span>{workspace.root}/workspace/*</span>
                        <span className="text-primary-container">•</span>
                        <span className="text-on-surface-variant">{dirtyFiles === 0 ? 'Clean tree' : `${dirtyFiles} dirty files`}</span>
                    </div>
                </div>

                <div className="bg-surface-container-low rounded-xl p-space-md shadow-sm relative overflow-hidden hover:bg-surface-container transition-all">
                    <div className="flex items-center justify-between">
                        <span className="font-label-xs text-label-xs uppercase tracking-wider text-outline">Active Daemons</span>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(78,222,163,0.8)]" />
                            <span className="font-label-xs text-label-xs text-primary font-semibold">LIVE</span>
                        </div>
                    </div>
                    <div className="mt-space-md flex items-baseline gap-space-sm">
                        <span className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-bold">{online.length}</span>
                        <span className="font-body-md text-body-md text-primary font-medium">Online</span>
                    </div>
                    <div className="mt-space-sm pt-space-xs flex items-center gap-1.5 font-code-sm text-code-sm">
                        {online.map((p) => (
                            <span key={p.pid} className="px-1.5 py-0.5 rounded bg-surface-container-high text-primary">:{p.port}</span>
                        ))}
                    </div>
                </div>

                <div className="bg-surface-container-low rounded-xl p-space-md shadow-sm relative overflow-hidden hover:bg-surface-container transition-all">
                    <div className="flex items-center justify-between">
                        <span className="font-label-xs text-label-xs uppercase tracking-wider text-outline">Synced Tasks</span>
                        <div className="w-7 h-7 rounded bg-surface-container-high flex items-center justify-center text-secondary">
                            <Clock className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-space-md flex items-baseline gap-space-sm">
                        <span className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-bold">{pending.length}</span>
                        <span className="font-body-md text-body-md text-on-surface-variant">pending</span>
                    </div>
                    <div className="mt-space-sm pt-space-xs flex items-center justify-between font-body-sm text-body-sm">
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
                            <span className="text-tertiary font-medium">{highPriority} high priority</span>
                        </div>
                        <span className="font-code-sm text-code-sm text-outline">TODO.md</span>
                    </div>
                </div>

                <div className="bg-surface-container-low rounded-xl p-space-md shadow-sm relative overflow-hidden hover:bg-surface-container transition-all">
                    <div className="flex items-center justify-between">
                        <span className={`font-label-xs text-label-xs uppercase tracking-wider ${conflict ? 'text-tertiary' : 'text-outline'}`}>Network Anomaly</span>
                        {conflict ? (
                            <span className="px-1.5 py-0.5 rounded bg-tertiary/10 text-tertiary font-label-xs text-label-xs font-semibold animate-pulse">ATTN</span>
                        ) : (
                            <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-label-xs text-label-xs font-semibold">OK</span>
                        )}
                    </div>
                    <div className="mt-space-md flex items-baseline justify-between">
                        <div>
                            <span className={`font-headline-xl text-headline-xl tracking-tight font-bold ${conflict ? 'text-tertiary' : 'text-on-surface'}`}>{conflicts.length}</span>
                            <span className="font-body-md text-body-md text-on-surface-variant ml-1.5">Conflict{conflicts.length === 1 ? '' : 's'}</span>
                        </div>
                        {conflict && (
                            <button
                                type="button"
                                onClick={resolveConflict}
                                className="h-6 px-2.5 rounded bg-tertiary text-on-tertiary font-label-xs text-label-xs uppercase tracking-wider font-semibold hover:bg-tertiary-fixed transition-colors flex items-center gap-1 shadow-sm"
                            >
                                <span>Resolve</span>
                                <ChevronRight className="w-3 h-3" strokeWidth={2.5} />
                            </button>
                        )}
                    </div>
                    <div className="mt-space-sm pt-space-xs flex items-center gap-1.5 font-code-sm text-code-sm text-on-surface-variant truncate">
                        {conflict ? (
                            <>
                                <span className="text-tertiary font-medium">:{conflict.port}</span>
                                <span className="text-outline truncate">{conflict.command.split(' / ')[0]} vs {conflictProject?.name}</span>
                            </>
                        ) : (
                            <span className="text-outline">No port contention detected</span>
                        )}
                    </div>
                </div>
            </section>

            {/* Section 2: active projects + today's priorities */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
                <div className="lg:col-span-8 bg-surface-container-low rounded-xl p-space-md shadow-sm flex flex-col gap-space-md">
                    <div className="flex items-center justify-between pb-space-xs">
                        <div className="flex items-center gap-space-sm">
                            <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                            <h2 className="font-headline-md text-headline-md font-semibold text-on-surface tracking-tight">Active Projects</h2>
                            <span className="font-label-xs text-label-xs px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant">{monitored.length} monitored</span>
                        </div>
                        <div className="flex items-center gap-space-xs">
                            <button type="button" className="h-7 px-2.5 rounded bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high font-code-sm text-code-sm flex items-center gap-1 transition-all">
                                <Activity className="w-3.5 h-3.5" />
                                <span>Topology</span>
                            </button>
                            <button type="button" className="w-7 h-7 rounded bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high flex items-center justify-center transition-all">
                                <MoreVertical className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                    <div className="overflow-x-auto w-full">
                        <table className="w-full text-left border-collapse">
                            <thead>
                            <tr className="bg-surface-container-lowest text-outline font-label-xs text-label-xs uppercase tracking-wider">
                                <th className="py-2.5 px-space-md rounded-l">Repository</th>
                                <th className="py-2.5 px-space-md">Branch Status</th>
                                <th className="py-2.5 px-space-md">Runtime State</th>
                                <th className="py-2.5 px-space-md text-right rounded-r">Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {monitored.map((p) => (
                                <tr key={p.id} className="hover:bg-surface-container transition-colors group">
                                    <td className="py-3 px-space-md">
                                        <div className="flex flex-col">
                                            <Link to={`/projects/${p.id}`} className="font-headline-md text-headline-md text-on-surface font-semibold group-hover:text-primary transition-colors cursor-pointer">
                                                {p.name}
                                            </Link>
                                            <div className="flex items-center gap-1.5 mt-1">
                                                {p.dashboardTags.map((t) => (
                                                    <span key={t.label} className={`font-code-sm text-code-sm px-1.5 rounded bg-surface-container-high ${toneText[t.tone]}`}>{t.label}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3 px-space-md"><BranchStatus project={p} /></td>
                                    <td className="py-3 px-space-md"><RuntimeState project={p} /></td>
                                    <td className="py-3 px-space-md text-right">
                                        <div className="inline-flex items-center gap-1.5">
                                            <button
                                                type="button"
                                                title="Launch IDE"
                                                onClick={() => api.openInIde(p.id)}
                                                className="w-7 h-7 rounded bg-surface-container-high hover:bg-primary hover:text-on-primary text-on-surface-variant flex items-center justify-center transition-colors"
                                            >
                                                <Code className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                title="Open Integrated Shell"
                                                onClick={() => api.openInTerminal(p.id)}
                                                className="w-7 h-7 rounded bg-surface-container-high hover:bg-secondary hover:text-on-secondary text-on-surface-variant flex items-center justify-center transition-colors"
                                            >
                                                <Terminal className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="lg:col-span-4 bg-surface-container-low rounded-xl p-space-md shadow-sm flex flex-col gap-space-md">
                    <div className="flex items-center justify-between pb-space-xs">
                        <div className="flex items-center gap-space-sm">
                            <DollarSign className="w-4 h-4 text-primary" />
                            <h2 className="font-headline-md text-headline-md font-semibold text-on-surface tracking-tight">Today's Priorities</h2>
                        </div>
                        <span className="font-code-sm text-code-sm text-outline">syncing...</span>
                    </div>
                    <form className="relative flex items-center" onSubmit={onSubmit}>
                        <input
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            placeholder="Add task to TODO.md (e.g. fix telemetry)"
                            className="w-full h-8 pl-3 pr-8 rounded bg-surface-container-lowest font-body-sm text-body-sm text-on-surface placeholder:text-outline focus:outline-none focus:bg-surface-container-high transition-all"
                        />
                        <button type="submit" className="absolute right-1 w-6 h-6 rounded bg-primary/20 text-primary hover:bg-primary hover:text-on-primary flex items-center justify-center transition-colors">
                            <Plus className="w-3 h-3" strokeWidth={2.5} />
                        </button>
                    </form>
                    <div className="flex flex-col gap-1.5">
                        {priorities.map((t) => (
                            <label key={t.id} className="flex items-start gap-space-sm p-2 rounded bg-surface-container-lowest hover:bg-surface-container transition-colors cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={t.done}
                                    onChange={() => toggleTask(t.id)}
                                    className="mt-1 w-3.5 h-3.5 rounded bg-surface-container border-0 accent-primary cursor-pointer"
                                />
                                <div className="flex flex-col flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-1">
                                        <span className={`font-body-md text-body-md truncate ${t.done ? 'line-through text-outline' : 'text-on-surface group-hover:text-primary transition-colors'}`}>{t.title}</span>
                                        <span className={`font-label-xs text-label-xs px-1.5 rounded shrink-0 ${priorityClasses(t.priority)}`}>{t.priority}</span>
                                    </div>
                                    <div className={`flex items-center gap-1.5 mt-0.5 font-code-sm text-code-sm ${t.done ? 'text-outline' : 'text-on-surface-variant'}`}>
                                        <span className={!t.done && t.highlight ? 'text-tertiary' : ''}>{projectName(t.projectId)}</span>
                                        <span>•</span>
                                        {t.done ? <span className="text-primary font-medium">resolved</span> : <span className="text-outline">{t.due ? `due ${t.due.toLowerCase()}` : t.tag ? `#${t.tag}` : 'backlog'}</span>}
                                    </div>
                                </div>
                            </label>
                        ))}
                    </div>
                    <div className="pt-space-xs flex items-center justify-between font-code-sm text-code-sm text-outline border-t border-surface-container">
                        <span>Completed: {completed}/{priorities.length}</span>
                        <Link to="/tasks" className="text-primary hover:underline">View all in TODO.md →</Link>
                    </div>
                </div>
            </section>

            {/* Section 3: ports & daemons */}
            <section className="bg-surface-container-low rounded-xl p-space-md shadow-sm flex flex-col gap-space-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm pb-space-xs">
                    <div className="flex items-center gap-space-sm">
                        <div className="w-7 h-7 rounded bg-surface-container-high flex items-center justify-center text-primary">
                            <Server className="w-4 h-4" />
                        </div>
                        <div>
                            <h2 className="font-headline-md text-headline-md font-semibold text-on-surface tracking-tight">Active Local Ports &amp; Daemons</h2>
                            <p className="font-body-sm text-body-sm text-on-surface-variant">Real-time socket inspection across {workspace.telemetry.platform}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-space-sm">
                        <span className="font-code-sm text-code-sm px-2 py-1 rounded bg-surface-container-lowest text-primary">Auto-refresh: 2s</span>
                        <button
                            type="button"
                            onClick={() => window.confirm('Kill all idle listening processes?') && killIdle()}
                            className="h-7 px-space-sm rounded bg-surface-container-high hover:bg-error hover:text-on-error text-error text-body-sm font-medium transition-colors flex items-center gap-1.5"
                        >
                            <CircleX className="w-3.5 h-3.5" />
                            <span>Kill Idle</span>
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto w-full">
                    <table className="w-full text-left border-collapse">
                        <thead>
                        <tr className="bg-surface-container-lowest text-outline font-label-xs text-label-xs uppercase tracking-wider">
                            <th className="py-2.5 px-space-md rounded-l">Local Port</th>
                            <th className="py-2.5 px-space-md">Mapped Project</th>
                            <th className="py-2.5 px-space-md">Command / PID</th>
                            <th className="py-2.5 px-space-md">Memory</th>
                            <th className="py-2.5 px-space-md">Status</th>
                            <th className="py-2.5 px-space-md text-right rounded-r">Action</th>
                        </tr>
                        </thead>
                        <tbody>
                        {processes.map((p) => {
                            const bad = p.status === 'collision';
                            return (
                                <tr key={p.pid} className={`hover:bg-surface-container transition-colors group ${bad ? 'bg-tertiary/5' : ''}`}>
                                    <td className={`py-3 px-space-md font-code-md text-code-md font-bold ${bad ? 'text-tertiary' : 'text-primary'}`}>:{p.port}</td>
                                    <td className="py-3 px-space-md">
                                        <span className={`font-body-md text-body-md font-medium ${bad ? 'text-tertiary' : 'text-on-surface'}`}>{projectName(p.projectId)}</span>
                                    </td>
                                    <td className="py-3 px-space-md font-code-sm text-code-sm text-on-surface-variant">
                                        <span className={bad ? 'text-tertiary' : 'text-on-surface'}>{p.command}</span>
                                        <span className="text-outline ml-1.5">PID {p.pid}</span>
                                    </td>
                                    <td className="py-3 px-space-md font-code-sm text-code-sm text-on-surface-variant">{p.memoryMb.toFixed(1)} MB</td>
                                    <td className="py-3 px-space-md">
                                        {bad ? (
                                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-tertiary/20 text-tertiary font-label-xs text-label-xs font-semibold">
                                                <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-ping" />
                                                <span>COLLISION</span>
                                            </div>
                                        ) : (
                                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-primary/10 text-primary font-label-xs text-label-xs font-semibold">
                                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                                <span>LISTENING</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="py-3 px-space-md text-right">
                                        <button
                                            type="button"
                                            onClick={() => onKill(p.pid, p.port)}
                                            className={
                                                bad
                                                    ? 'px-2.5 py-1 rounded bg-error text-on-error hover:bg-on-error-container font-code-sm text-code-sm flex items-center gap-1 ml-auto transition-colors font-medium shadow-sm'
                                                    : 'px-2.5 py-1 rounded bg-surface-container-high hover:bg-error hover:text-on-error text-on-surface-variant font-code-sm text-code-sm flex items-center gap-1 ml-auto transition-colors'
                                            }
                                        >
                                            <Ban className={`w-3.5 h-3.5 ${bad ? '' : 'text-error'}`} />
                                            <span>{bad ? 'Terminate' : 'Kill'}</span>
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                        {processes.length === 0 && (
                            <tr><td colSpan={6} className="py-8 text-center font-code-sm text-code-sm text-outline">No active listening sockets</td></tr>
                        )}
                        </tbody>
                    </table>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-space-xs pt-space-xs text-outline font-code-sm text-code-sm">
                    <div className="flex items-center gap-space-sm">
                        <span>Kernel Socket Buffer: {workspace.telemetry.socketBufferKb}KB</span>
                        <span>•</span>
                        <span>TCP Latency: {workspace.telemetry.latencyMs}ms</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-primary" />
                        <span className="text-on-surface-variant">{workspace.telemetry.tap}</span>
                    </div>
                </div>
            </section>
        </div>
    );
}