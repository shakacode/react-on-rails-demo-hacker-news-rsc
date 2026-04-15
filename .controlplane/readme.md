# Control Plane Deployment Notes

This repo now includes `cpflow` scaffolding for:

- opt-in PR review apps
- automatic staging deploys from `main`
- manual promotion from staging to production

## Why This Shape

This app already ships a production Dockerfile at the repository root and runs
React on Rails Pro server rendering in a separate Node process. The Control
Plane setup mirrors that:

- `.controlplane/controlplane.yml` points `dockerfile: ../Dockerfile`
- `templates/rails.yml` runs the public `rails` workload on port `80`
- `templates/renderer.yml` runs the internal React on Rails Pro Node renderer on port `3800`
- `release_script.sh` runs `bin/rails db:prepare` before deploys switch images

Because this demo uses Shakapacker plus the React on Rails Pro Node renderer,
the root `Dockerfile` now installs Node.js and runs `pnpm install --frozen-lockfile`
so the same image can both precompile assets and serve renderer requests in
Control Plane.

The renderer is also configured to bind `0.0.0.0` in production so the separate
`rails` workload can reach it over the shared Control Plane network. Its bundle
cache is stored under `/rails/tmp/.node-renderer-bundles`, which stays writable
for the non-root app user inside the production image.

## Required Runtime Secrets

Before the app will boot on Control Plane, configure at least:

- `RAILS_MASTER_KEY`
- `DATABASE_URL`
- `CACHE_DATABASE_URL`
- `QUEUE_DATABASE_URL`
- `CABLE_DATABASE_URL`

Optional:

- `RENDERER_PASSWORD`

These can be added either as direct GVC env vars or via a Control Plane secret
store referenced from `templates/app.yml`.

The four database URLs can point to separate production databases or to the
same Postgres cluster with distinct database names, matching Rails 8's
`primary`, `cache`, `queue`, and `cable` connections.

## Local cpflow Flow

Typical setup:

```sh
export APP_NAME=react-on-rails-hacker-news-app-staging

cpflow setup-app -a "$APP_NAME"
cpflow build-image -a "$APP_NAME"
cpflow deploy-image -a "$APP_NAME" --run-release-phase
cpflow open -a "$APP_NAME"
```

## GitHub Actions Variables And Secrets

Set these in GitHub before enabling the generated `cpflow-*` workflows:

- `CPLN_TOKEN_STAGING`
- `CPLN_TOKEN_PRODUCTION`
- `CPLN_ORG_STAGING`
- `CPLN_ORG_PRODUCTION`
- `STAGING_APP_NAME=react-on-rails-hacker-news-app-staging`
- `PRODUCTION_APP_NAME=react-on-rails-hacker-news-app-production`
- `REVIEW_APP_PREFIX=react-on-rails-hacker-news-app-review`

Optional:

- `STAGING_APP_BRANCH=main`
- `PRIMARY_WORKLOAD=rails`
