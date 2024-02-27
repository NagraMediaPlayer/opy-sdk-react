// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
/**
 * IMAWrapperDelegate.swift
 */

import Foundation
import UIKit
import AVFoundation

/**
 A protocol used by `IMAWrapper` to service functionality for placing adverts.
 The protocol needs to be implemented by a class within the application that
 uses the wrapper.
 */
@objc(IMAWrapperDelegate)
public protocol IMAWrapperDelegate: NSObjectProtocol {

  /**
   Pause content playback.
   */
  @objc func pauseContent()

  /**
   Resume content playback.
   */
  @objc func resumeContent()

  /**
   Notify the delegate that all ads have completed.
   */
  @objc func allAdsCompleted()

  /**
   Logs error messages and events from Google IMA.
   */
  @objc func log(event: String?)
}
