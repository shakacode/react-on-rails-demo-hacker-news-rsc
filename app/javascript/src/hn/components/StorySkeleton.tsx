import React from "react";

import * as styles from "./StorySkeleton.module.css";

export default function StorySkeleton() {
  return (
    <div className={styles.skeleton} aria-hidden="true">
      <div className={styles.title} />
      <div className={styles.meta} />
    </div>
  );
}
