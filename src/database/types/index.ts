import { NovelItem } from '@plugins/types';

export interface Category {
  id: number;
  name: string;
  sort: number;
}

export interface Novel extends NovelItem {
  id: number;
  pluginId: string;
  inLibrary: number;
}

export interface ExtendedNovel extends Novel {
  categories: Category[];
  chaptersUnread: number;
  chaptersDownloaded: number;
}

export interface ChapterInfo {
  id: number;
  novelId: number;
  url: string;
  name: string;
  releaseTime?: string;
  readTime: string;
  bookmark: number;
  unread: number;
  isDownloaded: number;

  // download screen need this :)
  pluginId: string;
  novelName: string;
  novelUrl: string;

  // migrate need this :)
  number: number;
}

export interface DownloadedChapter {
  id: number; // chapterId
  novelId: number;
  pluginId: string;
}

export interface History {
  id: number; // chapterId xD
  pluginId: string;
  novelId: number;
  novelName: string;
  novelUrl: string;
  novelCover: string;
  chapterName: string;
  chapterUrl: string;
  readTime: string;
  bookmark: number;
}

export interface Update {
  id: number; // chapterId
  pluginId: string;
  novelId: number;
  novelName: string;
  novelUrl: string;
  novelCover: string;
  name: string; //  chapterName
  url: string; //  chapterUrl
  updatedTime: string;
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
