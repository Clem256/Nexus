/**
 * Global application state (React context). Loads the snapshot via src/api.ts
 * and exposes actions that call the API and update local state.
 * Once the Tauri backend exists, local state can be replaced by events (`listen`)
 * while keeping the exact same actions.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import * as api from './api';
import type { ActiveProcess, NexusSnapshot, Priority, Project, Settings, StaticPort, Task } from './types';

/** A process is considered "idle" below this CPU threshold (Kill Idle button heuristic). */
export const IDLE_CPU_THRESHOLD = 0.5;

interface Store extends NexusSnapshot {
    scanning: boolean;
    scan: () => Promise<void>;
    // processes / ports
    killProcess: (pid: number) => Promise<void>;
    killIdle: () => Promise<void>;
    resolveConflict: () => Promise<void>;
    startProject: (projectId: string) => Promise<void>;
    launchStaticPort: (id: string) => Promise<void>;
    reassignStaticPort: (id: string, port: number) => void;
    // tasks
    toggleTask: (id: string) => void;
    addTask: (t: { projectId: string; title: string; priority: Priority; due?: string; tag?: string; focus?: boolean }) => void;
    deleteTask: (id: string) => void;
    archiveCompleted: (projectId: string) => void;
    reorderFocus: (fromId: string, toId: string) => void;
    syncTodo: () => Promise<void>;
    // settings
    saveSettings: (s: Settings) => Promise<void>;
    resetSettings: () => Settings;
}

const Ctx = createContext<Store | null>(null);

export function NexusProvider({ children }: { children: ReactNode }) {
    const [snap, setSnap] = useState<NexusSnapshot | null>(null);
    const [scanning, setScanning] = useState(false);

    useEffect(() => {
        api.loadSnapshot().then(setSnap);
    }, []);

    const patch = useCallback((fn: (s: NexusSnapshot) => NexusSnapshot) => setSnap((s) => (s ? fn(s) : s)), []);

    const value = useMemo<Store | null>(() => {
        if (!snap) return null;

        /** After a conflict ends, the offending project becomes startable again. */
        const withoutCollision = (s: NexusSnapshot, pid: number): NexusSnapshot => {
            const killed = s.processes.find((p) => p.pid === pid);
            const processes = s.processes.filter((p) => p.pid !== pid);
            let projects = s.projects;
            let staticPorts = s.staticPorts;
            if (killed?.status === 'collision') {
                projects = s.projects.map((p): Project =>
                    p.conflictPort === killed.port
                        ? { ...p, status: 'inactive', startPort: killed.port, conflictPort: undefined }
                        : p,
                );
                staticPorts = s.staticPorts.map((sp): StaticPort =>
                    sp.port === killed.port && sp.status === 'conflict' ? { ...sp, status: 'offline', conflictPid: undefined } : sp,
                );
            } else if (killed) {
                // The project is no longer online if it has no remaining processes
                projects = s.projects.map((p): Project =>
                    p.id === killed.projectId && p.status === 'online' && !processes.some((x) => x.projectId === p.id)
                        ? { ...p, status: 'inactive', startPort: killed.port }
                        : p,
                );
            }
            return { ...s, processes, projects, staticPorts };
        };

        const store: Store = {
            ...snap,
            scanning,

            scan: async () => {
                setScanning(true);
                await api.scanWorkspace();
                setScanning(false);
            },

            killProcess: async (pid) => {
                await api.killProcess(pid);
                patch((s) => withoutCollision(s, pid));
            },

            killIdle: async () => {
                const idle = snap.processes.filter((p) => p.status === 'listening' && p.cpuPct < IDLE_CPU_THRESHOLD);
                await Promise.all(idle.map((p) => api.killProcess(p.pid)));
                patch((s) => idle.reduce((acc, p) => withoutCollision(acc, p.pid), s));
            },

            resolveConflict: async () => {
                const c = snap.processes.find((p) => p.status === 'collision');
                if (!c) return;
                await api.killProcess(c.pid);
                patch((s) => withoutCollision(s, c.pid));
            },

            startProject: async (projectId) => {
                const project = snap.projects.find((p) => p.id === projectId);
                const port = project?.startPort ?? project?.port;
                if (!project || !port) return;
                const { pid } = await api.startService(projectId, port);
                patch((s) => ({
                    ...s,
                    projects: s.projects.map((p): Project => (p.id === projectId ? { ...p, status: 'online', port, startPort: undefined } : p)),
                    processes: [
                        ...s.processes,
                        { pid, port, protocol: 'TCP', projectId, command: 'nexus start', memoryMb: 24, cpuPct: 0.3, status: 'listening' } as ActiveProcess,
                    ],
                    staticPorts: s.staticPorts.map((sp): StaticPort => (sp.projectId === projectId && sp.port === port ? { ...sp, status: 'active' } : sp)),
                }));
            },

            launchStaticPort: async (id) => {
                const sp = snap.staticPorts.find((x) => x.id === id);
                if (!sp) return;
                const { pid } = await api.startService(sp.projectId, sp.port);
                patch((s) => ({
                    ...s,
                    staticPorts: s.staticPorts.map((x): StaticPort => (x.id === id ? { ...x, status: 'active' } : x)),
                    processes: [
                        ...s.processes,
                        { pid, port: sp.port, protocol: 'TCP', projectId: sp.projectId, command: sp.key, memoryMb: 20, cpuPct: 0.2, status: 'listening' } as ActiveProcess,
                    ],
                }));
            },

            reassignStaticPort: (id, port) =>
                patch((s) => ({ ...s, staticPorts: s.staticPorts.map((x): StaticPort => (x.id === id ? { ...x, port, status: 'offline', conflictPid: undefined } : x)) })),

            toggleTask: (id) => {
                const t = snap.tasks.find((x) => x.id === id);
                if (!t) return;
                const done = !t.done;
                api.setTaskDone(id, done);
                patch((s) => ({
                    ...s,
                    tasks: s.tasks.map((x): Task =>
                        x.id === id ? { ...x, done, doneAt: done ? 'just now' : undefined, doneToday: done } : x,
                    ),
                }));
            },

            addTask: ({ projectId, title, priority, due, tag, focus }) => {
                api.addTask({ projectId, title, priority });
                patch((s) => {
                    const nextOrder = Math.max(0, ...s.tasks.map((t) => t.focus?.order ?? 0)) + 1;
                    const task: Task = {
                        id: `t${Date.now()}`, projectId, title, priority, due, tag, done: false,
                        ...(focus ? { focus: { order: nextOrder } } : {}),
                    };
                    return { ...s, tasks: [...s.tasks, task] };
                });
            },

            deleteTask: (id) => {
                api.deleteTask(id);
                patch((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id) }));
            },

            archiveCompleted: (projectId) =>
                patch((s) => ({ ...s, tasks: s.tasks.filter((t) => !(t.projectId === projectId && t.done)) })),

            reorderFocus: (fromId, toId) =>
                patch((s) => {
                    const focus = s.tasks.filter((t) => t.focus).sort((a, b) => a.focus!.order - b.focus!.order);
                    const from = focus.findIndex((t) => t.id === fromId);
                    const to = focus.findIndex((t) => t.id === toId);
                    if (from < 0 || to < 0 || from === to) return s;
                    const [moved] = focus.splice(from, 1);
                    focus.splice(to, 0, moved);
                    const order = new Map(focus.map((t, i) => [t.id, i + 1]));
                    return { ...s, tasks: s.tasks.map((t) => (t.focus ? { ...t, focus: { ...t.focus, order: order.get(t.id)! } } : t)) };
                }),

            syncTodo: async () => {
                await api.syncTodoFiles();
            },

            saveSettings: async (settings) => {
                await api.saveSettings(settings);
                patch((s) => ({ ...s, settings }));
            },

            resetSettings: () => api.defaultSettings(),
        };
        return store;
    }, [snap, scanning, patch]);

    if (!value) return <div className="min-h-screen bg-surface" />;
    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useNexus(): Store {
    const v = useContext(Ctx);
    if (!v) throw new Error('useNexus must be used inside <NexusProvider>');
    return v;
}