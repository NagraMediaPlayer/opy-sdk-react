// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
//
//  OTVThumbnailModel.swift
//  This class is the data structure for OTVThumbnail
//  ReactOtvplayer
//

import Foundation

@objc(OTVThumbnailModel)
internal class OTVThumbnailModel: NSObject {
  @objc var display = false
  @objc var positionInSeconds = -1.0
  @objc var style: OTVThumbnailStyle?
  
  static func == (lhs: OTVThumbnailModel, rhs: OTVThumbnailModel) -> Bool {
    return lhs.display == rhs.display && lhs.positionInSeconds == rhs.positionInSeconds && lhs.style == rhs.style
  }
}
@objc(OTVThumbnailStyle)
internal class OTVThumbnailStyle: NSObject {

  @objc var top = -999999999
  @objc var left = -999999999
  @objc var width = -999999999
  @objc var height =  -999999999
  @objc var borderWidth = -999999999.0
  @objc var borderColor = "#000000"
  
  static func == (lhs: OTVThumbnailStyle, rhs: OTVThumbnailStyle) -> Bool {
    return lhs.top == rhs.top && lhs.left == rhs.left && lhs.width == rhs.width && lhs.height == rhs.height && lhs.borderWidth == rhs.borderWidth && lhs.borderColor == rhs.borderColor
  }
}
