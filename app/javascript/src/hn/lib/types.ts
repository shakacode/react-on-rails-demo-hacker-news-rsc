export type HNStoryType = "top" | "new" | "best" | "ask" | "show" | "job";

export type HNItemType = "job" | "story" | "comment" | "poll" | "pollopt";

export interface HNItem {
  id: number;
  deleted?: boolean;
  type?: HNItemType;
  by?: string;
  time?: number;
  text?: string;
  dead?: boolean;
  parent?: number;
  poll?: number;
  kids?: number[];
  url?: string;
  score?: number;
  title?: string;
  parts?: number[];
  descendants?: number;
}

export interface HNUser {
  id: string;
  created: number;
  karma: number;
  about?: string;
  submitted?: number[];
  delay?: number;
}

export interface HNStoryPage {
  storyType: HNStoryType;
  page: number;
  pageSize: number;
  totalIds: number;
  totalPages: number;
  ids: number[];
}
