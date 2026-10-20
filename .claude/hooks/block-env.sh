#!/usr/bin/env bash
# PreToolUse (Bash): refuse shell commands that mention .env files.
# .env.example is allowed. String matching is a guardrail against
# accidents, not a security boundary: `cat .e*` would get past it.
set -euo pipefail

cmd=$(jq -r '.tool_input.command // empty')

if printf '%s' "$cmd" | sed 's/\.env\.example//g' | grep -q '\.env'; then
  echo "Blocked by hook: commands that touch .env files are not allowed (secrets). Use .env.example." >&2
  exit 2
fi
