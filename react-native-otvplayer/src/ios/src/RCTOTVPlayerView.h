// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
//
//  RCTOTVPlayerView.h
//  React-otvplayer

#import <UIKit/UIKit.h>
#import <React/RCTComponent.h>
#import <React/RCTBridgeModule.h>
#include <TargetConditionals.h>
#import <React/RCTBridge.h>

#if TARGET_OS_TV
  @import OPYSDKFPSTv;
#else
  @import OPYSDKFPS;
#endif
NS_ASSUME_NONNULL_BEGIN

@class RCTEventDispatcher;
@interface RCTOTVPlayerView : UIView<OTVTracksChangedListener>

@property (nonatomic, copy) RCTDirectEventBlock onVideoLoadStart;
@property (nonatomic, copy) RCTDirectEventBlock onVideoLoad;
@property (nonatomic, copy) RCTDirectEventBlock onVideoProgress;
@property (nonatomic, copy) RCTDirectEventBlock onVideoSeek;
@property (nonatomic, copy) RCTDirectEventBlock onVideoEnd;
@property (nonatomic, copy) RCTDirectEventBlock onVideoWaiting;
@property (nonatomic, copy) RCTDirectEventBlock onTracksChanged;
@property (nonatomic, copy) RCTDirectEventBlock onAudioTrackSelected;
@property (nonatomic, copy) RCTDirectEventBlock onTextTrackSelected;
@property (nonatomic, copy) RCTDirectEventBlock onVideoError;
@property (nonatomic, copy) RCTDirectEventBlock onStatisticsUpdate;
@property (nonatomic, copy) RCTDirectEventBlock onVideoPaused;
@property (nonatomic, copy) RCTDirectEventBlock onVideoStopped;
@property (nonatomic, copy) RCTDirectEventBlock onVideoPlay;
@property (nonatomic, copy) RCTDirectEventBlock onVideoPlaying;
@property (nonatomic, copy) RCTDirectEventBlock onBitratesAvailable;
@property (nonatomic, copy) RCTDirectEventBlock onSelectedBitrateChanged;
@property (nonatomic, copy) RCTDirectEventBlock onDownloadResChanged;
@property (nonatomic, copy) RCTDirectEventBlock onThumbnailAvailable;
@property (nonatomic, copy) RCTDirectEventBlock onLog;

- (instancetype)initWithEventDispatcher:(RCTEventDispatcher *)eventDispatcher NS_DESIGNATED_INITIALIZER;

- (void)play;
- (void)pause;
- (void)stop;
- (void)seek:(NSDictionary*)info;
- (void)selectAudioTrack:(int)selectedAudioTrack;
- (void)selectTextTrack:(int)selectedTextTrack;

- (void)thumbnailsError:(NSNotification *)notification;
- (void)throwThumbnailError: (int)error;
- (void) sendOnThumbnailAvailable;

-(void) sendOnLogAvailable:(NSString*)info;

@end

NS_ASSUME_NONNULL_END
