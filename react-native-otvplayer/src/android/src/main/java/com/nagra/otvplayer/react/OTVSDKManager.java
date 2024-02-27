// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
package com.nagra.otvplayer.react;

import androidx.annotation.NonNull;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import java.util.HashMap;
import java.util.Map;

import nagra.otv.sdk.OTVLog;
import nagra.otv.sdk.OTVSDK;

public class OTVSDKManager extends ReactContextBaseJavaModule {
    private static final String MODULE_NAME = "OTVSDKManager";
    private static final String VERSION_KEY = "version";
    ReactApplicationContext mContext;

    public OTVSDKManager(ReactApplicationContext reactContext) {
        super(reactContext);
        mContext = reactContext;
        OTVLog.i(MODULE_NAME, OTVLog.LEAVE);
    }

    /**
     * React log levels are ERROR = 0 , WARNING = 1 ,INFO=2 , DEBUG=3
     * Android OTV SDK log levels are INFO=1, DEBUG=2 ,VERBOSE=3
     * xEmitToJs - select whether logs coming from player are passed on to JS layer
     */
    // TODO: Discard this 1-parameter method one once js layer supports eimtToJs

    // @ReactMethod
    public void setSDKLogLevel(int xLevel) {
        setSDKLogLevel(xLevel, false);
    }

    // TODO: Make this 2-parameter method the active one once js layer supports it
    @ReactMethod
    public void setSDKLogLevel(int xLevel, boolean xEmitToJs) {
        OTVLog.i(MODULE_NAME, OTVSDK.getSdkVersion() + " set Log level: " + xLevel);
        switch (xLevel) {
            case 0:
            case 1:
                OTVLogReact.setLogLevel(0, xEmitToJs);
                break;
            case 2:
                OTVLogReact.setLogLevel(OTVLog.LOG_LEVEL_INFO, xEmitToJs);
                break;
            case 3:
                OTVLogReact.setLogLevel(OTVLog.LOG_LEVEL_DEBUG, xEmitToJs);
                break;
            default:
                OTVLogReact.setLogLevel(OTVLog.LOG_LEVEL_VERBOSE, xEmitToJs);
        }
        OTVLog.v(MODULE_NAME, OTVLog.LEAVE);
    }

    @ReactMethod
    public void connectFactoryReset(String xOpVault, String resetType) {
        OTVLog.i(MODULE_NAME,"Connect reset with type "+resetType+" and opvault "+xOpVault);
        OTVSDK.connectFactoryReset(xOpVault.getBytes(),resetType.equalsIgnoreCase("all")?OTVSDK.ConnectResetType.ALL:OTVSDK.ConnectResetType.CURRENT);
    }

    @Override
    public Map<String, Object> getConstants() {
        final Map<String, Object> constants = new HashMap<>();
        constants.put(VERSION_KEY, OTVSDK.getSdkVersion());
        return constants;
    }

    @NonNull
    @Override
    public String getName() {
        return MODULE_NAME;
    }

    @Override
    public void initialize() {
        OTVLog.v(MODULE_NAME, OTVLog.ENTER_AND_LEAVE);
    }

    @Override
    public boolean canOverrideExistingModule() {
        OTVLog.v(MODULE_NAME, OTVLog.ENTER_AND_LEAVE);
        return false;
    }

    @Override
    public void onCatalystInstanceDestroy() {
        OTVLog.v(MODULE_NAME, OTVLog.ENTER_AND_LEAVE);
    }
}
