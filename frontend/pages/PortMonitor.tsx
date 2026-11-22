import { Fragment, useMemo, useRef, useState } from 'react';
import { ArrowRight, Box, Code, ExternalLink, FileCode, FileText, Folder, Play, RefreshCw, Search, Trash2, TriangleAlert, X, Zap } from 'lucide-react';
import { useNexus } from '../store';
import * as api from '../api';
import { useFlash } from '../ui';

export default function PortMonitor() {
    const { workspace, projects, processes, staticPorts, killProcess, killIdle, resolveConflict, launchStaticPort, reassignStaticPort, settings } = useNexus();
    const [query, setQuery] = useState('');
    const [inspecting, setInspecting] = useState<number | null>(null);
    const [rescanning, flashRescan] = useFlash(900);
    const staticRef = useRef<HTMLDivElement>(null);

    const name = (id: string) => projects.find((p) => p.id === id)?.name ?? id;
    const collision = processes.find((p) => p.status === 'collision');
    const listening = processes.filter((p) => p.status === 'listening').length;
    const manifests = new Set(staticPorts.map((s) => s.file)).size;
    const live = settings.pollInterval !== 'manual';

    const q = query.trim().toLowerCase();
    const filtered = useMemo(
        () => processes.filter((p) => !q || `:${p.port} ${p.pid} ${p.command} ${name(p.projectId)}`.toLowerCase().includes(q)),
        [processes, projects, q],
    );

    const fileIcon = (k: 'doc' | 'code' | 'box') =>
        k === 'doc' ? <FileText className="w-3 h-3 text-outline" /> : k === 'code' ? <FileCode className="w-3 h-3 text-outline" /> : <Box className="w-3 h-3 text-outline" />;

    return (
        <div className="flex flex-col w-full pb-12 gap-space-lg pt-space-md">
            {/* Collision banner */}
            {collision && (
                <div className="w-full rounded-lg bg-tertiary-container/15 p-space-md flex flex-col md:flex-row items-start md:items-center justify-between gap-space-md shadow-sm relative overflow-hidden">
                    <div className="absolute inset-y-0 left-0 w-1 bg-tertiary" />
                    <div className="flex items-center gap-space-sm pl-space-xs">
                        <div className="w-8 h-8 rounded bg-tertiary/20 flex items-center justify-center shrink-0 text-tertiary"><TriangleAlert className="w-4 h-4" /></div>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-space-xs flex-wrap">
                                <span className="font-headline-md text-headline-md text-tertiary font-semibold tracking-tight">Port Collision Detected on :{collision.port}</span>
                                <span className="font-code-sm text-code-sm px-1.5 py-0.5 rounded bg-surface-container-lowest text-tertiary-fixed font-medium">CRITICAL CONFLICT</span>
                            </div>
                            <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                                Process <code className="font-code-sm text-code-sm text-on-surface bg-surface-container-lowest px-1 py-0.5 rounded">{collision.command.split(' / ')[0]}</code> (PID {collision.pid}) is holding the socket while repository{' '}
                                <code className="font-code-sm text-code-sm text-primary bg-surface-container-lowest px-1 py-0.5 rounded">{name(collision.projectId)}</code> is mapped to bind it.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-space-sm self-end md:self-center shrink-0">
                        <button type="button" onClick={() => staticRef.current?.scrollIntoView({ behavior: 'smooth' })} className="h-8 px-space-sm rounded bg-surface-container-highest hover:bg-surface-bright text-on-surface font-label-md text-label-md flex items-center gap-1.5 transition-all">
                            <Code className="w-3.5 h-3.5 text-on-surface-variant" /><span>View Config</span>
                        </button>
                        <button type="button" onClick={() => window.confirm(`Terminate PID ${collision.pid} on :${collision.port}?`) && resolveConflict()} className="h-8 px-space-md rounded bg-tertiary hover:bg-tertiary-fixed text-on-tertiary font-label-md text-label-md font-semibold tracking-tight shadow-sm flex items-center gap-1.5 transition-all">
                            <X className="w-3.5 h-3.5" /><span>Resolve / Kill PID</span>
                        </button>
                    </div>
                </div>
            )}

            {/* KPI */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
                <div className="bg-surface-container-low rounded-lg p-space-md flex flex-col justify-between shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="font-body-sm text-body-sm text-on-surface-variant uppercase tracking-wider font-medium">Active Listening Ports</span>
                        <span className="font-label-xs text-label-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /><span>Live Kernel Watch</span></span>
                    </div>
                    <div className="flex items-baseline gap-space-sm mt-3">
                        <span className="font-headline-xl text-headline-xl text-on-surface font-semibold tracking-tight">{processes.length}</span>
                        <span className="font-code-sm text-code-sm text-primary">TCP sockets active</span>
                    </div>
                    <div className="flex items-center gap-space-xs mt-3 pt-space-xs text-on-surface-variant font-code-sm text-code-sm"><ArrowRight className="w-3.5 h-3.5 text-outline shrink-0" /><span className="truncate">{listening} listening · all sockets bound to 0.0.0.0 / 127.0.0.1</span></div>
                </div>
                <div className="bg-surface-container-low rounded-lg p-space-md flex flex-col justify-between shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="font-body-sm text-body-sm text-on-surface-variant uppercase tracking-wider font-medium">Configured Static Ports</span>
                        <span className="font-label-xs text-label-xs px-2 py-0.5 rounded-full bg-surface-container-highest text-secondary flex items-center gap-1.5"><FileText className="w-2.5 h-2.5" /><span>{manifests} Manifests Parsed</span></span>
                    </div>
                    <div className="flex items-baseline gap-space-sm mt-3">
                        <span className="font-headline-xl text-headline-xl text-on-surface font-semibold tracking-tight">{staticPorts.length}</span>
                        <span className="font-code-sm text-code-sm text-on-surface-variant">declarations declared</span>
                    </div>
                    <div className="flex items-center gap-space-xs mt-3 pt-space-xs text-on-surface-variant font-code-sm text-code-sm"><FileText className="w-3.5 h-3.5 text-outline shrink-0" /><span className="truncate">docker-compose, .env, configs parsed</span></div>
                </div>
                <div className="bg-surface-container-low rounded-lg p-space-md flex flex-col justify-between shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="font-body-sm text-body-sm text-on-surface-variant uppercase tracking-wider font-medium">System Network Load</span>
                        <span className="font-label-xs text-label-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">OPTIMAL</span>
                    </div>
                    <div className="flex items-baseline gap-space-sm mt-3">
                        <span className="font-headline-xl text-headline-xl text-primary font-semibold tracking-tight">{workspace.telemetry.latencyMs}ms</span>
                        <span className="font-code-sm text-code-sm text-on-surface-variant">loopback ping</span>
                    </div>
                    <div className="flex items-center gap-space-xs mt-3 pt-space-xs text-on-surface-variant font-code-sm text-code-sm"><Zap className="w-3.5 h-3.5 text-outline shrink-0" /><span className="truncate">Buffer: {workspace.telemetry.socketBufferKb}KB / {workspace.telemetry.droppedPackets} dropped packets</span></div>
                </div>
            </div>

            {/* Live processes */}
            <div className="bg-surface-container-low rounded-lg p-space-md md:p-space-lg flex flex-col shadow-sm">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-space-md gap-space-md">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-space-sm">
                            <h2 className="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight">Live Active Processes &amp; Sockets</h2>
                            <span className="font-label-xs text-label-xs px-2 py-0.5 rounded bg-surface-container-highest text-primary font-medium flex items-center gap-1.5">
                <RefreshCw className={`w-2.5 h-2.5 ${live ? 'animate-spin' : ''}`} strokeWidth={3} />
                                {live ? `Auto-refresh: ${settings.pollInterval}` : 'Manual refresh'}
              </span>
                        </div>
                        <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Real-time socket inspection via lsof / eBPF kernel network tap.</p>
                    </div>
                    <div className="flex items-center gap-space-sm flex-wrap">
                        <div className="relative flex items-center">
                            <Search className="w-3.5 h-3.5 text-outline absolute left-3 pointer-events-none" />
                            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter by port, PID, or process..." className="h-8 pl-8 pr-3 rounded bg-surface-container-lowest font-body-sm text-body-sm text-on-surface placeholder:text-outline focus:outline-none focus:bg-surface-container w-64 md:w-72 transition-colors" />
                        </div>
                        <button type="button" onClick={() => window.confirm('Kill all idle listening processes?') && killIdle()} className="h-8 px-space-sm rounded bg-error/10 hover:bg-error/20 text-error font-label-md text-label-md flex items-center gap-1.5 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" /><span>Kill All Idle</span>
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto w-full">
                    <table className="w-full text-left border-collapse">
                        <thead>
                        <tr className="bg-surface-container-lowest/60 text-outline font-label-xs text-label-xs uppercase">
                            {['LOCAL PORT', 'PROTOCOL', 'MAPPED PROJECT', 'COMMAND & PID', 'RAM / CPU', 'STATUS'].map((h, i) => (
                                <th key={h} className={`py-2.5 px-space-sm font-semibold ${i === 0 ? 'rounded-l' : ''}`}>{h}</th>
                            ))}
                            <th className="py-2.5 px-space-sm font-semibold text-right rounded-r">ACTIONS</th>
                        </tr>
                        </thead>
                        <tbody className="text-on-surface font-body-md text-body-md">
                        {filtered.map((p) => {
                            const bad = p.status === 'collision';
                            return (
                                <Fragment key={p.pid}>
                                    <tr className={`transition-colors group ${bad ? 'bg-tertiary-container/10 hover:bg-tertiary-container/20' : 'hover:bg-surface-container'}`}>
                                        <td className={`py-3 px-space-sm font-code-lg text-code-lg font-bold tracking-wider ${bad ? 'text-tertiary' : 'text-primary'}`}>:{p.port}</td>
                                        <td className="py-3 px-space-sm"><span className={`font-code-sm text-code-sm px-1.5 py-0.5 rounded ${bad ? 'bg-tertiary-container/30 text-tertiary' : 'bg-surface-container-highest text-secondary-fixed-dim'}`}>{p.protocol}</span></td>
                                        <td className="py-3 px-space-sm">
                                            <div className={`flex items-center gap-space-xs font-medium ${bad ? 'text-tertiary' : 'text-on-surface'}`}><Folder className={`w-3.5 h-3.5 ${bad ? 'text-tertiary' : 'text-outline'}`} /><span>{name(p.projectId)}</span></div>
                                        </td>
                                        <td className="py-3 px-space-sm">
                                            <div className="flex items-center gap-1.5 font-code-sm text-code-sm">
                                                <span className={bad ? 'text-tertiary font-medium' : 'text-on-surface'}>{p.command}</span>
                                                <span className="text-outline">·</span>
                                                <span className={bad ? 'text-tertiary font-bold' : 'text-on-surface-variant font-medium'}>PID {p.pid}</span>
                                            </div>
                                        </td>
                                        <td className={`py-3 px-space-sm font-code-sm text-code-sm ${bad ? 'text-tertiary-fixed' : 'text-on-surface-variant'}`}>
                                            {p.memoryMb.toFixed(1)} MB <span className="text-outline">/</span> <span className={bad ? '' : 'text-primary font-medium'}>{p.cpuPct.toFixed(1)}%</span>
                                        </td>
                                        <td className="py-3 px-space-sm">
                                            {bad ? (
                                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-tertiary text-on-tertiary font-label-xs text-label-xs font-bold uppercase tracking-wider"><TriangleAlert className="w-3 h-3 shrink-0" />COLLISION</span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 text-primary font-label-xs text-label-xs font-bold uppercase tracking-wider"><span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />LISTENING</span>
                                            )}
                                        </td>
                                        <td className="py-3 px-space-sm text-right">
                                            <div className="flex items-center justify-end gap-space-xs">
                                                {bad ? (
                                                    <>
                                                        <button type="button" onClick={() => setInspecting(inspecting === p.pid ? null : p.pid)} className="h-7 px-2.5 rounded bg-surface-container-highest hover:bg-surface-bright text-on-surface font-code-sm text-code-sm transition-colors">Inspect</button>
                                                        <button type="button" onClick={() => window.confirm(`Terminate PID ${p.pid}?`) && killProcess(p.pid)} className="h-7 px-2.5 rounded bg-error text-on-error hover:bg-error-container font-code-sm text-code-sm font-semibold transition-colors">Terminate PID {p.pid}</button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <a href={`http://localhost:${p.port}`} target="_blank" rel="noopener noreferrer" className="h-7 px-2 rounded bg-surface-container-highest hover:bg-surface-bright text-on-surface font-code-sm text-code-sm flex items-center gap-1 transition-colors"><span>Open</span><ExternalLink className="w-3 h-3 text-outline group-hover:text-primary" /></a>
                                                        <button type="button" onClick={() => window.confirm(`Kill PID ${p.pid} (:${p.port})?`) && killProcess(p.pid)} className="h-7 px-2 rounded bg-error-container/20 hover:bg-error-container/40 text-error font-code-sm text-code-sm font-medium transition-colors">Kill</button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                    {inspecting === p.pid && (
                                        <tr className="bg-surface-container-lowest">
                                            <td colSpan={7} className="px-space-md py-2 font-code-sm text-code-sm text-on-surface-variant">
                                                <span className="text-outline">$ lsof -i :{p.port}</span>
                                                <span className="ml-3">COMMAND <span className="text-on-surface">{p.command.split(' ')[0]}</span> · PID <span className="text-on-surface">{p.pid}</span> · {p.protocol} *:{p.port} (LISTEN)</span>
                                            </td>
                                        </tr>
                                    )}
                                </Fragment>
                            );
                        })}
                        {filtered.length === 0 && <tr><td colSpan={7} className="py-8 text-center font-code-sm text-code-sm text-outline">No process matches “{query}”</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Static ports */}
            <div ref={staticRef} className="bg-surface-container-low rounded-lg p-space-md md:p-space-lg flex flex-col shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-space-md gap-space-sm">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-space-sm">
                            <h2 className="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight">Static Port Configurations Detected</h2>
                            <span className="font-label-xs text-label-xs px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant font-medium">{manifests} Files Monitored</span>
                        </div>
                        <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Ports declared in repository configurations across {workspace.root} (parsed automatically).</p>
                    </div>
                    <button type="button" onClick={() => { flashRescan(); api.scanWorkspace(); }} className="h-8 px-space-sm rounded bg-surface-container-highest hover:bg-surface-bright text-on-surface font-label-md text-label-md flex items-center gap-1.5 transition-colors self-start sm:self-center">
                        <RefreshCw className={`w-3.5 h-3.5 text-primary ${rescanning ? 'animate-spin' : ''}`} /><span>Rescan Configs</span>
                    </button>
                </div>
                <div className="overflow-x-auto w-full">
                    <table className="w-full text-left border-collapse">
                        <thead>
                        <tr className="bg-surface-container-lowest/60 text-outline font-label-xs text-label-xs uppercase">
                            {['PORT', 'REPOSITORY', 'CONFIG SOURCE', 'ENV / CONTEXT', 'STATUS'].map((h, i) => (
                                <th key={h} className={`py-2.5 px-space-sm font-semibold ${i === 0 ? 'rounded-l' : ''}`}>{h}</th>
                            ))}
                            <th className="py-2.5 px-space-sm font-semibold text-right rounded-r">ACTIONS</th>
                        </tr>
                        </thead>
                        <tbody className="text-on-surface font-body-md text-body-md">
                        {staticPorts.map((s) => (
                            <tr key={s.id} className="hover:bg-surface-container transition-colors group">
                                <td className={`py-3 px-space-sm font-code-lg text-code-lg font-bold tracking-wider ${s.status === 'conflict' ? 'text-tertiary' : s.status === 'active' ? 'text-primary' : 'text-secondary'}`}>:{s.port}</td>
                                <td className="py-3 px-space-sm font-medium"><span className="text-on-surface">{name(s.projectId)}</span></td>
                                <td className="py-3 px-space-sm">
                                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface-container-highest text-on-surface font-code-sm text-code-sm">
                                        {fileIcon(s.fileIcon)}<span>{s.file}</span>{s.fileAnchor && <span className="text-outline text-label-xs">{s.fileAnchor}</span>}
                                    </div>
                                </td>
                                <td className="py-3 px-space-sm font-code-sm text-code-sm text-on-surface-variant">{s.key} {s.note && <span className="text-outline text-label-xs">({s.note})</span>}</td>
                                <td className="py-3 px-space-sm">
                                    {s.status === 'conflict' && <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-tertiary/10 text-tertiary font-label-xs text-label-xs font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-tertiary" />Conflict with PID {s.conflictPid}</span>}
                                    {s.status === 'offline' && <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant font-label-xs text-label-xs"><span className="w-1.5 h-1.5 rounded-full bg-outline" />Available (Offline)</span>}
                                    {s.status === 'active' && <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 text-primary font-label-xs text-label-xs font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />Running</span>}
                                </td>
                                <td className="py-3 px-space-sm text-right">
                                    <div className="flex items-center justify-end gap-space-xs">
                                        {s.status === 'conflict' ? (
                                            <button type="button" onClick={() => { const v = window.prompt(`New port for ${name(s.projectId)} (${s.key})`, String(s.port + 1)); const n = Number(v); if (v && Number.isInteger(n) && n > 0 && n < 65536) reassignStaticPort(s.id, n); }} className="h-7 px-2 rounded bg-tertiary-container/30 hover:bg-tertiary-container/50 text-tertiary font-code-sm text-code-sm font-medium transition-colors">Reassign Port</button>
                                        ) : s.status === 'offline' ? (
                                            <button type="button" onClick={() => launchStaticPort(s.id)} className="h-7 px-2 rounded bg-primary-container text-on-primary-container hover:bg-primary hover:text-on-primary font-code-sm text-code-sm font-medium transition-colors flex items-center gap-1"><Play className="w-3 h-3" strokeWidth={2.5} /><span>Launch Service</span></button>
                                        ) : null}
                                        <button type="button" onClick={() => api.openInIde(s.projectId)} className="h-7 px-2 rounded bg-surface-container-highest hover:bg-surface-bright text-on-surface font-code-sm text-code-sm flex items-center gap-1 transition-colors">
                                            <Code className="w-3 h-3 text-outline" /><span>{s.status === 'conflict' && s.line ? `:${s.line}` : 'Open File'}</span>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}