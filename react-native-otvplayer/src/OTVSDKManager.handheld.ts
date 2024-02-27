// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
import { NativeModules, Platform } from "react-native";
import PKG from "package.json";
import { Logger } from "./Logger";
import {
    OTVSDK_LOGLEVEL as LOG_LEVEL
} from "./common/enums";

let OTVSDKManagerInstance = null;
let NativeOTVSDKManager = NativeModules.OTVSDKManager;
let logger: Logger = new Logger();

export class OTVSDKManager {
    constructor() {
        if (OTVSDKManagerInstance) {
            return OTVSDKManagerInstance;
        }
        OTVSDKManagerInstance = this;
    }

    /**
     * @function
     * @summary Get the multi key sessions flag from SDK DRM configuration.
     * @return {boolean} multiSession flag value
     */
    get multiSession(): boolean {
        logger.log(
            LOG_LEVEL.WARNING,
            "OTVSDKManager.handheld.ts: get multiSession() API is not implemented for handheld"
        );
        return false;
    }

    /**
     * @function
     * @summary Set the flag to enable or disable the multi key sessions in SDK DRM configuration.
     * @return None
     */
    set multiSession(bMultiKeySession: boolean) {
        logger.log(
            LOG_LEVEL.WARNING,
            "OTVSDKManager.handheld.ts: set multiSession() API is not implemented for handheld. MultiKeySession val is:",
            bMultiKeySession
        );
    }

    /**
     * @function
     * @summary Retrieves the SDK Version.
     * @return SDKVersion
     */
    getVersion = () => {
        const { version } = NativeOTVSDKManager.getConstants();

        return {
            "sdkVersion": version,
            "otvPlayerVersion": PKG.version
        };
    }

    /**
     * @function
     * @summary To set RNPlugin log level and native player log level.
     * @param {number} level Log level to be set
     * @param {boolean} emitToJs Whether to emit native logs (Invalid for web platform)
     */
    setSDKLogLevel = (level: LOG_LEVEL, emitToJs?: Boolean) => {
        if (level >= LOG_LEVEL.ERROR && level <= LOG_LEVEL.VERBOSE) {
            logger.currentLogLevel = level;
            console.log(`currentLogLevel ${level}, emitToJs ${emitToJs}`);
            if (emitToJs === undefined || emitToJs == null) {
                NativeOTVSDKManager.setSDKLogLevel(level, false)
            } else {
                NativeOTVSDKManager.setSDKLogLevel(level, emitToJs)
            }
        } else {
            console.warn(`Invalid log level ( ${level} ) requested.`);
        }
    };

    /**
     * @function
     * @summary To reset Connect DRM 
     * @param {string} xOpVault opvault for connect DRM
     * @param {string} type connect DRM reset type( "all" or "current")
     */
    connectFactoryReset = (xOpVault: string, type: string) => {
        if (Platform.OS == "android") {
            if (xOpVault) {
                NativeOTVSDKManager.connectFactoryReset(xOpVault, type);
            } else {
                console.error(`Invalid opvault for connect reset ${xOpVault}`);
            }
        } else {
            console.error(`connectFactoryReset is not implemented for ${Platform.OS}`);
        }
    }
}

export default OTVSDKManager
