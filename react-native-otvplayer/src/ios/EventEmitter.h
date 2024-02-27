// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
//  EventEmitter.h
//  ReactOtvplayer

#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

// Extend RCTEventEmitter
@interface Events : RCTEventEmitter <RCTBridgeModule>
{
}

+ (void)emitEvent:(NSString *)event;
+ (void)emitEventBlock:(NSMutableDictionary *)payload;

@end
