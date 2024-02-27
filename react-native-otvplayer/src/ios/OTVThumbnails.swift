// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
//  OTVThumbnails.swift
//  ReactOtvplayer
//

import Foundation

#if os(tvOS)
import OPYSDKFPSTv;
#else
import OPYSDKFPS;
#endif

@objc(OTVThumbnails)
internal class OTVThumbnails: NSObject {
  
  weak var internalPlayerView: RCTOTVPlayerView?
  weak var internalPlayer: OTVAVPlayer?
  var otvThumbnailView: OTVThumbnailView?
  
  @objc var thumbnailStyle: OTVThumbnailStyle? {
    didSet{
      if let style = thumbnailStyle {
        if style != internalThumbnailStyle {
          setThumbnailStyle(style: style)
        }
      }
    }
  }
  
  @objc var thumbnailDictionary: OTVThumbnailModel?{
    didSet{
      if internalDictionary == nil {
        internalDictionary = thumbnailDictionary
      }
      
      if let thumbDict = thumbnailDictionary {
        internalDictionary = thumbnailDictionary
        
        if thumbnailPosition != thumbDict.positionInSeconds{
          thumbnailPosition = thumbDict.positionInSeconds
          setThumbnailPosition()
        }
        
        if displayThumbnail != thumbDict.display{
          displayThumbnails(toDisplay: thumbDict.display)
        }
      }
    }
  }
  var internalDictionary: OTVThumbnailModel?
  var internalThumbnailStyle: OTVThumbnailStyle?
  var defaultThumbnailPosition = true
  var initalThumbnailDisplay = true
  var validThumbnailStyle = false
  var displayThumbnail = false
  var thumbnailsAvailable = false
  var thumbnailsNotAvailable = false
  var thumbnailPosition: Double? = -1.0
  
  // MARK: Thumbnail error codes
  let ThumbnailItemError = 7020;
  let ThumbnailPostionError = 7021;
  let ThumbnailStylingError = 7022;
  let ThumbnailNotAvailable = 7023;
  let ThumbnailStatusUnknown = 7024;
  
  // MARK: Setup and teardown
  @objc init(playerView: RCTOTVPlayerView) {
    internalPlayerView = playerView
    super.init()
    attachObservers()
  }
  
  deinit {
    detachObservers()
    otvThumbnailView?.removeFromSuperview()
    otvThumbnailView = nil
    internalPlayerView = nil
    internalPlayer = nil
  }
  
  
  
  @objc func setupThumbnailView(player: OTVAVPlayer, url: URL) {
    let top = internalThumbnailStyle?.top
    let left = internalThumbnailStyle?.left
    let width = internalThumbnailStyle?.width
    let height = internalThumbnailStyle?.height
    let borderWidth = internalThumbnailStyle?.borderWidth
    let borderColor = internalThumbnailStyle?.borderColor
    
    internalPlayer = player
    let frame  = CGRect(x: top ?? 0, y: left ?? 0 , width: width ?? 180, height: height ?? 100)
    otvThumbnailView = OTVThumbnailView(url: url, frame: frame)
    let layers = otvThumbnailView?.layer.sublayers
    let thumbnailLayer = layers?.first as? AVPlayerLayer
    thumbnailLayer?.videoGravity = .resizeAspect
    
    otvThumbnailView?.backgroundColor = .black
    otvThumbnailView?.isHidden = true
    
    if ((borderColor) != nil) {
      otvThumbnailView?.layer.borderColor = UIColor(hexString: borderColor ?? "#000000")?.cgColor
    }
    otvThumbnailView?.layer.borderWidth = borderWidth ?? 0
  }
  
  // MARK: Thumbnail notifications
  
  func attachObservers() {
    NotificationCenter.default.addObserver(self, selector: #selector(thumbnailsAvailable(_:)), name: .OTVIFrameThumbnailsAvailable, object: nil)
    NotificationCenter.default.addObserver(self, selector: #selector(thumbnailsNotAvailable(_:)), name: .OTVIFrameThumbnailsNotAvailable, object: nil)
    NotificationCenter.default.addObserver(self, selector: #selector(thumbnailsError(_:)), name: .OTVIFrameThumbnailsError, object: nil)
  }
  
  func detachObservers() {
    NotificationCenter.default.removeObserver(self)
  }
  
  
  @objc func thumbnailsAvailable(_ notification: NSNotification) {
    _enter()
    thumbnailsAvailable = true
    
    //send on thumbnailsAvailable. Needs to be done in RCTOTVPlayerView
    internalPlayerView?.sendOnThumbnailAvailable()
    
    if displayThumbnail && validThumbnailStyle{
      
      if let thumbnailView = otvThumbnailView {
        initalThumbnailDisplay = false
        internalPlayerView?.addSubview(thumbnailView)
      }
      
      otvThumbnailView?.setNeedsDisplay()
      
      if thumbnailPosition == -1.0 {
        defaultThumbnailPosition = true
        otvThumbnailView?.isHidden = false
        displayCurrentTimeThumbnail()
      } else {
        displayThumbnailAtSetPosition()
      }
    } else if displayThumbnail && !validThumbnailStyle {
      //throw thumbnail style error
      internalPlayerView?.throwThumbnailError(Int32(ThumbnailStylingError))
    }
    _leave()
    
  }
  @objc func thumbnailsNotAvailable(_ notification: NSNotification) {
    _enter()
    thumbnailsNotAvailable = true
    _leave()
  }
  
  
  @objc func thumbnailsError(_ notification: NSNotification) {
    RCTOTVLog.error("Thumbnails error")
    internalPlayerView?.thumbnailsError(notification as Notification)
  }
  
  // MARK: Should display thumbnail
  
  func displayThumbnails(toDisplay: Bool) {
    if toDisplay {
      if !displayThumbnail {
        displayThumbnail = true
        if initalThumbnailDisplay {
          if let thumbnailView = otvThumbnailView {
            initalThumbnailDisplay = false
            internalPlayerView?.addSubview(thumbnailView)
          }
        }
        
        if thumbnailsAvailable {
          if validThumbnailStyle {
            otvThumbnailView?.isHidden = false
            if defaultThumbnailPosition {
              displayCurrentTimeThumbnail()
            }else {
              displayThumbnailAtSetPosition()
            }
          } else {
            internalPlayerView?.throwThumbnailError(Int32(ThumbnailStylingError))
          }
          return
        }
        throwThumbnailAvailabilityError()
      }
    }else {
      if displayThumbnail {
        otvThumbnailView?.isHidden = true
        displayThumbnail = false
      }
    }
    
  }
  
  func displayCurrentTimeThumbnail() {
    _enter()
    if let player = internalPlayer {
      if player.status != .readyToPlay {
        return
      }
      otvThumbnailView?.setTime(toSeconds: player.currentTime().seconds)
    }
    _leave()
    
  }
  
  func displayThumbnailAtSetPosition() {
    if let timeAsDouble = thumbnailPosition {
      let thumbnailTimeInterval = timeAsDouble
      if insideSeekableWindow(time: thumbnailTimeInterval){
        otvThumbnailView?.setTime(toSeconds: timeAsDouble)
        otvThumbnailView?.isHidden = false
      }else {
        otvThumbnailView?.isHidden = true
        internalPlayerView?.throwThumbnailError(Int32(ThumbnailPostionError))
      }
    }
  }
  
  
  func setThumbnailPosition() {
    _enter()
    defaultThumbnailPosition = false
    if thumbnailsAvailable && displayThumbnail {
      if let timeAsDouble = thumbnailPosition {
        let thumbnailTimeInterval = timeAsDouble
        if insideSeekableWindow(time: thumbnailTimeInterval){
          otvThumbnailView?.setTime(toSeconds: timeAsDouble)
          otvThumbnailView?.isHidden = false
        }else {
          otvThumbnailView?.isHidden = true
          //throw thumbnail postion error
          internalPlayerView?.throwThumbnailError(Int32(ThumbnailPostionError))
        }
      }
      return
    }
    throwThumbnailAvailabilityError()
    _leave()
    
  }
  
  func insideSeekableWindow(time: TimeInterval) -> Bool {
    _enter()
    var result = false
    if let seekableRange = internalPlayer?.currentItem?.seekableTimeRanges.last?.timeRangeValue {
      let seekableStart = seekableRange.start.seconds
      let seekableDuration = seekableRange.duration.seconds
      if time >= seekableStart && time <= seekableDuration {
        result =  true
      }
    }
    _leave()
    return result
  }
  
  func setThumbnailStyle(style: OTVThumbnailStyle) {
      internalThumbnailStyle = style
      if let style = internalThumbnailStyle {
        internalThumbnailStyle = style
        if style.top >= 0 && style.left >= 0 && style.width >= 0 && style.height >= 0 {
          validThumbnailStyle = true
          RCTOTVLog.info(style.top)
          RCTOTVLog.info(style.left)
          otvThumbnailView?.frame = CGRect(x: style.left, y: style.top, width: style.width, height: style.height)
        } else {
          validThumbnailStyle = false
        }
        
        if !style.borderColor.isEmpty {
          if UIColor(hexString: style.borderColor) !=  nil {
            otvThumbnailView?.layer.borderColor = UIColor(hexString: style.borderColor)?.cgColor
          } else {
            //default value if the key is not in the available color dictionary
            RCTOTVLog.warning("RGBA color set is not available. Check value of thumbnailStyle.borderColor. Defaulting to black border color");
            otvThumbnailView?.layer.borderColor = UIColor(hexString: "#000000")?.cgColor
          }
        }
        
        if style.borderWidth != -999999999.0 {
          otvThumbnailView?.layer.borderWidth = style.borderWidth
        }
        shouldDisplayThumbnail()
      }
  }
  
  func shouldDisplayThumbnail() {
    if thumbnailsAvailable && displayThumbnail {
      if validThumbnailStyle {
        otvThumbnailView?.setNeedsDisplay()
      }else if !validThumbnailStyle {
        otvThumbnailView?.isHidden = true
        //throw thumbnailStyleError
        internalPlayerView?.throwThumbnailError(Int32(ThumbnailStylingError))
        
      }
      return
    }
    throwThumbnailAvailabilityError()
  }
  
  func throwThumbnailAvailabilityError() {
    if displayThumbnail && thumbnailsNotAvailable {
      //throw thumbnail not available error
      internalPlayerView?.throwThumbnailError(Int32(ThumbnailNotAvailable))
      
    } else if displayThumbnail && !thumbnailsNotAvailable && !thumbnailsAvailable{
      //throw thumbnail status unknown
      internalPlayerView?.throwThumbnailError(Int32(ThumbnailStatusUnknown))
    }
  }
}

// MARK: HEX string RGBA
extension UIColor {
  convenience init?(hexString: String) {
    let input = hexString
      .replacingOccurrences(of: "#", with: "")
      .uppercased()
    var alpha: CGFloat = 1.0
    var red: CGFloat = 0
    var blue: CGFloat = 0
    var green: CGFloat = 0
    switch (input.count) {
      case 3 /* #RGB */:
        red = Self.colorComponent(from: input, start: 0, length: 1)
        green = Self.colorComponent(from: input, start: 1, length: 1)
        blue = Self.colorComponent(from: input, start: 2, length: 1)
        break
      case 4 /* #ARGB */:
        alpha = Self.colorComponent(from: input, start: 0, length: 1)
        red = Self.colorComponent(from: input, start: 1, length: 1)
        green = Self.colorComponent(from: input, start: 2, length: 1)
        blue = Self.colorComponent(from: input, start: 3, length: 1)
        break
      case 6 /* #RRGGBB */:
        red = Self.colorComponent(from: input, start: 0, length: 2)
        green = Self.colorComponent(from: input, start: 2, length: 2)
        blue = Self.colorComponent(from: input, start: 4, length: 2)
        break
      case 8 /* #AARRGGBB */:
        alpha = Self.colorComponent(from: input, start: 0, length: 2)
        red = Self.colorComponent(from: input, start: 2, length: 2)
        green = Self.colorComponent(from: input, start: 4, length: 2)
        blue = Self.colorComponent(from: input, start: 6, length: 2)
        break
      default:
        NSException.raise(NSExceptionName("Invalid color value"), format: "Color value \"%@\" is invalid.  It should be a hex value of the form #RBG, #ARGB, #RRGGBB, or #AARRGGBB", arguments:getVaList([hexString ?? ""]))
        return nil
    }
    self.init(red: red, green: green, blue: blue, alpha: alpha)
  }
  
  static func colorComponent(from string: String!, start: Int, length: Int) -> CGFloat {
    let substring = (string as NSString)
      .substring(with: NSRange(location: start, length: length))
    let fullHex = length == 2 ? substring : "\(substring)\(substring)"
    var hexComponent: UInt64 = 0
    Scanner(string: fullHex)
      .scanHexInt64(&hexComponent)
    return CGFloat(Double(hexComponent) / 255.0)
  }
}
