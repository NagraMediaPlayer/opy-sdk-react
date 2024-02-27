// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.

#import <Foundation/Foundation.h>
#import "UIKit/UIKit.h"
#import <React/RCTBridgeModule.h>


@interface RCT_EXTERN_MODULE(RCTOTVSDKManager, NSObject)

RCT_EXTERN_METHOD(setSDKLogLevel: (NSInteger *)level emitToJs:(BOOL *)emitToJs)

+ (BOOL)requiresMainQueueSetup
{
    return YES;
}
@end

