// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(ReactOtvplayer, NSObject)

RCT_EXTERN_METHOD(multiply:(float)a withB:(float)b
                 withResolver:(RCTPromiseResolveBlock)resolve
                 withRejecter:(RCTPromiseRejectBlock)reject)

@end
