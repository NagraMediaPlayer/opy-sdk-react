//
//  SwiftToObjCHelper.swift
//  ReactOtvplayer
//
//  Created by Alex Doney on 22/08/2024.
//  Copyright © 2024 Facebook. All rights reserved.
//

import Foundation

#if os(tvOS)
import OPYSDKFPSTv;
#else
import OPYSDKFPS;
#endif

@objc(SwiftToObjCHelper)
internal class SwiftToObjCHelper: NSObject {

  @objc internal func isThisAnHttpError(notification: Notification) -> Bool {
      if let otvNetworkNotificationType = notification.object as? OTVNetworkAnalytics.Event {
        if (otvNetworkNotificationType == .errorChanged) {
          return true
        }
      }
    return false
  }
}

