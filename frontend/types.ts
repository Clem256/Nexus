/**
 * Nexus data models (cf. README: Project, Task, Link, Port Detection, Active Process).
 * These types serve as a contract with the Tauri backend: `invoke` commands must
 * return/accept these exact shapes (see src/api.ts).
 */

export type Tone = 'primary' | 'secondary' | 'tertiary' | 'error' | 'outline' | 'neutral' | 'surface';
export type Priority = 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW';
export type ProjectStatus = 'online' | 'conflict' | 'library' | 'inactive';
export type Category = 'rust' | 'web' | 'backend' | 'containerized';
export type ProjectIcon = 'monitor' | 'globe' | 'chart' | 'lock' | 'settings' | 'network';
export type MetaIcon = 'github' | 'doc' | 'link' | 'external' | 'layers' | 'box' | 'book';
export type ActionIcon = 'code' | 'terminal' | 'external' | 'download' | 'box';

export interface Tag {
    label: string;
    tone: Tone;
}

export interface MetaItem {
    label: string;
    icon?: MetaIcon;
    href?: string;
    tone?: Tone;
    dot?: Tone;
}

export interface QuickAction {
    label: string;
    icon: ActionIcon;
    kbd?: string;
    tone?: Tone;
}

export interface Milestone {
    label: string;
    done: number;
    total: number;
}

export interface Project {
    id: string;
    name: string;
    path: string;
    icon: ProjectIcon;
    accent: Tone;
    version?: string;
    categories: Category[];
    status: ProjectStatus;
    /** Port displayed in the status badge (online) */
    port?: number;
    /** Badge text for portless projects (e.g., "Package v2.1.0") */
    badge?: string;
    /** Suggested port on startup (inactive project) */
    startPort?: number;
    /** Conflicting port (conflicting project); the offending process is found via ActiveProcess.status === 'collision' */
    conflictPort?: number;
    /** Chips displayed on the Projects page cards */
    stack: Tag[];
    /** Chips displayed in the Dashboard table */
    dashboardTags: Tag[];
    git: { branch: string; state: 'clean' | 'modified' | 'synced'; modified: number };
    /** Right element of the card's 1st Git row (replaces Git status if present) */
    gitRight?: MetaItem;
    /** Optional 2nd row of the card */
    row2?: { left: MetaItem; right?: MetaItem };
    milestone: Milestone;
    quickActions: [QuickAction, QuickAction];
    /** Last modified date (ISO) for "Recently Modified" sorting */
    modifiedAt: string;
}

export interface Task {
    id: string;
    projectId: string;
    title: string;
    /** Bracketed prefix: [Core] */
    scope?: string;
    scopeTone?: Tone;
    /** #tag */
    tag?: string;
    priority: Priority;
    /** Displayed due date: "Today", "Tomorrow", "Immediate"… */
    due?: string;
    dueTone?: Tone;
    /** Port chip, e.g., ":8080" */
    port?: string;
    done: boolean;
    /** "2h ago", "Yesterday" */
    doneAt?: string;
    doneToday?: boolean;
    /** Present in "Today's Focus" (display order) */
    focus?: { order: number; hint?: { icon: 'clock' | 'alert' | 'zap'; label: string; tone: Tone }; note?: string };
    /** Visual highlight (URGENT) in focus */
    highlight?: boolean;
}

export interface ActiveProcess {
    pid: number;
    port: number;
    protocol: 'TCP' | 'UDP';
    projectId: string;
    command: string;
    memoryMb: number;
    cpuPct: number;
    status: 'listening' | 'collision';
}

export interface StaticPort {
    id: string;
    port: number;
    projectId: string;
    file: string;
    fileIcon: 'doc' | 'code' | 'box';
    fileAnchor?: string;
    /** Line in the file where the port is declared ("Open File" button) */
    line?: number;
    key: string;
    note?: string;
    status: 'conflict' | 'offline' | 'active';
    conflictPid?: number;
}

export interface Commit {
    sha: string;
    message: string;
    path: string;
    when: string;
    tone: 'primary' | 'secondary' | 'neutral';
}

export interface ProjectProcess {
    port: number;
    label: string;
    pid: number;
    memoryMb: number;
    openUrl?: string;
}

export interface ConfiguredPort {
    port: number;
    source: string;
    key: string;
    status: 'active' | 'offline' | 'conflict';
}

export interface EnvLink {
    id: string;
    kind: 'github' | 'jira' | 'staging' | 'prod';
    label: string;
    href: string;
    badge?: { label: string; tone: Tone; mono?: boolean };
}

export interface ProjectDetail {
    uncommitted: number;
    lastCommit: { sha: string; message: string; when: string };
    aheadBy: number;
    repoUrl: string;
    processes: ProjectProcess[];
    uptime: string;
    configuredPorts: ConfiguredPort[];
    envLinks: EnvLink[];
    commits: Commit[];
    todoPath: string;
}

export interface FolderEntry {
    path: string;
    primary: boolean;
    repoCount: number;
}

export interface Settings {
    folders: FolderEntry[];
    autoScan: boolean;
    ignored: string;
    ide: string;
    ideCommand: string;
    terminal: string;
    terminalArgs: string;
    twoWaySync: boolean;
    manifestName: 'TODO.md' | 'TASKS.md' | 'custom';
    customManifest: string;
    pollInterval: '1s' | '2s' | '5s' | 'manual';
    notifyCollision: boolean;
}

export interface Workspace {
    root: string;
    version: string;
    appVersion: string;
    dbPath: string;
    daemon: { online: boolean; port: number };
    watcher: string;
    reposAddedThisMonth: number;
    telemetry: { socketBufferKb: number; latencyMs: number; droppedPackets: number; tap: string; platform: string };
}

export interface NexusSnapshot {
    workspace: Workspace;
    projects: Project[];
    tasks: Task[];
    processes: ActiveProcess[];
    staticPorts: StaticPort[];
    projectDetails: Record<string, ProjectDetail>;
    settings: Settings;
}