import React, { Suspense } from "react";

import { normalizeStoryType } from "../../hn/lib/mappers";
import Layout from "../components/Layout";
import Stories from "../components/Stories";

interface HNStoriesPageProps {
  page?: number | string;
  storyType?: string;
}

function normalizePage(rawPage: number | string | undefined): number {
  if (typeof rawPage === "number") {
    return rawPage > 0 ? Math.floor(rawPage) : 1;
  }

  if (typeof rawPage === "string") {
    const parsed = Number(rawPage);
    return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1;
  }

  return 1;
}

export default function HNStoriesPage({ page, storyType }: HNStoriesPageProps) {
  const normalizedStoryType = normalizeStoryType(storyType);
  const normalizedPage = normalizePage(page);

  return (
    <Layout storyType={normalizedStoryType}>
      <Suspense fallback={<p>Loading stories...</p>}>
        <Stories page={normalizedPage} storyType={normalizedStoryType} />
      </Suspense>
    </Layout>
  );
}
