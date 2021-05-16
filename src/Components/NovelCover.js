import React from "react";
import { StyleSheet, View, Text, ImageBackground, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { TouchableRipple } from "react-native-paper";

import { useSelector } from "react-redux";
import { useSettings, useTheme } from "../Hooks/reduxHooks";
import ListView from "./ListView";

const NovelCover = ({ item, onPress, libraryStatus }) => {
    const theme = useTheme();
    const { displayMode, novelsPerRow } = useSettings();

    const height = {
        1: 550,
        2: 280,
        3: 180,
        4: 140,
        5: 100,
    };

    const comfortableTitle = () =>
        displayMode === 1 && (
            <Text
                numberOfLines={2}
                style={[
                    styles.title,
                    {
                        color: theme.textColorPrimary,
                        padding: 4,
                    },
                ]}
            >
                {item.novelName}
            </Text>
        );

    const compactTitle = () =>
        displayMode === 0 && (
            <View style={styles.titleContainer}>
                <LinearGradient
                    colors={["transparent", "rgba(0,0,0,0.6)"]}
                    style={styles.linearGradient}
                >
                    <Text
                        numberOfLines={2}
                        style={[styles.title, { color: "rgba(255,255,255,1)" }]}
                    >
                        {item.novelName}
                    </Text>
                </LinearGradient>
            </View>
        );

    const unreadBadge = () =>
        item.chaptersUnread && (
            <Text
                style={[
                    styles.unreadBadge,
                    !item.chaptersDownloaded && {
                        borderTopLeftRadius: 4,
                        borderBottomLeftRadius: 4,
                    },
                ]}
            >
                {item.chaptersUnread}
            </Text>
        );

    const downloadBadge = () =>
        item.chaptersDownloaded && (
            <Text
                style={[
                    styles.downloadBadge,
                    !item.chaptersUnread && {
                        borderTopRightRadius: 4,
                        borderBottomRightRadius: 4,
                    },
                ]}
            >
                {item.chaptersDownloaded}
            </Text>
        );

    return displayMode !== 2 ? (
        <View style={{ flex: 1 / novelsPerRow }}>
            <TouchableRipple
                borderless
                centered
                rippleColor={theme.rippleColor}
                style={styles.opac}
                onPress={onPress}
            >
                <>
                    <ImageBackground
                        source={{ uri: item.novelCover }}
                        style={{ height: height[novelsPerRow] }}
                        imageStyle={[
                            { borderRadius: 4 },
                            libraryStatus && { opacity: 0.5 },
                        ]}
                        progressiveRenderingEnabled={true}
                    >
                        <View style={{ flexDirection: "row", margin: 4 }}>
                            {downloadBadge()}
                            {unreadBadge()}
                        </View>
                        {compactTitle()}
                    </ImageBackground>
                    {comfortableTitle()}
                </>
            </TouchableRipple>
        </View>
    ) : (
        <ListView
            item={item}
            downloadBadge={downloadBadge()}
            unreadBadge={unreadBadge()}
            theme={theme}
            onPress={onPress}
        />
    );
};

export default NovelCover;

const styles = StyleSheet.create({
    titleContainer: {
        flex: 1,
        justifyContent: "flex-end",
        borderRadius: 4,
    },
    title: {
        fontFamily: "pt-sans-bold",
        fontSize: 14,
        padding: 8,
    },
    linearGradient: {
        bottom: -1,
        borderRadius: 4,
    },
    opac: {
        paddingHorizontal: 4.5,
        paddingVertical: 4,
        borderRadius: 4,
    },
    extensionIcon: {
        width: 42,
        height: 42,
        borderRadius: 4,
    },
    listView: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 12,
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 4,
    },

    downloadBadge: {
        backgroundColor: "#47a84a",
        color: "#FFFFFF",
        borderTopLeftRadius: 4,
        borderBottomLeftRadius: 4,
        paddingTop: 2,
        paddingHorizontal: 4,
        fontSize: 12,
    },
    unreadBadge: {
        backgroundColor: "#2979FF",
        color: "#FFFFFF",
        borderTopRightRadius: 4,
        borderBottomRightRadius: 4,
        paddingTop: 2,
        paddingHorizontal: 4,
        fontSize: 12,
    },
});