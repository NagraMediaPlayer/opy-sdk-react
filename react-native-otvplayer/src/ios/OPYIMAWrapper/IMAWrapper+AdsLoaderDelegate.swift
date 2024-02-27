// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
/**
 * IMAWrapper+AdsLoaderDelegate.swift
 */

import Foundation
import GoogleInteractiveMediaAds

/**
 :nodoc:
 */
extension IMAWrapper: IMAAdsLoaderDelegate {
  public func adsLoader(_ loader: IMAAdsLoader, adsLoadedWith adsLoadedData: IMAAdsLoadedData) {
    // Grab the instance of the IMAAdsManager and set ourselves as the delegate.
    imaAdsManager = adsLoadedData.adsManager
    if let delegate = self as? IMAAdsManagerDelegate & NSObjectProtocol {
      imaAdsManager?.delegate = delegate
    }

    // Create ads rendering settings and tell the IMA to use the in-app browser.
    let adsRenderingSettings = IMAAdsRenderingSettings()
    //adsRenderingSettings.webOpenerPresentingController = self.videoViewController

    // Initialize the ads manager.
    imaAdsManager?.initialize(with: adsRenderingSettings)
  }

  public func adsLoader(_ loader: IMAAdsLoader, failedWith adErrorData: IMAAdLoadingErrorData) {
    delegate.log(event: adErrorData.adError.message)
    delegate.resumeContent()
  }
}
