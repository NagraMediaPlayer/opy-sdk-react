// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
package com.nagra.otvplayer.react;

import androidx.annotation.NonNull;
import nagra.otv.sdk.OTVLog;
import nagra.otv.sdk.log.IOTVLogProvider;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.uimanager.events.RCTEventEmitter;
import com.facebook.react.bridge.WritableMap;

public class OTVLogReact {

    public static final String ENTER = "Enter";
    public static final String LEAVE = "Leave";
    public static final String ENTER_AND_LEAVE = "Enter & Leave";
    private static final int DEFAULT_LOG_LEVEL = OTVLog.LOG_LEVEL_DEBUG;
    private static OTVLogReact mLogReact = null;
    private static int sLogLevel = DEFAULT_LOG_LEVEL;
    private static boolean sEmitToJs = false;
    private ReactUPIPlayer mVideoView = null;
    private ReactContext mContext = null;

    private final IOTVLogProvider mLogProvider = new IOTVLogProvider() {
        @Override
        public void logMessage(String xLog) {
            if (sEmitToJs) {
                dispatchLog(xLog);
            }
        }
    };
   

    private OTVLogReact(@NonNull ReactContext xContext, @NonNull ReactUPIPlayer xView) {
        mVideoView = xView;
        mContext = xContext;
        setLogLevel(DEFAULT_LOG_LEVEL);
        OTVLog.setLogProvider(mLogProvider);
    }

    public static OTVLogReact getInstance(@NonNull ReactContext xContext, @NonNull ReactUPIPlayer xView) {
        if (mLogReact == null) {
            mLogReact = new OTVLogReact(xContext, xView);
        }
        return mLogReact;
    }

    public static void setLogLevel(int xLogLevel) {
        setLogLevel(xLogLevel, false);
    }

    public static void setLogLevel(int xLogLevel, boolean xEmitToJs) {
        OTVLog.setLogLevel(xLogLevel);
        sLogLevel = xLogLevel;
        sEmitToJs = xEmitToJs;
    }

    public void v(String xTag, String xMsg) {
        OTVLog.v(xTag, xMsg);
        if (sLogLevel == OTVLog.LOG_LEVEL_VERBOSE && mLogReact.mVideoView != null) {
            this.dispatchLog("V " + xTag + ": " + xMsg);
        }
    }

    public void d(String xTag, String xMsg) {
        OTVLog.d(xTag, xMsg);
        if (sLogLevel >= OTVLog.LOG_LEVEL_DEBUG && mLogReact.mVideoView != null) {
            this.dispatchLog("D " + xTag + ": " + xMsg);
        }
    }

    public void i(String xTag, String xMsg) {
        OTVLog.i(xTag, xMsg);
        if (sLogLevel >= OTVLog.LOG_LEVEL_INFO && mLogReact.mVideoView != null) {
            this.dispatchLog("I " + xTag + ": " + xMsg);
        }
    }

    public void w(String xTag, String xMsg) {
        OTVLog.w(xTag, xMsg);
        if (mLogReact.mVideoView != null) {
            this.dispatchLog("W " + xTag + ": " + xMsg);
        }
    }

    public void e(String xTag, String xMsg) {
        OTVLog.e(xTag, xMsg);
        if (mLogReact.mVideoView != null) {
            this.dispatchLog("E " + xTag + ": " + xMsg);
        }
    }

    private void dispatchLog(String xLog) {
        WritableMap statsMap = Arguments.createMap();
        statsMap.putString("logs", xLog);
        if (mLogReact.mContext != null && sEmitToJs) {
            mLogReact.mContext.getJSModule(RCTEventEmitter.class).receiveEvent(mLogReact.mVideoView.mParentView.getId(),
                    "onLog",
                    statsMap);
        }
    }
}
