# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

**reviewer** is a CLI-based TUI application for interactively reviewing git diffs with syntax highlighting and hunk staging (like `git add -p`). Built with Bun, React 19, and @opentui/react.

## Commands

```bash
# Development
bun install              # Install dependencies
bun run dev              # Run the TUI app in current directory
bun run typecheck        # Type check all packages

# Run on a different repository
cd /path/to/repo && bun /path/to/reviewer/packages/reviewer/src/index.ts

# Package-specific
bun test --cwd packages/core    # Run tests for core package
```

## Architecture

**Monorepo with Bun workspaces + Turbo:**

- `packages/core` - Git operations library (`@reviewer/core`)
  - `git/types.ts` - FileDiff, Hunk, HunkLine types
  - `git/diff.ts` - Parse `git diff` output into structured format
  - `git/stage.ts` - Stage/unstage individual hunks via `git apply --cached`

- `packages/reviewer` - Main TUI application
  - `cli/review.ts` - CLI command (yargs)
  - `cli/tui/bootstrap.tsx` - TUI initialization with `createCliRenderer` + `createRoot`
  - `cli/tui/app.tsx` - Main App component with keyboard handling
  - `cli/tui/context/` - React contexts (GitProvider, KeybindProvider, ThemeProvider)
  - `cli/tui/components/` - UI components (FileList, DiffView, Header, StatusBar)

**Provider hierarchy:**
```
ThemeProvider → KeybindProvider → GitProvider → App
```

**Key patterns:**
- Uses `@opentui/react` with React 19 for terminal UI rendering
- Vim-style keybindings defined in `context/keybind.tsx`
- Git state managed via React context in `context/git.tsx`
- Built-in `<diff>` component from @opentui/core handles syntax highlighting
