// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
import otvplayer from "./NMPWebPlayer";
import { PlatformTypes, OTTPlayerStates, DRMStates, SSMStates } from "./common/interface";
import { OTVSDK_LOGLEVEL as LOG_LEVEL } from "./../common/enums";
import { Logger } from "../Logger";
import { OTVSDKManager } from "./OTVSDKManager";

const DRM_SYSTEM: string = "customer";
const SHAKA_PLAYER: string = "shaka";

export class OTTHelper {

  public static initialiseSDKPlayer = (
    videoRootElement: HTMLElement | string,
    successCallback: Function,
    failureCallback: Function,
    licenseRetrievalCallback: Function,
    certificateRetrievalCallback: Function,
    callBackMode: boolean
  ) => {
    let logger: Logger = new Logger();
    logger.log(
      LOG_LEVEL.DEBUG,
      "OTTHelper.ts: initialiseSDKPlayer(): ",
      "initialiseSDKPlayer called"
    );

    const isSafari = OTTHelper.isCurrentPlatform(PlatformTypes.PC_SAFARI);

    let otvSdkManager = new OTVSDKManager();
    let multiKeySession = (callBackMode === true) ? otvSdkManager.multiSession : false
    /**
     * @function _getPreferredPlayer
     * @summary If platform is hbbtv then it will return shaka else null.
     */
    let _getPreferredPlayer = () => {
      logger.log(
        LOG_LEVEL.DEBUG,
        "OTTHelper.ts: _getPreferredPlayer(): _getPreferredPlayer called "
      );
      if (OTTHelper.isCurrentPlatform(PlatformTypes.TVKeyCapable)) {
        logger.log(
          LOG_LEVEL.DEBUG,
          "OTTHelper.ts: _getPreferredPlayer(): platform is TVKey Capable"
        );
        return SHAKA_PLAYER;
      } else {
        return null;
      }
    };

    /**
     * @function _getFairPlayLegacyEME
     * @summary If platform is iPhoneOS or iPadOS < 16.4 and using Safari.
     * TODO ideally we want to be able to differentiate MacOS/iOS.
     */
    let _getFairPlayLegacyEME = () => {
      // Example Safari userAgent
      // "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15
      //  (KHTML, like Gecko) Version/16.3 Safari/605.1.15"
      // No difference between iOS and MacOS:
      // On MacOS its the Safari version.
      // On iOS its the iOS version as Safari is bundled.
      const regex = /Version\/([\d|.]+)/;
      let deviceMustUseLegacyEME = false;

      let matches = window.navigator.userAgent.match(regex);
      if (matches) {
        // Check only Major version
        let safariVersion = matches[0].slice("Version/".length).split('.')[0];

        // Apple fixed the issue in 16.4
        deviceMustUseLegacyEME = Number(safariVersion) >= 15 ;
      }
      return deviceMustUseLegacyEME;
    };


    return otvplayer(
      videoRootElement,
      // options
      {
        html5: {
          nativeCaptions: isSafari,
          nativeAudioTracks: isSafari,
        },
        muted: false,
        autoplay: false,
        nativeControlsForTouch: false,
        plugins: {
          otvtoolkit: {
            //The preferredPlayer option only works in HBBTV environment
            // and it will be ingnore for other platform.
            // to do: when we integtate 5.11.0 sdk then we need to remvoe this workaround because Shaka player will be used by default in HBBTV if preferredPlayer is undefined
            preferredPlayer: _getPreferredPlayer(),
            creationFailureCallback: failureCallback,
            drm: {
              system: DRM_SYSTEM,
              config: {
                multiSession: multiKeySession,
                fairplayServerCertificate: certificateRetrievalCallback,
                requestLicenceCallback: licenseRetrievalCallback,
                "com.apple.fps": isSafari
                  ? {
                    useLegacyEME: _getFairPlayLegacyEME(),
                  }
                  : undefined,
              },
            },
          },
        },
      },
      // loaded callback
      successCallback
    );
  };

  /**
 * @function getCertificate
 * @summary Retrieves the fairplay certificate for HLS playback
 * @param certificateUrl: String
 * @returns Promise<Uint8Array>
 */
  public static getCertificate = (certificateURL: string) => {
    return new Promise(function resolver(resolve, reject) {
      let xhr = new XMLHttpRequest();
      xhr.open("GET", certificateURL, true);
      xhr.responseType = "arraybuffer";

      xhr.onload = function onload() {
        if (xhr.status === 200) {
          resolve(new Uint8Array(xhr.response));
        } else {
          reject(
            "OTTHelper.ts :: Failed to receive certificate, HTTP status:" +
            xhr.status
          );
        }
      };

      xhr.onerror = function onerror() {
        reject("OTTHelper.ts :: Error on certificate request");
      };
      xhr.send();
    });
  }

  /**
  * @function isCurrentPlatform
  * @summary This method will check platform type is valid or not.
  * if it valid type then return true else false.
  * @param platformType
  */
  public static isCurrentPlatform(platformType: PlatformTypes) {
    switch (platformType) {
      case PlatformTypes.TVKeyCapable: {
        let lowerCaseUA = window.navigator.userAgent.toLowerCase();
        return lowerCaseUA.includes("hbbtv") && lowerCaseUA.includes("tizen");
      }

      case PlatformTypes.PC_SAFARI:
        // Example of Safari userAgent:
        // "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.1 Safari/605.1.15"
        // So we need to be careful not to confuse the presence of the word Safari
        // and absence of the word Chrome in Smart TV's userAgent
        return (
          !window.navigator.userAgent.toLowerCase().includes("smart") &&
          window.navigator.userAgent.indexOf("Safari") !== -1 &&
          window.navigator.userAgent.indexOf("Chrome") === -1
        );

      case PlatformTypes.SMARTTV:
        // Example of Tizen userAgent:
        // "Mozilla/5.0 (SMART-TV; LINUX; Tizen 5.0) AppleWebKit/537.36 (KHTML, like Gecko) Version/5.0 TV Safari/537.36"
        return window.navigator.userAgent.toLowerCase().includes("smart");

      default:
        return false;
    }
  };

  public static getAvailableSeekableRange = (playerInstance) => {
    const seekable = playerInstance.seekable();
    let seekableRange = {
      start: 0,
      end: 0,
      duration: 0, // 0 means unseekable
    };

    if (seekable.length) {
      seekableRange.start = seekable.start(seekable.length - 1);
      seekableRange.end = seekable.end(seekable.length - 1);
      seekableRange.duration = seekableRange.end - seekableRange.start;
    }

    return seekableRange;
  };

  public static getStateString = (state: OTTPlayerStates) => {
    const stateStringMap = new Map([
      [OTTPlayerStates.UNINITIALISED, "UNINITIALISED"],
      [OTTPlayerStates.INITIALISING, "INITIALISING"],
      [OTTPlayerStates.INITIALISED, "INITIALISED"],
      [OTTPlayerStates.PLAY_REQUESTED, "PLAY_REQUESTED"],
      [OTTPlayerStates.LOADED, "LOADED"],
      [OTTPlayerStates.PLAY, "PLAY"],
      [OTTPlayerStates.PLAYING, "PLAYING"],
      [OTTPlayerStates.PAUSED, "PAUSED"],
      [OTTPlayerStates.STOPPED, "STOPPED"],
      [OTTPlayerStates.ERROR, "ERROR"],
      [OTTPlayerStates.WAITING, "WAITING"],
      [OTTPlayerStates.SOURCE_SET, "SOURCE_SET"],
    ]);
    if (stateStringMap.has(state)) {
      return stateStringMap.get(state);
    } else {
      return "UNKNOWN";
    }
  }

  public static getDRMStateString = (state: DRMStates) => {
    const stateStringMap = new Map([
      [DRMStates.INACTIVE, "INACTIVE"],
      [DRMStates.AWAITING_CONTENT_TOKEN, "AWAITING_CONTENT_TOKEN"],
      [DRMStates.AWAITING_SESSION_TOKEN, "AWAITING_SESSION_TOKEN"],
      [DRMStates.LICENSE_REQUESTED, "LICENSE_REQUESTED"],
      [DRMStates.ACTIVE, "ACTIVE"],
      [DRMStates.RENEWAL_REQUESTED, "RENEWAL_REQUESTED"],
      [DRMStates.ERROR, "ERROR"],
    ]);
    if (stateStringMap.has(state)) {
      return stateStringMap.get(state);
    } else {
      return "UNKNOWN";
    }
  }

  public static getSSMStateString = (state: SSMStates) => {
    const stateStringMap = new Map([
      [SSMStates.SESSION_OFF, "SESSION_OFF"],
      [SSMStates.SESSION_ON, "SESSION_ON"],
      [SSMStates.SETUP_REQUESTED, "SETUP_REQUESTED"],
      [SSMStates.TEARDOWN_REQUESTED, "TEARDOWN_REQUESTED"],
      [SSMStates.RENEWAL_REQUESTED, "RENEWAL_REQUESTED"],
      [SSMStates.AWAITING_CONTENT_TOKEN, "AWAITING_CONTENT_TOKEN"],
      [SSMStates.ERROR, "ERROR"],
      [SSMStates.SSM_DISABLED, "SSM_DISABLED"],
    ]);
    if (stateStringMap.has(state)) {
      return stateStringMap.get(state);
    } else {
      return "UNKNOWN";
    }
  }

  public static getNetworkStats = (networkStatistics: any, enabled: boolean) => {
    let logger: Logger = new Logger();
    let availableBitrates: Array<number>;
    let selectedBitrate: number;
    let url: string;
    let bytesDownloaded: number;
    let downloadBitrate: number;
    let downloadBitrateAverage: number;

    if (enabled) {
      const adaptiveStreaming = networkStatistics?.getAdaptiveStreaming();
      availableBitrates = adaptiveStreaming?.availableBitrates;
      selectedBitrate = adaptiveStreaming?.selectedBitrate;
      url = networkStatistics?.getContentServer()?.url;

      const networkUsage = networkStatistics?.getNetworkUsage();
      bytesDownloaded = networkUsage?.bytesDownloaded;
      downloadBitrate = networkUsage?.downloadBitrate;
      downloadBitrateAverage = networkUsage?.downloadBitrateAverage;
    }
    const networkStatsInfo = {
      adaptiveStreaming: {
        availableBitrates,
        selectedBitrate,
      },
      contentServer: {
        url,
      },
      networkUsage: {
        bytesDownloaded,
        downloadBitrate,
        downloadBitrateAverage,
      }
    };
    if (enabled) {
      logger.log(
        LOG_LEVEL.DEBUG,
        "OTTHelper.ts: getNetworkStats(): ",
        JSON.stringify(networkStatsInfo));
    }
    return networkStatsInfo;
  }

  public static getRenderingStats = (renderingStatistics: any, enabled: boolean) => {
    let logger: Logger = new Logger();
    let framesPerSecondNominal: number;
    let framesPerSecond: number;
    let frameDrops: number;
    let frameDropsPerSecond: number;
    if (enabled) {
      framesPerSecondNominal = renderingStatistics?.getFramesPerSecondNominal();
      framesPerSecond = renderingStatistics?.getFramesPerSecond();
      frameDrops = renderingStatistics?.getFrameDrops();
      frameDropsPerSecond = renderingStatistics?.getFrameDropsPerSecond();
    }
    const renderingStatsInfo = {
      framesPerSecondNominal,
      framesPerSecond,
      frameDrops,
      frameDropsPerSecond,
    };
    if (enabled) {
      logger.log(
        LOG_LEVEL.DEBUG,
        `OTTHelper.ts: getRenderingStats(): rendering statistics`,
        JSON.stringify(renderingStatsInfo));
    }
    return renderingStatsInfo;
  }

  public static getPlaybackStats = (playbackStatistics: any, enabled: boolean) => {
    let logger: Logger = new Logger();
    let streamBitrate: number;
    let selectedResolution: any;
    if (enabled) {
      streamBitrate = playbackStatistics?.getStreamBitrate();
      selectedResolution = playbackStatistics?.getResolution();
      logger.log(
        LOG_LEVEL.DEBUG,
        `OTTHelper.ts: getPlaybackStats(): Playback statistics`,
        ` streamBitrate: ${streamBitrate}`,
        ` resolution: ${JSON.stringify(selectedResolution)}`
      );
    }
    return {
      streamBitrate,
      selectedResolution,
    };
  }


};
