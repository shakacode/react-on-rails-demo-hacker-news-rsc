import { cache } from "react";
import http from "node:http";
import https from "node:https";

import type { HNItem, HNStoryPage, HNStoryType, HNUser } from "./types";

// `server-only` from Next.js throws in non-Next runtimes.
// Keep an explicit browser guard instead for React on Rails.
if (typeof window !== "undefined") {
  throw new Error("hnApi must only run in server-rendered modules.");
}

const DEFAULT_HN_BASE_URL = "https://hacker-news.firebaseio.com/v0";
const DEFAULT_PAGE_SIZE = 30;
const MAX_PAGE_SIZE = 100;
const REQUEST_TIMEOUT_MS = 10_000;

function readEnv(name: string): string | undefined {
  const nodeGlobals = globalThis as {
    process?: {
      env?: Record<string, string | undefined>;
    };
  };

  return nodeGlobals.process?.env?.[name];
}

function normalizedBaseUrl(): string {
  const baseUrl = readEnv("HN_API_BASE_URL") ?? DEFAULT_HN_BASE_URL;
  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
}

const HN_BASE_URL = normalizedBaseUrl();

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNumberArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "number");
}

function isHNItem(value: unknown): value is HNItem {
  return isObject(value) && typeof value.id === "number";
}

function isHNUser(value: unknown): value is HNUser {
  return (
    isObject(value) &&
    typeof value.id === "string" &&
    typeof value.created === "number" &&
    typeof value.karma === "number"
  );
}

function normalizePage(rawPage: number): number {
  if (!Number.isFinite(rawPage) || rawPage < 1) {
    return 1;
  }

  return Math.floor(rawPage);
}

function normalizePageSize(rawPageSize: number): number {
  if (!Number.isFinite(rawPageSize) || rawPageSize < 1) {
    return DEFAULT_PAGE_SIZE;
  }

  return Math.min(Math.floor(rawPageSize), MAX_PAGE_SIZE);
}

class HNApiError extends Error {
  public readonly status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = "HNApiError";
    this.status = status;
  }
}

function requestJson(url: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const transport = url.startsWith("https:") ? https : http;

    const request = transport.get(
      url,
      {
        headers: {
          Accept: "application/json",
        },
      },
      (response) => {
        const status = response.statusCode ?? 500;

        if (status < 200 || status >= 300) {
          response.resume();
          reject(new HNApiError(`HN API request failed: ${url}`, status));
          return;
        }

        response.setEncoding("utf8");
        let body = "";

        response.on("data", (chunk) => {
          body += chunk;
        });

        response.on("end", () => {
          try {
            resolve(JSON.parse(body));
          } catch {
            reject(new HNApiError(`HN API returned invalid JSON: ${url}`));
          }
        });
      },
    );

    request.setTimeout(REQUEST_TIMEOUT_MS, () => {
      request.destroy(new HNApiError(`HN API request timed out: ${url}`, 504));
    });

    request.on("error", (error) => {
      if (error instanceof HNApiError) {
        reject(error);
        return;
      }

      reject(
        new HNApiError(
          `HN API network error: ${url} (${error instanceof Error ? error.message : "unknown error"})`,
          502,
        ),
      );
    });
  });
}

const fetchJson = cache(async (path: string): Promise<unknown> => {
  return requestJson(`${HN_BASE_URL}/${path}`);
});

export const fetchStoryIds = cache(async (storyType: HNStoryType = "top"): Promise<number[]> => {
  const payload = await fetchJson(`${storyType}stories.json`);

  if (!isNumberArray(payload)) {
    throw new HNApiError(`Unexpected stories payload shape for type '${storyType}'`);
  }

  return payload;
});

export const fetchItem = cache(async (itemId: number): Promise<HNItem | null> => {
  const payload = await fetchJson(`item/${itemId}.json`);

  if (payload === null) {
    return null;
  }

  if (!isHNItem(payload)) {
    throw new HNApiError(`Unexpected item payload shape for id '${itemId}'`);
  }

  return payload;
});

export const fetchUser = cache(async (userId: string): Promise<HNUser | null> => {
  const payload = await fetchJson(`user/${userId}.json`);

  if (payload === null) {
    return null;
  }

  if (!isHNUser(payload)) {
    throw new HNApiError(`Unexpected user payload shape for id '${userId}'`);
  }

  return payload;
});

export const fetchStoryPage = cache(async (
  storyType: HNStoryType = "top",
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
): Promise<HNStoryPage> => {
  const ids = await fetchStoryIds(storyType);
  const normalizedPageSize = normalizePageSize(pageSize);

  const totalIds = ids.length;
  const totalPages = Math.max(1, Math.ceil(totalIds / normalizedPageSize));
  const normalizedPage = Math.min(normalizePage(page), totalPages);

  const start = (normalizedPage - 1) * normalizedPageSize;
  const end = start + normalizedPageSize;

  return {
    storyType,
    page: normalizedPage,
    pageSize: normalizedPageSize,
    totalIds,
    totalPages,
    ids: ids.slice(start, end),
  };
});

export { HNApiError };
