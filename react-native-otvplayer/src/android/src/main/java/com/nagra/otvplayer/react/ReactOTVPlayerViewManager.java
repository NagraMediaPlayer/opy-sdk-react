// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
package com.nagra.otvplayer.react;

import androidx.core.util.Pair;

import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.NoSuchKeyException;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableType;
import com.facebook.react.bridge.UnexpectedNativeTypeException;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;

import java.util.Map;

import nagra.otv.upi.OTVUPISource;
import nagra.otv.upi.OTVUPIError;
import nagra.otv.upi.OTVUPIStatisticsConfig;

public class ReactOTVPlayerViewManager extends SimpleViewManager<ReactOTVPlayerContainer> {

    public static final String TAG = "RCTOTVPlayerViewMgr";
    public static final String REACT_CLASS = "RNCOTVPlayerView";
    public static final String ENTER = "Enter";
    public static final String LEAVE = "Leave";

    public static final String TOKEN_TYPE_DEFAULT = "nv-authorizations";
    private static OTVLogReact OTV_LOG = null;

    private ReactOTVPlayerContainer mPlaybackContainer;
    private ReactUPIPlayer mUPIPlayer;
    private ViewGroup mAdContainer;
    private boolean mContentInProgress = false;
    private String mStreamAdTag = "";
    private boolean mIsMuted = false;
    private OTVUPISource mSource;

    @Override
    public String getName() {
        return REACT_CLASS;
    }

    @NonNull
    @Override
    protected ReactOTVPlayerContainer createViewInstance(@NonNull ThemedReactContext reactContext) {
        mPlaybackContainer = new ReactOTVPlayerContainer(reactContext);
        mUPIPlayer = mPlaybackContainer.getPlayer();
        OTV_LOG = OTV_LOG.getInstance(reactContext, mUPIPlayer);
        // mAdContainer = mPlaybackContainer.getAdContainer();
        // initIMA(reactContext);
        // setupEventListeners();
        OTV_LOG.i(TAG, "ReactOTVPlayerContainer object created.");
        return mPlaybackContainer;
    }

    @Override
    public  void onDropViewInstance(@NonNull ReactOTVPlayerContainer xView) {
        super.onDropViewInstance(xView);
        stop(xView);
        OTV_LOG.e(TAG,"onDropViewInstance ENTER & LEAVE");
    }

    @Override
    public void receiveCommand(ReactOTVPlayerContainer view, String commandId, @Nullable ReadableArray args) {
        OTV_LOG.i(TAG, "receiveCommand: Enter - commandId = \"" + commandId + "\"");
        super.receiveCommand(view, commandId, args);
        try {
            switch (commandId) {
                case "play":
                    play(view);
                    break;
                case "pause":
                    pause(view);
                    break;
                case "seek":
                    seek(view, args);
                    break;
                case "stop":
                    stop(view);
                    break;
                case "selectAudioTrack":
                    selectAudioTrack(view, args);
                    break;
                case "selectTextTrack":
                    selectTextTrack(view, args);
                    break;
                default:
                    OTV_LOG.w(TAG, "Unknown command");
            }
        } catch (NoSuchKeyException | UnexpectedNativeTypeException | ArrayIndexOutOfBoundsException
                | ClassCastException e) {
            e.printStackTrace();
            OTV_LOG.w(TAG, e.getClass() + ": " + e.getMessage());
        }
        OTV_LOG.i(TAG, "receiveCommand: " + LEAVE);
    }

    private void play(ReactOTVPlayerContainer view) {
        OTV_LOG.i(TAG, "play: " + ENTER);
        view.getPlayer().setPaused(false);
        mContentInProgress = true;
        OTV_LOG.i(TAG, "play: " + LEAVE);
    }

    private void pause(ReactOTVPlayerContainer view) {
        OTV_LOG.i(TAG, "pause: " + ENTER);
        view.getPlayer().setPaused(true);
        mContentInProgress = false;
        OTV_LOG.i(TAG, "pause: " + LEAVE);
    }

    private void seek(ReactOTVPlayerContainer view, ReadableArray args) {
        OTV_LOG.i(TAG, "seek: " + ENTER);
        ReadableMap map = args.getMap(0);
        double seekPosSec = map.getDouble("position");
        OTV_LOG.i(TAG, "seek: position: " + seekPosSec);
        view.getPlayer().seek(seekPosSec);
        OTV_LOG.i(TAG, "seek: " + LEAVE);
    }

    private void selectAudioTrack(ReactOTVPlayerContainer view, ReadableArray args) {
        OTV_LOG.i(TAG, "selectAudioTrack: " + ENTER);
        int index = args.getInt(0);
        view.getPlayer().setSelectedAudioTrack(index);
        OTV_LOG.i(TAG, "selectAudioTrack: " + LEAVE);
    }

    private void selectTextTrack(ReactOTVPlayerContainer view, ReadableArray args) {
        OTV_LOG.i(TAG, "selectTextTrack: " + ENTER);
        int index = args.getInt(0);
        view.getPlayer().setSelectedTextTrack(index);
        OTV_LOG.i(TAG, "selectTextTrack: " + LEAVE);
    }

    private void stop(ReactOTVPlayerContainer view) {
        OTV_LOG.w(TAG, "stop: " + ENTER);
        checkAndStopTokenWaiting();
        view.getPlayer().stop();
        mSource = null;
        OTV_LOG.w(TAG, "stop: " + LEAVE);
    }

    @ReactProp(name = "source")
    public void setSource(ReactOTVPlayerContainer view, @Nullable ReadableMap sources) {
        OTV_LOG.i(TAG, "setSource: Enter");
        try {
            String uri = sources.hasKey("src") ? sources.getString("src") : "";
            if (uri.isEmpty()) {
              OTV_LOG.i(TAG, " Source uri is empty, skip it.");
              return;
            }
            String token = sources.hasKey("token") ? sources.getString("token") : null;
            //Check if the content token should be updated for current encrypted stream.
            if (checkAndUpdateToken(token, uri)) {
                return;
            }
            checkAndStopTokenWaiting();
            // the token type is not supported by Android, so just parse it now.
            String tokenType = sources.hasKey("tokenType") ? sources.getString("tokenType") : "";
            if (tokenType == null || tokenType.isEmpty()) {
                tokenType = TOKEN_TYPE_DEFAULT;
            }
            OTV_LOG.i(TAG, "token type: " + tokenType);

            String adUri = sources.hasKey("adTagURL") ? sources.getString("adTagURL") : "";
            String mimeType = sources.hasKey("type") ? sources.getString("type") : "";
            ReadableArray readableTextTracks = sources.hasKey("textTracks") ? sources.getArray("textTracks") : null;

            // Parse DRM information
            ReadableMap drmMap = sources.hasKey("drm") ? sources.getMap("drm") : null;
            OTVUPISource.Drm drm = drmMap != null ? generateDrmInfo(drmMap) : null;
            OTVUPISource.TextTrack[] textTracks = setTextTracks(view, readableTextTracks);
            OTVUPISource upiSource = new OTVUPISource(uri, mimeType, token, adUri, textTracks, drm);
            mSource = upiSource;
            // set source to UPI Player
            view.getPlayer().setSource(mSource);
            logSourceInfo(upiSource);
            if (mIsMuted) {
                view.getPlayer().setMuted(mIsMuted);
            }
            mContentInProgress = true;
        } catch (NoSuchKeyException nske) {
            OTV_LOG.w(TAG, nske.getMessage());
        }
        OTV_LOG.i(TAG, "setSource: Leave");
    }

    private boolean checkAndUpdateToken(String token, String uri) {
        if (mSource != null
                && mSource.getToken() == null
                && mSource.getSrc().equalsIgnoreCase(uri)
                && isEncryptedStream(mSource)) {
            if (token != null) {
                OTV_LOG.i(TAG, "Set Source Leave with Update content toke to : " + token);
                // Update token directly as Android UPI and Plugin will share a same Source object.
                mSource.setToken(token);
            } else {
                OTV_LOG.w(TAG, "Set source leave with not updating content token to null.");
            }
            return true;
        }
        return false;
    }

    private void checkAndStopTokenWaiting() {
        if (mSource != null
                && mSource.getToken() == null
                && isEncryptedStream(mSource)) {
            // The content token is still not avaialble when switch to a new stream
            // set an null token to stop waiting for the token.
            mSource.setToken(null);
        }
    }

    private void logSourceInfo(OTVUPISource source) {
        OTV_LOG.i(TAG, "uri   : " + source.getSrc());
        OTV_LOG.i(TAG, "token : " + source.getToken());
        OTV_LOG.i(TAG, "mimeType : " + source.getType());
        OTV_LOG.i(TAG, "adUri : " + source.getAdTagUrl());
        if (source.getDrm() != null) {
            OTVUPISource.Drm drm = source.getDrm();
            OTV_LOG.i(TAG, "drmType   : " + drm.getType());
            OTV_LOG.i(TAG, "certificateURL   : " + drm.getCertificateURL());
            OTV_LOG.i(TAG, "licenseURL : " + drm.getLicenseURL());
            OTV_LOG.i(TAG, "ssmServerURL : " + drm.getSsmServerURL());
        }
    }

    private boolean isEncryptedStream(OTVUPISource source) {
        OTVUPISource.Drm drm = source.getDrm();
        if (drm != null) {
            if (!drm.getLicenseURL().isEmpty()) {
                OTV_LOG.d(TAG, "The stream is encrypted stream with URL: " + source.getSrc());
                return true;
            }
        }
        return false;
    }

    private OTVUPISource.Drm generateDrmInfo(ReadableMap drm) {
        String drmType = drm.hasKey("type") ? drm.getString("type") : "widevine";
        // temp until we get correct value from streams. Currently streams do not have
        // this.
        String certificateURL = drm.hasKey("certificateURL") ? drm.getString("certificateURL") : "";
        String licenseURL = drm.hasKey("licenseURL") ? drm.getString("licenseURL") : "";
        String ssmServerURL = drm.hasKey("ssmServerURL") ? drm.getString("ssmServerURL") : "";
        boolean ssmSyncMode = drm.hasKey("ssmSyncMode") ? drm.getBoolean("ssmSyncMode") : false;
        return new OTVUPISource.Drm(drmType.split(",")[0], certificateURL, licenseURL, ssmServerURL, ssmSyncMode);
    }

    @ReactProp(name = "autoplay")
    public void autoplay(ReactOTVPlayerContainer view, boolean enabled) {
        OTV_LOG.i(TAG, "autoplay: Enter with " + enabled);
        view.getPlayer().setAutoplayEnabled(enabled);
        OTV_LOG.i(TAG, "autoplay: Leave");
    }

    @ReactProp(name = "rate")
    public void setPlaybackRate(ReactOTVPlayerContainer view, float rate) {
        OTV_LOG.i(TAG, "setPlaybackRate: Enter with " + rate);
        view.getPlayer().setPlaybackRate(rate);
        OTV_LOG.i(TAG, "setPlaybackRate: Leave");
    }

    @ReactProp(name = "volume")
    public void setVolume(ReactOTVPlayerContainer view, float volume) {
        OTV_LOG.i(TAG, "setVolume: Enter with " + volume);
        view.getPlayer().setVolume(volume);
        OTV_LOG.i(TAG, "setVolume: Leave");
    }

    @ReactProp(name = "muted")
    public void setMuted(ReactOTVPlayerContainer view, boolean muted) {
        OTV_LOG.i(TAG, "setMuted: Enter with " + muted);
        view.getPlayer().setMuted(muted);
        mIsMuted = muted;
        OTV_LOG.i(TAG, "setMuted: Leave");
    }

    private OTVUPISource.TextTrack[] setTextTracks(ReactOTVPlayerContainer view, ReadableArray tracks) {
        OTV_LOG.i(TAG, "setTextTracks: Enter");
        int numTracks = tracks != null ? tracks.size() : 0;
        OTVUPISource.TextTrack[] xTracks = new OTVUPISource.TextTrack[numTracks];
        try {
            for (int i = 0; i < numTracks; i++) {
                ReadableMap trackMap = tracks.getMap(i);
                String url = trackMap.getString("url");
                String mimeType = trackMap.getString("mimeType");
                String language = trackMap.getString("language");
                OTV_LOG.i(TAG, "Track :" + i);
                OTV_LOG.i(TAG, "url :" + url);
                OTV_LOG.i(TAG, "mimetype :" + mimeType);
                OTV_LOG.i(TAG, "language :" + language + "\n");
                xTracks[i] = new OTVUPISource.TextTrack(url, mimeType, language);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        OTV_LOG.i(TAG, "setTextTracks: Leave");
        return xTracks;
    }

    @ReactProp(name = "progressUpdateInterval")
    public void setProgressUpdateInterval(ReactOTVPlayerContainer view, float interval) {
        OTV_LOG.i(TAG, "setProgressUpdateInterval: Enter");
        try {
            OTV_LOG.i(TAG, "progressUpdateInterval : " + interval);
            view.getPlayer().setProgressUpdateInterval(interval);
        } catch (NoSuchKeyException nske) {
            nske.printStackTrace();
        }
        OTV_LOG.i(TAG, "setProgressUpdateInterval: Leave");
    }

    @ReactProp(name = "maxBitrate")
    public void setMaxBitrate(ReactOTVPlayerContainer view, int bitrate) {
        OTV_LOG.i(TAG, "setMaxBitrate: Enter");
        view.getPlayer().setMaxBitrate(bitrate);
        OTV_LOG.i(TAG, "setMaxBitrate: Leave");
    }

    @ReactProp(name = "maxResolution")
    public void setMaxResolution(ReactOTVPlayerContainer view, ReadableMap resolution) {
        OTV_LOG.i(TAG, "setMaxResolution: Enter");
        if (resolution != null) {
            if ((resolution.hasKey("width") && resolution.getType("width") == ReadableType.Number)
                    && (resolution.hasKey("height") && resolution.getType("height") == ReadableType.Number)) {
                int key = resolution.getInt("width");
                int value = resolution.getInt("height");
                // If Negative values are passed, set the resolution to the lowest.
                if (key < 0 || value < 0) {
                    key = 10;
                    value = 10;
                }
                Pair<Integer, Integer> res = new Pair<>(key, value);
                view.getPlayer().setMaxResolution(res);
            } else {
                // If width or height is passed as null , throw error.
                OTVUPIError error = new OTVUPIError(2222, 0, 0, "Resolution Cappings parameters Should be Number");
                view.getPlayer().dispatchError(error);
            }
        } else {
            // If null is passed reset the resolution Capping.
            OTV_LOG.i(TAG, "Reset maxResolution");
            Pair<Integer, Integer> res = new Pair<>(0, 0);
            view.getPlayer().setMaxResolution(res);
        }
        OTV_LOG.i(TAG, "setMaxResolution: Leave");
    }

    /**
     * @param view    the view container
     * @param xConfig Map of statistics settings:<br>
     *                statisticsUpdateInterval - The interval (in milliseconds)
     *                between statistics updates<br>
     *                statisticsTypes - The bit set of statistics to enable<br>
     *                <ul>
     *                <li>0 - disable statistics
     *                <li>~0 - enable all statistics (if set, overrides other
     *                settings)
     *                <li>2 - enable rendering statistics
     *                <li>4 - enable network statistics
     *                <li>8 - enable playback statistics
     *                <li>16 - enable event statistics (TBD)
     *                <li>32 - enable DRM Security statistics (TBD)
     *                </ul>
     */
    @ReactProp(name = "statisticsConfig")
    public void statisticsConfiguration(ReactOTVPlayerContainer view, ReadableMap xConfig) {
        OTV_LOG.i(TAG, "statisticsConfiguration: " + OTVLogReact.ENTER);
        OTVUPIStatisticsConfig.Builder configBuilder = new OTVUPIStatisticsConfig.Builder();
        if (xConfig.hasKey("statisticsTypes")) {
            int statisticsTypes = xConfig.getInt("statisticsTypes");
            OTV_LOG.i(TAG, "statisticsTypes: " + statisticsTypes);
            configBuilder.statisticsTypes(statisticsTypes);
        }
        if (xConfig.hasKey("statisticsUpdateInterval")) {
            int statisticsUpdateInterval = xConfig.getInt("statisticsUpdateInterval");
            OTV_LOG.i(TAG, "statisticsUpdateInterval: " + statisticsUpdateInterval);
            configBuilder.statisticsUpdateInterval(statisticsUpdateInterval);
        }
        view.getPlayer().setStatisticsConfig(configBuilder.build());
        OTV_LOG.i(TAG, "statisticsConfiguration: " + OTVLogReact.LEAVE);
    }

    /**
     * Specify the thumbnail display, position and style.
     *
     * @param xThumbnail the object to define thumbnail display, position in seconds and style
     */
    @ReactProp(name = "thumbnail")
    public void setThumbnail(ReactOTVPlayerContainer view, @Nullable ReadableMap xThumbnail) {
        OTV_LOG.i(TAG, "setThumbnail" + xThumbnail);
        if (xThumbnail != null) {
            OTV_LOG.i(TAG, "setThumbnail" + xThumbnail.toString());
            view.getPlayer().setThumbnail(xThumbnail);
        }
        OTV_LOG.i(TAG, "setThumbnail: Leave");
    }

    @Override
    @Nullable
    public Map getExportedCustomDirectEventTypeConstants() {
        return MapBuilder.builder().put("onTracksChanged", MapBuilder.of("registrationName", "onTracksChanged"))
                .put("onAudioTrackSelected", MapBuilder.of("registrationName", "onAudioTrackSelected"))
                .put("onTextTrackSelected", MapBuilder.of("registrationName", "onTextTrackSelected"))
                .put("onVideoLoadStart", MapBuilder.of("registrationName", "onVideoLoadStart"))
                .put("onVideoLoad", MapBuilder.of("registrationName", "onVideoLoad"))
                .put("onVideoProgress", MapBuilder.of("registrationName", "onVideoProgress"))
                .put("onVideoSeek", MapBuilder.of("registrationName", "onVideoSeek"))
                .put("onVideoEnd", MapBuilder.of("registrationName", "onVideoEnd"))
                .put("onVideoError", MapBuilder.of("registrationName", "onVideoError"))
                .put("onVideoPaused", MapBuilder.of("registrationName", "onVideoPaused"))
                .put("onVideoPlay", MapBuilder.of("registrationName", "onVideoPlay"))
                .put("onVideoPlaying", MapBuilder.of("registrationName", "onVideoPlaying"))
                .put("onVideoWaiting", MapBuilder.of("registrationName", "onVideoWaiting"))
                .put("onVideoStopped", MapBuilder.of("registrationName", "onVideoStopped"))
                .put("onLog", MapBuilder.of("registrationName", "onLog"))
                .put("onStatisticsUpdate", MapBuilder.of("registrationName", "onStatisticsUpdate"))
                .put("onThumbnailAvailable", MapBuilder.of("registrationName", "onThumbnailAvailable"))
                .put("onDownloadResChanged", MapBuilder.of("registrationName", "onDownloadResChanged"))
                .put("onBitratesAvailable", MapBuilder.of("registrationName", "onBitratesAvailable"))
                .put("onSelectedBitrateChanged", MapBuilder.of("registrationName", "onSelectedBitrateChanged"))
                .build();
    }
}
