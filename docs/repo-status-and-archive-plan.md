# Repo Status and Archive Plan

This document answers a narrow operational question:

> Which Hacker News demo repo should remain the public reference, and what should happen to the older one?

Compared repos:

- Current repo: [`shakacode/react-on-rails-demo-hacker-news-rsc`](https://github.com/shakacode/react-on-rails-demo-hacker-news-rsc)
- Older repo: [`shakacode/react-on-rails-hn-rsc-demo`](https://github.com/shakacode/react-on-rails-hn-rsc-demo)

## Recommendation

- Do not archive `react-on-rails-demo-hacker-news-rsc`
- Make `react-on-rails-demo-hacker-news-rsc` the clear canonical demo
- After a short handoff, archive `react-on-rails-hn-rsc-demo`

## Why This Repo Should Stay Active

The current repo is the stronger public reference:

- the README explains the architecture and request flow instead of reading like an implementation scratchpad
- it includes the React on Rails Pro vs Next.js comparison and the implementation lessons learned
- it shows Rails-owned 404 handling and cache headers, which are central to the React on Rails Pro positioning
- it includes streamed nested comments instead of only the simpler feed and detail flows
- it includes deterministic integration and system tests
- it includes a fake Hacker News API plus dedicated node-renderer test support
- it is on the newer React on Rails Pro `16.4.0-rc.5` baseline rather than `16.4.0-rc.4`

## What The Older Repo Still Represents

The older repo is still useful as historical context, but its current presentation makes it a weaker public landing page:

- the README describes it as an "implementation workspace"
- it documents the earlier scaffolding baseline
- it does not contain the stronger public-facing comparison and postmortem material
- it lacks the testing and Rails HTTP-semantics examples that now make this demo more persuasive

That means keeping both repos fully active creates unnecessary ambiguity about which one people should clone, read, and share.

## Evidence Summary

The current repo contains public-facing materials that the older repo does not:

- [README.md](../README.md)
- [react-on-rails-pro-vs-nextjs.md](./react-on-rails-pro-vs-nextjs.md)
- [react-on-rails-pro-lessons-learned.md](./react-on-rails-pro-lessons-learned.md)
- [lib/hacker_news_client.rb](../lib/hacker_news_client.rb)
- [test/integration/http_caching_test.rb](../test/integration/http_caching_test.rb)
- [test/system/hacker_news_app_test.rb](../test/system/hacker_news_app_test.rb)
- [test/support/fake_hacker_news_api.rb](../test/support/fake_hacker_news_api.rb)
- [test/support/node_renderer_test_server.rb](../test/support/node_renderer_test_server.rb)

## Safe Archive Handoff

Before archiving the older repo:

1. Merge the current docs branch in this repo so `main` carries the comparison, lessons learned, and this handoff note.
2. Update the older repo README to say this repo is the canonical demo and link here prominently.
3. Cross-link or close any older repo issues that still matter.
4. Archive the older repo only after the redirect README is live.

## Current Blocker

The only blocker to the final archive step is that archiving a repository is an irreversible action and should be an explicit maintainership decision.
