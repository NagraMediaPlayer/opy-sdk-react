// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
//
//  RCTOTVPlayerViewManager.m
//  React-otvplayer

#import "RCTOTVPlayerViewManager.h"
#import "RCTOTVPlayerView.h"
#import "RCTOTVLog.h"

#import <React/RCTBridgeModule.h>
#import <React/RCTBridge.h>
#import <React/RCTUIManager.h>

@implementation RCTOTVPlayerViewManager

RCT_EXPORT_MODULE();

RCTOTVPlayerView *rctTOTVPlayerView;

- (UIView *)view {
  RCTOTVLogD(@"return OTVPlayerView");
  return [[RCTOTVPlayerView alloc] initWithEventDispatcher:self.bridge.eventDispatcher];
}
- (void)dealloc
{
  rctTOTVPlayerView = nil;
}

- (dispatch_queue_t)methodQueue
{
  return self.bridge.uiManager.methodQueue;
}

RCT_EXPORT_VIEW_PROPERTY(source, NSDictionary);
RCT_EXPORT_VIEW_PROPERTY(autoplay, BOOL);
RCT_EXPORT_VIEW_PROPERTY(rate, float);
RCT_EXPORT_VIEW_PROPERTY(volume, float);
RCT_EXPORT_VIEW_PROPERTY(muted, BOOL);
RCT_EXPORT_VIEW_PROPERTY(maxBitrate, double);
RCT_EXPORT_VIEW_PROPERTY(maxResolution, NSDictionary);
RCT_EXPORT_VIEW_PROPERTY(thumbnail, NSDictionary);

RCT_EXPORT_VIEW_PROPERTY(statisticsConfig, NSDictionary);
RCT_EXPORT_VIEW_PROPERTY(progressUpdateInterval, float);

RCT_EXPORT_VIEW_PROPERTY(onVideoLoadStart, RCTDirectEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onVideoLoad, RCTDirectEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onVideoProgress, RCTDirectEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onVideoSeek, RCTDirectEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onVideoEnd, RCTDirectEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onVideoWaiting, RCTDirectEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onTracksChanged, RCTDirectEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onAudioTrackSelected, RCTDirectEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onTextTrackSelected, RCTDirectEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onVideoError, RCTDirectEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onStatisticsUpdate, RCTDirectEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onVideoPaused, RCTDirectEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onVideoPlay, RCTDirectEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onVideoPlaying, RCTDirectEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onVideoStopped, RCTDirectEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onBitratesAvailable, RCTDirectEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onSelectedBitrateChanged, RCTDirectEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onDownloadResChanged , RCTDirectEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onThumbnailAvailable, RCTDirectEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onLog, RCTDirectEventBlock);

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}


RCT_EXPORT_METHOD(play:(nonnull NSNumber*) reactTag) {
  [self.bridge.uiManager addUIBlock:^(RCTUIManager *uiManager, NSDictionary<NSNumber *,UIView *> *viewRegistry) {
    RCTOTVPlayerView *view = viewRegistry[reactTag];
    if (!view || ![view isKindOfClass:[RCTOTVPlayerView class]]) {
      RCTLogError(@"Cannot find NativeView with tag #%@", reactTag);
      return;
    }
    [view play];
  }];
}

RCT_EXPORT_METHOD(pause:(nonnull NSNumber*) reactTag) {
  [self.bridge.uiManager addUIBlock:^(RCTUIManager *uiManager, NSDictionary<NSNumber *,UIView *> *viewRegistry) {
    RCTOTVPlayerView *view = viewRegistry[reactTag];
    if (!view || ![view isKindOfClass:[RCTOTVPlayerView class]]) {
      RCTLogError(@"Cannot find NativeView with tag #%@", reactTag);
      return;
    }
    [view pause];
  }];
}

RCT_EXPORT_METHOD(seek:(nonnull NSNumber*) reactTag:(NSDictionary*)info) {
  [self.bridge.uiManager addUIBlock:^(RCTUIManager *uiManager, NSDictionary<NSNumber *,UIView *> *viewRegistry) {
    RCTOTVPlayerView *view = viewRegistry[reactTag];
    if (!view || ![view isKindOfClass:[RCTOTVPlayerView class]]) {
      RCTLogError(@"Cannot find NativeView with tag #%@", reactTag);
      return;
    }
    [view seek:info];
  }];
}

RCT_EXPORT_METHOD(stop:(nonnull NSNumber*) reactTag) {
  [self.bridge.uiManager addUIBlock:^(RCTUIManager *uiManager, NSDictionary<NSNumber *,UIView *> *viewRegistry) {
    RCTOTVPlayerView *view = viewRegistry[reactTag];
    if (!view || ![view isKindOfClass:[RCTOTVPlayerView class]]) {
      RCTLogError(@"Cannot find NativeView with tag #%@", reactTag);
      return;
    }
    [view stop];
  }];
}

RCT_EXPORT_METHOD(selectAudioTrack:(nonnull NSNumber*) reactTag:(int)selectedAudioTrack) {
  [self.bridge.uiManager addUIBlock:^(RCTUIManager *uiManager, NSDictionary<NSNumber *,UIView *> *viewRegistry) {
    RCTOTVPlayerView *view = viewRegistry[reactTag];
    if (!view || ![view isKindOfClass:[RCTOTVPlayerView class]]) {
      RCTLogError(@"Cannot find NativeView with tag #%@", reactTag);
      return;
    }
    [view selectAudioTrack:selectedAudioTrack];
  }];
}

RCT_EXPORT_METHOD(selectTextTrack:(nonnull NSNumber*) reactTag:(int)selectedTextTrack) {
  [self.bridge.uiManager addUIBlock:^(RCTUIManager *uiManager, NSDictionary<NSNumber *,UIView *> *viewRegistry) {
    RCTOTVPlayerView *view = viewRegistry[reactTag];
    if (!view || ![view isKindOfClass:[RCTOTVPlayerView class]]) {
      RCTLogError(@"Cannot find NativeView with tag #%@", reactTag);
      return;
    }
    [view selectTextTrack:selectedTextTrack];
  }];
}



@end
