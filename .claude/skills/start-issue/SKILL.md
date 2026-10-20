---
name: start-issue
description: "Start work on a GitHub issue in this repo: read it, branch from an up-to-date dev using the <issue#>--short-slug convention, and write a plan for approval before any code."
argument-hint: <issue-number>
disable-model-invocation: true
---

# Start issue $ARGUMENTS

Follow these steps in order. Stop and report if any step fails.

1. **Read the issue.** Run `gh issue view $ARGUMENTS`. If it is closed or does not exist, stop.
2. **Check the working tree.** Run `git status --short`. If there are uncommitted changes, stop and list them. Do not stash, commit, or discard anything.
3. **Update dev.** `git switch dev` then `git pull m dev`. The remote is `m`, not `origin`.
4. **Create the branch.** Name it `$ARGUMENTS--<slug>`: 2–4 lowercase words from the issue title, kebab-case (e.g. `3--sync-job`). Run `git switch -c <name>`.
5. **Gather context.** Read the sections of CLAUDE.md that apply, and the existing code and files the issue touches. Check related issues it mentions.
6. **Write a plan**, then stop and wait for approval:
   - Each issue checkbox → what you will do and which files you will create or change
   - Decisions that need my input, with your recommendation
   - Anything that looks out of scope (suggest it for the parking lot instead)
   - Risks or things you could not verify

Do not write or change code until I approve the plan.
