import React from "react";

import * as styles from "./CommentSkeleton.module.css";

export default function CommentSkeleton() {
  return (
    <div className={styles.skeleton} aria-hidden="true">
      <div className={styles.meta} />
      <div className={styles.body} />
      <div className={styles.child} />
    </div>
  );
}
