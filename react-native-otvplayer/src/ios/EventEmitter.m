// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
//
//  EventEmitter.m
//  ReactOtvplayer
//

#import "EventEmitter.h"
#import <React/RCTBridge.h>
#import <React/RCTConvert.h>
#import <React/RCTUIManager.h>
#import <React/RCTConvert.h>

@implementation Events

RCT_EXPORT_MODULE()

// must override supported events
- (NSArray<NSString *> *)supportedEvents
{
    return @[@"onLog"];
}

- (void)startObserving
{
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(emitEventInternal:) name:@"EventNotification" object:nil];

}

- (void)stopObserving
{
    [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (void)emitEventInternal:(NSNotification *)notification
{
    NSDictionary *contentInfo = notification.userInfo;
    NSString* eventName= contentInfo.allKeys[0];
    [self sendEventWithName:eventName body:notification.userInfo];
}

// Static
+ (void)emitEvent:(NSString *) event
{
    NSDictionary *userInfo =
    [NSDictionary dictionaryWithObject:event forKey:@"EVENTNAME"];
    
    [[NSNotificationCenter defaultCenter] postNotificationName:
     @"EventNotification" object:self userInfo:userInfo];
}

+ (void)emitEventBlock:(NSMutableDictionary *) payload
{
    [[NSNotificationCenter defaultCenter] postNotificationName:
     @"EventNotification" object:self userInfo:payload];
}

@end
