import React, { useEffect, useState } from "react";
import {
    StyleSheet,
    View,
    Text,
    FlatList,
    ActivityIndicator,
} from "react-native";
import { ProgressBar } from "react-native-paper";
import { useLibrary, useTheme } from "../../../hooks/reduxHooks";
import { useSelector } from "react-redux";

import EmptyView from "../../../components/EmptyView";
import MigrationNovelList from "./MigrationNovelList";
import { Appbar } from "../../../components/Appbar";

import { showToast } from "../../../hooks/showToast";
import { migrateNovel } from "../../../database/queries/NovelQueries";
import { ScreenContainer } from "../../../components/Common";
import { getSource } from "../../../sources/sources";

const MigrationNovels = ({ navigation, route }) => {
    const { sourceId, novelName } = route.params;
    const theme = useTheme();

    const [progress, setProgress] = useState(0);
    const [loading, setLoading] = useState(false);
    const [searchResults, setSearchResults] = useState("");
    const { sources, pinned } = useSelector((state) => state.sourceReducer);

    const library = useLibrary();

    const pinnedSources = sources.filter(
        (source) =>
            pinned.indexOf(source.sourceId) !== -1 &&
            source.sourceId !== sourceId
    );

    const getSearchResults = () => {
        pinnedSources.map((item, index) =>
            setTimeout(async () => {
                try {
                    setLoading(true);

                    const source = getSource(item.sourceId);
                    const data = await source.searchNovels(novelName);

                    setSearchResults((searchResults) => [
                        ...searchResults,
                        {
                            sourceId: item.sourceId,
                            sourceName: item.sourceName,
                            sourceLanguage: item.sourceLanguage,
                            novels: data,
                        },
                    ]);
                    setLoading(false);
                } catch (error) {
                    showToast(error.message);

                    setSearchResults((searchResults) => [
                        ...searchResults,
                        {
                            sourceId: item.sourceId,
                            sourceName: item.sourceName,
                            sourceLanguage: item.sourceLanguage,
                            novels: [],
                        },
                    ]);
                    setLoading(false);
                }
            }, 1000 * index)
        );
    };

    useEffect(() => {
        getSearchResults();
    }, []);

    const renderItem = ({ item }) => (
        <>
            <View style={{ padding: 8, paddingVertical: 16 }}>
                <Text style={{ color: theme.textColorPrimary }}>
                    {item.sourceName}
                </Text>
                <Text style={{ color: theme.textColorSecondary, fontSize: 12 }}>
                    {item.sourceLanguage}
                </Text>
            </View>
            <MigrationNovelList
                data={item.novels}
                theme={theme}
                library={library}
                navigation={navigation}
            />
        </>
    );

    return (
        <ScreenContainer theme={theme}>
            <Appbar
                title={novelName}
                onBackAction={() => navigation.goBack()}
            />
            {progress < 1 && pinned && (
                <ProgressBar color={theme.colorAccent} progress={progress} />
            )}
            <FlatList
                contentContainerStyle={{
                    flexGrow: 1,
                    padding: 4,
                }}
                data={searchResults}
                keyExtractor={(item) => item.sourceId.toString()}
                renderItem={renderItem}
                extraData={pinned}
                ListEmptyComponent={
                    <>
                        {!loading && (
                            <EmptyView
                                icon="__φ(．．)"
                                description={`Search a novel in your pinned sources ${
                                    pinned.length === 0
                                        ? "(No sources pinned)"
                                        : ""
                                }`}
                            />
                        )}
                    </>
                }
                ListFooterComponent={
                    loading && (
                        <View
                            style={{
                                flex: 1,
                                justifyContent: "center",
                                padding: 16,
                            }}
                        >
                            <ActivityIndicator
                                size="large"
                                color={theme.colorAccent}
                            />
                        </View>
                    )
                }
            />
        </ScreenContainer>
    );
};

export default MigrationNovels;

const styles = StyleSheet.create({});