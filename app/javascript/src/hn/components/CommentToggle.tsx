import React from "react";

import * as styles from "./Comment.module.css";

interface CommentToggleProps {
  children: React.ReactNode;
  className?: string;
  collapsedCount?: number;
}

export default function CommentToggle({
  children,
  className,
  collapsedCount = 1,
}: CommentToggleProps) {
  const collapsedLabel = `[+${Math.max(collapsedCount, 1)}]`;

  return (
    <details className={styles.toggleDetails} open>
      <summary className={className}>
        <span className={styles.expandedLabel}>[-]</span>
        <span className={styles.collapsedLabel}>{collapsedLabel}</span>
      </summary>
      <div className={styles.toggleContent}>{children}</div>
    </details>
  );
}
