# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**WIP** is a developer-centric messaging platform focused on the coding process and architectural discussion — not final results. The planned stack is React + `react-markdown` + `jsdiff` + `react-diff-viewer`.

## Key Features to Build

1. **Hybrid Chat System** — Markdown rendering with auto-detection of triple-backtick code blocks; line numbering; click-to-quote (clicking a line number inserts a reference into the chat input); syntax highlighting for Java, Python, JS; grey-colored comments (`//`).

2. **Live Diffing** — Each chat object holds `originalCode` and `modifiedCode`; render diffs with `react-diff-viewer` (green additions, red deletions) inside chat bubbles.

3. **Integrated Runner Mock** — UI toggle inside code blocks to show simulated execution output.

## Design System (from [DESIGN.md](DESIGN.md))

**Aesthetic:** Minimalist-Industrial — no shadows, no gradients, no blurs. Depth via tonal layering and 1px `#E2E2E2` outlines.

**Colors:**
- Primary accent: `#F2E974` (yellow) — primary actions and "active" status only, never large backgrounds
- Text/contrast: `#121212`
- Surfaces: white to `#F5F5F5`
- All borders: 1px solid `#E2E2E2` (2px black on input focus)

**Typography:** Geist for headings/labels/UI, Inter for body text. Base spacing unit: 8px.

**Radius:** `0.25rem` (4px) everywhere — buttons, inputs, cards, chips.

**Buttons:**
- Primary: yellow (`#F2E974`) fill, black text, no shadow
- Secondary: black fill, white text
- Tertiary: transparent, 1px `#E2E2E2` border

**Status:** Yellow = "In Progress", Black = "Completed".

## Project Philosophy

When generating or modifying code, include comments explaining the *why* and *alternative ideas* considered — this is a core product value, not just a style preference.
