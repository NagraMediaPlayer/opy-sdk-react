// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
/**
 * IMAWrapper+AdsManagerDelegate.swift
 */

import Foundation
import GoogleInteractiveMediaAds

/**
 :nodoc:
 */
extension IMAWrapper: IMAAdsManagerDelegate {
  public func adsManager(_ adsManager: IMAAdsManager, didReceive event: IMAAdEvent) {
    NSLog("IMAWrapper: AD EVENT: " + IMAWrapperEventTranslator.getEventName(forEventType: event.type))
    switch event.type {
    case .LOADED:
      // When the IMA notifies us that ads have been loaded, play them.
      adsManager.start()

    case .STARTED:
      // Ensure we pause content when Ads playing
      delegate.pauseContent()

    case .ALL_ADS_COMPLETED:
      // Forward the event to the delegate
      delegate.allAdsCompleted()

    case .LOG:
      // Highlight IMA error messages
      delegate.log(event: event.typeString)

    case .AD_BREAK_READY, .AD_BREAK_ENDED, .AD_BREAK_STARTED, .CLICKED,
         .COMPLETE, .CUEPOINTS_CHANGED, .FIRST_QUARTILE, .MIDPOINT, .THIRD_QUARTILE, .PAUSE,
         .RESUME, .SKIPPED, .STREAM_LOADED, .STREAM_STARTED, .TAPPED:
      // Take specific action depending on the event
      NSLog("IMAWrapper: ignored event: \(event.type)")
      
    @unknown default:
      NSLog("IMAWrapper: unknown event: \(event.type)")
    }
  }

  public func adsManager(_ adsManager: IMAAdsManager, didReceive error: IMAAdError) {
    // Something went wrong with the ads manager after ads were loaded. Log the error and play the
    // content.
    delegate.log(event: error.message)
    delegate.resumeContent()
  }

  public func adsManagerDidRequestContentPause(_ adsManager: IMAAdsManager) {
    // The IMA is going to play ads, so has requested pause the content.
    // But in order to optimize the transition between content and ad we ignore
    // and wait for the STARTED event.
    NSLog("IMAWrapper: adsManager Request Content PAUSE - Ignored")
  }

  public func adsManagerDidRequestContentResume(_ adsManager: IMAAdsManager) {
    // The IMA is done playing ads (at least for now), so resume the content.
    NSLog("IMAWrapper: adsManager Request Content RESUME")
    delegate.resumeContent()
  }
}
