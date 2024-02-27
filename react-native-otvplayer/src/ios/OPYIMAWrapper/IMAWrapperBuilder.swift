// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
/**
 * IMAWrapperBuilder.swift
 */

import Foundation
import AVFoundation
import GoogleInteractiveMediaAds

/**
 Class to use for dependency injects `IMAWrapper` to allow mocking the IMA objects
 here we want build IMA objects correctly.
 */
class IMAWrapperBuilder {
  /**
  Correctly create the IMAAVPlayerContentPlayhead object
  */
  func createIMAAVPlayerContentPlayhead(contentPlayer: AVPlayer) -> IMAAVPlayerContentPlayhead {
    return IMAAVPlayerContentPlayhead(avPlayer: contentPlayer)
  }

  /**
  Correctly create the IMAAdsLoader object
  */
  func createIMAAdsLoader(settings: IMASettings?) -> IMAAdsLoader {
    return IMAAdsLoader(settings: settings)
  }
  
  /**
   Correctly create the IMACompanionAdSlot object
   */
  func createIMACompanionAdSlot(_ view: IMAWrapperCompanionAdContainer) -> IMACompanionAdSlot {
    return IMACompanionAdSlot(view: view.advert, width: Int(Int32(view.width)), height: Int(Int32(view.height)))
  }
}
