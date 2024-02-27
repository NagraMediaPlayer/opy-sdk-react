// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
package com.nagra.otvplayer.react;

import android.util.Log;
import android.view.Gravity;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import android.widget.RelativeLayout;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.ReactContext;

import nagra.otv.sdk.OTVLog;


public class ReactOTVPlayerContainer extends FrameLayout {
  private static final String MODULE_NAME = "ReacOTVPlayertContainer";
  private static OTVLogReact OTV_LOG = null;
  private final  RelativeLayout mAdContainer;
  private final ReactUPIPlayer mPlayer;

  public ReactOTVPlayerContainer(@NonNull ReactContext reactContext) {
    super(reactContext);
    mAdContainer = new RelativeLayout(reactContext);
    mPlayer = new ReactUPIPlayer(reactContext, this);
    // ReactUPIPlayer will create a new OTVLogReact instance which can send logs to JS layer.
    OTV_LOG = OTVLogReact.getInstance(reactContext, mPlayer);
    OTV_LOG.i(MODULE_NAME,OTVLogReact.ENTER_AND_LEAVE);
  }

  public ReactUPIPlayer getPlayer() {
    OTV_LOG.v(MODULE_NAME, "Enter");
    OTV_LOG.v(MODULE_NAME, "Exit");
    return mPlayer;
  }

  public ViewGroup getAdContainer() {
    OTV_LOG.v(MODULE_NAME,OTVLogReact.ENTER_AND_LEAVE);
    return mAdContainer;
  }

  @Override
  public void onDetachedFromWindow() {
    OTVLog.i(MODULE_NAME,"onDetachedFromWindow");
    super.onDetachedFromWindow();
    OTVLog.i(MODULE_NAME,OTVLog.LEAVE);
  }


  @Override
  public void requestLayout() {
    OTVLog.v(MODULE_NAME,OTVLog.ENTER);
    super.requestLayout();

    // The advert view relies on a measure + layout pass happening after it calls
    // requestLayout().
    // If the view is not visible when an advert is requested it will timeout
    // with a 402 exception.
    post(measureAndLayout);
    OTVLog.v(MODULE_NAME,OTVLog.LEAVE);
  }

  private final Runnable measureAndLayout = new Runnable() {
    @Override
    public void run() {
      measure(MeasureSpec.makeMeasureSpec(getWidth(), MeasureSpec.EXACTLY),
          MeasureSpec.makeMeasureSpec(getHeight(), MeasureSpec.EXACTLY));
      layout(getLeft(), getTop(), getRight(), getBottom());
    }
  };

  public void refreshLayout() {
    post(measureAndLayout);
  }

}
