import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { getAllCategories } from '@database/queries/CategoryQueries';
import {
  getLibraryNovels,
  getNovelsInLibrary,
} from '@database/queries/LibraryQueries';

import { Category, ExtendedNovel, Novel } from '@database/types';

import { useLibrarySettings } from '@hooks/useSettings';
import { LibrarySortOrder } from '../constants/constants';

type Library = Category & { novels: ExtendedNovel[] };

export const useLibrary = ({ searchText }: { searchText?: string }) => {
  const {
    filter,
    sortOrder = LibrarySortOrder.DateAdded_DESC,
    downloadedOnlyMode = false,
  } = useLibrarySettings();

  const [library, setLibrary] = useState<Library[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const getLibrary = async () => {
    if (searchText) {
      setIsLoading(true);
    }

    const [categories, novels] = await Promise.all([
      getAllCategories(),
      getLibraryNovels({
        searchText,
        filter,
        sortOrder,
        downloadedOnlyMode,
      }),
    ]);
    const res = categories.map(category => ({
      ...category,
      novels: novels.filter(novel =>
        novel.categories.find(e => e.id === category.id),
      ),
    }));
    setLibrary(res);
    setIsLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      getLibrary();
    }, [searchText, filter, sortOrder, downloadedOnlyMode]),
  );

  return { library, isLoading, refetchLibrary: getLibrary };
};

export const useLibraryNovels = () => {
  const [library, setLibrary] = useState<Novel[]>([]);

  const getLibrary = async () => {
    const novels = await getNovelsInLibrary();
    setLibrary(novels);
  };

  useFocusEffect(
    useCallback(() => {
      getLibrary();
    }, []),
  );

  return { library, setLibrary };
};
