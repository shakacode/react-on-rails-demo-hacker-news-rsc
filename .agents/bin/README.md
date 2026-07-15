# Agent Workflow Scripts

Standard entry points that portable agent-workflow skills call, so a skill can
run `.agents/bin/<name>` in any repo without knowing this repo's specific
commands. Each script is a thin, repo-owned wrapper. A script that is **absent**
means that capability is n/a here.

| Script | Purpose | This repo runs |
| --- | --- | --- |
| `setup` | Install dependencies without starting a development server | `bin/setup --skip-server` |
| `validate` | Pre-push gate | `bin/ci` |
| `test` | Prepare the test database, then run tests | `RAILS_ENV=test bin/rails db:prepare && bin/rails test` |
| `lint` | Run lint checks | `bin/rubocop` |
| `build` | Build artifacts | n/a |
| `docs` | Validate documentation | n/a |
| `ci-detect` | Detect CI impact | n/a |

Non-command policy lives in [`../agent-workflow.yml`](../agent-workflow.yml).
