// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
//
//  RCTOTVDRMHelper.h
//  React-otvplayer

#import <Foundation/Foundation.h>
#include <TargetConditionals.h>

#if TARGET_OS_TV
  @import OPYSDKFPSTv;
  #import "RNOTVPlayer_tvOS-swift.h"
#else
  @import OPYSDKFPS;
  #import "RNOTVPlayer-swift.h"
#endif
NS_ASSUME_NONNULL_BEGIN

@interface OTVDRMHelper : NSObject{
  BOOL ssmSyncMode;
  NSURL* ssmURL;
  NSURL* certificateURL;
  NSURL* licenseURL;
  OTVReactNativeLicenseDelegate* ssmDelegate;
  OTVReactNativeLicenseDelegate* sspDelegate;
}
+ (OTVDRMHelper*) shared;
- (void) setDrmConfig:(NSDictionary*) drmConfig;
- (void) setDRMTokenType:(NSString*) tokenType;
- (void) clearStreamDelegate;
-(BOOL)hasDRM;
@property(nonatomic, readonly) OTVReactNativeLicenseDelegate* delegate;


@end

NS_ASSUME_NONNULL_END
