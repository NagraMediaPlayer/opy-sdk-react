// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
package com.nagra.otvplayer.react;

import nagra.otv.sdk.OTVLog;
import nagra.otv.sdk.OTVTrackInfo;
import nagra.otv.sdk.OTVVideoView;
import nagra.otv.sdk.statistics.HTTPProcessing;
import nagra.otv.sdk.statistics.OTVNetworkStatisticsListener;

import java.util.List;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.events.RCTEventEmitter;

import androidx.core.util.Pair;

import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;

import nagra.otv.upi.IOTVUPIEventListener;
import nagra.otv.upi.IOTVUPIPlayer;
import nagra.otv.upi.OTVUPIEventListener;
import nagra.otv.upi.OTVUPISource;
import nagra.otv.upi.OTVUPIError;
import nagra.otv.upi.OTVUPIPlayerFactory;
import nagra.otv.upi.OTVUPIStatistics;
import nagra.otv.upi.OTVUPIStatisticsConfig;
import nagra.otv.upi.OTVUPIThumbnailStyle;

class ReactUPIPlayer {
    public static final String TAG = "ReactUPIPlayer";
    private static final int SECONDS_TO_MS = 1000;
    private static final int DISABLE_TEXT_TRACK = -1;
    private static final double LIVE_DURATION = -1; // because some react dependencies crash with INFINITY
    private static final String EVENT_PROP_FAST_FORWARD = "canPlayFastForward";
    private static final String EVENT_PROP_SLOW_FORWARD = "canPlaySlowForward";
    private static final String EVENT_PROP_SLOW_REVERSE = "canPlaySlowReverse";
    private static final String EVENT_PROP_REVERSE = "canPlayReverse";
    private static final String EVENT_PROP_STEP_FORWARD = "canStepForward";
    private static final String EVENT_PROP_STEP_BACKWARD = "canStepBackward";
    private static final String EVENT_PROP_URI = "src";
    private static final String EVENT_PROP_CONTENT_TYPE = "type";
    private static final String EVENT_PROP_DURATION = "duration";
    private static final String EVENT_PROP_PLAYABLE_DURATION = "playableDuration";
    private static final String EVENT_PROP_SEEKABLE_DURATION = "seekableDuration";
    private static final String EVENT_PROP_CURRENT_POSITION = "currentPosition";
    private static final String EVENT_PROP_CURRENT_TIME = "currentTime";
    private static final String EVENT_PROP_SEEK_POSITION = "seekPosition";
    private static final String EVENT_PROP_NATURAL_SIZE = "naturalSize";
    private static final String EVENT_PROP_WIDTH = "width";
    private static final String EVENT_PROP_HEIGHT = "height";
    private static final String EVENT_PROP_ORIENTATION = "orientation";

    private static final String EVENT_ON_VIDEO_WAITING = "onVideoWaiting";
    private static final String EVENT_ON_VIDEO_STOPPED = "onVideoStopped";
    private static final String EVENT_ON_VIDEO_ERROR = "onVideoError";
    private static final String EVENT_ON_VIDEO_PLAYING = "onVideoPlaying";
    private static final String EVENT_ON_VIDEO_PLAY = "onVideoPlay";
    private static final String EVENT_ON_VIDEO_PAUSED = "onVideoPaused";
    private static final String EVENT_ON_VIDEO_END = "onVideoEnd";
    private static final String EVENT_ON_VIDEO_SEEK = "onVideoSeek";
    private static final String EVENT_ON_STATISTICS_UPDATE = "onStatisticsUpdate";
    private static final String EVENT_ON_VIDEO_PROGRESS = "onVideoProgress";
    private static final String EVENT_ON_VIDEO_LOAD = "onVideoLoad";
    private static final String EVENT_ON_VIDEO_LOAD_START = "onVideoLoadStart";
    private static final String EVENT_ON_AUDIO_TRACK_SELECTED = "onAudioTrackSelected";
    private static final String EVENT_ON_TEXT_TRACK_SELECTED = "onTextTrackSelected";
    private static final String EVENT_ON_TRACKS_CHANGED = "onTracksChanged";
    private static final String EVENT_ON_THUMBNAIL_AVAILABLE = "onThumbnailAvailable";
    private static final String EVENT_ON_VIDEO_HTTP_ERROR = "onVideoHttpError";

    protected static final int THUMBNAIL_ERROR_ITEM = 7020;
    protected static final int THUMBNAIL_ERROR_POSITION = 7021;
    protected static final int THUMBNAIL_ERROR_STYLE = 7022;
    protected static final int THUMBNAIL_ERROR_NOT_AVAILABLE = 7023;
    protected static final int THUMBNAIL_ERROR_STATUS_UNKNOWN = 7024;

    private static OTVLogReact OTV_LOG = null;
    private final ReactContext mReactContext;
    private final IOTVUPIPlayer mUPIPlayer;
    private Boolean mAutoplay = null;

    // Reference to the parent view that React uses for listening to events
    final View mParentView;
    private Double mDuration = null;
    private Double mThumbnailPosition = null;
    private Boolean mThumbnailDisplay = null;
    private OTVUPIThumbnailStyle mThumbnailStyle;
    private boolean mThumbnailAvailable = false;
    private Boolean mNoThumbnails = null;

    //define Player event listener.
    private class EventListener extends OTVUPIEventListener {
        @Override
        public void onLoad(int xDurationMs, int xTrickModeFlags,
                           @NonNull IOTVUPIEventListener.NaturalSize xNaturalSize) {
            dispatchOnLoad(xDurationMs, xTrickModeFlags, xNaturalSize);
        }

        @Override
        public void onTracksChanged(@NonNull List<IOTVUPIEventListener.TrackInfo> xTextTrackList,
                                    @NonNull List<IOTVUPIEventListener.TrackInfo> xAudioTrackList,
                                    @NonNull List<IOTVUPIEventListener.TrackInfo> xVideoTrackList) {
            dispatchOnTracksChanged(xTextTrackList, xAudioTrackList, xVideoTrackList);
        }

        @Override
        public void onProgress(long xCurrentTimeMs, int xCurrentPositionMs, int xPlayableDurationMs,
                               int xSeekableDurationMs) {
            dispatchOnProgress(xCurrentTimeMs, xCurrentPositionMs, xPlayableDurationMs, xSeekableDurationMs);
        }

        @Override
        public void onStatisticsUpdate(OTVUPIStatistics xStatistics, int xEnabledStatistics) {
            dispatchOnStatisticsUpdate(xStatistics, xEnabledStatistics);
        }

        @Override
        public void onSeek(int xCurrentPositionMs, int xSeekPositionMs) {
            dispatchOnSeek(xCurrentPositionMs, xSeekPositionMs);
        }

        @Override
        public void onEnd() {
            fireJSEvent(EVENT_ON_VIDEO_END);
        }

        @Override
        public void onWaiting() {
            fireJSEvent(EVENT_ON_VIDEO_WAITING);
        }

        @Override
        public void onPlaying() {
            fireJSEvent(EVENT_ON_VIDEO_PLAYING);
        }

        @Override
        public void onPaused() {
            fireJSEvent(EVENT_ON_VIDEO_PAUSED);
        }

        @Override
        public void onPlay() {
            fireJSEvent(EVENT_ON_VIDEO_PLAY);
        }

        @Override
        public void onStopped() {
            fireJSEvent(EVENT_ON_VIDEO_STOPPED);
        }

        /**
         * Gets called when the audio track selection takes effect.
         *
         * @param xIndex the index of audio track in the audio tracks array.
         */
        @Override
        public void onAudioTrackSelected(int xIndex) {
            dispatchOnTrackSelected(xIndex, OTVTrackInfo.MEDIA_TRACK_TYPE_AUDIO);
        }

        /**
         * Gets called when the text track selection takes effect.
         *
         * @param xIndex the index of text track in the text tracks array.
         */
        @Override
        public void onTextTrackSelected(int xIndex) {
            dispatchOnTrackSelected(xIndex, OTVTrackInfo.MEDIA_TRACK_TYPE_TIMEDTEXT);
        }

        /**
         * Gets called on playback error
         *
         * @param xError OTVUPIError object
         */
        @Override
        public void onError(@NonNull OTVUPIError xError) {
            dispatchOnVideoError(xError);
        }

        /**
         * Gets called on thumbnail is available
         */
        @Override
        public void onThumbnailAvailable() {
            if (!mThumbnailAvailable) {
                mThumbnailAvailable = true;
                fireJSEvent(EVENT_ON_THUMBNAIL_AVAILABLE);
                handleSetThumbnail();
            }
        }

        @Override
        public void onThumbnailNotAvailable() {
            OTVLog.i(TAG, "The stream does not contain thumbnails ");
            mNoThumbnails = true;
        }

        @Override
        public void onDownloadResolutionChanged(Pair<Integer, Integer> xResolution) {
            dispatchOnDownloadResolutionChanged(xResolution);
        }

        @Override
        public void onSelectedBitrateChanged(int xBitrate) {
            dispatchOnSelectedBitrateChanged(xBitrate);
        }

        @Override
        public void onBitratesAvailable(int[] xAvailableBitrates) {
            dispatchOnBitratesAvailable(xAvailableBitrates);
        }

        private void dispatchOnTracksChanged(List<IOTVUPIEventListener.TrackInfo> mSubtitleTracks,
                                             List<IOTVUPIEventListener.TrackInfo> mAudioTracks, List<IOTVUPIEventListener.TrackInfo> mVideoTracks) {
            OTV_LOG.v(TAG, "Dispatch OnTracksChanged");
            WritableMap event = Arguments.createMap();

            WritableArray audioTracksArray = makeAudioTracks(mAudioTracks);
            WritableArray textTracksArray = makeTextTracks(mSubtitleTracks);
            event.putArray("audioTracks", audioTracksArray);
            event.putArray("textTracks", textTracksArray);

            fireJSEvent(EVENT_ON_TRACKS_CHANGED, event);
        }

        private void dispatchOnTrackSelected(int index, int trackType) {

            if ((trackType == OTVTrackInfo.MEDIA_TRACK_TYPE_TIMEDTEXT)) {
                WritableMap event = Arguments.createMap();
                OTV_LOG.d(TAG, "DispatchOnTextTrackSelected " + index);
                event.putInt("index", index);
                fireJSEvent(EVENT_ON_TEXT_TRACK_SELECTED, event);

            } else if ((trackType == OTVTrackInfo.MEDIA_TRACK_TYPE_AUDIO)) {
                WritableMap event = Arguments.createMap();
                OTV_LOG.d(TAG, "DispatchOnAudioTrackSelected " + index);
                event.putInt("index", index);
                fireJSEvent(EVENT_ON_AUDIO_TRACK_SELECTED, event);
            }
        }

        private void dispatchOnLoad(int xDurationMs, int xTrickModeFlags,
                                    @NonNull IOTVUPIEventListener.NaturalSize xNaturalSize) {
            OTV_LOG.v(TAG, "Dispatch OnLoad");
            WritableMap event = Arguments.createMap();

            double realDuration = xDurationMs / 1000D;
            if (realDuration < 0.1) { // short enough duration value to show that we are not VOD
                // Due to a current issue (OTVPL-3230) with React we will not be using INFINITY
                // values
                // realDuration = Double.POSITIVE_INFINITY;
                realDuration = LIVE_DURATION;
            }

            event.putDouble(EVENT_PROP_DURATION, realDuration);

            WritableMap naturalSize = Arguments.createMap();

            int width = xNaturalSize.mWidth;
            int height = xNaturalSize.mHeight;
            naturalSize.putInt(EVENT_PROP_WIDTH, width);
            naturalSize.putInt(EVENT_PROP_HEIGHT, height);
            if (width > height) {
                naturalSize.putString(EVENT_PROP_ORIENTATION, "landscape");
            } else {
                naturalSize.putString(EVENT_PROP_ORIENTATION, "portrait");
            }
            event.putMap(EVENT_PROP_NATURAL_SIZE, naturalSize);

            // TODO: Does Exoplayer actually support these? Possibly iOS only.
            event.putBoolean(EVENT_PROP_FAST_FORWARD, true);
            event.putBoolean(EVENT_PROP_SLOW_FORWARD, true);
            event.putBoolean(EVENT_PROP_SLOW_REVERSE, true);
            event.putBoolean(EVENT_PROP_REVERSE, true);
            event.putBoolean(EVENT_PROP_FAST_FORWARD, true);
            event.putBoolean(EVENT_PROP_STEP_BACKWARD, true);
            event.putBoolean(EVENT_PROP_STEP_FORWARD, true);

            fireJSEvent(EVENT_ON_VIDEO_LOAD, event);
        }

        private boolean shouldFireProgressEvent() {
            if (mUPIPlayer.getOTVPlayer() instanceof OTVVideoView) {
                OTVVideoView player = (OTVVideoView) mUPIPlayer.getOTVPlayer();
                if (player.getDuration() >= 0 && !player.isPlaying()) {
                    // VOD and not isPlaying
                    OTVLog.d(TAG, "onProgress event should not be fired when player is not playing status for VOD");
                    return false;
                }
            }
            return true;
        }

        private void dispatchOnProgress(long xCurrentTimeMs, int xCurrentPositionMs, int xPlayableDurationMs,
                                        int xSeekableDurationMs) {
            if (!shouldFireProgressEvent()) return;

            WritableMap event = Arguments.createMap();
            // All values converted to seconds
            event.putDouble(EVENT_PROP_CURRENT_POSITION, (double) xCurrentPositionMs / SECONDS_TO_MS);
            event.putDouble(EVENT_PROP_PLAYABLE_DURATION, (double) xPlayableDurationMs / SECONDS_TO_MS);
            event.putDouble(EVENT_PROP_SEEKABLE_DURATION, (double) xSeekableDurationMs / SECONDS_TO_MS);
            event.putDouble(EVENT_PROP_CURRENT_TIME, (double) xCurrentTimeMs / SECONDS_TO_MS);

            mDuration = event.getDouble(EVENT_PROP_SEEKABLE_DURATION);

            fireJSEvent(EVENT_ON_VIDEO_PROGRESS, event);
        }

        private WritableArray makeBitrateArray(int[] bitrates) {
            WritableArray availableBitrates = Arguments.createArray();
            for (int bitrate : bitrates) {
                availableBitrates.pushInt(bitrate);
            }
            return availableBitrates;
        }

        private void dispatchOnStatisticsUpdate(OTVUPIStatistics xStatistics, int xEnabledStatistics) {
            WritableMap event = Arguments.createMap();

            if ((xEnabledStatistics & OTVUPIStatisticsConfig.NETWORK_STATISTICS) != 0) {
                WritableMap network =Arguments.createMap();
                OTVUPIStatistics.AdaptiveStreaming adStrStats = xStatistics.getNetwork().getAdaptiveStreaming();
                WritableMap adaptiveStreaming =Arguments.createMap();
                adaptiveStreaming.putArray("availableBitrates", makeBitrateArray(adStrStats.getAvailableBitrates()));
                adaptiveStreaming.putInt("selectedBitrate", adStrStats.getSelectedBitrate());
                adaptiveStreaming.putInt("bitrateSwitches", adStrStats.getBitrateSwitches());
                adaptiveStreaming.putInt("bitrateDowngrade", adStrStats.getBitrateDowngrades());
                adaptiveStreaming.putDouble("averageBitrate", adStrStats.getAverageBitrate());
                network.putMap("adaptiveStreaming", adaptiveStreaming);
                // Not supported on Android:
                // * averageVideoBitrate
                // * averageAudioBitrate

                OTVUPIStatistics.NetworkUsage netUseStats = xStatistics.getNetwork().getNetworkUsage();
                WritableMap networkUsage =Arguments.createMap();
                networkUsage.putDouble("bytesDownloaded", netUseStats.getBytesDownloaded());
                networkUsage.putInt("downloadBitrate", netUseStats.getDownloadBitrate());
                networkUsage.putInt("downloadBitrateAverage", netUseStats.getDownloadBitrateAverage());
                network.putMap("networkUsage", networkUsage);
                // Not supported on Android:
                // * numberOfMediaRequests
                // * transferDuration
                // * downloadsOverdue

                OTVUPIStatistics.ContentServer conSerStats = xStatistics.getNetwork().getContentServer();
                WritableMap contentServer =Arguments.createMap();
                contentServer.putString("finalURL", conSerStats.getFinalURL());
                contentServer.putString("url", conSerStats.getURL());
                network.putMap("contentServer", contentServer);
                event.putMap("network", network);
                // Not supported on Android:
                // * finalIPAddress
                // * numberOfServerAddressChanges
            }

            if ((xEnabledStatistics & OTVUPIStatisticsConfig.PLAYBACK_STATISTICS) != 0) {
                OTVUPIStatistics.Player playerStats = xStatistics.getPlayback().getPlayer();
                WritableMap playback =Arguments.createMap();
                playback.putDouble("bufferedDuration", playerStats.getBufferedDurationMs());
                WritableMap resolution = Arguments.createMap();
                resolution.putInt("width", playerStats.getSelectedResolution().first);
                resolution.putInt("height", playerStats.getSelectedResolution().second);
                playback.putMap("selectedResolution",resolution);
                playback.putInt("streamBitrate", playerStats.getStreamBitrate());
                event.putMap("playback", playback);
                // Not supported on Android:
                // * availableResolutions
                // * startUpTime
                // * numberOfStalls
                // * playbackType
                // * playbackStartDate
                // * playbackStartOffset
            }

            if ((xEnabledStatistics & OTVUPIStatisticsConfig.RENDERING_STATISTICS) != 0) {
                OTVUPIStatistics.Rendering renderStats = xStatistics.getPlayback().getRendering();
                WritableMap rendering =Arguments.createMap();
                rendering.putInt("frameDrops", renderStats.getFrameDrops());
                rendering.putInt("frameDropsPerSecond", renderStats.getFrameDropsPerSecond());
                rendering.putInt("framesPerSecond", renderStats.getFramesPerSecond());
                rendering.putInt("framesPerSecondNominal", renderStats.getFramesPerSecondNominal());
                event.putMap("rendering", rendering);
            }

            fireJSEvent(EVENT_ON_STATISTICS_UPDATE, event);
        }

        private void dispatchOnSeek(int xCurrentPositionMs, int mSeekPositionMs) {
            OTV_LOG.v(TAG, "Dispatch OnSeek");
            WritableMap event = Arguments.createMap();
            event.putDouble(EVENT_PROP_SEEK_POSITION, (double) mSeekPositionMs / SECONDS_TO_MS);
            event.putDouble(EVENT_PROP_CURRENT_POSITION, (double) xCurrentPositionMs / SECONDS_TO_MS);

            fireJSEvent(EVENT_ON_VIDEO_SEEK, event);
        }

        private void dispatchOnDownloadResolutionChanged(Pair<Integer, Integer> xResolution) {
            OTV_LOG.v(TAG, "Dispatch onDownloadResolutionChanged");
            WritableMap event = Arguments.createMap();

            event.putInt("width", xResolution.first);
            event.putInt("height", xResolution.second);

            mReactContext.getJSModule(RCTEventEmitter.class).receiveEvent(mParentView.getId(), "onDownloadResChanged",
                    event);
        }

        private void dispatchOnBitratesAvailable(int[] xAvailableBitrates) {
            OTV_LOG.v(TAG, "Dispatch onBitratesAvailable");
            if (xAvailableBitrates != null) {
                WritableMap event = Arguments.createMap();

                event.putArray("availableBitrates", makeBitrateArray(xAvailableBitrates));

                mReactContext.getJSModule(RCTEventEmitter.class).receiveEvent(mParentView.getId(), "onBitratesAvailable",
                        event);
            }
        }

        private void dispatchOnSelectedBitrateChanged(int xBitrate) {
            OTV_LOG.v(TAG, "Dispatch onSelectedBitrateChanged ");
            WritableMap event = Arguments.createMap();
            event.putInt("selectedBitrate", xBitrate);
            mReactContext.getJSModule(RCTEventEmitter.class).receiveEvent(mParentView.getId(), "onSelectedBitrateChanged",
                    event);
        }

        private WritableArray makeAudioTracks(List<IOTVUPIEventListener.TrackInfo> tracks) {
            return Utils.makeTracks(tracks, OTVTrackInfo.MEDIA_TRACK_TYPE_AUDIO);
        }

        private WritableArray makeTextTracks(List<IOTVUPIEventListener.TrackInfo> tracks) {
            return Utils.makeTracks(tracks, OTVTrackInfo.MEDIA_TRACK_TYPE_TIMEDTEXT);
        }
    } // end of EventListener

    // define network statistics listener.
    private class NetworkStatisticsListener implements OTVNetworkStatisticsListener {
        @Override
        public void availableBitratesChanged(int[] xNewAvailableBitrates) {
            OTV_LOG.d(ReactUPIPlayer.TAG, "availableBitratesChanged");
        }

        @Override
        public void selectedBitrateChanged(int xNewSelectedBitrate) {
           OTV_LOG.d(ReactUPIPlayer.TAG, "selectedBitrateChanged");
        }

        @Override
        public void urlChanged(String xNewUrl, String xNewFinalUrl) {
            OTV_LOG.d(ReactUPIPlayer.TAG, "urlChanged");
        }

        @Override
        public void errorChanged(int xErrorCode, String xErrorMessage) {
            OTV_LOG.e(ReactUPIPlayer.TAG, "errorChanged");
        }

        @Override
        public void httpProcessingEnded(HTTPProcessing xHttpProcessing) {
            OTV_LOG.d(ReactUPIPlayer.TAG, "httpProcessingEnded");
        }
        @Override
        public void httpProcessingError(@NonNull HTTPProcessing xHttpProcessing) {
            WritableMap event = Arguments.createMap();
            event.putString("url", xHttpProcessing.getUrl());
            event.putInt("date", (int)(xHttpProcessing.getEndTime()/SECONDS_TO_MS));
            event.putInt("statusCode", xHttpProcessing.getStatus());
            event.putString("message", xHttpProcessing.getErrorMessage());

            WritableMap platform = Arguments.createMap();
            platform.putString("name", "Android");
            // response error body is only available for error code >= 400
            byte[] responseBody = xHttpProcessing.getResponseBody();
            String responseStr = responseBody != null ? new String(responseBody) : null;
            WritableArray dataArray = Arguments.createArray();
            dataArray.pushString(responseStr);
            platform.putArray("data", dataArray);
            event.putMap("platform", platform);
            OTV_LOG.e(ReactUPIPlayer.TAG, "httpProcessingError: " + event);
            fireJSEvent(EVENT_ON_VIDEO_HTTP_ERROR, event);
        }
    }

    private final IOTVUPIEventListener RCTUPIEventListener = new EventListener();

    private final OTVNetworkStatisticsListener RCTNetworkStatisticsListener = new NetworkStatisticsListener();

    public ReactUPIPlayer(ReactContext context, View parentView) {
        mReactContext = context;
        mParentView = parentView;
        mUPIPlayer = OTVUPIPlayerFactory.createPlayer(context, new OTVUPISource(), RCTUPIEventListener);
        addNetworkStatisticsListener();
        OTV_LOG = OTV_LOG.getInstance(mReactContext, this);
        OTV_LOG.i(TAG, "React UPI Player object created.");
    }

    public void setSource(OTVUPISource src) {
        OTV_LOG.i(TAG, "set source: " + src);
        mUPIPlayer.detachPlayerView();
        resetThumbnail();
        mDuration = null;
        mUPIPlayer.setView((ViewGroup) mParentView);
        if (mAutoplay == null) {
            // set autoplay default value to false.
            mUPIPlayer.setAutoplay(false);
        }
        mUPIPlayer.setSource(src);
        dispatchOnLoadStart(src);
    }

    public void setAutoplayEnabled(boolean enabled) {
        OTV_LOG.i(TAG, "set autoplay enabled: " + enabled);
        mAutoplay = enabled;
        mUPIPlayer.setAutoplay(enabled);
    }

    public void setPlaybackRate(float rate) {
        OTV_LOG.i(TAG, "set playback rate: " + rate);
        mUPIPlayer.setPlaybackRate(rate);
    }

    public void setVolume(float volume) {
        OTV_LOG.i(TAG, "set volume: " + volume);
        mUPIPlayer.setVolume(volume);
    }

    public void setPaused(boolean paused) {
        OTV_LOG.i(TAG, "set paused: " + paused);
        if (paused) {
            mUPIPlayer.pause();
        } else {
            mUPIPlayer.play();
        }
    }

    public void setStatisticsConfig(@NonNull OTVUPIStatisticsConfig xConfig) {
        OTV_LOG.i(TAG, String.format("Statistics enabled: 0x%02X", xConfig.getStatisticsTypes()));
        OTV_LOG.i(TAG, "Statistics update interval: " + xConfig.getStatisticsUpdateInterval() + "ms");
        mUPIPlayer.setStatisticsConfig(xConfig);
    }

    public void setMuted(boolean muted) {
        OTV_LOG.i(TAG, "set muted: " + muted);
        mUPIPlayer.setMuted(muted);
    }

    public void setProgressUpdateInterval(float intervalSeconds) {
        int intervalMs = Math.round(intervalSeconds * SECONDS_TO_MS);
        OTV_LOG.i(TAG, "setProgressUpdateInterval to milliseconds: " + intervalMs);
        if (intervalMs > 0) {
            mUPIPlayer.setProgressUpdateInterval(intervalMs);
        }
    }

    public void seek(double xSeekToSeconds) {
        OTV_LOG.i(TAG, "seek to seconds: " + xSeekToSeconds);
        // aligned api is seek in seconds, so we convert to ms
        mUPIPlayer.seek((int) (xSeekToSeconds * SECONDS_TO_MS));
    }

    public void stop() {
        mUPIPlayer.detachPlayerView();
        resetThumbnail();
        mUPIPlayer.stop();
    }

    private void resetThumbnail() {
        mThumbnailPosition = null;
        mThumbnailDisplay = null;
        mThumbnailAvailable = false;
        mNoThumbnails = null;
        mThumbnailStyle = null;
    }

    public void play() {
        mUPIPlayer.play();
    }

    private void parseThumbnailProperties(ReadableMap xThumbnail) {
        final String DISPLAY = "display";
        final String POSITION = "positionInSeconds";
        final String STYLE = "style";
        if (xThumbnail.hasKey(DISPLAY)) mThumbnailDisplay = xThumbnail.getBoolean(DISPLAY);
        // Skip parsing style and position if disply is false.
        if (Boolean.TRUE.equals(mThumbnailDisplay)) {
            if (xThumbnail.hasKey(POSITION)) mThumbnailPosition = xThumbnail.getDouble(POSITION);
            if (xThumbnail.hasKey(STYLE)) {
                mThumbnailStyle = Utils.parseThumbnailStyle(xThumbnail.getMap(STYLE), OTV_LOG);
            }
        }
    }

    public void setThumbnail(ReadableMap xThumbnail) {
        OTV_LOG.i(TAG, "Set Thumbnail: " + xThumbnail.toString());
        // pause current thumbnail settings.
        parseThumbnailProperties(xThumbnail);
        handleSetThumbnail();
        OTV_LOG.i(TAG, "Set thumbnail leave.");
    }

    private void handleSetThumbnail() {
        if (Boolean.TRUE.equals(mThumbnailDisplay)) {
            // check if thumbnail is available.
            if (!checkAndFireThumbnailStatusError()) {
                return;
            }
            // check style is valid
            boolean styleValid = mThumbnailStyle != null
                    && checkStyleSize(mThumbnailStyle.width, mThumbnailStyle.height);
            if (!styleValid) {
                hideThumbnailView();
                fireThumbnailError(THUMBNAIL_ERROR_STYLE);
                return;
            } else {
                // set new style
                mUPIPlayer.setThumbnailStyle(mThumbnailStyle);
            }
            // check position is valid.
            if (!checkPositionError()) {
                hideThumbnailView();
                fireThumbnailError(THUMBNAIL_ERROR_POSITION);
                return;
            } else if (mThumbnailPosition != null) {
                // set new position.
                mUPIPlayer.setThumbnailPosition((int) (mThumbnailPosition * SECONDS_TO_MS));
            }
            mUPIPlayer.setDisplayThumbnail(true);
        } else if (mThumbnailAvailable) {
            hideThumbnailView();
        }
    }

    private boolean checkAndFireThumbnailStatusError() {
        if (!mThumbnailAvailable) {
            int errorType;
            if (Boolean.TRUE.equals(mNoThumbnails)) {
                errorType = THUMBNAIL_ERROR_NOT_AVAILABLE;
            } else {
                errorType = THUMBNAIL_ERROR_STATUS_UNKNOWN;
            }
            fireThumbnailError(errorType);
            return false;
        }
        return true;
    }

    private boolean checkPositionError() {
        if (mThumbnailPosition != null) {
            if (mThumbnailPosition < 0 || (mDuration != null && mThumbnailPosition > mDuration)) {
                return false;
            }
        }
        return true;
    }

    private void hideThumbnailView() {
        mUPIPlayer.setDisplayThumbnail(false);
        mThumbnailDisplay = false;
    }

    private void fireThumbnailError(int errorType) {
        String msg = Utils.getErrorMsgByType(errorType);
        OTV_LOG.w(TAG, msg);
        OTVUPIError error = new OTVUPIError(errorType, 0, 0, msg);
        dispatchError(error);
    }

    private boolean checkStyleSize(int width, int height) {
        int viewWidth = mParentView.getWidth();
        int viewHeight = mParentView.getHeight();
        if (width <= 0 || height <= 0 ||
                (viewWidth > 0 && viewWidth < width) ||
                (viewHeight > 0 && viewHeight < height)) {
            OTV_LOG.w(TAG, "the size in style is invalid: width " + width + " height " + height
                    + " view width " + viewWidth + " view height " + viewHeight);
            return false;
        }
        return true;
    }

    // The color passed from react app will be in 0xrrggbbaa format ,which needs to
    // converted to 0xaarrggbb for android.

    public void addTextTrack(String url, String mimeType, String language) {
        OTV_LOG.i(TAG, "add text track: " + mimeType + ", lang: " + language);
        mUPIPlayer.addTextTrack(url, mimeType, language);
    }

    public void setSelectedAudioTrack(int index) {
        String selectedTrack = "select track index for audio from audio tracks array : " + index;
        OTV_LOG.i(TAG, "Selected track: " + selectedTrack);
        mUPIPlayer.setSelectedAudioTrack(index);
    }

    public void setSelectedTextTrack(int index) {
        mUPIPlayer.setSelectedTextTrack(index);
    }

    public void setMaxBitrate(int bitrate) {
        mUPIPlayer.setMaxBitrate(bitrate);
    }

    public void setMaxResolution(Pair<Integer, Integer> resolution) {
        mUPIPlayer.setMaxResolution(resolution);
    }

    public void dispatchError(OTVUPIError xError) {
        dispatchOnVideoError(xError);
    }

    private void dispatchOnLoadStart(OTVUPISource src) {
        OTV_LOG.v(TAG, "Dispatch OnLoadStart");

        String contentType = src.getType();
        // Following iOS here. Android Exo example sends a NULL event!!!
        WritableMap event = Arguments.createMap();

        event.putString(EVENT_PROP_URI, src.getSrc());
        event.putString(EVENT_PROP_CONTENT_TYPE, contentType);

        fireJSEvent(EVENT_ON_VIDEO_LOAD_START, event);
    }

    private void dispatchOnVideoError(OTVUPIError xError) {
        OTV_LOG.e(TAG, "Dispatch onVideoError");
        // Android gives us a pair of ints and little else. Trying to align with iOS.
        int errorCode = xError.getCode();

        final int ERROR_THUMBNAIL = 9000;
        //covert thumbnail error code
        if (errorCode == ERROR_THUMBNAIL) {
            errorCode = THUMBNAIL_ERROR_ITEM;
        }

        String errorString = xError.getDetails().getMessage();

        WritableMap details = Arguments.createMap();
        details.putInt("what", xError.getDetails().getWhat());
        details.putInt("extra", xError.getDetails().getExtra());
        details.putString("message", errorString);

        WritableMap native_Error = Arguments.createMap();
        native_Error.putString("platform", "Android");
        native_Error.putMap("details", details);

        WritableMap event = Arguments.createMap();
        event.putInt("code", errorCode);
        event.putMap("nativeError", native_Error);

        fireJSEvent(EVENT_ON_VIDEO_ERROR, event);
    }

    private void fireJSEvent(String xEventName) {
        fireJSEvent(xEventName, Arguments.createMap());
    }

    private void fireJSEvent(String xEventName, WritableMap xEvent) {
        OTV_LOG.i(TAG, "Dispatch " + xEventName);
        mReactContext.getJSModule(RCTEventEmitter.class).receiveEvent(mParentView.getId(), xEventName, xEvent);
    }

    // Add network statistics listener to player for http error.
    private void addNetworkStatisticsListener() {
        OTVVideoView player = (OTVVideoView) mUPIPlayer.getOTVPlayer();
        if (player != null) {
            player.getNetworkStatistics().addNetworkStatisticsListener(RCTNetworkStatisticsListener);
        }
    }

}
