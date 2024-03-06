import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { useTheme } from '@hooks/persisted';
import { getString } from '@strings/translations';

import { Appbar, ErrorScreenV2, LoadingScreenV2 } from '@components';

import { LibraryStats } from '@database/types';
import {
  getChaptersDownloadedCountFromDb,
  getChaptersReadCountFromDb,
  getChaptersTotalCountFromDb,
  getChaptersUnreadCountFromDb,
  getLibraryStatsFromDb,
  getNovelGenresFromDb,
  getNovelStatusFromDb,
} from '@database/queries/StatsQueries';
import { Row } from '@components/Common';
import { overlay } from 'react-native-paper';
import { translateNovelStatus } from '@utils/translateEnum';
import Svg, { Circle } from 'react-native-svg';

const StatsScreen = () => {
  const theme = useTheme();
  const { goBack } = useNavigation();

  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<LibraryStats>({});
  const [error, setError] = useState<any>();

  const getStats = async () => {
    try {
      const res = await Promise.all([
        getLibraryStatsFromDb(),
        getChaptersTotalCountFromDb(),
        getChaptersReadCountFromDb(),
        getChaptersUnreadCountFromDb(),
        getChaptersDownloadedCountFromDb(),
        getNovelGenresFromDb(),
        getNovelStatusFromDb(),
      ]);
      setStats(Object.assign(...res));
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getStats();
  }, []);

  const Header = (
    <Appbar
      title={getString('statsScreen.title')}
      handleGoBack={goBack}
      theme={theme}
    />
  );

  if (isLoading) {
    return (
      <>
        {Header}
        <LoadingScreenV2 theme={theme} />
      </>
    );
  }

  if (error) {
    return (
      <>
        {Header}
        <ErrorScreenV2 error={error} />
      </>
    );
  }
  const percentages = [0.4, 0.24, 0.16, 0.09, 0.04, 0.04, 0.03];
  const colors = [
    theme.primary,
    theme.secondary,
    theme.tertiary,
    theme.onSurface,
    theme.error,
    theme.inversePrimary,
    theme.outline,
  ];
  const strokeWidth = 12;
  const radius = 100;
  const perimeter = 2 * Math.PI * radius;
  const padding = 1;

  return (
    <>
      {Header}
      <ScrollView
        style={styles.screenCtn}
        contentContainerStyle={styles.contentCtn}
      >
        <Text style={[styles.header, { color: theme.onSurfaceVariant }]}>
          {getString('generalSettings')}
        </Text>
        <Row style={styles.statsRow}>
          <StatsCard
            label={getString('statsScreen.titlesInLibrary')}
            value={stats.novelsCount}
          />
          <StatsCard
            label={getString('statsScreen.readChapters')}
            value={stats.chaptersRead}
          />
          <StatsCard
            label={getString('statsScreen.totalChapters')}
            value={stats.chaptersCount}
          />
        </Row>
        <Row style={styles.statsRow}>
          <StatsCard
            label={getString('statsScreen.unreadChapters')}
            value={stats.chaptersUnread}
          />
          <StatsCard
            label={getString('statsScreen.downloadedChapters')}
            value={stats.chaptersDownloaded}
          />
        </Row>
        <Row style={styles.statsRow}>
          <StatsCard
            label={getString('statsScreen.sources')}
            value={stats.sourcesCount}
          />
        </Row>
        <Text style={[styles.header, { color: theme.onSurfaceVariant }]}>
          {getString('statsScreen.genreDistribution')}
        </Text>
        <View style={[{ alignItems: 'center', justifyContent: 'center' }]}>
          <Svg
            width={(radius + strokeWidth) * 2}
            height={(radius + strokeWidth) * 2}
            viewBox={`0 0 ${(radius + strokeWidth) * 2} ${
              (radius + strokeWidth) * 2
            }`}
            style={{ transform: [{ rotate: '-180deg' }] }}
          >
            {percentages.map((percentage, index) => {
              return (
                <Circle
                  key={percentage + '_' + index}
                  cx={radius + strokeWidth}
                  cy={radius + strokeWidth}
                  r={radius}
                  stroke={colors[index]}
                  strokeWidth={strokeWidth}
                  fill="transparent"
                  strokeDashoffset={
                    -(
                      perimeter *
                        percentages.slice(0, index).reduce((a, b) => a + b, 0) +
                      padding
                    )
                  }
                  strokeDasharray={`${
                    perimeter * percentage - padding
                  } ${perimeter}`}
                  onPress={() => {
                    console.log(colors[index]);
                  }}
                />
              );
            })}
          </Svg>
        </View>
        <Row style={[styles.statsRow, styles.genreRow]}>
          {Object.entries(stats.genres || {}).map(item => (
            <StatsCard key={item[0]} label={item[0]} value={item[1]} />
          ))}
        </Row>
        <Text style={[styles.header, { color: theme.onSurfaceVariant }]}>
          {getString('statsScreen.statusDistribution')}
        </Text>
        <Row style={[styles.statsRow, styles.genreRow]}>
          {Object.entries(stats.status || {}).map(item => (
            <StatsCard
              key={item[0]}
              label={translateNovelStatus(item[0])}
              value={item[1]}
            />
          ))}
        </Row>
      </ScrollView>
    </>
  );
};

export default StatsScreen;

export const StatsCard: React.FC<{ label: string; value?: number }> = ({
  label,
  value = 0,
}) => {
  const theme = useTheme();

  if (!label) {
    return null;
  }

  return (
    <View
      style={[
        styles.statsCardCtn,
        {
          backgroundColor: theme.isDark
            ? overlay(2, theme.surface)
            : theme.secondaryContainer,
        },
      ]}
    >
      <Text style={[styles.statsVal, { color: theme.primary }]}>{value}</Text>
      <Text style={{ color: theme.onSurface }}> {label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  statsCardCtn: {
    elevation: 1,
    margin: 4,
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsVal: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  screenCtn: {
    paddingHorizontal: 16,
  },
  contentCtn: {
    paddingBottom: 40,
  },
  statsRow: {
    marginBottom: 8,
    justifyContent: 'center',
  },
  genreRow: {
    flexWrap: 'wrap',
  },
  header: {
    paddingVertical: 16,
    fontWeight: 'bold',
  },
});
