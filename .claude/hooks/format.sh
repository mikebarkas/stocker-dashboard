#!/usr/bin/env bash
# PostToolUse (Edit|Write): run Prettier on the file Claude just changed.
set -euo pipefail

file=$(jq -r '.tool_input.file_path // empty')
[ -n "$file" ] || exit 0

# Only format files inside this repo.
case "$file" in "$CLAUDE_PROJECT_DIR"/*) ;; *) exit 0 ;; esac

# Hooks run in a non-login shell, so a Node version manager set up in
# ~/.bash_profile is not loaded. Load fnm here if node is missing.
if ! command -v node >/dev/null 2>&1 && command -v fnm >/dev/null 2>&1; then
  eval "$(fnm env --shell bash)"
fi
if ! command -v node >/dev/null 2>&1; then
  echo "format hook: node not found on PATH; file not formatted: $file" >&2
  exit 1
fi

cd "$CLAUDE_PROJECT_DIR"
node_modules/.bin/prettier --write --ignore-unknown "$file" >/dev/null
