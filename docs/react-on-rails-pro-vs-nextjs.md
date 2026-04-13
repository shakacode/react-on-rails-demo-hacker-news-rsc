# React on Rails Pro vs Next.js for This Hacker News App

This document compares two concrete implementations of the same idea:

- This repository: Rails 8 + React 19 + React on Rails Pro RSC
- Reference app: [`vercel/next-react-server-components`](https://github.com/vercel/next-react-server-components) at commit `e5cdd85`, using Next `14.2.35` and React `18.3.1`

The goal is not to declare a universal winner. The goal is to answer a narrower question:

> For an app like this Hacker News clone, what changes when you build it with React on Rails Pro instead of Next.js?

## Executive Summary

If you already have a serious Rails application, React on Rails Pro is the better fit when you want React Server Components without moving routing, caching, auth, and request orchestration out of Rails.

If the web frontend is the product and you want the lowest-ceremony path to a pure JavaScript deployment model, Next.js is the simpler greenfield choice.

For this specific demo:

- Next.js has a smaller client-first footprint and faster warm route responses in local measurements
- React on Rails Pro keeps Rails in control of HTTP behavior, which is often more valuable than the raw framework delta for an existing Rails team
- The biggest difference is not “can they both do RSC?” They can.
- The biggest difference is “who owns the application shell and request lifecycle?” Rails in one case, Next.js in the other

## What Is Actually Similar

At the React layer, the two apps are much closer than people expect.

Both implementations use:

- async server components
- Suspense boundaries
- recursive comment trees
- tiny client islands for interactivity
- streamed server output

That is the most important takeaway from this example:

**RSC is not a Next.js-only architectural pattern.**

This Rails app proves that the React programming model still works when Rails owns the request lifecycle.

## What Is Actually Different

### 1. Routing and Request Ownership

In the Next.js app, route ownership lives in the App Router:

- `app/news/[page]/page.tsx`
- `app/item/[id]/layout.tsx`
- `app/item/[id]/(comments)/page.tsx`

In this Rails app, route ownership is split across Rails and React:

- `config/routes.rb`
- `app/controllers/stories_controller.rb`
- `app/controllers/items_controller.rb`
- `app/controllers/users_controller.rb`
- `app/views/stories/index.html.erb`
- `app/views/items/show.html.erb`
- `app/views/users/show.html.erb`
- `app/javascript/src/hn/ror_components/*`

That means:

- Next.js is simpler for a greenfield frontend because the framework owns the whole route
- React on Rails Pro is better when you explicitly want Rails to keep owning routing, status codes, cache headers, redirects, and controller logic

### 2. Caching Model

The reference Next.js app uses framework-managed fetch caching:

```ts
await fetch(url, {
  next: { revalidate: 10 }
})
```

It also pre-generates some routes:

- `/news/1`
- the top 30 `/item/:id` pages

This Rails app uses normal controller-level HTTP caching:

```ruby
apply_public_cache(ttl: 5.minutes, etag: [ "item", @hn_item_props[:itemId] ])
```

That is a philosophical difference as much as a technical one:

- Next.js defaults toward framework-level data caching and route prerendering
- React on Rails Pro keeps caching explicit at the HTTP/controller layer

For Rails teams, that explicitness is often a feature, not a bug.

### 3. Runtime Shape

The Next.js reference app runs as one application runtime.

This Rails demo has more moving parts:

- Rails app server
- React on Rails Pro Node renderer
- Webpack client bundle
- Webpack server bundle
- Webpack RSC bundle

In development, the difference is especially visible:

- Next.js: `pnpm dev`
- React on Rails Pro demo: `bin/dev`, which starts Rails, client bundling, server bundling, the Node renderer, and the RSC bundle watcher

So yes, React on Rails Pro is operationally more explicit.

That is the price of keeping Rails in charge instead of replacing it.

## Performance Findings

These measurements were taken locally on:

- Apple M5 Max
- 128 GB RAM
- macOS 26.4.1
- Node `24.8.0`
- Ruby `3.4.3`

The Next.js app was benchmarked against a shared local fake Hacker News API so the measurements were not dominated by public API/network jitter. The Rails app used the same fake API.

Important caveats:

- This is not a pure framework bake-off because the reference Next.js app pre-generates routes that this Rails demo does not
- The Next.js reference app is on Next 14 / React 18, while this app uses React 19
- Rails route timings below were taken in the test/runtime harness because local production boot is constrained by app-specific production DB credentials
- For Rails, `curl` total time is inflated by chunked streaming; `time_starttransfer` is the more useful number

### Clean Build Time

| Measurement | React on Rails Pro demo | Next.js reference |
| --- | ---: | ---: |
| Clean production build | `3.58s` | `8.33s` |

Interpretation:

- In this repo, the React on Rails Pro build was faster
- That is not a universal law
- The Next.js build is doing more route pre-generation work out of the box, so part of the extra time is a strategy choice, not just framework overhead

### Output Shape

React on Rails Pro build output:

- client vendor JS: `226,875` bytes uncompressed, `71,434` bytes gzip
- server bundle: `1,268,412` bytes
- RSC bundle: `278,143` bytes

Next.js reference build output:

- first load JS for `/news/[page]`: `97.9 kB`
- `.next/static` JS/CSS total: about `718 kB`
- `.next/server` JS/RSC/HTML sample total: about `950 kB`

Interpretation:

- Next.js ships a smaller browser-first payload in this example
- React on Rails Pro carries additional explicit SSR/RSC bundle artifacts because the integration boundary is visible instead of hidden inside the framework

### Warm Dynamic Route Timings

Routes chosen for comparison:

- `/news/2`
- `/item/1031`

These routes avoid the reference app’s most obvious pre-generated hot path.

| Route | Metric | React on Rails Pro demo | Next.js reference |
| --- | --- | ---: | ---: |
| `/news/2` | avg start-transfer | `25.9ms` | `10.5ms` |
| `/news/2` | avg total | `303.4ms` | `10.6ms` |
| `/item/1031` | avg start-transfer | `55.5ms` | `8.9ms` |
| `/item/1031` | avg total | `373.3ms` | `9.0ms` |

Important nuance:

- Rails responses were `Transfer-Encoding: chunked`
- Next.js responses returned fixed `Content-Length`
- Rails also reported `X-Runtime` values around `21ms` to `43ms` for sample requests

Interpretation:

- Next.js was faster in warm local route timings for this demo
- The user-visible gap is smaller than `curl` total time suggests because the Rails response streams and stays open longer
- This result mostly says: the reference Next.js app has a tighter integrated runtime and more aggressive default pre-render/cache behavior

### Cold Start Behavior

The first Rails feed request was materially slower than later ones because the renderer path had to warm up. That is a real tradeoff:

- React on Rails Pro has a renderer warmup tax
- Next.js has fewer moving pieces in this small example

If you need the absolute best cold-start path for a frontend-only app, Next.js has the advantage here.

## Complexity Differences

### React on Rails Pro Is More Explicit

To add or change a route in this app, you typically touch:

- Rails routes
- a Rails controller
- a Rails view
- a top-level RSC component
- one or more React components
- possibly controller cache rules

To add or change a route in the Next.js reference app, you usually touch:

- an App Router file
- shared components
- shared data helpers

That makes Next.js feel lighter for a greenfield UI.

### But Next.js Pushes More of the App into JavaScript

That same simplicity has a cost when you already have Rails:

- request policy moves into Next route/layout/page conventions
- caching moves into Next fetch/cache rules
- auth, redirects, middleware, and backend integration often move out of the Rails request layer
- teams that already understand Rails now need more application concerns to live in JavaScript infrastructure

So the complexity question is asymmetric:

- React on Rails Pro has more framework wiring
- Next.js often creates more migration complexity for a Rails organization because it changes who owns the app

## When React on Rails Pro Is the Better Choice

Use React on Rails Pro for an app like this when:

- you already have a Rails monolith or Rails-backed product
- you want RSC without rewriting routing and request ownership into Next.js
- your team wants Rails controllers to keep owning status codes, cache headers, auth checks, and redirects
- you want to adopt RSC incrementally instead of doing a frontend platform migration
- SEO/server rendering matters, but Rails remains the system of record for web requests

The strongest message from this demo is:

**If you are already committed to Rails, RSC does not force you into Next.js.**

## When Next.js Is the Better Choice

Use Next.js for an app like this when:

- the web frontend is the primary app, not an extension of an existing Rails request layer
- your team prefers file-based routing and a single JavaScript-centric deployment/runtime model
- you want built-in SSG/ISR-style defaults and easy static pre-generation for content-heavy routes
- you are optimizing for frontend-only developer ergonomics over Rails integration
- there is no strategic reason to keep Rails in charge of the browser-facing request lifecycle

## How to Use This Demo to Explain the Choice

This example is best used as a positioning demo, not just a feature demo.

### The message for React on Rails Pro

Use this demo to show:

- the React programming model is the same
- server components, Suspense, and streaming still work
- Rails can remain the outer application shell
- teams do not need to rewrite into Next.js just to get modern React server rendering

The sentence to repeat is:

> “You can keep Rails as the app, and still use the modern React server model.”

### The message for Next.js

Use the reference app to show:

- it is a strong default for a greenfield frontend
- its routing and data model feel cohesive because the framework owns everything
- static generation and route-level optimization are easier when the whole app lives inside Next conventions

The sentence to repeat is:

> “If your frontend is the platform, Next.js is simpler.”

### The honest positioning

The honest comparison is not:

> “React on Rails Pro beats Next.js.”

The honest comparison is:

> “React on Rails Pro removes the forced choice between Rails and modern React server rendering.”

That is what this example proves.

## Bottom Line

For this Hacker News app:

- Next.js is leaner and faster on the client/runtime path
- React on Rails Pro is more explicit and more operationally complex
- But React on Rails Pro preserves Rails ownership of the web application, which is often the more important architectural outcome for a Rails product team

If the choice is being made inside an existing Rails codebase, this example argues strongly for React on Rails Pro.

If the choice is being made for a brand-new frontend-first product, this example argues that Next.js is the simpler starting point.
