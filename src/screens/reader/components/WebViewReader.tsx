import { FC, useEffect, useMemo } from 'react';
import {
  Dimensions,
  NativeEventEmitter,
  NativeModules,
  StatusBar,
} from 'react-native';
import WebView, { WebViewNavigation } from 'react-native-webview';
import color from 'color';

import { useTheme } from '@hooks/persisted';
import { ChapterInfo } from '@database/types';
import { getString } from '@strings/translations';

import { getPlugin } from '@plugins/pluginManager';
import { MMKVStorage, getMMKVObject } from '@utils/mmkv/mmkv';
import {
  CHAPTER_GENERAL_SETTINGS,
  CHAPTER_READER_SETTINGS,
  ChapterGeneralSettings,
  ChapterReaderSettings,
  initialChapterGeneralSettings,
  initialChapterReaderSettings,
} from '@hooks/persisted/useSettings';
import { getBatteryLevelSync } from 'react-native-device-info';
import * as Speech from 'expo-speech';
import * as Clipboard from 'expo-clipboard';
import { showToast } from '@utils/showToast';

type WebViewPostEvent = {
  type: string;
  data?: { [key: string]: string | number };
};

type WebViewReaderProps = {
  data: {
    novel: {
      pluginId: string;
    };
    chapter: ChapterInfo;
  };
  html: string;
  nextChapter: ChapterInfo;
  webViewRef: React.RefObject<WebView>;
  saveProgress(percentage: number): void;
  onPress(): void;
  onLayout(): void;
  navigateToChapterBySwipe(name: string): void;
  onWebViewNavigationStateChange({ url }: WebViewNavigation): void;
  readerPages: boolean;
};

const WebViewReader: FC<WebViewReaderProps> = props => {
  const {
    data,
    html,
    nextChapter,
    webViewRef,
    readerPages,
    saveProgress,
    onPress,
    onLayout,
    navigateToChapterBySwipe,
    onWebViewNavigationStateChange,
  } = props;
  const assetsUriPrefix = useMemo(
    () => (__DEV__ ? 'http://localhost:8081/assets' : 'file:///android_asset'),
    [],
  );
  const { RNDeviceInfo } = NativeModules;
  const deviceInfoEmitter = new NativeEventEmitter(RNDeviceInfo);
  const theme = useTheme();
  const { novel, chapter } = data;
  const readerSettings = useMemo(
    () =>
      getMMKVObject<ChapterReaderSettings>(CHAPTER_READER_SETTINGS) ||
      initialChapterReaderSettings,
    [],
  );
  const {
    showScrollPercentage,
    swipeGestures,
    showBatteryAndTime,
    verticalSeekbar,
    bionicReading,
  } = useMemo(
    () =>
      getMMKVObject<ChapterGeneralSettings>(CHAPTER_GENERAL_SETTINGS) ||
      initialChapterGeneralSettings,
    [],
  );
  const batteryLevel = useMemo(getBatteryLevelSync, []);
  const layoutHeight = Dimensions.get('window').height;
  const plugin = getPlugin(novel?.pluginId);

  useEffect(() => {
    const mmkvListener = MMKVStorage.addOnValueChangedListener(key => {
      switch (key) {
        case CHAPTER_READER_SETTINGS:
          webViewRef.current?.injectJavaScript(
            `reader.updateReaderSettings(${MMKVStorage.getString(
              CHAPTER_READER_SETTINGS,
            )})`,
          );
          break;
        case CHAPTER_GENERAL_SETTINGS:
          webViewRef.current?.injectJavaScript(
            `reader.updateGeneralSettings(${MMKVStorage.getString(
              CHAPTER_GENERAL_SETTINGS,
            )})`,
          );
          break;
      }
    });

    const subscription = deviceInfoEmitter.addListener(
      'RNDeviceInfo_batteryLevelDidChange',
      (level: number) => {
        webViewRef.current?.injectJavaScript(
          `reader.updateBatteryLevel(${level})`,
        );
      },
    );

    return () => {
      subscription.remove();
      mmkvListener.remove();
    };
  });
  const debugging = `
     // Debug
     console = new Object();
     console.log = function(log) {
      reader.post({"type": "console", "msg": log});
     };
     console.debug = console.log;
     console.info = console.log;
     console.warn = console.log;
     console.error = console.log;
     `;
  //@ts-ignore
  const onMessage = payload => {
    let dataPayload;
    try {
      dataPayload = JSON.parse(payload.nativeEvent.data);
    } catch (e) {}

    if (dataPayload) {
      if (dataPayload.type === 'console') {
        console.info(`[Console] ${JSON.stringify(dataPayload.msg, null, 2)}`);
      } else if (false) {
        if (dataPayload.type !== 'save') console.log(dataPayload);
      }
    }
  };

  return (
    <WebView
      injectedJavaScript={debugging}
      ref={webViewRef}
      style={{ backgroundColor: readerSettings.theme }}
      allowFileAccess={true}
      originWhitelist={['*']}
      scalesPageToFit={true}
      showsVerticalScrollIndicator={false}
      onNavigationStateChange={onWebViewNavigationStateChange}
      javaScriptEnabled={true}
      onLayout={async () => onLayout()}
      onMessage={ev => {
        __DEV__ && onMessage(ev);
        const event: WebViewPostEvent = JSON.parse(ev.nativeEvent.data);
        switch (event.type) {
          case 'hide':
            onPress();
            break;
          case 'next':
            navigateToChapterBySwipe('SWIPE_LEFT');
            break;
          case 'prev':
            navigateToChapterBySwipe('SWIPE_RIGHT');
            break;
          case 'error-img':
            if (event.data && typeof event.data === 'string') {
              plugin?.fetchImage(event.data).then(base64 => {
                webViewRef.current?.injectJavaScript(
                  `document.querySelector("img[error-src='${event.data}']").src="data:image/jpg;base64,${base64}"`,
                );
              });
            }
            break;
          case 'save':
            if (event.data && typeof event.data === 'number') {
              saveProgress(event.data);
            }
            break;
          case 'speak':
            if (event.data && typeof event.data === 'string') {
              Speech.speak(event.data, {
                onDone() {
                  webViewRef.current?.injectJavaScript('tts.next?.()');
                },
              });
            }
            break;
          case 'stop-speak':
            Speech.stop();
            break;
          case 'copy':
            if (event.data && typeof event.data === 'string') {
              Clipboard.setStringAsync(event.data).then(() => {
                showToast(getString('common.copiedToClipboard', { name: '' }));
              });
            }
            break;
        }
      }}
      source={{
        html: `
                <html>
                  <head>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
                    <style>
                    :root {
                      --StatusBar-currentHeight: ${StatusBar.currentHeight};
                      --readerSettings-theme: ${readerSettings.theme};
                      --readerSettings-padding: ${2 * readerSettings.padding}%;
                      --readerSettings-textSize: ${readerSettings.textSize}px;
                      --readerSettings-textColor: ${readerSettings.textColor};
                      --readerSettings-textAlign: ${readerSettings.textAlign};
                      --readerSettings-lineHeight: ${readerSettings.lineHeight};
                      --readerSettings-fontFamily: ${readerSettings.fontFamily};
                      --theme-primary: ${theme.primary};
                      --theme-onPrimary: ${theme.onPrimary};
                      --theme-secondary: ${theme.secondary};
                      --theme-tertiary: ${theme.tertiary};
                      --theme-onTertiary: ${theme.onTertiary};
                      --theme-onSecondary: ${theme.onSecondary};
                      --theme-surface: ${theme.surface};
                      --theme-surface-0-9: ${color(theme.surface)
                        .alpha(0.9)
                        .toString()};
                      --theme-onSurface: ${theme.onSurface};
                      --theme-surfaceVariant: ${theme.surfaceVariant};
                      --theme-onSurfaceVariant: ${theme.onSurfaceVariant};
                      --theme-outline: ${theme.outline};
                      --theme-rippleColor: ${theme.rippleColor};
                      --chapterCtn-height: ${layoutHeight - 140};
                      ${
                        readerPages &&
                        `
                          * {touch-action:none;}
                          body {
                            overflow: hidden;
                            position: relative;
                          }
                          #left,
                          #right, #middle {
                            position: absolute;
                            height: 100%;
                            width: 35%;
                            top: 0;
                            z-index: 2000
                          }
                          #middle {
                            left: 35%;
                            width: 30%;
                          }
                          #left {
                            left: 0;
                          }
                          #right {
                            right: 0;
                          }
                          #infoContainer {
                            position: absolute;
                            z-index: 1000;
                            bottom: 40;
                            width: calc(100% - 2*${readerSettings.padding}%)
                          }
                          .nextButton{
                            position: relative;
                            z-index: 100000 !important
                          }
                          chapter {
                            height: 100%;
                            display: flexbox;
                            flex-direction: column;
                            flex-wrap: wrap;
                            column-gap: 0;
                            column-width: 100vw; 
                            transition: 200ms;
                          }
                          .hide {
                            transform: translate(110%);
                            transition: 200ms
                          }
                          .show {
                            transform: translate(0%);
                          }
                          `
                      }
                      }
                      @font-face {
                        font-family: ${readerSettings.fontFamily};
                        src: url("file:///android_asset/fonts/${
                          readerSettings.fontFamily
                        }.ttf");
                      }
                    </style>
                    <link rel="stylesheet" href="${assetsUriPrefix}/css/index.css">
                    <style>${readerSettings.customCSS}</style>
                    <script async>
                      var initSettings = {
                        showScrollPercentage: ${showScrollPercentage},
                        swipeGestures: ${swipeGestures},
                        showBatteryAndTime: ${showBatteryAndTime},
                        verticalSeekbar: ${verticalSeekbar},
                        bionicReading: ${bionicReading},
                      }
                      var batteryLevel = ${batteryLevel};
                      var autoSaveInterval = 2222;
                    </script>
                  </head>
                  <body'>
                    <div class="chapterCtn"> 
                      <chapter 
                        data-page=0
                        data-pages=0
                        data-page-reader='${readerPages}'
                        data-plugin-id='${novel.pluginId}'
                        data-novel-id='${chapter.novelId}'
                        data-chapter-id='${chapter.id}'
                      >
                        ${html}
                      </chapter>
                      <div class="hidden" id="ToolWrapper">
                          <div id="TTS-Controller"></div>
                          <div id="ScrollBar"></div>
                      </div>
                      <div id="Image-Modal">
                        <img id="Image-Modal-img">
                      </div>
                      <div id="reader-footer-wrapper">
                          <div id="reader-footer">
                              <div id="reader-battery" class="reader-footer-item"></div>
                              <div id="reader-percentage" class="reader-footer-item"></div>
                              <div id="reader-time" class="reader-footer-item"></div>
                          </div>
                      </div>
                    </div>
                    ${
                      !readerPages
                        ? `
                    <div class="infoText">
                      ${getString(
                        'readerScreen.finished',
                      )}: ${chapter.name.trim()}
                    </div>
                    ${
                      nextChapter
                        ? `<button class="nextButton" onclick="reader.post({type:'next'})">
                            ${getString('readerScreen.nextChapter', {
                              name: nextChapter.name,
                            })}
                          </button>`
                        : `<div class="infoText">
                          ${getString('readerScreen.noNextChapter')}
                        </div>`
                    }`
                        : ''
                    }
                    </body>
                    <script>
                        // Debug
                        console = new Object();
                        console.log = function(log) {
                         reader.post({"type": "console", "msg": log});
                        };
                        console.debug = console.log;
                        console.info = console.log;
                        console.warn = console.log;
                        console.error = console.log;
                    </script>
                    <script src="${assetsUriPrefix}/js/text-vibe.js"></script>
                    <script src="${assetsUriPrefix}/js/index.js"></script>
                    <script src="${assetsUriPrefix}/js/horizontalScroll.js"></script>
                    <script defer>
                        console.log(toolWrapper.tools)
                    </script>
                    <script>
                    document.querySelector(".chapterCtn").addEventListener("click", ${
                      !readerPages
                        ? '() => reader.post({ type: "hide" })'
                        : 'tapChapter'
                    });
                      async function fn(){
                                         
                          ${readerSettings.customJS}
                        // scroll to saved position
                        reader.refresh();
                        window.scrollTo({
                          top: reader.chapterHeight * ${
                            chapter.progress
                          } / 100 - reader.layoutHeight,
                          behavior: 'smooth',
                        });
                      }
                      document.addEventListener("DOMContentLoaded", fn);
                    </script>
                </html>
                `,
      }}
    />
  );
};

export default WebViewReader;
