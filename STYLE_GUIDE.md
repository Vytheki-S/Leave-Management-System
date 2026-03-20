# UI Style Guide

This document captures the preferred visual style for the Leave Management System.

## Theme Direction
- Dark interface with green accents.
- High contrast cards and surfaces.
- Rounded controls and compact data-dense layout.
- Status badges with semantic color coding.

## Core Palette

### Primary
- primary: #16a34a
- primary-hover: #15803d
- primary-active: #166534
- primary-light: #dcfce7
- primary-glow: #4ade80

### Backgrounds
- bg-base: #0f0f0f
- bg-sidebar: #111111
- bg-card: #1a1a1a
- bg-card-hover: #222222
- bg-input: #1a1a1a

### Borders
- border-default: #2a2a2a
- border-hover: #333333
- border-focus: #16a34a

### Text
- text-primary: #f5f5f5
- text-secondary: #d1d5db
- text-muted: #6b7280
- text-accent-green: #4ade80

## Status Tokens
- pending-bg: #f59e0b18
- pending-text: #fbbf24
- pending-border: #f59e0b30
- approved-bg: #16a34a18
- approved-text: #4ade80
- approved-border: #16a34a30
- rejected-bg: #ef444418
- rejected-text: #f87171
- rejected-border: #ef444430
- cancelled-bg: #2a2a2a
- cancelled-text: #6b7280
- cancelled-border: #333333

## Tailwind Token Mapping

Use this color structure in Tailwind config:

```js
colors: {
  primary: {
    DEFAULT: '#16a34a',
    hover: '#15803d',
    dark: '#166534',
    light: '#dcfce7',
    glow: '#4ade80',
  },
  dark: {
    base: '#0f0f0f',
    sidebar: '#111111',
    card: '#1a1a1a',
    card2: '#222222',
    border: '#2a2a2a',
    border2: '#333333',
  },
  text: {
    primary: '#f5f5f5',
    secondary: '#d1d5db',
    muted: '#6b7280',
  },
}
```

## Component Style Notes
- Sidebar:
  - Dark panel with subtle border and active menu item in green.
- Navbar:
  - Dark bar with compact avatar and role chip.
- Cards:
  - Surface #1a1a1a with border #2a2a2a and hover state #222222.
- Buttons:
  - Primary solid green.
  - Secondary dark with white border.
- Inputs:
  - Dark field with muted text and green focus ring.
- Tables:
  - Minimal separators, strong first-column text, compact spacing.
- Badges:
  - Color-coded status pills for pending, approved, rejected, cancelled.

## UX Mood
- Functional, modern admin dashboard.
- Low visual noise with clear state visibility.
- Suitable for desktop-heavy operations and mobile fallback.
