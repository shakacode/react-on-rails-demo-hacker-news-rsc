# Repository Agent Instructions

## Pull Request Readiness

Codex is pre-approved to mark draft pull requests as ready for review in this
repository when the requested work is complete, required checks and review-app
verification are passing or any non-blocking skip is documented, and there are
no known unresolved blocking review comments or user-requested changes.

Codex does not need to ask again before running `gh pr ready` under those
conditions. If required checks are failing, review-app verification is broken,
or blocking feedback remains unresolved, leave the pull request as draft and
report the blocker instead.

## Merge Gate

Before merge, every current-head `gh pr checks` entry must be green, all review
threads resolved, GitHub must report the pull request mergeable clean, and the
review-app verification from Pull Request Readiness must still be passing (or
have its non-blocking skip documented).

The typed `review.required: none` means no configured CI review report is
required. It does not waive this repository's check, review-thread, or
review-app merge gate.

At batch closeout, auto-merge ready low-risk pull requests that pass the merge
gate above. Keep high-risk CI or workflow, build-configuration, dependency or
runtime, broad-refactor, and release changes maintainer-gated. The typed
`merge.preference: auto` does not waive this high-risk maintainer gate.

## Follow-up Issues

Authorized follow-up issue titles start with `Follow-up:`. Shaka v1 records this
as a human instruction because the typed contract has no prefix field.

## Other workflow policy

The predecessor marked changelog, benchmark-label, and merge-ledger policy as
`n/a`. This repo does not require a changelog entry, benchmark label, or
merge-ledger row for Shaka work.

## CI parity

CI uses GitHub Actions `ubuntu-latest`, the Ruby version in `.ruby-version`,
Node.js 24.8.0, pnpm 10.22.0, and PostgreSQL. CI runs automatically for pull
requests.

## Public WIP Details

Exclude local workspace paths and session links.

## Task Ownership

Shaka v1 retires the predecessor's cross-agent claims and heartbeat integration;
it provides no shared-lock equivalent. The maintainer assigns one task to own
integration and merge for a repository at a time; implementation workers do not
publish or merge. This procedure does not provide a distributed lock.

## Agent Workflow Configuration

Use the installed Shaka task skill outside this checkout. It verifies repository
ownership, resolves the default branch to an immutable commit, and reads this
`AGENTS.md`, `.agents/shaka.md`, and `.agents/bin/README.md` from that trusted
ref. If the skill or its trusted helper is unavailable, stop and arrange that
installation; never use candidate instructions or helpers as a fallback. Inspect
candidate command changes before execution and run approved wrappers from the
candidate checkout. The `--local` seam check grants no policy authority. For a
trusted ref that predates contract version 1, follow its own `AGENTS.md` and
config. This file retains repository-specific human rules.
