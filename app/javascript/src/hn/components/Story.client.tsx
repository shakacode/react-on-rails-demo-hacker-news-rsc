"use client";

import React from "react";

import type { StoryViewModel } from "../../hn/lib/mappers";

import { pluralize, timeAgo } from "./formatting";
import * as styles from "./Story.module.css";

interface StoryProps {
  rank: number;
  story: StoryViewModel;
}

export default function Story({ rank, story }: StoryProps) {
  return (
    <article className={styles.story}>
      <span className={styles.rank}>{rank}.</span>
      <div className={styles.content}>
        <h2 className={styles.title}>
          <button
            className={styles.vote}
            type="button"
          >
            ▲
          </button>
          {story.url ? (
            <a href={story.url} rel="noopener noreferrer nofollow" target="_blank">
              {story.title}
            </a>
          ) : (
            <a href={`/item/${story.id}`}>{story.title}</a>
          )}
          {story.domain && (
            <span className={styles.domain}>
              {" "}
              (<a href={`https://${story.domain}`}>{story.domain}</a>)
            </span>
          )}
        </h2>
        <p className={styles.meta}>
          {story.score} {pluralize(story.score, "point")} by{" "}
          <a href={`/user/${story.userId}`}>{story.userId}</a>{" "}
          <a href={`/item/${story.id}`} suppressHydrationWarning>
            {timeAgo(story.timeMs)} ago
          </a>{" "}
          | <a href={`/item/${story.id}`}>{story.commentCount} {pluralize(story.commentCount, "comment")}</a>
        </p>
      </div>
    </article>
  );
}
