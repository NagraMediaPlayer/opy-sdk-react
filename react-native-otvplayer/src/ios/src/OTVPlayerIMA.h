// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
//
//  OTVPlayerIMA.h
//  Pods

#ifndef OTVPlayerIMA_h
#define OTVPlayerIMA_h

@class OTVAVPlayer;
@class UIView;

@interface OTVPlayerIMA : NSObject
- (void)prepareWithPlayer: (OTVAVPlayer*)player
      adView: (UIView*)playerView
        adTagURL: (NSString*)adTagURL
 companiomAdView: (UIView*)companiomAdView;

- (BOOL) requestAds;

- (void) reset;

@end
#endif /* OTVPlayerIMA_h */
