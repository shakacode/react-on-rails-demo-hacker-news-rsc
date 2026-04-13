import React, { Suspense } from "react";

import {
  fetchItem,
  fetchStoryPage,
} from "../../hn/lib/server";
import { mapItemToStory } from "../../hn/lib/mappers";
import type { HNStoryType } from "../../hn/lib/types";

import Pagination from "./Pagination";
import Story from "./Story.client";
import StorySkeleton from "./StorySkeleton";
import * as styles from "./Stories.module.css";

interface StoriesProps {
  page: number;
  storyType: HNStoryType;
}

interface StoryRowProps {
  id: number;
  rank: number;
}

function MissingStory({ rank }: { rank: number }) {
  return (
    <div className={styles.row}>
      <span className={styles.rank}>{rank}.</span>
      <p className={styles.missing}>This story is unavailable.</p>
    </div>
  );
}

function StoryRowFallback({ rank }: { rank: number }) {
  return (
    <div className={styles.row}>
      <span className={styles.rank}>{rank}.</span>
      <StorySkeleton />
    </div>
  );
}

async function StoryRow({ id, rank }: StoryRowProps) {
  const item = await fetchItem(id);
  const story = mapItemToStory(item);

  if (!story) {
    return <MissingStory rank={rank} />;
  }

  return <Story rank={rank} story={story} />;
}

export default async function Stories({ page, storyType }: StoriesProps) {
  const storyPage = await fetchStoryPage(storyType, page);

  return (
    <section className={styles.wrapper}>
      <div className={styles.list}>
        {storyPage.ids.map((id, offset) => {
          const rank = (storyPage.page - 1) * storyPage.pageSize + offset + 1;

          return (
            <Suspense fallback={<StoryRowFallback rank={rank} />} key={id}>
              <StoryRow id={id} rank={rank} />
            </Suspense>
          );
        })}
      </div>
      <Pagination currentPage={storyPage.page} storyType={storyType} totalPages={storyPage.totalPages} />
    </section>
  );
}
