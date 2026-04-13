# React on Rails Pro Lessons Learned from This Hacker News Demo

This document captures what went wrong, what we learned, and what looks worth improving upstream after building this Hacker News demo with Rails 8, React 19, and React on Rails Pro RSC.

The intent is practical:

- identify implementation issues that were real, not theoretical
- separate demo-specific friction from product-level friction
- turn those findings into concrete issue ideas for React on Rails
- identify documentation updates that would have reduced implementation time

## Short Answer

Yes, there were real issues in the implementation.

None of them were deal-breakers, but several of them are strong candidates for upstream product or documentation improvements:

- client/server boundary failures were too easy to hit and too hard to diagnose
- Node renderer runtime constraints were not obvious enough
- RSC testing setup was more manual than it should be
- error reporting for streamed RSC failures lost too much detail
- route-level Rails + RSC patterns like 404 handling need more documentation

## Issues We Actually Hit

## 1. Client component boundaries were easy to misconfigure

The most important runtime issue in the implementation was this:

- a comment toggle component used `useState`
- it was intended to behave as a client boundary
- but it still ended up executing in the RSC runtime path
- the result was a streamed item page failure with `useState is not a function`

What made this costly:

- the browser symptom was mostly a blank page
- the console only showed a generic `Error in RSC stream`
- the renderer log did not immediately surface the real exception

This is the kind of failure that should ideally be caught earlier:

- at build time
- or with a much more explicit dev-mode error

### Why this matters

This is exactly the class of bug people will hit when first adopting RSC:

- “I thought this was a client component”
- “Why is React Server trying to execute it?”

That means it is product-surface friction, not just app-specific friction.

## 2. The Node renderer VM does not behave like a normal Node app

The `hnApi.ts` implementation initially used `fetch`.

That failed inside the Node renderer VM because `fetch` was not available in the effective execution context used for server rendering. The fix was to switch to `node:http` and `node:https`.

### Why this matters

Modern Node developers reasonably expect `fetch` to exist.

If the renderer intentionally does not expose it, that needs to be extremely obvious.

If it can be exposed safely, the default developer experience would improve.

This was one of the most surprising runtime differences versus Next.js.

## 3. RSC test setup was more manual than it should be

To get integration and system tests stable, the demo had to do a fair amount of custom wiring:

- set renderer env vars before Rails boots
- compile test assets before starting tests
- boot a dedicated Node renderer test server
- clear `.node-renderer-bundles`
- run tests with a single worker
- run a fake Hacker News API to avoid network dependence

This works, but it is more infrastructure than most teams will expect for testing a Rails page.

### Why this matters

If React on Rails Pro wants RSC adoption to feel routine inside Rails apps, test setup is one of the highest leverage places to smooth out.

## 4. Streamed RSC errors were not observable enough

During the item-page failure, the diagnostic path was weaker than it should have been:

- browser console had a generic stream error
- the renderer log file did not clearly show the stack
- the HTML shell arrived, but the stream aborted mid-flight

We were still able to debug it, but only after inspecting the streamed payload manually.

### Why this matters

This is expert-only debugging behavior.

A product should make the common failure mode legible:

- which component failed
- whether it failed in the server bundle or the RSC bundle
- whether the root cause was an unsupported hook/client import/runtime global

## 5. Route-level 404 handling is a real integration concern

In Next.js, route-level missing-item handling can live naturally inside the route tree.

In this Rails app, we added a Ruby-side Hacker News preflight client so controllers could decide whether to return `404` before streaming the page.

That was the right choice, but it highlights a real pattern gap:

- RSC rendering happens in React
- HTTP status ownership happens in Rails

That split is valid, but it needs stronger guidance.

### Why this matters

Teams adopting React on Rails Pro for RSC will run into this immediately:

- Where should not-found live?
- Where should redirects live?
- Can a server component trigger HTTP semantics upstream?

## 6. Rspack is not yet a clean option for this RSC path

This demo stayed on Webpack because the current RSC manifest/plugin flow depends on it.

That is not a blocker, but it is a notable product limitation if the broader ecosystem is moving toward Rspack for faster iteration.

## Which Issues Were Product Issues vs Demo Issues

### Likely product issues

- weak client/server boundary diagnostics
- lack of clear `fetch` guidance or support in the renderer VM
- weak streamed-error observability
- lack of first-class RSC test harness guidance
- missing documentation for Rails-owned 404/redirect patterns
- incomplete Rspack story for RSC

### Mostly demo or app-level issues

- the particular choice to use a client toggle for comment collapse
- the exact benchmark shape versus the Vercel reference app
- the specific fake Hacker News API wiring

## Recommended Issues to File Upstream

These are the best candidate upstream issues based on this implementation.

## 1. Improve dev-mode error reporting for RSC stream failures

Suggested title:

`RSC stream failures should surface component path and original exception in dev`

What it should ask for:

- clearer browser/dev-console messaging
- component name and module path in the error
- explicit distinction between server-bundle and RSC-bundle failures
- original stack trace preservation where possible

## 2. Catch client-component boundary mistakes earlier

Suggested title:

`Detect unsupported client-hook usage in RSC/server bundle earlier and fail with actionable diagnostics`

What it should ask for:

- better compile-time or startup-time diagnostics
- explicit messaging when a `useState`/`useEffect` component lands in the wrong runtime
- guidance on supported client-boundary patterns in React on Rails Pro

## 3. Clarify or support `fetch` inside the Node renderer runtime

Suggested title:

`Document Node renderer runtime globals for RSC, including fetch support expectations`

Possible scope:

- document current runtime guarantees explicitly
- or expose `fetch`, `Headers`, `Request`, and `Response` if safe
- or document the recommended escape hatch through `additionalContext`

## 4. Provide first-class RSC testing guidance for Rails apps

Suggested title:

`Add official guide or helper for integration/system testing with RSC and the Node renderer`

What it should cover:

- when to compile test assets
- how to boot a renderer in tests
- how to isolate bundle caches
- parallelization caveats
- examples for Capybara/system tests

## 5. Document Rails-owned HTTP semantics with RSC

Suggested title:

`Document recommended patterns for 404, redirects, and cache headers when Rails owns the request and RSC owns rendering`

This is especially important because it is one of the main reasons teams choose React on Rails Pro over Next.js.

## 6. Track Rspack compatibility for RSC manifests/plugins

Suggested title:

`Document current Rspack limitations for RSC and track parity plan`

If parity is not near-term, the docs should say that plainly.

## Recommended Documentation Updates for React on Rails

These documentation updates would have reduced implementation time materially.

## 1. Add a “Common RSC Failure Modes” page

Include:

- `useState is not a function`
- `fetch is not defined`
- blank shell with aborted stream
- missing client manifest / stale renderer cache
- “what to inspect first” checklist

## 2. Add a “Rails Route Ownership with RSC” guide

Cover:

- controller responsibilities
- view entrypoints
- route props
- status code handling
- redirects
- 404 behavior
- HTTP caching patterns

## 3. Add a dedicated testing guide for RSC

Cover:

- Minitest and RSpec examples
- system tests
- fake external API setup
- renderer test boot patterns
- bundle cache invalidation
- when parallel tests are unsafe

## 4. Make Node renderer runtime constraints explicit

A page should answer:

- which globals exist
- whether `fetch` exists
- whether browser APIs exist
- how `supportModules` changes behavior
- how to add safe globals

## 5. Add a small end-to-end demo showing server components plus one client island

The best doc example would look a lot like this app:

- stories page
- item page
- nested comments
- one interactive element
- Rails controller cache headers
- route-level 404 handling

That example would answer more real adoption questions than a minimal hello-world.

## 6. Explain streaming semantics more explicitly

The docs should make clear that:

- `curl` total response time is not the same as time to first meaningful paint
- streamed responses may intentionally stay open longer
- `Transfer-Encoding: chunked` is expected
- first-render and warm-render behavior can differ because the renderer warms up

## Should React on Rails Docs Be Updated Based on This Demo?

Yes.

The strongest doc update is not “how to build a Hacker News clone.”

The strongest doc update is:

> “Here are the real integration seams you will encounter when you add RSC to a Rails app that still wants Rails to own the request.”

That is the real differentiator.

## What Other Questions You Should Be Asking

These are the next high-value questions after this demo.

## Product and platform questions

- How should React on Rails Pro position itself relative to Next.js for existing Rails teams versus greenfield teams?
- What is the intended long-term story for Rspack with RSC?
- Can the Node renderer be made simpler to operate in development and tests?
- Can route-level HTTP semantics be made more ergonomic when React and Rails share responsibility?

## Performance questions

- What is the cold-start cost of the Node renderer in a real production deployment?
- How much can prewarming or persistent renderer workers reduce first-request latency?
- What is the real browser performance delta after excluding server-bundle artifacts and focusing only on shipped client JS?
- How do CDN caching and reverse-proxy setup change the comparison?

## Adoption questions

- How hard is it to migrate one route at a time in an existing Rails monolith?
- What is the recommended boundary between Rails controllers and RSC server components in a large app?
- How should authentication and per-user data caching be handled with React on Rails Pro RSC?
- What does observability look like in production when a stream fails mid-render?

## Developer experience questions

- What is the minimal official setup for stable system tests?
- What debugging workflow should the docs recommend first when an RSC page shows a blank shell?
- Should there be a generator for route/controller/view/top-level-RSC wiring?
- Can React on Rails ship stronger warnings around incorrect client/server imports?

## Final Take

The implementation succeeded, and the product story is strong.

But the friction points were concentrated in exactly the places that matter most for adoption:

- runtime boundaries
- debugging
- test setup
- Rails/RSC ownership seams

That is actually good news.

These are fixable product and documentation problems, not evidence that the architecture is unsound.
