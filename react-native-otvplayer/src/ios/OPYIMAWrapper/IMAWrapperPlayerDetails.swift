// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
/**
 * IMAWrapperPlayerDetails.swift
 */

import Foundation
import UIKit
import AVKit
@objc(IMAWrapperPlayerDetails)
public class IMAWrapperPlayerDetails: NSObject {
  /// Reference to the AVPlayer used by the application
  @objc public weak var contentPlayer: AVPlayer?
  /// Reference to the Ads UIView
  @objc public weak var adsUIView: UIView?
  /// The adTag URL
  @objc public var adTagURL: String?
  /// The initalised Companion ad container if they're required
  @objc public var companionAdViews: [IMAWrapperCompanionAdContainer]?
}
