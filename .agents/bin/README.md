# Agent Workflow Scripts

Thin, repo-owned wrappers that agent skills call instead of this repo's
specific commands. Shaka's standard `setup`, `validate`, and `test` live in
[`../shaka/bin/`](../shaka/bin/); other tools, such as `lint`, stay here. A
script that is **absent** means that capability is n/a here.

| Script | Purpose | This repo runs |
| --- | --- | --- |
| `setup` | Install dependencies without starting a development server | `bin/setup --skip-server` |
| `validate` | Pre-push gate | `bin/ci` |
| `test` | Prepare the test database, then run tests | `RAILS_ENV=test bin/rails db:prepare && bin/rails test` |
| `lint` | Run lint checks | `bin/rubocop` |
| `build` | Build artifacts | n/a |
| `docs` | Validate documentation | n/a |
| `ci-detect` | Detect CI impact | n/a |

Typed review and merge preferences live in [`../agent-workflow.yml`](../agent-workflow.yml).
The trusted task skill also checks the repository-specific gates in [`../../AGENTS.md`](../../AGENTS.md).
Shaka configuration commands are in [`../shaka.md`](../shaka.md).
