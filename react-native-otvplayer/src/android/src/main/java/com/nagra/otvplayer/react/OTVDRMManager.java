// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
package com.nagra.otvplayer.react;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;

import nagra.otv.sdk.OTVLog;

public class OTVDRMManager extends ReactContextBaseJavaModule {
    private static final String MODULE_NAME = "OTVDRMManager";
    private static final String LICENSE_URL = "licenseURL";
    private static final String SSM_SERVER_URL = "ssmServerURL";
    private static final String SSM_SYNC_MODE = "ssmSyncMode";

    public static String mLicenseUrl = "";
    public static String mSSMUrl = "";
    public static boolean ssmSynchMode = true;

    public OTVDRMManager(ReactApplicationContext reactContext) {
        super(reactContext);
        OTVLog.i(MODULE_NAME, OTVLog.ENTER_AND_LEAVE);
    }

    @ReactMethod
    public static void setDRMConfig(ReadableMap configIn) {
        OTVLog.i(MODULE_NAME, OTVLog.ENTER);
        if (configIn.hasKey(LICENSE_URL)) {
            mLicenseUrl = configIn.getString(LICENSE_URL);
        }
        if (configIn.hasKey(SSM_SERVER_URL)) {
            mSSMUrl = configIn.getString(SSM_SERVER_URL);
        }
        if (configIn.hasKey(SSM_SYNC_MODE)) {
            ssmSynchMode = configIn.getBoolean(SSM_SYNC_MODE);
        }

        OTVLog.i(MODULE_NAME, "Server info set \n" +
                "licenseURL : " + mLicenseUrl + "\n" +
                "SSMServURL : " + mSSMUrl + "\n" +
                "SSM in Synch? : " + ssmSynchMode);
        OTVLog.i(MODULE_NAME, OTVLog.LEAVE);
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
