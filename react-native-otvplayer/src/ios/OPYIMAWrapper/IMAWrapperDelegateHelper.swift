// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
/**
 * IMAWrapperDelegateHelper.swift
 */

import Foundation
import GoogleInteractiveMediaAds

/**
 Class to use for helping integrators of `IMAWrapperDelegate` to address common issues
 seen in sample applications.
 */
class IMAWrapperDelegateHelper {
  private var finishedAdverts: Bool
  private var pausedForAdverts: Bool

  /**
   Constructor for the `IMAWrapperDelegateHelper` class.
   */
  init () {
    pausedForAdverts = false
    finishedAdverts = true
  }

  /**
   Function to be called when the last advert of the last advert break has completed.
   */
  func notifyFinalAdvertHasCompleted() {
    finishedAdverts = true
    pausedForAdverts = false
  }

  /**
   Function to be called when an advert break has started
   */
  func adBreakStarted() {
    pausedForAdverts = true
    finishedAdverts = false
  }

  /**
   Function to be called when an advert break has completed
   */
  func adBreakCompleted() {
    pausedForAdverts = false
  }

  /**
   Function used to determine if the content has been paused in order to present adverts.
   This is useful to track to take action as a result of such an event.  Example of
   this would be

   1) to be able to resume adverts automatically when returning from
   the app being in the background.

   2) to be able to not call play when the seek slider is released after an advert
   break has already started.

   - returns: `true` if content playback is paused due to adverts playing
   */
  func currentlyShowingAdvertBreak() -> Bool {
    return pausedForAdverts
  }

  /**
   Function used to determine if necessary to hide the video view before a
   post-roll rather than show the initial freeze frame again.

   - parameter videoView: a reference to the `UIView` of the content playback.
   */
  func shouldHideVideoView(withView videoView: UIView) {
    if !finishedAdverts {
      videoView.isHidden = true
    }
  }
}
