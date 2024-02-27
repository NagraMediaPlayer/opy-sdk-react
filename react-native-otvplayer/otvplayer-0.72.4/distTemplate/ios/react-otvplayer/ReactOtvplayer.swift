// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
@objc(ReactOtvplayer)
class ReactOtvplayer: NSObject {

    @objc(multiply:withB:withResolver:withRejecter:)
    func multiply(a: Float, b: Float, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        resolve(a*b)
    }
}
