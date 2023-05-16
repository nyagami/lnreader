import * as SQLite from 'expo-sqlite';
import { ExtendedNovel } from '@database/types';

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
