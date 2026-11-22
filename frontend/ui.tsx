import { useEffect, useState} from "react";
import {
    BarChart3, BookOpen, Box, Code, Download, ExternalLink, FileText, Globe, Layers, Link as LinkIcon,
    Lock, Monitor, Network, Settings as SettingsIcon, Terminal, } from 'lucide-react';
import type { ActionIcon, MetaIcon, ProjectIcon, Tone } from './types';

export const toneText: Record<Tone, string> = {
    primary: 'text-primary',
    secondary: 'text-secondary',
    tertiary: 'text-tertiary',
    error: 'text-error',
    outline: 'text-outline',
    neutral: 'text-on-surface-variant',
    surface: 'text-on-surface',
};

export const toneBg: Record<Tone, string> = {
    primary: 'bg-primary',
    secondary: 'bg-secondary',
    tertiary: 'bg-tertiary',
    error: 'bg-error',
    outline: 'bg-outline',
    neutral: 'bg-on-surface-variant',
    surface: 'bg-on-surface',
};

export const projectIcons: Record<ProjectIcon, typeof Monitor> = {
    monitor: Monitor, globe: Globe, chart: BarChart3, lock: Lock, settings: SettingsIcon, network: Network,
};

export const metaIcons: Record<MetaIcon, typeof Monitor> = {
    github: LinkIcon, link: LinkIcon, doc: FileText, external: ExternalLink, layers: Layers, box: Box, book: BookOpen,
};

export const actionsIcons: Record<ActionIcon, typeof Monitor> = {
  code: Code, terminal: Terminal, external: ExternalLink, download: Download, box: Box,
};

/** Priority */
export function priorityClasses(p: string): string {
    switch (p) {
        case 'URGENT': return 'bg-error-container text-error';
        case 'HIGH': return 'bg-tertiary/10 text-tertiary';
        default: return 'bg-surface-container-highest text-on-surface-variant';
    }
}

export function useFlash(ms = 800): [boolean, () => void] {
    const [on, setOn] = useState(false);
    useEffect(() => {
        if (!on) return;
        const t = setTimeout(() => setOn(false), ms);
        return () => clearTimeout(t);
    }, [on, ms]);
    return [on, () => setOn(true)];
}