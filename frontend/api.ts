/**
 * Data access layer.
 *
 * Currently: everything comes from src/data/mock.json.
 * Later (Tauri backend): replace each function body with
 *   `invoke<T>('command_name', { ...args })` (import { invoke } from '@tauri-apps/api/core').
 * The signatures and types (src/types.ts) form the contract with the Rust backend.
 */
import mock from './data/mock.json';
import type { NexusSnapshot, Settings } from './types';

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));
const delay = (ms = 120) => new Promise<void>((r) => setTimeout(r, ms));

/** invoke('get_snapshot') */
export async function loadSnapshot(): Promise<NexusSnapshot> {
    await delay(0);
    return clone(mock) as unknown as NexusSnapshot;
}

/** Default settings ("Reset to Defaults" button) — invoke('get_default_settings') */
export function defaultSettings(): Settings {
    return clone(mock.settings) as unknown as Settings;
}

/** invoke('scan_workspace') — rescans watched folders */
export async function scanWorkspace(): Promise<void> {
    await delay(800);
}

/** invoke('kill_process', { pid }) */
export async function killProcess(_pid: number): Promise<void> {
    await delay();
}

/** invoke('start_service', { projectId, port }) */
export async function startService(_projectId: string, _port: number): Promise<{ pid: number }> {
    await delay();
    return { pid: 40000 + Math.floor(Math.random() * 9999) };
}

/** invoke('set_task_done', { id, done }) — must rewrite the project's TODO.md */
export async function setTaskDone(_id: string, _done: boolean): Promise<void> {
    await delay(0);
}

/** invoke('add_task', { task }) */
export async function addTask(_task: { projectId: string; title: string; priority: string }): Promise<void> {
    await delay(0);
}

/** invoke('delete_task', { id }) */
export async function deleteTask(_id: string): Promise<void> {
    await delay(0);
}

/** invoke('sync_todo_files') */
export async function syncTodoFiles(): Promise<void> {
    await delay(700);
}

/** invoke('open_in_ide', { projectId }) */
export async function openInIde(_projectId: string): Promise<void> {
    await delay(0);
}

/** invoke('open_in_terminal', { projectId }) */
export async function openInTerminal(_projectId: string): Promise<void> {
    await delay(0);
}

/** invoke('save_settings', { settings }) */
export async function saveSettings(_settings: Settings): Promise<void> {
    await delay(900);
}