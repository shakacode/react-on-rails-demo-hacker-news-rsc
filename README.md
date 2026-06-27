# React on Rails Hacker News App

This repository is a Hacker News demo built with Rails 8, React 19, and React on Rails Pro React Server Components (RSC).

It recreates the core experience of the Vercel `next-react-server-components` demo in a Rails-first application:

- Story feeds for `top`, `new`, `best`, `ask`, `show`, and `job`
- Item pages with streamed nested comments
- User profile pages
- Rails-managed HTTP caching and 404 handling
- React Server Components rendered through the React on Rails Pro Node renderer

Reference projects:

- [Epic: Hacker News RSC Demo for React on Rails Pro](https://github.com/shakacode/react_on_rails-demos/issues/70)
- [Vercel next-react-server-components](https://github.com/vercel/next-react-server-components)
- [Legacy implementation workspace](https://github.com/shakacode/react-on-rails-hn-rsc-demo)

## Repository Status

[`shakacode/react-on-rails-demo-hacker-news-rsc`](https://github.com/shakacode/react-on-rails-demo-hacker-news-rsc) is the canonical public Hacker News RSC demo for React on Rails Pro.

It supersedes the older [`shakacode/react-on-rails-hn-rsc-demo`](https://github.com/shakacode/react-on-rails-hn-rsc-demo) repo, which is still useful as historical implementation context but is no longer the best public entry point.

For the repo comparison and recommended archive handoff, see [docs/repo-status-and-archive-plan.md](docs/repo-status-and-archive-plan.md).

Related:

- [react-on-rails-starter-tanstack](https://github.com/shakacode/react-on-rails-starter-tanstack) - the 2026 TanStack-first starter that shares the Rails + React on Rails Pro patterns behind this public-traffic RSC demo.
- [Using TanStack Query](https://reactonrails.com/docs/building-features/tanstack-query) - the canonical guide to client-side server-state (caching, mutations, pagination) against a Rails JSON API, the complement to this demo's RSC rendering.

## Live Demo

- Public deployment: not configured yet
- Local demo after `bin/dev`: [http://localhost:3000](http://localhost:3000)

## Quick Start

### Prerequisites

- Ruby `3.4.3`
- Node.js `24.8.0`
- `pnpm`
- PostgreSQL
- Optional: [`mise`](https://mise.jdx.dev/) to match `.tool-versions`

### Install and Run

If you use `mise`:

```bash
mise install
bin/setup --skip-server
bin/dev
```

If you manage runtimes yourself:

```bash
bundle install
pnpm install
bin/rails db:prepare
bin/dev
```

Then open [http://localhost:3000](http://localhost:3000).

### Useful Development Commands

```bash
bin/dev           # Rails + client bundle + server bundle + node renderer + RSC bundle
bin/dev static    # Static asset watch mode
bin/dev prod      # Development with production-style assets
pnpm exec tsc --noEmit
bin/rubocop
bin/rails test
bin/rails test:system
```

## Routes

- `/` and `/news/:page` render story feeds
- `/item/:id` renders a story detail page or direct comment page
- `/user/:id` renders a Hacker News user profile
- `/rsc_payload/:component_name` streams the React Server Component payload used by React on Rails Pro

## Architecture

This app keeps Rails in charge of routing, controllers, caching, and HTML entrypoints, while React on Rails Pro handles the RSC runtime and the Node renderer.

### Request Flow

1. A Rails route hits `StoriesController`, `ItemsController`, or `UsersController`.
2. The controller prepares props, preflights missing Hacker News resources, and applies HTTP caching headers.
3. The `.erb` view calls `stream_react_component(...)`.
4. React on Rails Pro serves the initial shell and opens an RSC stream through `/rsc_payload/:component_name`.
5. The Node renderer executes `rsc-bundle.js`, resolves async server components, and streams Suspense boundaries back to the browser.
6. Only the minimal client code needed for interactivity is hydrated on the page.

### Key Rails Pieces

- `app/controllers/` manages route params, 404s, and cache headers
- `app/views/*/show.html.erb` and `app/views/stories/index.html.erb` are the Rails entrypoints for streamed components
- `lib/hacker_news_client.rb` is the Ruby-side preflight client used for missing-resource checks

### Key React Pieces

- `app/javascript/src/hn/ror_components/` contains top-level route components registered with React on Rails Pro
- `app/javascript/src/hn/components/` contains async server components, presentational components, and minimal interactive surfaces
- `app/javascript/src/hn/lib/` contains Hacker News API access, types, and view-model mappers
- `client/node-renderer.js` configures the React on Rails Pro Node renderer

### Build and Runtime Notes

- The demo uses Webpack for asset bundling because the current RSC manifest flow in this app depends on it
- The Node renderer runs separately from Rails in development on port `3800`
- `hnApi.ts` uses Node `http` and `https` instead of relying on global `fetch`, which keeps it compatible with the Node renderer VM

## File Structure

```text
app/
  controllers/
    stories_controller.rb
    items_controller.rb
    users_controller.rb
  views/
    stories/index.html.erb
    items/show.html.erb
    users/show.html.erb
  javascript/src/hn/
    ror_components/
      HNStoriesPage.tsx
      HNItemPage.tsx
      HNUserPage.tsx
    components/
      Stories.tsx
      ItemPage.tsx
      UserPage.tsx
      Comments.tsx
      Comment.tsx
      CommentToggle.tsx
      Story.client.tsx
    lib/
      hnApi.ts
      mappers.ts
      server.ts
      types.ts
client/
  node-renderer.js
config/
  initializers/react_on_rails_pro.rb
  webpack/
test/
  integration/http_caching_test.rb
  system/hacker_news_app_test.rb
  support/
    fake_hacker_news_api.rb
    node_renderer_test_server.rb
```

## Key RSC Patterns

### 1. Rails Starts the Stream

Each route is still a normal Rails action plus a normal Rails view:

```erb
<%= stream_react_component("HNStoriesPage", props: @hn_stories_props, prerender: true) %>
```

That keeps routing and response behavior in Rails instead of moving it into a JavaScript router.

### 2. Async Server Components Fetch Their Own Data

`Stories.tsx` is an async server component. It fetches story IDs, then streams story rows behind Suspense boundaries:

```tsx
export default async function Stories({ page, storyType }: StoriesProps) {
  const storyPage = await fetchStoryPage(storyType, page);

  return storyPage.ids.map((id, offset) => (
    <Suspense fallback={<StoryRowFallback rank={offset + 1} />} key={id}>
      <StoryRow id={id} rank={offset + 1} />
    </Suspense>
  ));
}
```

The same pattern is used for nested comments in `Comments.tsx`.

### 3. Server-Side Data Mapping Stays Explicit

`app/javascript/src/hn/lib/mappers.ts` converts raw Hacker News payloads into stable view models before rendering. That keeps rendering code simple and avoids leaking API edge cases into components.

### 4. Keep the Client Surface Small

This demo keeps most logic on the server:

- `Story.client.tsx` is a tiny client component for the story row surface
- `CommentToggle.tsx` uses native `<details>` and `<summary>` so comment collapsing works without a hook-based client boundary
- Data fetching, pagination, comment recursion, and user pages all stay server-rendered

### 5. Rails HTTP Caching Wraps the RSC Experience

Controllers still own HTTP semantics:

```ruby
apply_public_cache(ttl: 5.minutes, etag: [ "item", @hn_item_props[:itemId] ])
```

That means the app can use Rails cache headers, ETags, and 404 responses without giving up streamed RSC rendering.

## Comparison with the Next.js Version

For a detailed compare-and-contrast, including local benchmark notes and “when to choose which” guidance, see [docs/react-on-rails-pro-vs-nextjs.md](docs/react-on-rails-pro-vs-nextjs.md).

For implementation follow-ups, upstream product improvement ideas, documentation gaps, and recommended next questions, see [docs/react-on-rails-pro-lessons-learned.md](docs/react-on-rails-pro-lessons-learned.md).

| Concern | Next.js Reference | This App |
| --- | --- | --- |
| Routing | App Router / file-system routes | Rails routes + Rails controllers |
| Entry HTML | React/Next page tree | Rails view calls `stream_react_component` |
| Data fetching | Server components inside Next.js runtime | Server components inside React on Rails Pro Node renderer |
| RSC transport | Built into Next.js | Explicit `/rsc_payload/:component_name` route |
| HTTP caching | Typically handled in Next.js route handlers or hosting layer | Standard Rails controller cache headers and ETags |
| 404 handling | Next.js route conventions | Ruby preflight checks plus Rails status codes |
| Deployment shape | Next.js app runtime | Rails app plus Node renderer process |

The important similarity is the rendering model: async server components, Suspense boundaries, progressive streaming, and minimal client-side JavaScript.

The important difference is ownership: Rails remains the application shell, request orchestrator, and caching layer.

## Testing

The test suite uses a deterministic fake Hacker News API plus a dedicated Node renderer test server.

- `test/integration/http_caching_test.rb` verifies cache headers and 404 behavior
- `test/system/hacker_news_app_test.rb` verifies feed rendering, nested comments, comment collapsing, and user pages
- `test/support/fake_hacker_news_api.rb` removes the external Hacker News API dependency during tests
- `test/support/node_renderer_test_server.rb` boots the renderer against compiled test assets

## Learn More

- [React on Rails Pro docs](https://www.shakacode.com/react-on-rails-pro/docs/)
- [Installation](https://www.shakacode.com/react-on-rails-pro/docs/installation/)
- [Configuration](https://www.shakacode.com/react-on-rails-pro/docs/configuration/)
- [Node Renderer basics](https://www.shakacode.com/react-on-rails-pro/docs/node-renderer/basics/)
- [Add streaming and interactivity to an RSC page](https://www.shakacode.com/react-on-rails-pro/docs/react-server-components/add-streaming-and-interactivity/)
- [SSR React Server Components](https://www.shakacode.com/react-on-rails-pro/docs/react-server-components/server-side-rendering/)

## Contributing

Contributions are welcome.

- Open an issue before large scope changes
- Keep Rails routing/controller concerns separate from React rendering concerns
- Prefer server components by default and add client code only when interactivity requires it
- Run local checks before opening a pull request:

```bash
pnpm exec tsc --noEmit
bin/rubocop
bin/rails test
bin/rails test:system
```
