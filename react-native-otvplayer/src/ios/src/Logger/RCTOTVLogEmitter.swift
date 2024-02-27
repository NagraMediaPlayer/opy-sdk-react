// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
//
//  RCTOTVLogEmitter.swift

import Foundation

fileprivate  class OTVLogProvider: NSObject, IOTVLogProvider {
    
    public func logProvider(xLog: String) {
        RCTOTVLogEmitter.sharedInstance.dispatchLog("[OTVSDK] \(xLog)")
    }
}

fileprivate  class RCTOTVLogProvider: NSObject, RCTOTVILogProvider {
    
    public func logProvider(xLog: String) {
        RCTOTVLogEmitter.sharedInstance.dispatchLog("[RCTOTVSDK] \(xLog)")
    }
}

public class RCTOTVLogEmitter: NSObject {
    
    static let sharedInstance = RCTOTVLogEmitter()
    
    fileprivate let otvLogProvider = OTVLogProvider()
    fileprivate let rctotvLogProvider = RCTOTVLogProvider()
    
    var emitToJsLayer: Bool = false
    
    func setLogProvider() {
        OTVSDK.setLogProvider(xLogProvider: otvLogProvider)
        RCTOTVLog.setLogProvider(xLogProvider: rctotvLogProvider)
    }
    
    func setEmitToJs(_ emitToJs: Bool) {
        self.emitToJsLayer = emitToJs
    }
    
    func dispatchLog(_ xLog: String) {
        if emitToJsLayer {
            let dict = ["logs": xLog]
            NotificationCenter.default.post(name: Notification.Name("OTVLogNotification"), object: nil, userInfo: dict)
        }
    }
    
    private override init() {
        super.init()
        self.setLogProvider()
    }
    
}
