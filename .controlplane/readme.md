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

Staging and review apps use `templates/app-shared-postgres.yml`. They read
`RAILS_MASTER_KEY` from the shared runtime secret
`react-on-rails-hn-rsc-demo-secrets`, and they read the four database URLs from
a per-app Control Plane secret named `{{APP_NAME}}-database`. The GitHub
workflows create/update that database dictionary secret from
`SHARED_POSTGRES_URL_PREFIX`, grant the app identity access to it, and also
grant the app identity access to the shared runtime secret.

Populate `react-on-rails-hn-rsc-demo-secrets.RAILS_MASTER_KEY` before enabling
staging or review deploys. If `RENDERER_PASSWORD` is set in the app template,
store it in the same secret.

Set `SHARED_POSTGRES_URL_PREFIX` to the shared Postgres URL without a database
name, for example:

```sh
postgres://USER:URL_ENCODED_PASSWORD@postgres.staging-shared-postgres.cpln.local:5432
```

The workflow appends app-specific database names so each staging/review app
gets four logical databases:

- `${APP_NAME}`
- `${APP_NAME}_cache`
- `${APP_NAME}_queue`
- `${APP_NAME}_cable`

For example, review app `react-on-rails-hn-rsc-demo-review-pr-41` should not
share any of its four database names with staging or another review app. The
database role in `SHARED_POSTGRES_URL_PREFIX` must either have permission to
create these databases during `bin/rails db:prepare`, or the databases must be
pre-created before the release phase runs.

This low-cost staging/review setup is not a database security boundary between
review apps. Apps share the same Postgres credentials and are isolated by
logical database name. Use per-app roles/passwords from a trusted provisioning
job if review apps need hard database isolation.

Existing staging/review apps are updated by the deploy workflows before the
new image is built: they ensure the app identity, patch existing workloads to
use that identity without changing workload images, create the per-app database
secret and reveal policy, and re-apply only the `app-shared-postgres` GVC
template. The old image remains in place until
`cpflow deploy-image --run-release-phase` completes the release phase and cuts
over to the new image.

Review app deletion removes the per-app Control Plane database secret and
policy. The logical databases in the shared Postgres cluster are intentionally
left in place because dropping them is destructive; archive or drop them with a
separate trusted database-maintenance task when that data is no longer needed.

## Local cpflow Flow

Typical setup:

```sh
export APP_NAME=react-on-rails-hn-rsc-demo-staging

cpflow setup-app -a "$APP_NAME"
cpflow build-image -a "$APP_NAME"
cpflow deploy-image -a "$APP_NAME" --run-release-phase
cpflow open -a "$APP_NAME"
```

For a one-off local update of an existing staging or review app:

```sh
export APP_NAME=react-on-rails-hn-rsc-demo-review-pr-41
export CPLN_ORG=shakacode-open-source-examples-staging
export SHARED_POSTGRES_URL_PREFIX="postgres://USER:URL_ENCODED_PASSWORD@postgres.staging-shared-postgres.cpln.local:5432"

script/control-plane/ensure-shared-postgres-secret
cpflow apply-template app-shared-postgres -a "$APP_NAME" --org "$CPLN_ORG" --yes
cpflow deploy-image -a "$APP_NAME" --org "$CPLN_ORG" --run-release-phase
```

## GitHub Actions Variables And Secrets

Set these in GitHub before enabling the generated `cpflow-*` workflows:

- `CPLN_TOKEN_STAGING`
- `CPLN_TOKEN_PRODUCTION`
- `SHARED_POSTGRES_URL_PREFIX`
- `CPLN_ORG_STAGING`
- `CPLN_ORG_PRODUCTION`
- `STAGING_APP_NAME=react-on-rails-hn-rsc-demo-staging`
- `PRODUCTION_APP_NAME=react-on-rails-hn-rsc-demo-production`
- `REVIEW_APP_PREFIX=react-on-rails-hn-rsc-demo-review-pr`

Optional:

- `STAGING_APP_BRANCH=main`
- `PRIMARY_WORKLOAD=rails`
