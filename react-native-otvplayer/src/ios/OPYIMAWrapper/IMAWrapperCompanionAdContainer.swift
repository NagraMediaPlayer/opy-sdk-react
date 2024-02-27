// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
/**
 * IMAWrapperCompanionAdContainer.swift
 */

import Foundation
import UIKit
import AVFoundation

/**
 A struct used by the delegate to pass UIView containers with their dimensions
 */
@objc(IMAWrapperCompanionAdContainer)
public class IMAWrapperCompanionAdContainer: NSObject {
  @objc public var advert: UIView? = nil
  @objc public var width: Int32 = 0
  @objc public var height: Int32 = 0
}
