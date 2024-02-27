// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
import { OTV, SHAKA } from "./NMPWebPlayer";
import { SHAKA_LOG_LEVEL } from "./common/interface";
import PKG from "package.json";
import { Logger } from "./../Logger";
import {
  OTVSDK_LOGLEVEL as LOG_LEVEL
} from "./../common/enums";

let OTVSDKManagerInstance = null;
let logger: Logger = new Logger();

export class OTVSDKManager {
  private sdkVersion: string;
  private pluginVersion: string;
  private _multiKeySession: boolean;
  constructor() {
    if (OTVSDKManagerInstance) {
      return OTVSDKManagerInstance;
    }
    this.sdkVersion = `${OTV?.versions.product}.${OTV?.versions.revision}`;
    this.pluginVersion = PKG.version;
    this._multiKeySession = false;
    OTVSDKManagerInstance = this;
  }

  /**
   * @function
   * @summary Get the multi key sessions flag from SDK DRM configuration.
   * @return {boolean} multiSession flag value
   */
  get multiSession(): boolean {
    return this._multiKeySession;
  }

  /**
   * @function
   * @summary Set the flag to enable or disable the multi key sessions in SDK DRM configuration.
   * @return None
   */
  set multiSession(bMultiKeySession: boolean) {
    this._multiKeySession = bMultiKeySession;
  }

  /**
   * @function
   * @summary Retrieves the SDK Version.
   * @return SDKVersion
   */
  getVersion = () => {
    return {
      otvPlayerVersion: this.pluginVersion,
      sdkVersion: this.sdkVersion,
    };
  };

  /**
   * @function
   * @summary to set RNPlugin log level and shaka player log level.
   * @param {number} level
   */
  setSDKLogLevel = (level: number, emitToJs: boolean) => {
    console.log(`plugin v${this.pluginVersion}, SDK v${this.sdkVersion}`);
    console.log(`emitToJs: ${emitToJs}`);
    switch (level) {
      case LOG_LEVEL.ERROR:
        OTVSDKManager.setShakaLogLevel(level, SHAKA_LOG_LEVEL.ERROR);
        break;
      case LOG_LEVEL.WARNING:
        OTVSDKManager.setShakaLogLevel(level, SHAKA_LOG_LEVEL.WARNING);
        break;
      case LOG_LEVEL.INFO:
        OTVSDKManager.setShakaLogLevel(level, SHAKA_LOG_LEVEL.INFO);
        break;
      case LOG_LEVEL.DEBUG:
        OTVSDKManager.setShakaLogLevel(level, SHAKA_LOG_LEVEL.DEBUG);
        break;
      case LOG_LEVEL.VERBOSE:
        OTVSDKManager.setShakaLogLevel(level, SHAKA_LOG_LEVEL.VERBOSE);
        break;
      default:
        OTVSDKManager.setShakaLogLevel(LOG_LEVEL.WARNING, SHAKA_LOG_LEVEL.WARNING);
        console.warn(
          `Invalid log level ( ${level} ) requested. Setting to default level: INFO ( OTVSDK_LOGLEVEL.WARNING )`
        );
    }
  };
  static setShakaLogLevel = (level: number, shakaLog: SHAKA_LOG_LEVEL) => {
    logger.currentLogLevel = level;
    SHAKA.log.setLevel(shakaLog);
  }

  /**
  * @function
  * @summary To reset Connect DRM for Android only
  * @param {string} xOpVault opvault for connect DRM
  * @param {string} type connect DRM reset type( "all" or "current")
  */
  connectFactoryReset = (xOpVault: string, type: string) => {
    console.warn(`connectFactoryReset is not implemented for web, opVault : ${xOpVault} type : ${type}`);
  }
}
