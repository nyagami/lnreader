import * as SQLite from 'expo-sqlite';
import { Chapter, ExtendedChapter, ExtendedNovel } from '@database/types';
import { txnErrorCallback } from '@database/utils/helpers';

const db = SQLite.openDatabase('lnreader.db');

export const fetchEagerLibraryNovel = (
  novel: ExtendedNovel,
): Promise<ExtendedNovel> => {
  const query = `
        SELECT C.* FROM Category as C
        JOIN NovelCategory as NC
        ON C.id = NC.categoryId
        AND NC.novelId = ?
    `;
  return new Promise(resolve => {
    db.transaction(tx => {
      tx.executeSql(query, [novel.id], (txObj, { rows }) => {
        novel.categories = rows._array;
        resolve(novel);
      });
    });
  });
};

export const fetchEagerChapter = (
  chapter: Chapter,
): Promise<ExtendedChapter> => {
  return new Promise(resolve => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM Novel WHERE id = ?',
        [chapter.novelId],
        (txObj, { rows }) =>
          resolve({ ...chapter, novel: rows.item(0) } as ExtendedChapter),
        txnErrorCallback,
      );
    });
  });
};
