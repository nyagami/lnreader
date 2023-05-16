import { LibraryFilter } from '@screens/library/constants/constants';
import * as SQLite from 'expo-sqlite';
import { ExtendedNovel, Novel } from '../types';
import { txnErrorCallback } from '../utils/helpers';
import { fetchEagerLibraryNovel } from '.';

const db = SQLite.openDatabase('lnreader.db');

export const getNovelsWithCategory = (
  categoryId: number,
  onlyOngoingNovels?: boolean,
): Promise<Novel[]> => {
  let query = `
    SELECT
    * 
    FROM Novel
    JOIN (
        SELECT novelId 
            FROM NovelCategory WHERE categoryId = ?
      ) as NC
    ON Novel.id = NC.novelId
  `;
  if (onlyOngoingNovels) {
    query += " AND status NOT LIKE 'Completed'";
  }

  return new Promise(resolve =>
    db.transaction(tx => {
      tx.executeSql(
        query,
        [categoryId],
        (txObj, { rows }) => resolve((rows as any)._array),
        txnErrorCallback,
      );
    }),
  );
};

export const getNovelsInLibrary = (
  onlyOngoingNovels?: boolean,
): Promise<Novel[]> => {
  let getLibraryNovelsQuery = 'SELECT * FROM Novel WHERE inLibrary = 1';

  if (onlyOngoingNovels) {
    getLibraryNovelsQuery += " AND status NOT LIKE 'Completed'";
  }

  return new Promise(resolve =>
    db.transaction(tx => {
      tx.executeSql(
        getLibraryNovelsQuery,
        [],
        (txObj, { rows }) => resolve((rows as any)._array),
        txnErrorCallback,
      );
    }),
  );
};

export const getLibraryNovels = ({
  filter,
  searchText,
  sortOrder,
  downloadedOnlyMode,
}: {
  sortOrder?: string;
  filter?: string;
  searchText?: string;
  downloadedOnlyMode?: boolean;
}): Promise<ExtendedNovel[]> => {
  let query = `
    SELECT 
      Novel.*, chaptersUnread, chaptersDownloaded, lastReadAt, lastUpdatedAt
    FROM Novel
    JOIN 
    (
      SELECT 
        SUM(unread) as chaptersUnread, SUM(isDownloaded) as chaptersDownloaded, 
        novelId, MAX(readTime) as lastReadAt, MAX(updatedTime) as lastUpdatedAt
      FROM Chapter
      GROUP BY novelId
    ) as C ON Novel.id = C.novelId

  `;

  if (filter) {
    query += ` AND ${filter} `;
  }
  if (downloadedOnlyMode) {
    query += ' ' + LibraryFilter.DownloadedOnly;
  }

  if (searchText) {
    query += ` AND name LIKE '%${searchText}%' `;
  }

  if (sortOrder) {
    query += ` ORDER BY ${sortOrder} `;
  }

  return new Promise(resolve =>
    db.transaction(tx => {
      tx.executeSql(
        query,
        [],
        (txObj, { rows }) => {
          Promise.all(
            rows._array.map(novel => fetchEagerLibraryNovel(novel)),
          ).then(res => resolve(res as ExtendedNovel[]));
        },
        txnErrorCallback,
      );
    }),
  );
};
