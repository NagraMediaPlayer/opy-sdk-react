// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
package com.nagra.example.dynamicima.adverts;

import java.util.Map;

/**
 * Interface definition for callbacks to be invoked when an action or status
 * is required of the player for the correct operation of ads
 */
public interface IMAWrapperDelegate {

  /**
   * Enumeration of the types of resumption providing information on
   * the event that triggered playback of content to start or continue.
   */
  enum IMAWrapperResumeType {
    /** Starting playback of content when no pre-roll adverts */
    INITIAL,
    /** Continuing playback despite IMA SDK reporting an error */
    ON_AD_ERROR,
    /** Continuing playback after completion of an advert break */
    ON_AD_COMPLETION
  }

  /**
   * Called when playback of content needs to be started/resumed
   *
   * @param xResumeType The event that triggered the resumption
   */
  void resumeContent(IMAWrapperResumeType xResumeType);

  /**
   * Called when playback of content needs to be paused
   */
  void pauseContent();

  /**
   * Called when an advert has started
   */
  void advertStarted();

  /**
   * Called when a log message needs action
   *
   * @param xAdData Map of additional information contained within the event
   */
  void logEvent(Map<String, String> xAdData);

  /**
   * Called routinely to enquire current player's position
   */
  long getContentPosition();

  /**
   * Called routinely to enquire current player's duration
   */
  long getContentDuration();

  /**
   * Called when all IMA Ads completed.
   */
  void completedCallback();
}


