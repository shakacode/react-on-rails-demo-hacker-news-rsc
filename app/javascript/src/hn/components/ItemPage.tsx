import React, { Suspense } from "react";

import { mapItemToComment, mapItemToStory } from "../../hn/lib/mappers";
import { fetchItem } from "../../hn/lib/server";

import Comments from "./Comments";
import CommentSkeleton from "./CommentSkeleton";
import { formatAbsoluteDate, pluralize, timeAgo } from "./formatting";
import * as styles from "./ItemPage.module.css";

interface ItemPageProps {
  itemId: number;
}

function CommentsFallback() {
  return (
    <div className={styles.commentsFallback}>
      <CommentSkeleton />
      <CommentSkeleton />
      <CommentSkeleton />
    </div>
  );
}

export default async function ItemPage({ itemId }: ItemPageProps) {
  const item = await fetchItem(itemId);

  if (!item || item.deleted || item.dead) {
    return (
      <article className={styles.item}>
        <h1 className={styles.title}>Item not found</h1>
        <p>The requested item does not exist or is unavailable.</p>
      </article>
    );
  }

  const story = mapItemToStory(item);
  const comment = mapItemToComment(item);

  if (!story && !comment) {
    return (
      <article className={styles.item}>
        <h1 className={styles.title}>Item not found</h1>
        <p>The requested item does not exist or is unavailable.</p>
      </article>
    );
  }

  if (story) {
    return (
      <article className={styles.item}>
        <h1 className={styles.title}>
          {story.url ? (
            <a href={story.url} rel="noopener noreferrer nofollow" target="_blank">
              {story.title}
            </a>
          ) : (
            story.title
          )}
        </h1>
        <p className={styles.meta}>
          {story.score} {pluralize(story.score, "point")} by <a href={`/user/${story.userId}`}>{story.userId}</a>{" "}
          <span suppressHydrationWarning>{timeAgo(story.timeMs)} ago</span> ({formatAbsoluteDate(story.timeMs)})
        </p>
        {story.text && (
          <div
            className={styles.storyText}
            dangerouslySetInnerHTML={{ __html: story.text }}
          />
        )}

        <section className={styles.commentsSection}>
          <h2 className={styles.commentsHeading}>
            {story.commentCount} {pluralize(story.commentCount, "comment")}
          </h2>
          <Suspense fallback={<CommentsFallback />}>
            <Comments commentIds={item.kids ?? []} />
          </Suspense>
        </section>
      </article>
    );
  }

  if (!comment) {
    return (
      <article className={styles.item}>
        <h1 className={styles.title}>Comment not found</h1>
        <p>The requested comment does not exist or is unavailable.</p>
      </article>
    );
  }

  return (
    <article className={styles.item}>
      <h1 className={styles.title}>Comment</h1>
      <p className={styles.meta}>
        by{" "}
        {comment.userId ? (
          <a href={`/user/${comment.userId}`}>{comment.userId}</a>
        ) : (
          <span>[deleted]</span>
        )}{" "}
        {comment.timeMs > 0 && (
          <span suppressHydrationWarning>{timeAgo(comment.timeMs)} ago</span>
        )}
      </p>
      <div
        className={styles.comment}
        dangerouslySetInnerHTML={{ __html: comment.text }}
      />
      <section className={styles.commentsSection}>
        <h2 className={styles.commentsHeading}>
          {comment.descendantCount} {pluralize(comment.descendantCount, "reply")}
        </h2>
        <Suspense fallback={<CommentsFallback />}>
          <Comments commentIds={item.kids ?? []} emptyMessage="No replies yet." />
        </Suspense>
      </section>
    </article>
  );
}
