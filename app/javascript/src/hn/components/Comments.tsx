import React, { Suspense } from "react";

import {
  mapItemToComment,
  type CommentViewModel,
} from "../../hn/lib/mappers";
import { fetchItem } from "../../hn/lib/server";

import Comment from "./Comment";
import CommentSkeleton from "./CommentSkeleton";
import * as styles from "./Comments.module.css";

async function fetchCommentTree(commentId: number): Promise<CommentViewModel | null> {
  const item = await fetchItem(commentId);

  if (!item) {
    return null;
  }

  const children = (
    await Promise.all((item.kids ?? []).map((childId) => fetchCommentTree(childId)))
  ).filter((comment): comment is CommentViewModel => comment !== null);

  return mapItemToComment(item, children);
}

async function CommentThread({ commentId }: { commentId: number }) {
  const comment = await fetchCommentTree(commentId);

  if (!comment) {
    return null;
  }

  return <Comment comment={comment} />;
}

interface CommentsProps {
  commentIds: number[];
  emptyMessage?: string;
}

export default function Comments({
  commentIds,
  emptyMessage = "No comments yet.",
}: CommentsProps) {
  if (commentIds.length === 0) {
    return <p className={styles.empty}>{emptyMessage}</p>;
  }

  return (
    <section className={styles.comments}>
      {commentIds.map((commentId) => (
        <Suspense fallback={<CommentSkeleton />} key={commentId}>
          <CommentThread commentId={commentId} />
        </Suspense>
      ))}
    </section>
  );
}
