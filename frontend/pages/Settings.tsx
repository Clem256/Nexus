import { useState, type ReactNode } from 'react';
import { Activity, ChevronDown, CircleCheck, Code, FolderSearch, Loader2, Lock, Plus, Save, Trash2 } from 'lucide-react';
import { useNexus } from '../store';
import type { Settings as SettingsModel } from '../types';

const IDE_OPTIONS = [
    { id: 'vscode', label: 'VS Code', cmd: 'code .' },
    { id: 'cursor', label: 'Cursor', cmd: 'cursor .' },
    { id: 'zed', label: 'Zed', cmd: 'zed .' },
    { id: 'intellij', label: 'IntelliJ IDEA', cmd: 'idea .' },
    { id: 'pycharm', label: 'PyCharm', cmd: 'pycharm .' },
];
const TERMINAL_OPTIONS = [
    { id: 'warp', label: 'Warp', cmd: 'warp --new-tab {path}' },
    { id: 'iterm2', label: 'iTerm2', cmd: 'open -a iTerm {path}' },
    { id: 'ghostty', label: 'Ghostty', cmd: 'ghostty --working-directory={path}' },
    { id: 'terminal', label: 'Terminal.app', cmd: 'open -a Terminal {path}' },
    { id: 'alacritty', label: 'Alacritty', cmd: 'alacritty --working-directory {path}' },
];
const POLL_OPTIONS: { id: SettingsModel['pollInterval']; label: string }[] = [
    { id: '1s', label: 'Every 1 second (High CPU)' },
    { id: '2s', label: 'Every 2 seconds (Default)' },
    { id: '5s', label: 'Every 5 seconds' },
    { id: 'manual', label: 'Manual only' },
];
const MANIFESTS: { id: SettingsModel['manifestName']; label: string; desc: string; badge?: string }[] = [
    { id: 'TODO.md', label: 'TODO.md', badge: 'Default', desc: 'Standard project checklist manifest at repository root directory.' },
    { id: 'TASKS.md', label: 'TASKS.md', desc: 'Alternative markdown task tracking convention.' },
    { id: 'custom', label: 'Custom filename pattern...', desc: 'Custom glob pattern for dedicated workflow documentation (e.g. .nexus/tasks.json).' },
];

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={label}
            onClick={() => onChange(!checked)}
            className={`w-11 h-6 rounded-full p-0.5 transition-colors relative shrink-0 ${checked ? 'bg-primary-container' : 'bg-surface-container-high'}`}
        >
            <span className={`block w-5 h-5 rounded-full bg-on-primary shadow-sm transform transition-transform duration-150 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
    );
}

function Select({ value, onChange, options, className = '' }: { value: string; onChange: (v: string) => void; options: { id: string; label: string }[]; className?: string }) {
    return (
        <div className={`relative ${className}`}>
            <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full h-9 pl-3 pr-8 rounded bg-surface-container font-body-sm text-body-sm text-on-surface appearance-none focus:outline-none focus:bg-surface-container-high cursor-pointer">
                {options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
            <div className="absolute right-2.5 top-2.5 pointer-events-none text-outline flex items-center"><ChevronDown className="w-4 h-4" /></div>
        </div>
    );
}

function CardHeader({ icon, title, desc }: { icon: ReactNode; title: string; desc: string }) {
    return (
        <div className="flex items-start gap-space-md mb-6">
            <div className="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center text-primary shrink-0">{icon}</div>
            <div className="flex flex-col">
                <h2 className="font-headline-md text-headline-md text-on-surface">{title}</h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">{desc}</p>
            </div>
        </div>
    );
}

export default function Settings() {
    const { settings, workspace, saveSettings, resetSettings } = useNexus();
    const [s, setS] = useState<SettingsModel>(settings);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const set = <K extends keyof SettingsModel>(k: K, v: SettingsModel[K]) => setS((x) => ({ ...x, [k]: v }));

    const dirty = JSON.stringify(s) !== JSON.stringify(settings);

    const onSave = async () => {
        setSaving(true);
        await saveSettings(s);
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 1200);
    };

    const addFolder = () => {
        // Replace with the native folder picker (@tauri-apps/plugin-dialog)
        const path = window.prompt('Folder to monitor (e.g. ~/Projects)');
        if (path?.trim()) set('folders', [...s.folders, { path: path.trim(), primary: false, repoCount: 0 }]);
    };

    return (
        <div className="flex flex-col w-full">
            <div className="max-w-[900px] w-full mx-auto py-6 px-4 space-y-6">
                {/* Workspace & scanning */}
                <section className="bg-surface-container-low rounded-xl p-6 shadow-xl relative overflow-hidden">
                    <CardHeader icon={<FolderSearch className="w-5 h-5" />} title="Workspace & Folder Scanning" desc="Configure directories scanned for Git repositories and package manifests." />
                    <div className="space-y-2 mb-4">
                        <span className="font-label-xs text-label-xs text-on-surface-variant uppercase tracking-wider block mb-1">Monitored Directories</span>
                        {s.folders.map((f) => (
                            <div key={f.path} className="flex items-center justify-between p-space-md rounded-lg bg-surface-container-lowest hover:bg-surface-container transition-colors">
                                <div className="flex items-center gap-space-md min-w-0">
                                    <div className={`w-2 h-2 rounded-full shrink-0 ${f.primary ? 'bg-primary shadow-[0_0_6px_rgba(78,222,163,0.8)]' : 'bg-outline'}`} />
                                    <div className="flex items-center gap-space-xs min-w-0">
                                        <span className="font-code-md text-code-md text-on-surface font-medium truncate">{f.path}</span>
                                        <span className={`font-label-xs text-label-xs px-2 py-0.5 rounded-full uppercase font-semibold ${f.primary ? 'bg-primary/10 text-primary' : 'bg-surface-container text-on-surface-variant'}`}>{f.primary ? 'Primary' : 'Secondary'}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-space-md shrink-0">
                                    <span className="font-code-sm text-code-sm text-outline">{f.repoCount} repositories found</span>
                                    {f.primary ? (
                                        <div className="flex items-center text-outline p-1" title="Primary workspace locked"><Lock className="w-4 h-4" /></div>
                                    ) : (
                                        <button type="button" title="Remove path" onClick={() => set('folders', s.folders.filter((x) => x.path !== f.path))} className="flex items-center justify-center p-1 rounded text-outline hover:text-error transition-colors"><Trash2 className="w-4 h-4" /></button>
                                    )}
                                </div>
                            </div>
                        ))}
                        <button type="button" onClick={addFolder} className="w-full py-2.5 px-3 rounded-lg bg-surface-container-lowest hover:bg-surface-container text-primary font-body-sm text-body-sm font-medium flex items-center justify-center gap-space-xs transition-colors">
                            <Plus className="w-4 h-4" /><span>Add Monitored Folder</span>
                        </button>
                    </div>
                    <div className="pt-5 mt-5 space-y-5 bg-surface-container-low">
                        <div className="flex items-center justify-between gap-space-lg">
                            <div className="flex flex-col">
                                <label className="font-body-md text-body-md font-medium text-on-surface cursor-pointer" onClick={() => set('autoScan', !s.autoScan)}>Auto-scan on startup</label>
                                <span className="font-body-sm text-body-sm text-on-surface-variant">Automatically inspect registered paths when the Nexus daemon launches.</span>
                            </div>
                            <Toggle checked={s.autoScan} onChange={(v) => set('autoScan', v)} label="Auto-scan on startup" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between">
                                <label className="font-body-md text-body-md font-medium text-on-surface" htmlFor="ignored-patterns">Ignored Directories &amp; Patterns</label>
                                <span className="font-code-sm text-code-sm text-outline">glob syntax</span>
                            </div>
                            <span className="font-body-sm text-body-sm text-on-surface-variant mb-1">Comma-separated folder names skipped during directory traversal.</span>
                            <input id="ignored-patterns" value={s.ignored} onChange={(e) => set('ignored', e.target.value)} className="w-full h-9 px-3 rounded-lg bg-surface-container-lowest font-code-md text-code-md text-on-surface placeholder:text-outline focus:outline-none focus:bg-surface-container-high transition-colors" />
                        </div>
                    </div>
                </section>

                {/* Dev tools */}
                <section className="bg-surface-container-low rounded-xl p-6 shadow-xl relative overflow-hidden">
                    <CardHeader icon={<Code className="w-5 h-5" />} title="Default Developer Tools" desc="Configure quick-launch actions and editor integrations for workspaces." />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="flex flex-col gap-3.5 p-4 rounded-lg bg-surface-container-lowest">
                            <div className="flex flex-col gap-1.5">
                                <label className="font-body-md text-body-md font-medium text-on-surface">Preferred IDE</label>
                                <Select value={s.ide} options={IDE_OPTIONS} onChange={(v) => setS((x) => ({ ...x, ide: v, ideCommand: IDE_OPTIONS.find((o) => o.id === v)?.cmd ?? x.ideCommand }))} />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="font-body-sm text-body-sm text-on-surface-variant" htmlFor="ide-command">Launch Command</label>
                                    <span className="font-label-xs text-label-xs px-1.5 rounded bg-surface-container-high text-outline uppercase">CLI</span>
                                </div>
                                <input id="ide-command" value={s.ideCommand} onChange={(e) => set('ideCommand', e.target.value)} className="w-full h-8 px-2.5 rounded bg-surface-container font-code-sm text-code-sm text-on-surface placeholder:text-outline focus:outline-none focus:bg-surface-container-high transition-colors" />
                            </div>
                        </div>
                        <div className="flex flex-col gap-3.5 p-4 rounded-lg bg-surface-container-lowest">
                            <div className="flex flex-col gap-1.5">
                                <label className="font-body-md text-body-md font-medium text-on-surface">Preferred Terminal</label>
                                <Select value={s.terminal} options={TERMINAL_OPTIONS} onChange={(v) => setS((x) => ({ ...x, terminal: v, terminalArgs: TERMINAL_OPTIONS.find((o) => o.id === v)?.cmd ?? x.terminalArgs }))} />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="font-body-sm text-body-sm text-on-surface-variant" htmlFor="terminal-command">Execution Arguments</label>
                                    <span className="font-label-xs text-label-xs px-1.5 rounded bg-surface-container-high text-outline uppercase">FLAGS</span>
                                </div>
                                <input id="terminal-command" value={s.terminalArgs} onChange={(e) => set('terminalArgs', e.target.value)} className="w-full h-8 px-2.5 rounded bg-surface-container font-code-sm text-code-sm text-on-surface placeholder:text-outline focus:outline-none focus:bg-surface-container-high transition-colors" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Sync */}
                <section className="bg-surface-container-low rounded-xl p-6 shadow-xl relative overflow-hidden">
                    <CardHeader icon={<CircleCheck className="w-5 h-5" />} title="Task & TODO.md Synchronization" desc="Two-way file synchronization with markdown tasks in repository roots." />
                    <div className="flex items-center justify-between gap-space-lg p-4 rounded-lg bg-surface-container-lowest mb-5">
                        <div className="flex flex-col">
                            <span className="font-body-md text-body-md font-medium text-on-surface">Two-way real-time sync with project TODO.md files</span>
                            <span className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">File system watcher (inotify/fsevents) writes changes made in Nexus directly to disk.</span>
                        </div>
                        <Toggle checked={s.twoWaySync} onChange={(v) => set('twoWaySync', v)} label="Two-way sync" />
                    </div>
                    <div className="space-y-2">
                        <span className="font-label-xs text-label-xs text-on-surface-variant uppercase tracking-wider block mb-1">Task Manifest Naming Convention</span>
                        {MANIFESTS.map((m) => {
                            const on = s.manifestName === m.id;
                            return (
                                <label key={m.id} className="flex items-start gap-space-md p-3.5 rounded-lg bg-surface-container-lowest cursor-pointer hover:bg-surface-container transition-colors">
                                    <div className={`mt-0.5 flex items-center justify-center w-4 h-4 rounded-full shrink-0 ${on ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-outline'}`}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${on ? 'bg-on-primary' : 'bg-transparent'}`} />
                                    </div>
                                    <div className="flex flex-col flex-1">
                                        <div className="flex items-center gap-space-xs">
                                            <span className="font-code-md text-code-md font-medium text-on-surface">{m.label}</span>
                                            {m.badge && <span className="font-label-xs text-label-xs px-1.5 rounded bg-surface-container-high text-primary uppercase font-semibold">{m.badge}</span>}
                                        </div>
                                        <span className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">{m.desc}</span>
                                        {m.id === 'custom' && on && (
                                            <input value={s.customManifest} onChange={(e) => set('customManifest', e.target.value)} onClick={(e) => e.preventDefault()} placeholder=".nexus/tasks.json" className="mt-2 w-full h-8 px-2.5 rounded bg-surface-container font-code-sm text-code-sm text-on-surface placeholder:text-outline focus:outline-none focus:bg-surface-container-high" />
                                        )}
                                    </div>
                                    <input type="radio" name="manifest_name" className="sr-only" checked={on} onChange={() => set('manifestName', m.id)} />
                                </label>
                            );
                        })}
                    </div>
                </section>

                {/* Port scanner */}
                <section className="bg-surface-container-low rounded-xl p-6 shadow-xl relative overflow-hidden">
                    <CardHeader icon={<Activity className="w-5 h-5" />} title="Port Scanner & Daemon" desc="Background kernel tap and eBPF socket listener parameters." />
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md p-4 rounded-lg bg-surface-container-lowest mb-3">
                        <div className="flex flex-col">
                            <span className="font-body-md text-body-md font-medium text-on-surface">Socket Inspection Frequency</span>
                            <span className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Determines how aggressively the telemetry engine queries bound ports.</span>
                        </div>
                        <Select className="shrink-0 sm:w-64" value={s.pollInterval} options={POLL_OPTIONS} onChange={(v) => set('pollInterval', v as SettingsModel['pollInterval'])} />
                    </div>
                    <div className="flex items-center justify-between gap-space-lg p-4 rounded-lg bg-surface-container-lowest mb-4">
                        <div className="flex flex-col">
                            <span className="font-body-md text-body-md font-medium text-on-surface">Notify on port collision</span>
                            <span className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Display system notification and highlight conflicting PIDs when port contention occurs.</span>
                        </div>
                        <Toggle checked={s.notifyCollision} onChange={(v) => set('notifyCollision', v)} label="Notify on port collision" />
                    </div>
                    <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-surface-container-lowest">
                        <div className="flex items-center gap-space-sm">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
              </span>
                            <span className="font-code-sm text-code-sm text-on-surface">Daemon listening on <span className="font-medium text-primary">127.0.0.1:{workspace.daemon.port}</span></span>
                        </div>
                        <span className="font-label-xs text-label-xs px-2 py-0.5 rounded bg-surface-container text-on-surface-variant uppercase tracking-wider">eBPF Active</span>
                    </div>

                    <div className="pt-5 mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-surface-container-low">
                        <div className="flex items-center gap-space-xs text-outline">
                            <span className="font-code-sm text-code-sm truncate">Nexus {workspace.appVersion} • SQLite DB: {workspace.dbPath}</span>
                        </div>
                        <div className="flex items-center gap-space-sm shrink-0 w-full sm:w-auto justify-end">
                            <button type="button" onClick={() => setS(resetSettings())} className="h-9 px-4 rounded-lg bg-surface-container-high hover:bg-surface-container text-on-surface font-body-sm text-body-sm font-medium transition-colors">Reset to Defaults</button>
                            <button type="button" onClick={onSave} disabled={saving} className="h-9 px-5 rounded-lg bg-primary-container hover:bg-primary text-on-primary font-body-sm text-body-sm font-medium flex items-center gap-space-xs transition-colors shadow-md disabled:opacity-80">
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                <span>{saved ? 'Saved' : saving ? 'Saving…' : dirty ? 'Save Changes' : 'Save Changes'}</span>
                            </button>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}