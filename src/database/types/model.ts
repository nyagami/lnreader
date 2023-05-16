import { NovelStatus } from '@plugins/types';

export interface Category {
  id: number;
  name: string;
  sort: number;
}

export interface Novel {
  id: number;
  url: string;
  pluginId: string;
  categories: Category[];
  name: string;
  cover?: string;
  summary?: string;
  author?: string;
  artist?: string;
  status?: NovelStatus;
  genres?: string;
  inLibrary: number;
}

export interface Chapter {
  id: number;
  novel: Novel;
  url: string;
  name: string;
  releaseTime?: string;
  readTime: string;
  bookmark: number;
  unread: number;
  isDownloaded: number;
}

export interface DownloadedChapter {
  id: number;
  chapter: Chapter;
  chapterText: string;
}

export interface History {
  chapter: Chapter;
  novel: Novel;
}

export interface LibraryStats {
  novelsCount?: number;
  chaptersCount?: number;
  chaptersRead?: number;
  chaptersUnread?: number;
  chaptersDownloaded?: number;
  sourcesCount?: number;
  genres?: Record<string, number>;
  status?: Record<string, number>;
}
