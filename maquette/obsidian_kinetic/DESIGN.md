---
name: Obsidian Kinetic
colors:
  surface: '#10141a'
  surface-dim: '#10141a'
  surface-bright: '#353940'
  surface-container-lowest: '#0a0e14'
  surface-container-low: '#181c22'
  surface-container: '#1c2026'
  surface-container-high: '#262a31'
  surface-container-highest: '#31353c'
  on-surface: '#dfe2eb'
  on-surface-variant: '#bbcabf'
  inverse-surface: '#dfe2eb'
  inverse-on-surface: '#2d3137'
  outline: '#86948a'
  outline-variant: '#3c4a42'
  surface-tint: '#4edea3'
  primary: '#4edea3'
  on-primary: '#003824'
  primary-container: '#10b981'
  on-primary-container: '#00422b'
  inverse-primary: '#006c49'
  secondary: '#7bd0ff'
  on-secondary: '#00354a'
  secondary-container: '#00a6e0'
  on-secondary-container: '#00374d'
  tertiary: '#ffb95f'
  on-tertiary: '#472a00'
  tertiary-container: '#e29100'
  on-tertiary-container: '#523200'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#6ffbbe'
  primary-fixed-dim: '#4edea3'
  on-primary-fixed: '#002113'
  on-primary-fixed-variant: '#005236'
  secondary-fixed: '#c4e7ff'
  secondary-fixed-dim: '#7bd0ff'
  on-secondary-fixed: '#001e2c'
  on-secondary-fixed-variant: '#004c69'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#10141a'
  on-background: '#dfe2eb'
  surface-variant: '#31353c'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.025em
  headline-xl-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.015em
  body-lg:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: -0.01em
  body-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: -0.005em
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0em
  code-lg:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: -0.01em
  code-md:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0em
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 14px
    letterSpacing: 0.02em
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.04em
  label-xs:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '600'
    lineHeight: 12px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-sm: 0.75rem
  gutter-lg: 1.5rem
  margin: 1.5rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1.25rem
  space-xl: 1.75rem
---

## Brand & Style

The design system establishes a high-performance, keyboard-first developer aesthetic engineered for speed, high visual density, and acute technical precision. Drawing influence from modern hyper-refined developer utilities like Linear, Raycast, and Vercel, the interface rejects decorative indulgence in favor of structural clarity, low-latency visual hierarchy, and tactile feedback.

### Emotional Response & Personality
- **Surgical Precision:** Every border, gap, and pixel aligns rigidly to signal computational accuracy and zero operational latency.
- **Calm Focus:** An immersive, dark obsidian architecture reduces optical fatigue during prolonged engineering sessions.
- **Instrumental Tactility:** Subtle matte surface elevations and translucent overlays mimic high-end technical apparatus hardware.

### Design Movement: Technical Minimalist Matte Glass
The interface synthesizes high-contrast dark-mode minimalism with refined glassmorphism and crisp 1px structural framing. Surfaces are distinguished not by dramatic drop shadows, but through deliberate micro-tonal layer shifts and hairline perimeter dividers that catch ambient light.

## Colors

The palette is engineered specifically for deep dark mode ergonomics, anchoring the deepest planes in neutral obsidian tones while using high-luminosity spectral accents to signal machine states, operational status, and interactive affordances.

### Palette Architecture
- **Base Canvas (`#0D1117`):** The primary void. Non-reflective, deep carbon canvas for maximum background sink.
- **Elevated Tier 1 (`#161B22`):** Primary card container, sidebars, command bars, and navigation panels.
- **Elevated Tier 2 (`#21262D`):** Nested panels, hover surfaces, inputs, modal containers, and elevated utility bars.
- **Borders & Dividers:** Hairline borders use `#30363D` for active container framing and `#262C36` for passive internal separators.
- **Primary Emerald (`#10B981`):** Operational health, active branches, live ports, execution success, and primary commit actions.
- **Secondary Sky (`#38BDF8`):** Focus rings, interactive text links, external docs, parameter highlights, and info-level telemetry.
- **Tertiary Amber (`#F59E0B`):** System warnings, port conflicts, dirty Git states, pending deprecations, and high resource utilization.
- **Destructive Crimson (`#EF4444`):** Process termination, hard failures, container crashes, and critical interrupts.
- **Foreground Hierarchy:** `#F0F6FC` (high-contrast text/values), `#8B949E` (secondary labels, metadata, shortcuts), `#484F58` (placeholders, disabled tokens).

## Typography

Typography prioritizes extreme legibility across compact horizontal arrays. The interface enforces a strict bi-font segregation:

1. **System & Interaction Layer (`Inter`):** Handles all application navigation, dialog headings, descriptive documentation, and general user interface labels. Tight letter spacing (`-0.01em` to `-0.025em`) ensures an assertive, modern character.
2. **Machine & Telemetry Layer (`JetBrains Mono`):** Applied systematically to all computational data: ports (`:3000`), Process IDs (`PID 4921`), commit SHAs, file paths, environment keys, and command palette shortcuts (`⌘K`). Numbers use tabular figures by default to prevent visual drift during real-time data streaming.

## Layout & Spacing

The layout model is built on an information-dense, flexible grid with high-efficiency viewport consumption. Developer tools require maximum visible context without unnecessary dead space.

### Grid & Density Rationale
- **Desktop (1024px+):** Fluid multi-pane workspace (collapsible navigation tree, dynamic main split editor/monitor canvas, persistent right-hand telemetry rail). Gutters sit at `1rem` (16px) with an outer frame margin of `1.5rem` (24px).
- **Tablet (768px - 1023px):** Collapses auxiliary telemetry into sliding sheets or drawer overlays. Gutter drops to `0.75rem` (12px).
- **Mobile (<768px):** Single-column stacked stream. Main controls map to bottom sheets; margins snap to `1rem` (16px).

### Spacing Token Rules
Spacing enforces a 4px/8px incremental cadence. Spacing tokens strictly determine internal container padding, stack margins, and flex-gap distances. Micro-spacers (`space-xs` = 4px, `space-sm` = 8px) dominate toolbars, badge rows, and inline code tags to guarantee compact vertical footprints.

## Elevation & Depth

Visual hierarchy is maintained through calibrated matte surface stratification, 1px structural framing, and low-opacity specular refraction rather than heavy dropshadows.

### Structural Stratification (Tonal Depth)
- **Layer 0 (Canvas):** `#0D1117`. Flat base, non-interactive.
- **Layer 1 (Card & Module Surfaces):** `#161B22` framed by a solid 1px border of `#30363D`.
- **Layer 2 (Interactive Floating Flyouts & Sheets):** Backdrop blur of `12px` to `16px` combined with a semi-translucent fill of `rgba(22, 27, 34, 0.85)` and a `#30363D` border.
- **Layer 3 (Overlays, Modals, Command Bar):** `rgba(22, 27, 34, 0.95)` with backdrop filter `blur(20px)`, enclosed by a hairline top highlight `rgba(255, 255, 255, 0.08)` and border `rgba(48, 54, 61, 0.9)`.

### Shadow Signature
Shadows are reserved exclusively for floating interactive layers (command palettes, menus, context popovers):
- `box-shadow: 0 0 0 1px #30363D, 0 12px 32px -4px rgba(0, 0, 0, 0.65), 0 4px 12px -2px rgba(0, 0, 0, 0.4);`
No colored glow is used on elevated boxes, preserving color strictly for functional states (emerald, amber, sky).

## Shapes

The interface embraces a disciplined "Soft" curvature token (`0.25rem` / 4px base). Developer tools demand crisp geometry to cleanly anchor tabular grids, logs, and nested command interfaces.

### Curvature Matrix
- **Base Components (Inputs, Buttons, Badges, Tabs):** `0.25rem` (4px). Delivers a technical, sharp-edged appearance that preserves space.
- **Containers & Surface Panels (`rounded-lg`):** `0.5rem` (8px). Softens larger viewport panels without losing architectural cohesion.
- **Modals & Command Palettes (`rounded-xl`):** `0.75rem` (12px). Encapsulates floating dialogs cleanly against the darker background void.
- **Pill Shape Exception:** Solely permitted for circular machine status dots (e.g., `w-2 h-2 rounded-full`).

## Components

### Buttons
- **Primary:** Background `#10B981`, foreground `#042F2E`, `font-medium`, 4px radius. Hover: `#059669`. Focus: 2px offset ring with `#38BDF8`.
- **Secondary (Default):** Background `#21262D`, border 1px solid `#30363D`, foreground `#F0F6FC`. Hover: `#30363D` background with border `#8B949E`.
- **Ghost / Utility:** Background transparent, foreground `#8B949E`. Hover: `#161B22` background, foreground `#F0F6FC`.
- **Keyboard Shortcut Affordance:** Small utility key badges nested inside buttons using `JetBrains Mono` 10px uppercase on `rgba(255, 255, 255, 0.06)` background.

### Inputs & Search Bars
- Background `#0D1117`, border 1px solid `#30363D`, foreground `#F0F6FC`, typography `body-md`.
- Focus state: Border transitions to `#38BDF8`, paired with a non-blurring box-shadow `0 0 0 1px #38BDF8`.
- Clear/Search icons: Rendered in `#8B949E` with 14px bounding boxes.

### Chips & Telemetry Status Badges
- Height: Compact 20px–22px. Padding: 0 6px.
- Font: `JetBrains Mono` label-xs (10px, uppercase, tracking-wide).
- **Active / Running:** Background `rgba(16, 185, 129, 0.1)`, text `#10B981`, border 1px solid `rgba(16, 185, 129, 0.25)`.
- **Warning / Port Conflict:** Background `rgba(245, 158, 11, 0.1)`, text `#F59E0B`, border 1px solid `rgba(245, 158, 11, 0.25)`.
- **Neutral / Idle:** Background `#161B22`, text `#8B949E`, border 1px solid `#30363D`.

### Checkboxes & Radio Buttons
- 14px × 14px square (`rounded: 2px` for checkboxes; full circle for radio).
- Base: Border 1px solid `#30363D`, background `#0D1117`.
- Checked: Border `#10B981`, background `#10B981`, checkmark glyph `#042F2E`.

### Lists & Data Rows
- High-density rows (32px to 36px height), dividing lines 1px solid `#21262D`.
- Alternate hover: Background fills with `#161B22`.
- Active selection: Hairline left indicator tab (2px wide `#10B981`) combined with background `rgba(16, 185, 129, 0.04)`.

### Cards & Panels
- Background `#161B22`, border 1px solid `#30363D`, internal padding `space-md` or `space-lg`.
- Top-level cards feature a subtle gradient border highlight (`linear-gradient(to bottom, #30363D, #161B22)`).

### Command Palette (Specialized Component)
- Max width 640px, centered horizontally at top 15% of viewport.
- Background `rgba(22, 27, 34, 0.95)`, backdrop-blur 20px, border 1px solid `#30363D`.
- Filter input: Integrated borderless field at `headline-md` size with `JetBrains Mono` execution prompts.
- Result rows feature hotkey indicators (`⌘ Enter`, `Esc`) right-aligned in `#8B949E`.