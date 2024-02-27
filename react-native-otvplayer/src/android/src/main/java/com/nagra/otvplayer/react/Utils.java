// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
package com.nagra.otvplayer.react;

import android.graphics.Color;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.NoSuchKeyException;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableType;
import com.facebook.react.bridge.UnexpectedNativeTypeException;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import nagra.otv.sdk.OTVTrackInfo;
import nagra.otv.upi.IOTVUPIEventListener;
import nagra.otv.upi.IOTVUPIEventListener.TrackInfo;
import nagra.otv.upi.OTVUPIThumbnailStyle;


public final class Utils {
    private static final String TAG = "Utils";
    private static final Map<Integer, String> AUDIOTYPEMAP = new HashMap<>();

    static {
        AUDIOTYPEMAP.put(TrackInfo.AUDIO_TRACK_ENCODING_TYPE_AAC, "AAC");
        AUDIOTYPEMAP.put(TrackInfo.AUDIO_TRACK_ENCODING_TYPE_AC3, "AC3");
        AUDIOTYPEMAP.put(TrackInfo.AUDIO_TRACK_ENCODING_TYPE_DTS, "DTS");
        AUDIOTYPEMAP.put(TrackInfo.AUDIO_TRACK_ENCODING_TYPE_MPEG, "MPEG");
    }

    private static final Map<Integer, String> TEXTTYPEMAP = new HashMap<>();

    static {
        TEXTTYPEMAP.put(TrackInfo.SUBTITLE_TRACK_ENCODING_TYPE_DVB_BITMAP, "DVB BITMAP");
        TEXTTYPEMAP.put(TrackInfo.SUBTITLE_TRACK_ENCODING_TYPE_EIA_608, "EIA 608");
        TEXTTYPEMAP.put(TrackInfo.SUBTITLE_TRACK_ENCODING_TYPE_EIA_708, "EIA 708");
        TEXTTYPEMAP.put(TrackInfo.SUBTITLE_TRACK_ENCODING_TYPE_ID3, "ID3");
        TEXTTYPEMAP.put(TrackInfo.SUBTITLE_TRACK_ENCODING_TYPE_SMPTE, "SMPTE");
        TEXTTYPEMAP.put(TrackInfo.SUBTITLE_TRACK_ENCODING_TYPE_SRT, "SRT");
        TEXTTYPEMAP.put(TrackInfo.SUBTITLE_TRACK_ENCODING_TYPE_WEBVTT, "WEBVTT");
    }

    private Utils() {
    }

    public static String getAudioTrackTypeString(int type) {
        return AUDIOTYPEMAP.containsKey(type) ? AUDIOTYPEMAP.get(type) : "UNKNOWN";
    }

    public static String getTextTrackTypeString(int type) {
        return TEXTTYPEMAP.containsKey(type) ? TEXTTYPEMAP.get(type) : "UNKNOWN";
    }

    public static int ColorWithHexString(String xColor, OTVLogReact xLog) {
        int color = 0xff000000; // Default black color
        String borderColor = "#000000";
        if (xColor.contains("#")) {
            switch (xColor.length()) {
                case 4: // handle format #rgb
                    // the color code can be obtained by converting #rgb to #rrggbb
                    borderColor = "#" + xColor.charAt(1) + xColor.charAt(1) + xColor.charAt(2) + xColor.charAt(2)
                            + xColor.charAt(3) + xColor.charAt(3);
                    break;
                case 5: // #rgba
                    // the color code can be obtained by converting #rgba to #aarrggbb
                    borderColor = "#" + xColor.charAt(4) + xColor.charAt(4) + xColor.charAt(1) + xColor.charAt(1)
                            + xColor.charAt(2) + xColor.charAt(2) + xColor.charAt(3) + xColor.charAt(3);
                    break;
                case 7: // #rrggbb
                    borderColor = xColor;
                    break;
                case 9: // #rrggbbaa
                    // #rrggbbaa format needs to be converted to #aarrggbb for android.
                    borderColor = "#" + xColor.substring(7, 9) + xColor.substring(1, 7);
                    break;
                default:
                    xLog.w(TAG,
                            "Invalid color value ,It should be hex value in the form #RGB,#RGBA,#RRGGBB,#RRGGBBAA");
                    break;
            }
        } else {
            // incase the color is passed with name, we will try to display supported color
            // names.
            borderColor = xColor;
        }

        try {
            color = Color.parseColor(borderColor);
        } catch (IllegalArgumentException e) {
            xLog.e(TAG, xColor + "Color string is not valid : " + e.getMessage());
        }

        xLog.i(TAG, "Thumbnail color " + color + " hex " + Integer.toHexString(color));
        return color;
    }

    public static int convertRgbaToArgb(int rgba, OTVLogReact xLog) {
        int color = (rgba >>> 8) | (rgba << (32 - 8));
        xLog.i(TAG, "Thumbnail color from int :" + color + " hex :" + Integer.toHexString(color));
        return color;
    }

    public static WritableArray makeTracks(List<TrackInfo> tracks, int trackType) {
        WritableArray tracksArray = Arguments.createArray();
        for (int index = 0; index < tracks.size(); index++) {
            IOTVUPIEventListener.TrackInfo track = tracks.get(index);

            int encodeType = track.mEncodeType;
            String EncStr = "UNKNOWN";
            WritableMap tTrack = Arguments.createMap();
            if (trackType == OTVTrackInfo.MEDIA_TRACK_TYPE_AUDIO) {
                switch (track.mEncodeType) {
                    case IOTVUPIEventListener.TrackInfo.AUDIO_TRACK_ENCODING_TYPE_AAC:
                        EncStr = "AAC";
                        break;
                    case IOTVUPIEventListener.TrackInfo.AUDIO_TRACK_ENCODING_TYPE_AC3:
                        EncStr = "AC3";
                        break;
                    case IOTVUPIEventListener.TrackInfo.AUDIO_TRACK_ENCODING_TYPE_DTS:
                        EncStr = "DTS";
                        break;
                    case IOTVUPIEventListener.TrackInfo.AUDIO_TRACK_ENCODING_TYPE_MPEG:
                        EncStr = "MPEG";
                        break;
                    default:
                        encodeType = 1000;
                        break;
                }
            } else if (trackType == OTVTrackInfo.MEDIA_TRACK_TYPE_TIMEDTEXT) {
                WritableArray characterArray = Arguments.createArray();
                tTrack.putArray("characteristics", characterArray);

                switch (track.mEncodeType) {
                    case IOTVUPIEventListener.TrackInfo.SUBTITLE_TRACK_ENCODING_TYPE_DVB_BITMAP:
                        EncStr = "DVB BITMAP";
                        break;
                    case IOTVUPIEventListener.TrackInfo.SUBTITLE_TRACK_ENCODING_TYPE_EIA_608:
                        EncStr = "EIA 608";
                        break;
                    case IOTVUPIEventListener.TrackInfo.SUBTITLE_TRACK_ENCODING_TYPE_EIA_708:
                        EncStr = "EIA 708";
                        break;
                    case IOTVUPIEventListener.TrackInfo.SUBTITLE_TRACK_ENCODING_TYPE_ID3:
                        EncStr = "ID3";
                        break;
                    case IOTVUPIEventListener.TrackInfo.SUBTITLE_TRACK_ENCODING_TYPE_SMPTE:
                        EncStr = "SMPTE";
                        break;
                    case IOTVUPIEventListener.TrackInfo.SUBTITLE_TRACK_ENCODING_TYPE_SRT:
                        EncStr = "SRT";
                        break;
                    case IOTVUPIEventListener.TrackInfo.SUBTITLE_TRACK_ENCODING_TYPE_WEBVTT:
                        EncStr = "WEBVTT";
                        break;
                    default:
                        encodeType = 1000;
                        break;
                }
            }

            tTrack.putString("title", track.mTitle + "[" + EncStr + "]");
            tTrack.putInt("encodeType", encodeType);
            tTrack.putString("language", track.mLanguage);

            tracksArray.pushMap(tTrack);
        }
        return tracksArray;
    }

    public static OTVUPIThumbnailStyle parseThumbnailStyle(ReadableMap thumbnailStyle, OTVLogReact xLog) {
        final String TOP = "top";
        final String LEFT = "left";
        final String WIDTH = "width";
        final String HEIGHT = "height";
        final String BORDER_WIDTH = "borderWidth";
        final String BORDER_COLOR = "borderColor";
        OTVUPIThumbnailStyle.Builder stylebBuilder = new OTVUPIThumbnailStyle.Builder();
        //Get position and size
        try {
            stylebBuilder.setLeft(thumbnailStyle.getInt(LEFT))
                    .setTop(thumbnailStyle.getInt(TOP))
                    .setWidth(thumbnailStyle.getInt(WIDTH))
                    .setHeight(thumbnailStyle.getInt(HEIGHT));
        } catch (NoSuchKeyException | UnexpectedNativeTypeException e) {
            xLog.w(TAG, e.getMessage());
            return null;
        }

        // Get border width
        try {
            stylebBuilder.setBorderWidth(thumbnailStyle.getInt(BORDER_WIDTH));
        } catch (NoSuchKeyException | UnexpectedNativeTypeException ex) {
            xLog.d(TAG, ex.getMessage());
            stylebBuilder.setBorderWidth(0); // set to 0
        }

        // Get border color
        try {
            if (thumbnailStyle.getType(BORDER_COLOR) == ReadableType.String) {
                stylebBuilder.setBorderColor(Utils.ColorWithHexString(thumbnailStyle.getString(BORDER_COLOR), xLog));
            } else {
                stylebBuilder.setBorderColor(Utils.convertRgbaToArgb(thumbnailStyle.getInt(BORDER_COLOR), xLog));
            }
        } catch (NoSuchKeyException | UnexpectedNativeTypeException ex) {
            xLog.d(TAG, ex.getMessage());
            stylebBuilder.setBorderColor(0xff000000); //BLACK
        }
        return stylebBuilder.build();
    }

    public static String getErrorMsgByType(int errorType) {
        String msg = "";
        switch (errorType) {
            case ReactUPIPlayer.THUMBNAIL_ERROR_STYLE:
                msg = "Thumbnail style error.";
                break;
            case ReactUPIPlayer.THUMBNAIL_ERROR_POSITION:
                msg = "Thumbnail position error.";
                break;
            case ReactUPIPlayer.THUMBNAIL_ERROR_NOT_AVAILABLE:
                msg = "thumbnails not available.";
                break;
            case ReactUPIPlayer.THUMBNAIL_ERROR_STATUS_UNKNOWN:
                msg = "Thumbnails status unknown.";
                break;
            default:
        }
        return msg;
    }
}
