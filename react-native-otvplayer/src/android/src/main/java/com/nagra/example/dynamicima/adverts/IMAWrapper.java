// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
package com.nagra.example.dynamicima.adverts;

import static java.lang.Math.abs;

import com.google.ads.interactivemedia.v3.api.AdDisplayContainer;
import com.google.ads.interactivemedia.v3.api.AdErrorEvent;
import com.google.ads.interactivemedia.v3.api.AdEvent;
import com.google.ads.interactivemedia.v3.api.AdsLoader;
import com.google.ads.interactivemedia.v3.api.AdsManager;
import com.google.ads.interactivemedia.v3.api.AdsManagerLoadedEvent;
import com.google.ads.interactivemedia.v3.api.AdsRequest;
import com.google.ads.interactivemedia.v3.api.CompanionAdSlot;
import com.google.ads.interactivemedia.v3.api.ImaSdkFactory;
import com.google.ads.interactivemedia.v3.api.ImaSdkSettings;
import com.google.ads.interactivemedia.v3.api.player.ContentProgressProvider;
import com.google.ads.interactivemedia.v3.api.player.VideoProgressUpdate;

import java.util.ArrayList;
import java.util.List;

import android.content.Context;
import android.util.Log;
import android.util.Pair;
import android.view.View;
import android.view.ViewGroup;

import nagra.otv.sdk.OTVSDK;
import nagra.otv.sdk.OTVLog;

/**
 * The IMAWrapper provides a quick and easy way to implement ad insertions
 * <p>
 * This class utilises Google's Interactive Media Ads (IMA) SDK to access Ad Servers (ADSs),
 * fetch and present linear and non-linear content, by implementing the VAST and VMAP standards.
 * <p>
 * The main steps using this class are
 * <ul>
 * <li> Class construction </li>
 * <li> Starting the IMA services </li>
 * <li> Requesting the ads using the tag </li>
 * </ul>
 * <p>
 * <h3>Class construction</h3>
 * During the construction, the application should provide the context reference and a reference to
 * the class implementing the {@link IMAWrapperDelegate IMAWrapperDelegeate} interface.
 * The delegate assignment may be deferred to a later stage using
 * {@link #setDelegate(IMAWrapperDelegate)}
 * <h3>Starting the IMA services</h3>
 * Once the class is initialised, use
 * {@link #startAdsServices(ViewGroup)} to start the communications with
 * the IMA services. You need to provide the UI container of the video view (on which the adverts
 * will be presented).
 * <p>
 * The above two steps can be done once per application run, then the following step, requesting the
 * ads should be performed once prior to playback of each content.
 * <h3>Requesting the ads</h3>
 * Using the {@link #requestAds(String xAdTag)} with an ads tag URL will prepare a set of adverts,
 * as specified in the tag. Based on the tag, the adverts type (linear, non-linear, skippable, pods,
 * etc.) and their schedule (pre-, mid- or post- roll), the adverts will be presented.
 * <p>
 * <h3>The IMAWrapperDelegate interface</h3>
 * The application must implement a set of functions and provide {@link IMAWrapper} with a reference
 * to the implementation class. These delegate functions provide the wrapper with the necessary
 * information and actions for IMA to insert adverts smoothly and timely - pausing/resuming
 * playback, getting playback position/duration and letting the application know when all scheduled
 * adverts have been completed.
 */
public class IMAWrapper implements AdErrorEvent.AdErrorListener, AdEvent.AdEventListener, AdsLoader.AdsLoadedListener {
  private static String TAG = "IMAWrapper";

  private IMAWrapperDelegate mDelegate;
  private ImaSdkFactory mSdkFactory;
  private AdsLoader mAdsLoader;
  private AdsManager mAdsManager;

  private Context mContext;

  private boolean mIsAdDisplayed = false;
  private boolean mAllAdsCompleted = true;
  private List<Float> mCuePoints;
  private ViewGroup mAdUiContainer;
  private AdDisplayContainer mAdDisplayContainer;
  private List<CompanionAdSlot> mCompanionAdSlots;

  public IMAWrapper(Context xContext) {
    mContext = xContext;
  }

  /**
   * The class' constructor
   *
   * @param xContext the application environment's context
   * @param xDelegate the class implementing the {@link IMAWrapperDelegate} interface
   */
  public IMAWrapper(Context xContext, IMAWrapperDelegate xDelegate) {
    this(xContext);

    OTVLog.i(TAG, "IMA Wrapper Create with delegate!");
    mDelegate = xDelegate;
  }

  ImaSdkFactory getFactoryInstanceWrapped() {
    return ImaSdkFactory.getInstance();
  }

  /**
   * Called to set a reference to the class that should implement the IMAWrapperDelegate interface.
   * Not required if the delegate reference was provided with the constructor, unless it has
   * changed.
   *
   * @param xDelegate the class implementing the {@link IMAWrapperDelegate} interface
   */
  public void setDelegate(IMAWrapperDelegate xDelegate) {
    OTVLog.i(TAG, "setDelegate: Enter with delegate - " + mDelegate + ", cuePoints - " + mCuePoints);
    if (mDelegate != xDelegate) {
      mDelegate = xDelegate;
      if ((null != mDelegate) && (null != mCuePoints) && !mCuePoints.isEmpty() && (abs(mCuePoints.get(0)) > 0.01f)) {
        mDelegate.resumeContent(IMAWrapperDelegate.IMAWrapperResumeType.INITIAL);
      }
    }
    OTVLog.i(TAG, "setDelegate: Exit");
  }

  /**
   * Fetch the reference to the currently assigned delegate
   *
   * @return the reference to the currently assigned delegate
   */
  public IMAWrapperDelegate getDelegate() {
    return mDelegate;
  }

  /**
   * Prepare the wrapper for accepting ad requests using tags
   *
   * @param xAdUiContainer container for presentation of the adverts
   */
  public void startAdsServices(ViewGroup xAdUiContainer) {
    startAdsServices(xAdUiContainer, null);
  }

  /**
   * Prepare the wrapper for accepting ad requests using tags
   *
   * @param xAdUiContainer container for presentation of the adverts
   * @param xCompanionAdContainerList a list of placeholders for companion ads
   */
  public void startAdsServices(ViewGroup xAdUiContainer, List<IMAWrapperCompanionAdContainer> xCompanionAdContainerList) {
    OTVLog.v(TAG, "startAdsServices: Enter");
    stopAdsServices();
    mAdUiContainer = xAdUiContainer;

    mSdkFactory = getFactoryInstanceWrapped();
    mAdDisplayContainer = mSdkFactory.createAdDisplayContainer();
    mAdDisplayContainer.setAdContainer(mAdUiContainer);
    ImaSdkSettings settings = mSdkFactory.createImaSdkSettings();
    settings.setDebugMode(true);
    settings.setPlayerVersion(OTVSDK.getSdkVersion());
    mAdsLoader = mSdkFactory.createAdsLoader(mContext, settings, mAdDisplayContainer);

    mAdsLoader.addAdErrorListener(this);
    mAdsLoader.addAdsLoadedListener(this);

    configureCompanionAds(xCompanionAdContainerList);
    OTVLog.v(TAG, "startAdsServices: Exit");
  }

  /**
   * Cancel ads and reset Ads manager and loader (if active)
   */
  public void stopAdsServices() {
    OTVLog.v(TAG, "stopAdsServices: Enter");
    if (mAdUiContainer != null) {
      mAdUiContainer.setVisibility(View.INVISIBLE);
    }
    clearCompanionAdViews();
    clearAdsManager();

    if (null != mAdsLoader) {
      mAdsLoader.removeAdErrorListener(this);
      mAdsLoader.removeAdsLoadedListener(this);
    }
    OTVLog.v(TAG, "stopAdsServices: Exit");
  }

  private void clearCompanionAdViews(){
    if (null != mCompanionAdSlots) {
      for (CompanionAdSlot ad : mCompanionAdSlots) {
        ad.getContainer().removeAllViews();
      }
    }
  }

  private void clearAdsManager() {
    if (null != mAdsManager) {
      mAdsManager.discardAdBreak();
      mAdsManager.removeAdErrorListener(this);
      mAdsManager.removeAdEventListener(this);
      mAdsManager.destroy();
    }
    mAdsManager = null;
  }

  private void configureCompanionAds(List<IMAWrapperCompanionAdContainer> xCompanionAdContainerList) {
    if (null != xCompanionAdContainerList && mSdkFactory != null) {
      mCompanionAdSlots = new ArrayList<CompanionAdSlot>();

      for (IMAWrapperCompanionAdContainer cac : xCompanionAdContainerList) {
        CompanionAdSlot oneCompanionAdSlot = mSdkFactory.createCompanionAdSlot();
        if (oneCompanionAdSlot != null) {
          oneCompanionAdSlot.setContainer(cac.getViewGroup());

          oneCompanionAdSlot.setSize(cac.getWidth(), cac.getHeight());

          mCompanionAdSlots.add(oneCompanionAdSlot);
        }
      }
    }
  }

  /**
   * Request the ads using a scheduling string in the form of a VAST/VMAP URL.
   *
   * @param xAdTag a URL string for configuring the ads type and schedule, it must not be empty.
   */
  public void requestAds(String xAdTag) {
    if (xAdTag == null || xAdTag.isEmpty() || mAdUiContainer == null) {
      return;
    }

    if (null != mCompanionAdSlots) {
      mAdDisplayContainer.setCompanionSlots(mCompanionAdSlots);
    }

    AdsRequest request = mSdkFactory.createAdsRequest();
    request.setAdTagUrl(xAdTag);
    request.setContentProgressProvider(new ContentProgressProvider() {
      @Override
      public VideoProgressUpdate getContentProgress() {
        if (null != mDelegate && mDelegate.getContentDuration() > 0) {
          return new VideoProgressUpdate(mDelegate.getContentPosition(), mDelegate.getContentDuration());
        }

        OTVLog.d(TAG, "get content progress - not ready");
        return VideoProgressUpdate.VIDEO_TIME_NOT_READY;
      }
    });
    mCuePoints = null;

    mAdsLoader.requestAds(request);
  }

  /**
   * Should be called to provide the areas set aside for companion ad display.
   * This is then associated with the ad display container.
   *
   * @param xCompanionAdContainerList a list of placeholders for companion ads
   */
  public void setCompanionAds(List<IMAWrapperCompanionAdContainer> xCompanionAdContainerList) {
    configureCompanionAds(xCompanionAdContainerList);
    if (null != mAdDisplayContainer  && null != mCompanionAdSlots) {
      mAdDisplayContainer.setCompanionSlots(mCompanionAdSlots);
    }else {
      OTVLog.v(TAG, "Companion ads slots aren't set");
    }
  }

  /**
   * The IMAWrapperCompanionAdContainer class allows a simple description of where companion
   * adverts can be shown.
   */
  public static class IMAWrapperCompanionAdContainer {
    private ViewGroup mViewGroup;
    private Integer mWidth;
    private Integer mHeight;

    /**
     * The class' constructor
     *
     * @param xDimensions  the width and height of and area set aside for companion ads
     * @param xViewGroup  a ViewGroup set aside for companion ads
     */
    public IMAWrapperCompanionAdContainer(Pair<Integer, Integer> xDimensions, ViewGroup xViewGroup) {
      mViewGroup = xViewGroup;
      mWidth = xDimensions.first;
      mHeight = xDimensions.second;
    }

    public ViewGroup getViewGroup() {
      return mViewGroup;
    }

    public Integer getWidth() {
      return mWidth;
    }

    public Integer getHeight() {
      return mHeight;
    }
  }

  /**
   * Check if an advert is currently presented (active)
   *
   * @return  true if an advert is active (or if an ad was active when the app was pushed to the
   * backgorund)
   */
  public boolean isAdActive() {
    if (null != mAdsManager && mIsAdDisplayed) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * Should be called to interrupt advert presentation (when app moves to background)
   */
  public void pause() {
    if (null == mAdsManager) {
      OTVLog.w(TAG, "No ads manager to handle pause");
      return;
    }
    mAdsManager.pause();
  }

  /**
   * Should be called to resume an interrupted advert presentation when app returns from background)
   */
  public void resume() {
    if (null == mAdsManager) {
      OTVLog.w(TAG, "No ads manager to handle resume");
      return;
    }
    mAdsManager.resume();
  }

  /**
   * Check if there are still adverts to be presented
   *
   * @return true if no more ads are scheduled
   */
  public boolean isCompleted() {
    return mAllAdsCompleted;
  }

  /**
   * Let the wrapper know when playback is completed (e.g. user stopped playback)
   */
  public void contentComplete() {
    OTVLog.i(TAG, "CONTENT COMPLETE");
    if (null != mAdsLoader) {
      mAdsLoader.contentComplete();
    }
  }

  /// @cond HIDE_ALWAYS
  @Override
  public void onAdsManagerLoaded(AdsManagerLoadedEvent adsManagerLoadedEvent) {
    OTVLog.i(TAG, "ADS MANAGER LOADED");
    clearAdsManager();
    mAdsManager = adsManagerLoadedEvent.getAdsManager();
    mAdsManager.addAdErrorListener(this);
    mAdsManager.addAdEventListener(this);
    mCuePoints = mAdsManager.getAdCuePoints();
    // Show the positions (in seconds) in which adverts are going to be inserted.
    // The value -1.0 means post-roll.
    for (Float cuePoint : mCuePoints) {
      OTVLog.d(TAG, "   ADS MANAGER has cue point " + cuePoint);
    }
    if (!mCuePoints.isEmpty()) {
      OTVLog.i(TAG, "onAdsManagerLoaded: " + mCuePoints.size() + "cue points");
      mAllAdsCompleted = false;
      if ((abs(mCuePoints.get(0)) > 0.01f) && (null != mDelegate)) {
        mDelegate.resumeContent(IMAWrapperDelegate.IMAWrapperResumeType.INITIAL);
      }
    }

    mAdsManager.init();
  }

  @Override
  public void onAdEvent(AdEvent adEvent) {
    AdEvent.AdEventType type = adEvent.getType();
    OTVLog.d(TAG, "AD EVENT: " + type);
    // These are the suggested event types to handle. For full list of all ad event
    // types, see the documentation for AdEvent.AdEventType.
    if (null == mDelegate) {
      OTVLog.w(TAG, "No delegate to handle consequent actions for event " + type);
      return;
    }

    switch (type) {
      case LOADED:
        // AdEventType.LOADED will be fired when ads are ready to be played.
        // AdsManager.start() begins ad playback. This method is ignored for VMAP or
        // ad rules playlists, as the SDK will automatically start executing the
        // playlist.
        mAdsManager.start();
        break;

      case LOG:
        // ADEventType.LOG is used to log some error messages
        mDelegate.logEvent(adEvent.getAdData());
        break;

      case CONTENT_PAUSE_REQUESTED:
        // AdEventType.CONTENT_PAUSE_REQUESTED is fired immediately before a video
        // ad is played.
        mIsAdDisplayed = true;
        mDelegate.pauseContent();
        mAdUiContainer.setVisibility(View.VISIBLE);
        break;

      case STARTED:
        // AdEventType.STARTED is fired when an individual ad has started, multiple STARTED events
        // can be fired between the CONTENT_PAUSE_REQUESTED and CONTENT_RESUME_REQUESTED events.
        // It may be desirable to react to this to hide the video view.
        mDelegate.advertStarted();
        break;


      case CONTENT_RESUME_REQUESTED:
        // AdEventType.CONTENT_RESUME_REQUESTED is fired when the ad is completed
        // and you should start playing your content.
        mIsAdDisplayed = false;
        mAdUiContainer.setVisibility(View.GONE);
        mDelegate.resumeContent(IMAWrapperDelegate.IMAWrapperResumeType.ON_AD_COMPLETION);
        break;

      case ALL_ADS_COMPLETED:
        mAllAdsCompleted = true;
        clearAdsManager();
        mDelegate.completedCallback();
        break;

      default:
        break;
    }
  }

  @Override
  public void onAdError(AdErrorEvent adErrorEvent) {
    OTVLog.w(TAG, "ad loading error: " + adErrorEvent.getError().toString());
    if (null != mDelegate) {
      mDelegate.resumeContent(IMAWrapperDelegate.IMAWrapperResumeType.ON_AD_ERROR);
    } else {
      OTVLog.w(TAG, "ad loading error: no delegate to resume playback");
    }
  }
  /// @endcond
}
