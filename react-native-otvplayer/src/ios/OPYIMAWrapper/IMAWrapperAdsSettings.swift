// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
/**
 * IMAWrapperAdsSettings.swift
 */

import Foundation
import GoogleInteractiveMediaAds

@objc(IMAWrapperAdsSettings)
public class IMAWrapperAdsSettings: NSObject {
  
  var settings: IMASettings?
  
  /**
   Populates the settings for IMA Ads based upon the user's chosen settings.
   These can include ppid, maxRedirects, language, playerType, playerVersion,
   autoPlayAdBreaks and debugMode
   
   - Parameter: Dictionary of [String: Any] where
   
   ppid: String
   
   maxRedirects: UInt
   
   language: String
   
   playerType: String
   
   playerVersion: String
   
   autoPlayAdBreaks: Bool
   
   debugMode: Bool
   */
  @objc public convenience init(settingsDictionary: [String: Any]) {
    self.init(settingsDictionary, IMASettings())
  }
  
  convenience init(_ settings: IMASettings) {
    self.init([String: Any](), settings)
  }
  
  convenience override init() {
    self.init([String: Any](), IMASettings())
  }
  
  init(_ settingsDictionary: [String: Any], _ settings: IMASettings) {
    self.settings = settings
    super.init()

    setupSettings(settingsDictionary)
  }
  
  private func ppidSetter(value: Any) {
    if let pID = value as? String {
      settings?.ppid = pID
    }
  }
  
  private func maxRedirectsSetter(value: Any) {
    if let mRedir =  value as? UInt {
      settings?.maxRedirects = mRedir
    }
  }
  
  private func languageSetter(value: Any) {
    if let language = value as? String {
      settings?.language = language
    }
  }
  
  private func playerTypeSetter(value: Any) {
    if let plyrType = value as? String {
      settings?.playerType = plyrType
    }
  }
  
  private func playerVersionSetter(value: Any) {
    if let playerVer = value as? String {
      settings?.playerVersion = playerVer
    }
  }
  
  private func autoPlayAdBreaksSetter(value: Any) {
    if let autoPlayAdBr = value as? Bool {
      settings?.autoPlayAdBreaks = autoPlayAdBr
    }
  }
  
  private func debugMODESetter(value: Any) {
    if let debugMODE = value as? Bool {
      settings?.enableDebugMode = debugMODE
    }
  }

  /**
   :nodoc:
   From the given dictionary store the desired settings for the future
   generation of the IMASettings object.
   
   - Parameter: Dictionary of [String: Any] where
   */
  internal func setupSettings(_ settingsDictionary: [String: Any]) {
    for dict in settingsDictionary {
      switch dict.key {
      case "ppid":
        ppidSetter(value: dict.value)
      case "maxRedirects":
        maxRedirectsSetter(value: dict.value)
      case "language":
        languageSetter(value: dict.value)
      case "playerType":
        playerTypeSetter(value: dict.value)
      case "playerVersion":
        playerVersionSetter(value: dict.value)
      case "autoPlayAdBreaks":
        autoPlayAdBreaksSetter(value: dict.value)
      case "debugMode":
        debugMODESetter(value: dict.value)
      default: break
      }
    }
  }
}
