// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
//  OTVPlayerIMA.m
//  DoubleConversion-iOS

#import <Foundation/Foundation.h>
#import <AVFoundation/AVFoundation.h>
//#import <OPYSDKFPS/OPYSDKFPS.h>
#import <OPYIMAWrapper/OPYIMAWrapper.h>

#import "OTVPlayerIMA.h"

@interface OTVPlayerIMA()

@property(nonatomic) IMAWrapper* imawrapper;
@property(nonatomic, weak) AVPlayer* player;
@end

@implementation OTVPlayerIMA

- (void)prepareWithPlayer:(AVPlayer*)player
               adView:(UIView *)adView
                 adTagURL:(NSString *)adTagURL
          companiomAdView:(UIView *)companiomAdView
{
  // Customise the settings of the IMAWrapper see API documention for details
  _player = player;
  IMAWrapperPlayerDetails* playerDetails = [IMAWrapperPlayerDetails new];
  playerDetails.contentPlayer = player;
  playerDetails.adsUIView = adView;
  playerDetails.adTagURL = adTagURL;
  playerDetails.companionAdViews = nil;
  IMAWrapperAdsSettings* setupSettings = [[IMAWrapperAdsSettings alloc] initWithSettingsDictionary:@{}] ;
  __weak OTVPlayerIMA* weakSelf = self;
  _imawrapper = [[IMAWrapper alloc] initWithPlayerDetails:playerDetails withDelegate:(id<IMAWrapperDelegate>)weakSelf withSettings:setupSettings];
}

- (BOOL) requestAds
{
  return [_imawrapper requestAds];
}

- (void) reset
{
  self.player = nil;
  self.imawrapper = nil;
}
@end

@implementation OTVPlayerIMA(IMAWrapperDelegate)
- (void) pauseContent
{
  [self.player pause];
}

- (void) resumeContent
{
  [self.player play];
}

- (void) allAdsCompleted
{
  NSLog(@"All ads complete");
}

- (void) logWithEvent:(NSString *)event
{
  NSLog(@"Event: %@", event);
}

@end

