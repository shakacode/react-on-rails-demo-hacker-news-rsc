import React from "react";

import type { HNStoryType } from "../../hn/lib/types";

import * as styles from "./Pagination.module.css";

function pageHref(page: number, storyType: HNStoryType): string {
  const query = storyType === "top" ? "" : `?type=${storyType}`;

  if (page <= 1) {
    return `/${query}`;
  }

  return `/news/${page}${query}`;
}

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  storyType: HNStoryType;
}

export default function Pagination({ currentPage, totalPages, storyType }: PaginationProps) {
  return (
    <nav className={styles.nav} aria-label="Stories pagination">
      {currentPage > 1 ? (
        <a className={styles.link} href={pageHref(currentPage - 1, storyType)}>
          ← Prev
        </a>
      ) : (
        <span className={styles.disabled}>← Prev</span>
      )}

      <span className={styles.page}>
        Page {currentPage} of {totalPages}
      </span>

      {currentPage < totalPages ? (
        <a className={styles.link} href={pageHref(currentPage + 1, storyType)}>
          More →
        </a>
      ) : (
        <span className={styles.disabled}>More →</span>
      )}
    </nav>
  );
}
