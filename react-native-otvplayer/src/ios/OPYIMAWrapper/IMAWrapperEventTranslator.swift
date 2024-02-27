// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
/**
 * IMAWrapperEventTranslator.swift
 */

import Foundation
import GoogleInteractiveMediaAds

class IMAWrapperEventTranslator {
  /// :nodoc:
  static let eventTypeTranslator: [IMAAdEventType: String] =
      [.LOADED: "LOADED",
       .AD_BREAK_ENDED: "AD_BREAK_ENDED",
       .AD_BREAK_READY: "AD_BREAK_READY",
       .AD_BREAK_STARTED: "AD_BREAK_STARTED",
       .ALL_ADS_COMPLETED: "ALL_ADS_COMPLETED",
       .CLICKED: "CLICKED",
       .COMPLETE: "COMPLETE",
       .CUEPOINTS_CHANGED: "CUEPOINTS_CHANGED",
       .FIRST_QUARTILE: "FIRST_QUARTILE",
       .LOG: "LOG",
       .MIDPOINT: "MIDPOINT",
       .PAUSE: "PAUSE",
       .RESUME: "RESUME",
       .SKIPPED: "SKIPPED",
       .STARTED: "STARTED",
       .STREAM_LOADED: "STREAM_LOADED",
       .STREAM_STARTED: "STREAM_STARTED",
       .TAPPED: "TAPPED",
       .THIRD_QUARTILE: "THIRD_QUARTILE"
      ]
  
  /// :nodoc:
  class func getEventName(forEventType type: IMAAdEventType) -> String {
    guard let theString = eventTypeTranslator[type] else {
      return "<<unrecognised event>>"
    }
    return theString
  }
}
