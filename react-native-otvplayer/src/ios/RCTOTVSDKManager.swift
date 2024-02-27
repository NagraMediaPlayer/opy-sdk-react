// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
//
//  RCTOTVSDKManager.swift
//  RNOTVPlayer
//

import Foundation

#if os(tvOS)
  import OPYSDKFPSTv;
#else
  import OPYSDKFPS;
#endif


@objc(RCTOTVSDKManager)
public class RCTOTVSDKManager: NSObject {
        
    @objc(setSDKLogLevel:emitToJs:)
    public func setSDKLogLevel(_ level: Int, emitToJs: Bool = false) {
        
        print("set SDK log level \(level) with emitToJs as \(emitToJs)")
        RCTOTVLogEmitter.sharedInstance.setEmitToJs(emitToJs)
        
        switch level {
        case 0:
            OTVSDK.setLogging(level: .error)
            RCTOTVLog.setLogging(level: .error)
            break
        case 1:
            OTVSDK.setLogging(level: .warning)
            RCTOTVLog.setLogging(level: .warning)
            break
        case 2:
            OTVSDK.setLogging(level: .info)
            RCTOTVLog.setLogging(level: .info)
            break
        case 3:
            OTVSDK.setLogging(level: .debug)
            RCTOTVLog.setLogging(level: .debug)
            break
        case 4:
            OTVSDK.setLogging(level: .debug)
            RCTOTVLog.setLogging(level: .debug)
            break
        default:
            break
        }
    }
    
    @objc
      func constantsToExport() -> [String: Any]! {
        return [
          "version": getSDKVersion()
        ]
      }
    
    func getSDKVersion() -> String {
        #if os(tvOS)
        let bundle = Bundle(identifier: "com.nagra.OPYSDKFPSTv")!
        #else
        let bundle = Bundle(identifier: "com.nagra.OPYSDKFPS")!
        #endif
        
        let sdkBuildNumber = bundle.infoDictionary![kCFBundleVersionKey as String] ?? ""
        let sdkVersionNumber = bundle.infoDictionary!["CFBundleShortVersionString"] ?? ""
        
        let fullSDKVersion = String("\(sdkVersionNumber).\(sdkBuildNumber)")
        
        return fullSDKVersion
    }
    
}
