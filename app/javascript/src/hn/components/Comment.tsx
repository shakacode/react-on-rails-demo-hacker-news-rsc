import React from "react";

import type { CommentViewModel } from "../../hn/lib/mappers";

import { pluralize, timeAgo } from "./formatting";
import CommentToggle from "./CommentToggle";
import * as styles from "./Comment.module.css";

interface CommentProps {
  comment: CommentViewModel;
  depth?: number;
}

export default function Comment({ comment, depth = 0 }: CommentProps) {
  const isDeleted = comment.isDeleted || !comment.userId;
  const hasChildren = comment.children.length > 0;
  const hasVisibleBody = Boolean(comment.text) || hasChildren;

  return (
    <article
      className={depth === 0 ? `${styles.comment} ${styles.root}` : styles.comment}
      style={{ marginLeft: depth === 0 ? 0 : `${Math.min(depth, 6) * 18}px` }}
    >
      <div className={styles.meta}>
        {isDeleted ? (
          <span className={styles.deletedUser}>[deleted]</span>
        ) : (
          <a className={styles.author} href={`/user/${comment.userId}`}>
            {comment.userId}
          </a>
        )}

        {comment.timeMs > 0 && (
          <span suppressHydrationWarning>{timeAgo(comment.timeMs)} ago</span>
        )}

        {comment.descendantCount > 0 && (
          <span className={styles.replyCount}>
            {comment.descendantCount} {pluralize(comment.descendantCount, "reply")}
          </span>
        )}
      </div>

      {hasVisibleBody ? (
        <CommentToggle
          className={styles.toggle}
          collapsedCount={comment.descendantCount + 1}
        >
          {comment.text ? (
            <div
              className={styles.text}
              dangerouslySetInnerHTML={{ __html: comment.text }}
            />
          ) : (
            <p className={styles.deletedText}>Comment removed.</p>
          )}

          {hasChildren && (
            <div className={styles.children}>
              {comment.children.map((child) => (
                <Comment comment={child} depth={depth + 1} key={child.id} />
              ))}
            </div>
          )}
        </CommentToggle>
      ) : (
        <p className={styles.deletedText}>Comment removed.</p>
      )}
    </article>
  );
}
