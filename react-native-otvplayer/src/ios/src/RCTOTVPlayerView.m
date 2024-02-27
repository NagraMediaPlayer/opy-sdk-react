// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
//
//  RCTOTVPlayerView.m
//  React-otvplayer

#import "RCTOTVPlayerView.h"
#import "OTVDRMHelper.h"
#import <React/RCTBridge.h>
#import <React/UIView+React.h>
#import <AVFoundation/AVFoundation.h>

static NSString *const statusKeyPath = @"status";
static NSString *const playbackLikelyToKeepUpKeyPath = @"playbackLikelyToKeepUp";
static NSString *const otvSSMSetupErrorNotification = @"OTVSSMSetupErrorNotification";
static NSString *const otvSSMHeartbeatErrorNotification = @"OTVSSMHeartbeatErrorNotification";
static NSString *const otvSSMTeardownErrorNotification = @"OTVSSMTeardownErrorNotification";
static NSString *const playerTimeControlStatusKeyPath = @"timeControlStatus";
static NSString *const otvDRMLicenseErrorNotification = @"OTVDRMLicenseError";
static NSString *const otvDRMLicenseDownloadedNotification = @"OTVLicenseDownloadEnded";

// Logs

static NSString *const otvLogNotification = @"OTVLogNotification";

// Thumnails
static NSString *const iIFrameThumbnailsAvailable = @"OTVIFrameThumbnailsAvailable";
static NSString *const iIFrameThumbnailsNotAvailable = @"OTVIFrameThumbnailsNotAvailable";
static NSString *const iFrameThumbnailsError = @"OTVIFrameThumbnailsError";

static NSString *const otvAvailableBitratesChanged = @"availableBitratesChanged";
static NSString *const otvSelectedBitrateChanged = @"selectedBitrateChanged";
static NSString *const otvSelectedResoloutionsChanged = @"selectedResoloutionsChanged";

// HTTP Error codes
const NSInteger HTTPErrorResourceMissing = -12938;
const NSInteger HTTPErrorBadRequest      = -16845;             //HTTP 400
const NSInteger HTTPErrorUnauthorized    = -16840;             //HTTP 401
const NSInteger HTTPErrorForbidden       = -12660;             //HTTP 403
const NSInteger HTTPErrorForbidden1      = -1102;              //Forbidden error comes as underlying error in this case.
const NSInteger HTTPErrorRangeNotSatisfiable = -12939;         //HTTP 416
const NSInteger HTTPErrorConflict            = -16852;         //HTTP 409
const NSInteger HTTPErrorResourceNoLongerAvailable   = -12668; //HTTP 410
const NSInteger HTTPErrorResourceExpecationFailed    = -16240; //HTTP 417-450, 452-499, 506-600
const NSInteger HTTPErrorUnknownErrorOnMissingChunks = -16657;
const NSInteger HTTPErrorUnhandled     = -16846;               //HTTP 501, 505
const NSInteger HTTPErrorInternalError = -16847;               //HTTP 500
const NSInteger HTTPErrorBadGateway    = -16848;               // HTTP 502
const NSInteger HTTPErrorServiceUnavailable = -16849;          // HTTP 503
const NSInteger HTTPErrorGatewayTimeout     = -16850;          // HTTP 504
const NSInteger SegmentExceedsSpecifiedBandwidthForVariant = -12318; //e.g. e.g. Segment size are too big as per variant.
const NSInteger PlaylistParseError          = -12642;                //e.g. if there is any issue in manifest.

// SSM Error Codes
const NSInteger SSMErrorCodeSetup     = 6001;
const NSInteger SSMErrorCodeHeartBeat = 6003;
const NSInteger SSMErrorCodeTearDown  = 6002;

//DRM Error codes
const NSInteger DRMErrorCodeKeyResponseWithExpiredLease = 5004;
const NSInteger DRMErrorCodeKeyResponseError = 5007;
const NSInteger DRMErrorContentTokenNotAvailable = 5022;


//Thumbnail Error codes
const int ThumbnailItemError = 7020;
const int ThumbnailPostionError = 7021;
const int ThumbnailStylingError = 7022;
const int ThumbnailNotAvailable = 7023;
const int ThumbnailStatusUnknown = 7024;

static NSInteger const PLAYER_ITEM_ERROR_LOG_ENTRY_TYPE  = 0;
static NSInteger const PLAYER_OBSERVER_ERROR_TYPE  = 1;
static NSInteger const PLAYER_THUMBNAIL_ERROR_TYPE = 2;

static int const ENABLE_STATISTICS_NONE          = 0;
static int const ENABLE_STATISTICS_ALL           = ~0;
static int const ENABLE_STATISTICS_RENDERING     = 1;
static int const ENABLE_STATISTICS_NETWORK       = 1 << 1;
static int const ENABLE_STATISTICS_PLAYBACK      = 1 << 2;
static int const ENABLE_STATISTICS_EVENT         = 1 << 3;
static int const ENABLE_STATISTICS_DRM_SECURITY  = 1 << 4;

static float const LIVE_DURATION = -1;  // because some react dependencies crash with INFINITY

@interface RCTOTVPlayerView()
{
  OTVAVPlayerItem *_playerItem;
  OTVAVPlayer *_player;
  NSDictionary *_src;
  BOOL _autoplay;
  float _rate;
  float _volume;
  BOOL _muted;
  BOOL _paused;
  BOOL _playInBackground;
  BOOL _playWhenInactive;
  double _maxBitrate;
  NSDictionary *_maxResolution;

  id _timeObserver;
  BOOL _playerItemObserversSet;
  BOOL _playerObserversSet;
  double _progressUpdateInterval;
  BOOL _errorHandlingListenersSet;
  BOOL _playerListenersListenersSet;
  NSDictionary *_pendingSeekInfo;
  BOOL _videoLoadStarted;
  BOOL _playbackStalled;

  UIView *_textView;
  UIView *_adView;

  //thumbnails

  OTVThumbnails *_thumbnails;
  OTVThumbnailModel* _thumbnailModel;
  OTVThumbnailStyle* _newThumbnailStyle;


  //track selection
  int _selectedTextTrack;
  int _selectedAudioTrack;
  NSArray* previousTextTracks;
  NSArray* previousAudioTracks;

  //Statistics
  id _updateStatisticsTimer;
  int _statisticsTypes;
  double _statisticsUpdateInterval;
  NSDictionary *_statisticsConfig;

  BOOL _enableNetworkStats;
  BOOL _enablePlaybackStats;
  BOOL _enableRenderingStats;
  BOOL _enableEventStats;         // currently unsupported
  BOOL _enableDrmSecurityStats;   // currently unsupported

  BOOL _drmError;
  NSInteger _lastDRMErrorCode;
  NSInteger _lastSSMErrorCode;
  NSInteger _lastPlayerItemErrorCode;
  NSInteger _lastThumbnailPlayerItemErrorCode;
  /* Required to publish events */
  RCTEventDispatcher *_eventDispatcher;

  dispatch_semaphore_t tokenSemaphore;
  NSString* _token;
}

@property (nonatomic, weak) NSTimer* liveTimeObserver;
@end

// Avoid getting the designed-initializer warning for this case
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wobjc-designated-initializers"
@implementation RCTOTVPlayerView

- (instancetype)initWithEventDispatcher:(RCTEventDispatcher *)eventDispatcher
{
  RCTOTVLogD(@"init enter");

  if (self = [super init]) {
    _player = [[OTVAVPlayer alloc] initWithPlayerItem: nil];
    //[_player registerWithTracksChangedListener:self];
    [self attachSSMErrorListners];
    [self attachLogListners];
    [self attachDRMErrorListners];
    _src = @{};
    _autoplay = NO;
    _rate = 1.0;
    _volume = 1.0;
    _muted = NO;
    _paused = YES;
    _maxBitrate;
    _maxResolution;
    _playerItemObserversSet = NO;
    _playerObserversSet = NO;
    _errorHandlingListenersSet = NO;
    _progressUpdateInterval = 0.25;
    _statisticsTypes  = ENABLE_STATISTICS_ALL;
    _statisticsUpdateInterval = 5000;
    _statisticsConfig = @{};
    _updateStatisticsTimer = nil;
    _eventDispatcher = eventDispatcher;
    _playbackStalled = NO;
    _selectedTextTrack = -1;
    _selectedAudioTrack = -1;

    previousTextTracks = [NSArray new];
    previousAudioTracks = [NSArray new];

    _lastDRMErrorCode = -1;
    _lastPlayerItemErrorCode = -1;
    _lastThumbnailPlayerItemErrorCode =-1;
    tokenSemaphore = dispatch_semaphore_create(0);


    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(applicationWillResignActive:)
                                                 name:UIApplicationWillResignActiveNotification
                                               object:nil];

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(applicationDidEnterBackground:)
                                                 name:UIApplicationDidEnterBackgroundNotification
                                               object:nil];

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(applicationWillEnterForeground:)
                                                 name:UIApplicationWillEnterForegroundNotification
                                               object:nil];
  }

  [self setMuteButtonSwitch];


  RCTOTVLogD(@"init exit");
  return self;
}
#pragma clang diagnostic pop

- (void)sendStatisticsUpdate {
  AVPlayerItem *item = _player.currentItem;
  if (item && item.status == AVPlayerItemStatusReadyToPlay) {

    RCTOTVLogD(@"sendStatisticsUpdate enter");

    NSMutableDictionary* statistics = [[NSMutableDictionary alloc] init];
    NSMutableDictionary* network= [[NSMutableDictionary alloc] init];
    NSMutableDictionary* playback = [[NSMutableDictionary alloc] init];
    NSMutableDictionary* rendering = [[NSMutableDictionary alloc] init];

    //selectedResolution
    NSMutableDictionary* selectedResolutionDictionary = [[NSMutableDictionary alloc] init];

    if (_enableNetworkStats) {
      NSMutableDictionary* adaptiveStreaming= [[NSMutableDictionary alloc] init];
      NSMutableDictionary* networkUsage = [[NSMutableDictionary alloc] init];
      NSMutableDictionary* contentServer = [[NSMutableDictionary alloc] init];

      // AdaptiveStreaming
      NSArray* availableBitrates = [NSArray arrayWithArray:[_player.networkAnalytics.adaptiveStreaming availableBitrates]];
      NSNumber *selectedBitrate = [NSNumber numberWithInt:[_player.networkAnalytics.adaptiveStreaming selectedBitrate]];
      NSNumber *bitrateSwitches = [NSNumber numberWithLong:[_player.networkAnalytics.adaptiveStreaming bitrateSwitches]];
      NSNumber *bitrateDowngrade = [NSNumber numberWithLong:[_player.networkAnalytics.adaptiveStreaming bitrateDowngrade]];
      NSNumber *averageBitrate = [NSNumber numberWithLong:[_player.networkAnalytics.adaptiveStreaming averageBitrate]];
      NSNumber *averageVideoBitrate = [NSNumber numberWithLong:[_player.networkAnalytics.adaptiveStreaming averageVideoBitrate]];
      NSNumber *averageAudioBitrate = [NSNumber numberWithLong:[_player.networkAnalytics.adaptiveStreaming averageAudioBitrate]];

      // NetworkUsage
      NSNumber *bytesDownloaded = [NSNumber numberWithLong:[_player.networkAnalytics.networkUsage bytesDownloaded]];
      NSNumber *downloadBitrate = [NSNumber numberWithLong:[_player.networkAnalytics.networkUsage downloadBitrate]];
      NSNumber *downloadBitrateAverage = [NSNumber numberWithLong:[_player.networkAnalytics.networkUsage downloadBitrateAverage]];
      NSNumber *numberOfMediaRequests = [NSNumber numberWithLong:[_player.networkAnalytics.networkUsage numberOfMediaRequests]]; //int
      NSNumber *transferDuration = [NSNumber numberWithDouble:[_player.networkAnalytics.networkUsage transferDuration]];
      NSNumber *downloadsOverdue = [NSNumber numberWithLong:[_player.networkAnalytics.networkUsage downloadsOverdue]];

      // ContentServer
      NSString* finalIPAddress = [_player.networkAnalytics.contentServer finalIPAddress];
      NSString* finalURL = [_player.networkAnalytics.contentServer finalURL];
      NSString* url = [_player.networkAnalytics.contentServer url];
      NSNumber *numberOfServerAddressChanges = [NSNumber numberWithLong:[_player.networkAnalytics.contentServer numberOfServerAddressChanges]];

      [adaptiveStreaming setValue:availableBitrates forKey:@"availableBitrates"];
      [adaptiveStreaming setValue:selectedBitrate forKey:@"selectedBitrate"];
      [adaptiveStreaming setValue:bitrateSwitches forKey:@"bitrateSwitches"];
      [adaptiveStreaming setValue:bitrateDowngrade forKey:@"bitrateDowngrade"];
      [adaptiveStreaming setValue:averageBitrate forKey:@"averageBitrate"];
      [adaptiveStreaming setValue:averageVideoBitrate forKey:@"averageVideoBitrate"];
      [adaptiveStreaming setValue:averageAudioBitrate forKey:@"averageAudioBitrate"];

      [networkUsage setValue:bytesDownloaded forKey:@"bytesDownloaded"];
      [networkUsage setValue:downloadBitrate forKey:@"downloadBitrate"];
      [networkUsage setValue:downloadBitrateAverage forKey:@"downloadBitrateAverage"];
      [networkUsage setValue:numberOfMediaRequests forKey:@"numberOfMediaRequests"];
      [networkUsage setValue:transferDuration forKey:@"transferDuration"];
      [networkUsage setValue:downloadsOverdue forKey:@"downloadsOverdue"];

      [contentServer setValue:finalIPAddress forKey:@"finalIPAddress"];
      [contentServer setValue:finalURL forKey:@"finalURL"];
      [contentServer setValue:url forKey:@"url"];
      [contentServer setValue:numberOfServerAddressChanges forKey:@"numberOfServerAddressChanges"];

      [network setValue:adaptiveStreaming forKey:@"adaptiveStreaming"];
      [network setValue:networkUsage forKey:@"networkUsage"];
      [network setValue:contentServer forKey:@"contentServer"];

      [statistics setValue:network forKey:@"network"];



    }
    if (_enablePlaybackStats) {
      int bufferedDuration = [_player.playbackAnalytics.player bufferedDuration];
      NSNumber *wrappedBufferedDuration = [NSNumber numberWithInt:bufferedDuration];

      NSArray* availableResoloutions = [NSArray arrayWithArray:[_player.playbackAnalytics.player availableResoloutions]];

      NSMutableArray *formattedAvailableResolutionArray = [[NSMutableArray alloc] init];
      for (NSValue* entry in availableResoloutions) {
        CGSize resSize;
        [entry getValue:&resSize];
        if ((resSize.width > 0) && (resSize.height > 0)) {
          NSMutableDictionary* resolution= [[NSMutableDictionary alloc] init];
          [resolution setValue:[NSNumber numberWithInt:resSize.width] forKey:@"width" ];
          [resolution setValue:[NSNumber numberWithInt:resSize.height] forKey:@"height" ];
          [formattedAvailableResolutionArray addObject:resolution];
        }
      }

      CGSize selectedResoloution = [_player.playbackAnalytics.player selectedResoloution];
      NSNumber *resolutionWidth = [NSNumber numberWithInt:selectedResoloution.width];
      NSNumber *resolutionHeight = [NSNumber numberWithInt:selectedResoloution.height];

      NSNumber *startUpTime = [NSNumber numberWithDouble:[_player.playbackAnalytics.player startUpTime]];
      NSNumber *numberOfStalls = [NSNumber numberWithLong:[_player.playbackAnalytics.player numberOfStalls]];
      NSString* playbackType = [_player.playbackAnalytics.player playbackType];

      NSDate* playbackStartDate = [_player.playbackAnalytics.player playbackStartDate];
      NSDateFormatter *dateFormatter = [[NSDateFormatter alloc] init];
      dateFormatter.dateFormat = @"yyyy-MM-dd 'at' HH:mm:ss";
      NSString *dateString = [dateFormatter stringFromDate:playbackStartDate];

      NSNumber *playbackStartOffset = [NSNumber numberWithDouble:[_player.playbackAnalytics.player playbackStartOffset]];

      [playback setValue:wrappedBufferedDuration forKey:@"bufferedDuration"];
      [playback setValue:formattedAvailableResolutionArray forKey:@"availableResolutions"];


      [selectedResolutionDictionary setValue:resolutionWidth forKey:@"width"];
      [selectedResolutionDictionary setValue:resolutionHeight forKey:@"height"];
      [playback setValue:selectedResolutionDictionary forKey:@"selectedResolution"];

      [playback setValue:startUpTime forKey:@"startUpTime"];
      [playback setValue:numberOfStalls forKey:@"numberOfStalls"];
      [playback setValue:playbackType forKey:@"playbackType"];
      [playback setValue:dateString forKey:@"playbackStartDate"];
      [playback setValue:playbackStartOffset forKey:@"playbackStartOffset"];

      [statistics setValue:playback forKey:@"playback"];

    }


    if (_enableRenderingStats) {

      NSNumber *frameDrops = [NSNumber numberWithLong:[_player.playbackAnalytics.rendering frameDrops]];
      NSNumber *frameDropsPerSecond = [NSNumber numberWithLong:[_player.playbackAnalytics.rendering frameDropsPerSecond]];
      NSNumber *framesPerSecond     = [NSNumber numberWithLong:[_player.playbackAnalytics.rendering framesPerSecond]];
      NSNumber *framesPerSecondNominal = [NSNumber numberWithLong:[_player.playbackAnalytics.rendering framesPerSecondNominal]];

      [rendering setValue:frameDrops forKey:@"frameDrops"];
      [rendering setValue:frameDropsPerSecond forKey:@"frameDropsPerSecond"];
      [rendering setValue:framesPerSecond forKey:@"framesPerSecond"];
      [rendering setValue:framesPerSecondNominal forKey:@"framesPerSecondNominal"];

      [statistics setValue:rendering forKey:@"rendering"];
    }
    /* Currently not supported

     if (_enableEventStats) {
     }
     if (_enableDrmSecurityStats) {
     }
     */

    if (self.onStatisticsUpdate) {
      self.onStatisticsUpdate(statistics);
    }
    RCTOTVLogD(@"sendStatisticsUpdate exit");

  }

}

- (void)dealloc
{
  RCTOTVLogD(@"dealloc enter");
  [OTVDRMHelper.shared.delegate removeStream];
  [[NSNotificationCenter defaultCenter] removeObserver:self];
  [self removePlayerListeners];
  [self removePlayerErrorListeners];
  [self stopStatisticsUpdate];
  [self removePlayerLayer];
  [self removePlayerItemObservers];
  [self removePlayerTimeObserver];
  [self removePlayerObservers];
  [_player unregisterWithTracksChangedListener:self];
  [self removeSSMErrorListners];
  [self removeLogListners];
  [self removeDRMErrorListners];
  [_player pause];
  [_player replaceCurrentItemWithPlayerItem:nil];
  _thumbnails = nil;
  RCTOTVLogD(@"dealloc exit");

}

//cleanup function location. When the view is being descoped but there are still objects that need to be removed.
//this is the function to do the cleanup.
-(void)didMoveToWindow{
  //only fire on dealloc of the view and not on init.
  if (self.window == nil){
    [self removePlayerTimeObserver];
  }
}


#pragma mark - App lifecycle handlers

- (void)applicationWillResignActive:(NSNotification *)notification
{
  RCTOTVLogD(@"applicationWillResignActive enter");
  RCTOTVLogD(@"applicationWillResignActive exit");

}

- (void)applicationDidEnterBackground:(NSNotification *)notification
{
  RCTOTVLogD(@"applicationDidEnterBackground enter");

  // Needed to play sound in background. See https://developer.apple.com/library/ios/qa/qa1668/_index.html
  AVPlayerLayer *playerLayer = (AVPlayerLayer*)self.layer;
  [playerLayer setPlayer:nil];
  RCTOTVLogD(@"applicationDidEnterBackground exit");

}

- (void)applicationWillEnterForeground:(NSNotification *)notification
{
  RCTOTVLogD(@"applicationWillEnterForeground enter");
  AVPlayerLayer *playerLayer = (AVPlayerLayer*)self.layer;
  [playerLayer setPlayer:_player];
  RCTOTVLogD(@"applicationWillEnterForeground exit");

}

- (void)setStatisticsConfig: (NSDictionary*)statsconfig
{
  RCTOTVLogD(@"setStatisticsConfig enter");
  if (statsconfig) {
    RCTOTVLogI(@"statistics config: %@", statsconfig);
  }
  _statisticsConfig = statsconfig;

  if (self->_statisticsConfig[@"statisticsTypes"]) {
    NSString * typesString = self->_statisticsConfig[@"statisticsTypes"];
    _statisticsTypes = [typesString intValue];
    RCTOTVLogI(@"statisticsTypes: %i",  _statisticsTypes);
  }
  else {
    _statisticsTypes  = ENABLE_STATISTICS_ALL;
  }

  if (self->_statisticsConfig[@"statisticsUpdateInterval"]) {
    NSString * updatedIntervalString = self->_statisticsConfig[@"statisticsUpdateInterval"];
    _statisticsUpdateInterval = [updatedIntervalString intValue];
    RCTOTVLogI(@"statisticsUpdateInterval: %f",  _statisticsUpdateInterval);
  } else {
    _statisticsUpdateInterval = 5000;
  }

  RCTOTVLogI(@"statisticsTypes: %i",  _statisticsTypes);
  RCTOTVLogI(@"statisticsUpdateInterval: %f",  _statisticsUpdateInterval);

  [self setStatisticsGroups:_statisticsTypes];
  [self toggleStatistics:_statisticsTypes];

  RCTOTVLogD(@"setStatisticsConfig exit");
}


- (void)setSource: (NSDictionary*)src
{
  RCTOTVLogD(@"setSource enter");
  __weak RCTOTVPlayerView *weakSelf = self;
  OTVDRMHelper* drmHelper = [OTVDRMHelper shared];

  //if the same content but no token then trigger token callback.
  if ([_src[@"src"] isEqual:src[@"src"]]) {
    if(src[@"token"] && [_token isEqualToString:@""] && !_drmError){
      _token = src[@"token"];
      _src = src;
      dispatch_semaphore_signal(tokenSemaphore);
    }
    RCTOTVLogD(@"setSource exit");
    return;
  }

  if (src) {
    RCTOTVLogI(@"setSource src:");
    RCTOTVLogI( @"%@", src);
  }
  else {
    RCTOTVLogI(@"setSource: src is missing");
  }

  _src = src;

  if ([src[@"src"] isEqual:@""] || [src[@"src"] isEqual:[NSNull null]])
  {
    [self resetPlaybackState];
    RCTOTVLogD(@"setSource exit");
    return;
  }

  [self resetPlaybackState];

  _thumbnails = [[OTVThumbnails alloc]initWithPlayerView:self];

  //dont setup DRM when src is nil
  if (self->_src[@"drm"] && _src[@"drm"]) {
    RCTOTVLogI(@"DRM FOUND");
    [drmHelper setDrmConfig:self->_src[@"drm"]];
    if (self->_src[@"tokenType"]) {
      RCTOTVLogI(@"TokenType FOUND");
      [drmHelper setDRMTokenType:[self->_src valueForKey:@"tokenType"]];
    }
    if (![drmHelper hasDRM]){
      RCTOTVLogI(@"NO DRM or DRM object is empty.");
      [drmHelper clearStreamDelegate];
      [weakSelf setupFPSPlayback];
    }else if(self->_src[@"token"] && ![self->_src[@"token"] isEqual:[NSNull null]]){
      [self setupFPSPlayback];
    }else {
      dispatch_async(dispatch_get_global_queue( DISPATCH_QUEUE_PRIORITY_DEFAULT, 0),^(void){
        tokenSemaphore = dispatch_semaphore_create(0);
        dispatch_time_t timeout;
        RCTOTVLogD(@"tokenWait start");
        timeout = dispatch_time(DISPATCH_TIME_NOW, (int64_t)(5.0 * NSEC_PER_SEC));
        dispatch_semaphore_wait(tokenSemaphore, timeout);
        RCTOTVLogD(@"tokenWait end");
        if (![_token isEqual:@""] && !_drmError && ![self->_src[@"token"] isEqual:[NSNull null]]) {
          [self setupFPSPlayback];
        }else {
          dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t) 0), dispatch_get_main_queue(), ^{
            NSDictionary *userInfo = [NSDictionary dictionaryWithObject:@"DRMErrorContentTokenNotAvailable" forKey:@"DRMErrorContentTokenNotAvailable"];
            [[NSNotificationCenter defaultCenter] postNotificationName:
             otvDRMLicenseErrorNotification object:@"DRMErrorContentTokenNotAvailable" userInfo:userInfo];
          });
        }
      });
    }
  }else {
    [drmHelper clearStreamDelegate];
    [weakSelf setupFPSPlayback];
  }


  RCTOTVLogD(@"setSource exit");
}

-(void)resetPlaybackState {
  //reset error states to default on zap

  OTVDRMHelper* drmHelper = [OTVDRMHelper shared];
  //remove last SSM session.
  [drmHelper.delegate removeStream];

  _drmError = false;
  _lastDRMErrorCode = -1;
  _lastPlayerItemErrorCode = -1;
  _lastThumbnailPlayerItemErrorCode = -1;
  _lastSSMErrorCode = -1;

  //reset content token
  _token = @"";
  //initial thumbnail states.
  _newThumbnailStyle = nil;
  _thumbnailModel = nil;
  _thumbnails = nil;

  [self stopStatisticsUpdate];
  [self removePlayerTimeObserver];
  [self removePlayerItemObservers];
  [self->_player unregisterWithTracksChangedListener:self];

  [_player replaceCurrentItemWithPlayerItem:nil];
}

-(void)setupFPSPlayback {
  OTVDRMHelper* drmHelper = [OTVDRMHelper shared];

  /**
   setSrc is called in JS thread, make sure native player is handled in UI thread
   */
  dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t) 0), dispatch_get_main_queue(), ^{
    if(self->_src[@"token"]){
      self->_token = self->_src[@"token"];
      [drmHelper.delegate setStreamWithToken:self->_src[@"token"] with:[[NSURL alloc]initWithString:[self->_src valueForKey:@"src"]]
                                     success:^{
        RCTOTVLogI(@"delegate setStream succeeded");
      } failure:^{
        RCTOTVLogE(@"delegate setStream failed");
      }];
    }

    NSURL* srcURL = [NSURL URLWithString: self->_src[@"src"]];

    if (srcURL && srcURL.absoluteString.length != 0) {
      [self->_player registerWithTracksChangedListener:self];
    }

    self->_playerItem = [[OTVAVPlayerItem alloc] initWithURL:srcURL];
    [self addPlayerItemObservers];

    _paused = true;
    [self->_player pause];
    [self->_player replaceCurrentItemWithPlayerItem:self->_playerItem];
    [self usePlayerLayer];
    [self setSideloadedTextTracks: self->_src[@"textTracks"]];
    [self createTextView];
    [self addPlayerObservers];
    [self attachPlayerErrorListeners];
    [self attachPlayerListeners];

    if (self.onVideoLoadStart) {
      id uri = [self->_src objectForKey:@"src"];
      id type = [self->_src objectForKey:@"type"];
      RCTOTVLogD(@"Sending onVideoLoadStart event");
      self.onVideoLoadStart(@{ @"src": uri ? uri : [NSNull null],
                               @"type": type ? type : [NSNull null]
                            });
      RCTOTVLogD(@"Sent onVideoLoadStart event");
      self->_videoLoadStarted = YES;
    }

    [self setStatisticsGroups:self->_statisticsTypes];
    [self startStatisticsUpdates];

    [self setupOTVThumbnail];
  });

}
-(void)setupOTVThumbnail {
  NSURL* srcURL = [NSURL URLWithString: _src[@"src"]];
  [_thumbnails setupThumbnailViewWithPlayer:_player url:srcURL];
}

-(void)setThumbnail: (NSDictionary*)object {
  if (object == nil) {
    return;
  }
  if (_thumbnailModel == nil) {
    _thumbnailModel = [[OTVThumbnailModel alloc]init];
  }
  if (_newThumbnailStyle == nil) {
    _newThumbnailStyle = [[OTVThumbnailStyle alloc]init];
  }

  if ([object valueForKey:@"style"]) {
    OTVThumbnailStyle* localStyle = [[OTVThumbnailStyle alloc]init];
    NSDictionary* style = [object valueForKey:@"style"];
    if ([style valueForKey:@"top"]){
      localStyle.top = [[style valueForKey:@"top"]intValue];
      }
      if ([style valueForKey:@"left"]){
        localStyle.left = [[style valueForKey:@"left"]intValue];
      }

      if ([style valueForKey:@"width"]){
        localStyle.width = [[style valueForKey:@"width"]intValue];
      }
      if ([style valueForKey:@"height"]){
        localStyle.height = [[style valueForKey:@"height"]intValue];
      }

      if (style[@"borderWidth"]) {
        localStyle.borderWidth= [[style valueForKey:@"borderWidth"]floatValue];
      }
      if (style[@"borderColor"]) {
        localStyle.borderColor= [style valueForKey:@"borderColor"];
      }
    if (localStyle != _newThumbnailStyle) {
      _newThumbnailStyle = localStyle;
    }
    _thumbnails.thumbnailStyle = _newThumbnailStyle;
  }

  if ([object valueForKey:@"display"]){
    _thumbnailModel.display = [[object valueForKey:@"display"]boolValue];
  }

  if ([object valueForKey:@"positionInSeconds"]){
    _thumbnailModel.positionInSeconds = [[object valueForKey:@"positionInSeconds"]floatValue];
  }

  _thumbnails.thumbnailDictionary = _thumbnailModel;
}

- (void)setAutoplay: (BOOL)autoplay
{
  RCTOTVLogD(@"setAutoplay enter");
  _autoplay = autoplay;
  RCTOTVLogD(@"setAutoplay exit");
}


- (void)setRate: (float)rate
{
  RCTOTVLogD(@"setRate enter");
  _rate = rate;
  [self applyModifiers];
  RCTOTVLogD(@"setRate exit");
}

- (void)setVolume:(float)volume
{
  RCTOTVLogD(@"setVolume enter");
  _volume = volume;
  [self applyModifiers];
  RCTOTVLogD(@"setVolume exit");
}


-(void)throwThumbnailError: (int)error {

  RCTOTVLogD(@"thumbnailError enter");

  NSInteger errorCode = -1;
  NSString *errorDomain = @"UnknownThumbnailError";
  NSString *localizedDesc = @"Unknown thumbnail error";
  NSString *localizedFailureReason = @"";
  NSString *localizedRecoverySuggestion = @"Unknown";
  NSString *platform = @"";
  switch (error) {
    case ThumbnailStylingError:
      errorCode = ThumbnailStylingError;
      errorDomain = @"ThumbnailStylingError";
      localizedDesc = @"ThumbnailStylingNotSet for top, left, width or height";
      localizedFailureReason = @"";
      localizedRecoverySuggestion = @"Set values for thumbnailStyle for top, left, width and height";
      break;
    case ThumbnailNotAvailable:
      errorCode = ThumbnailNotAvailable;
      errorDomain = @"ThumbnailNotAvailable";
      localizedDesc = @"Thumbnails are not available for the media.";
      localizedFailureReason = @"";
      localizedRecoverySuggestion = @"Only set displayThumbnail to true where thumbnails are available.";
      break;
    case ThumbnailStatusUnknown:
      errorCode = ThumbnailStatusUnknown;
      errorDomain = @"ThumbnailStatusUnknown";
      localizedDesc = @"Thumbnail status is unknown";
      localizedFailureReason = @"";
      localizedRecoverySuggestion = @"Wait until onThumbnailAvailables before setting displayThumbnail to true.";
      break;
    case ThumbnailPostionError:
      errorCode = ThumbnailPostionError;
      errorDomain = @"ThumbnailOutOfBounds";
      localizedDesc = @"Trying to display a thubnail outside of the seekable window";
      localizedFailureReason = @"OTVThumbnailPositionError";
      localizedRecoverySuggestion = @"Set thumbnail postion to a value inside of the seekable range.";
      break;
    default:
      break;
  }
#if TARGET_OS_IOS
  platform = @"iOS";
#else
  platform = @"tvOS";
#endif

  RCTOTVLogE(@"mapped error Code: %ld", (long)errorCode);
  RCTOTVLogE(@"error Domain: %@", errorDomain);

  NSDictionary *details = @{ @"domain":errorDomain,
                             @"code":@(errorCode),
                             @"localizedDescription":localizedDesc,
                             @"localizedFailureReason":localizedFailureReason,
                             @"localizedRecoverySuggestion":localizedRecoverySuggestion
  };
  NSDictionary *nativeError = @{ @"platform":platform, @"details":details};
  if(self.onVideoError) {
    self.onVideoError(@{ @"code":@(errorCode), @"nativeError":nativeError});
  }
}

- (void)play {
  RCTOTVLogD(@"play enter");

  if (self.onVideoPlay) {
    self.onVideoPlay(@{});
    RCTOTVLogD(@"playerItemStatus trigger onPlay event");
  } else {
    RCTOTVLogD(@"onPlay event is not bound");
  }
  [_player play];
  _paused = false;
  [_player setRate:_rate];

  //reset last errors.
  _lastDRMErrorCode = -1;
  _lastPlayerItemErrorCode = -1;
  _lastThumbnailPlayerItemErrorCode = -1;
  _lastSSMErrorCode = -1;

  RCTOTVLogD(@"play exit");
}

- (void)pause {
  RCTOTVLogD(@"pause enter");
  [_player pause];
  _paused = true;
  [_player setRate:0.0];
  RCTOTVLogD(@"pause exit");
}

- (void)stop {
  RCTOTVLogD(@"stop enter");
  [self removePlayerErrorListeners];
  [self stopStatisticsUpdate];
  [self removePlayerItemObservers];
  [self removePlayerTimeObserver];
  [self removePlayerObservers];
  [_player pause];
  [_player unregisterWithTracksChangedListener:self];
  [_player replaceCurrentItemWithPlayerItem:nil];
  _thumbnails = nil;
  _thumbnailModel = nil;
  _newThumbnailStyle = nil;
  [self sendOnStop];
  RCTOTVLogD(@"stop exit");
}

- (void)seek:(NSDictionary*)info {
  RCTOTVLogD(@"seek enter");
  __weak RCTOTVPlayerView *weakSelf = self;
  if (!info) {
    return;
  }
  NSNumber *seekPosition = info[@"position"];
  NSNumber *seekTolerance = info[@"tolerance"];

  int timeScale = 1000;

  AVPlayerItem *item = _player.currentItem;
  if (item && item.status != AVPlayerItemStatusReadyToPlay) {
    // store seek request, and perform it when player is ready
    _pendingSeekInfo = [[NSDictionary alloc] initWithDictionary:info copyItems:TRUE];
  } else {
    // TODO check loadedTimeRanges
    CMTime cmSeekTime = CMTimeMakeWithSeconds([seekPosition floatValue], timeScale);
    CMTime current = item.currentTime;
    // TODO figure out a good tolerance level
    CMTime tolerance = CMTimeMake([seekTolerance intValue], timeScale);
    if (CMTimeCompare(current, cmSeekTime) != 0) {
      [_player seekToTime:cmSeekTime toleranceBefore:tolerance toleranceAfter:tolerance completionHandler:^(BOOL finished) {
        RCTOTVLogD(@"Seek to postion: %@", seekPosition);
        if(weakSelf.onVideoSeek) {
          weakSelf.onVideoSeek(@{@"currentPosition": [NSNumber numberWithFloat:CMTimeGetSeconds(item.currentTime)],
                             @"seekPosition": seekPosition});

        }
      }];
      _pendingSeekInfo = nil;
    }
  }
  RCTOTVLogD(@"seek exit");
}

- (void)selectAudioTrack:(int)selectedAudioTrack {
  RCTOTVLogD(@"selectAudioTrack enter");
  [self setMediaSelection:OTVTrackTypeAudio withIndex:selectedAudioTrack];
  [_player selectedTrackWithType:OTVTrackTypeAudio];
  RCTOTVLogD(@"selectAudioTrack exit");
}

- (void)selectTextTrack:(int)selectedTextTrack {
  RCTOTVLogD(@"selectTextTrack enter");
  [self setMediaSelection:OTVTrackTypeSubtitle withIndex:selectedTextTrack];
  [_player selectedTrackWithType:OTVTrackTypeSubtitle];
  RCTOTVLogD(@"selectTextTrack exit");
}

-(void) setMaxBitrate:(double)maxBitrate
{
    RCTOTVLogD(@"setmaxBitrate enter");
    _playerItem.preferredPeakBitRate = maxBitrate;
    _maxBitrate = maxBitrate;
    RCTOTVLogD(@"setmaxBitrate exit");
}

-(void) setMaxResolution:(NSDictionary*)maxResolution
{
    RCTOTVLogD(@"setmaxResolution enter");
    if(maxResolution != 0 ){
        if(([maxResolution objectForKey:@"width"] && [[maxResolution objectForKey:@"width"] isKindOfClass:[NSNumber class]]) &&
           ([maxResolution objectForKey:@"height"] && [[maxResolution objectForKey:@"height"] isKindOfClass:[NSNumber class]])) {
                RCTOTVLogD(@"Both values are number type");
                NSNumber* width = [maxResolution objectForKey: @"width"];
                double _width = [width doubleValue];
                NSNumber* height = [maxResolution objectForKey: @"height"];
                double _height = [height doubleValue];

                if(_width < 0 || _height < 0){
                    _width = 10;
                    _height = 10;
                }
                _playerItem.preferredMaximumResolution = CGSizeMake(_width, _height);
        }else {
            RCTOTVLogE(@"setMaxResolution onError");
            if(self.onVideoError) {
                NSInteger errorCode = 2222;
                NSString *errorDomain = @"ResolutionCappingError";
                NSString *localizedDesc = @"Resolution Capping parameters Should be Number";
                NSString *localizedFailureReason = @"Height & Width values are NULL";
                NSString *localizedRecoverySuggestion = @"";
                NSString *platform = @"";
#if TARGET_OS_IOS
                platform = @"iOS";
#else
                platform = @"tvOS";
#endif

                NSDictionary *details = @{ @"domain": errorDomain,
                                           @"code":@(errorCode),
                                           @"localizedDescription":localizedDesc,
                                           @"localizedFailureReason":localizedFailureReason,
                                           @"localizedRecoverySuggestion":localizedRecoverySuggestion,
                };
                NSDictionary *nativeError = @{ @"platform":platform, @"details":details};
                self.onVideoError(@{ @"code":@(errorCode), @"nativeError": nativeError});
            }
        }
    }
    else{
        RCTOTVLogI(@"MaxResolution in Null reset Resolution");
        _playerItem.preferredMaximumResolution = CGSizeMake(0,0);
    }
    _maxResolution = maxResolution;
    RCTOTVLogD(@"setmaxResolution exit");
}

-(void)setMuteButtonSwitch {
  //allow audio to be played when the mute rocker is turned on.
  [[AVAudioSession sharedInstance] setCategory:AVAudioSessionCategoryPlayback withOptions:AVAudioSessionCategoryOptionMixWithOthers error:nil];
}

- (void)setMuted:(BOOL)muted
{
  RCTOTVLogD(@"setMuted enter");
  if (muted) {
    [_player setVolume:0];
    [_player setMuted:YES];
  } else {
    [_player setVolume:_volume];
    [_player setMuted:NO];
  }
  _muted = muted;
  RCTOTVLogD(@"setMuted exit");
}


- (void)setSideloadedTextTracks: (NSArray*) textTracks
{
  RCTOTVLogD(@"setSideloadedTextTracks enter");

  for(id item in textTracks) {
    NSDictionary *trackInfo = (NSDictionary*)item;
    NSString *url = trackInfo[@"url"];
    NSString *mimeType = trackInfo[@"mimeType"];
    NSString *language = trackInfo[@"language"];
    RCTOTVLogI(@"url is %@, mimeType is %@, language is %@", url, mimeType, language);
    if (url != nil && mimeType != nil && language != nil) {
      [_player addSubtitleWithUrl:url mimeType:mimeType language:language];
    } else {
      RCTOTVLogI(@"one of url, mimeType, language is nil");
    }
  }
  RCTOTVLogD(@"setSideloadedTextTracks exit");
}

- (void)setMediaSelection: (OTVTrackType)trackType withIndex: (int)index
{
  RCTOTVLogD(@"setMediaSelection enter");
  if (index == -1) {
    [_player deselectTrackWithType:trackType index:0];
  }
  [_player selectTrackWithType:trackType index:index];
  RCTOTVLogD(@"setMediaSelection exit");

}

- (void)setProgressUpdateInterval: (float)interval
{
  RCTOTVLogD(@"setProgressUpdateInterval enter");
  _progressUpdateInterval = interval;
  RCTOTVLogD(@"setProgressUpdateInterval exit");
}

- (void)applyModifiers
{
  RCTOTVLogD(@"applyModifiers enter");
//  [self setMaxBitRate:_maxBitRate];
//  [self setSelectedAudioTrack:_selectedAudioTrack];
//  [self setSelectedTextTrack:_selectedTextTrack];
//  [self setResizeMode:_resizeMode];
//  [self setRepeat:_repeat];
//  [self setPaused:_paused]; - should be set explicitly where required.
  [self setMuted:_muted];
  [self seek:_pendingSeekInfo];
//  [self setAllowsExternalPlayback:_allowsExternalPlayback];
  RCTOTVLogD(@"applyModifiers exit");
}

- (void)usePlayerLayer
{
  RCTOTVLogD(@"usePlayerLayer enter");

  if( _player )
  {
    AVPlayerLayer *playerLayer = (AVPlayerLayer*)self.layer;
    [playerLayer setPlayer:_player];
    [playerLayer setVideoGravity:AVLayerVideoGravityResizeAspect];

    playerLayer.frame = self.bounds;
    playerLayer.needsDisplayOnBoundsChange = YES;
  }
  RCTOTVLogD(@"usePlayerLayer exit");

}

- (void)createTextView
{
  RCTOTVLogD(@"createTextView enter");
  _textView = [[UIView alloc] initWithFrame:self.bounds];
  _textView.autoresizingMask = (UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight);
  [self addSubview:_textView];
  _player.subtitleView = _textView;
  RCTOTVLogD(@"createTextView exit");
}

- (void)removePlayerLayer
{
  RCTOTVLogD(@"removePlayerLayer enter");
  AVPlayerLayer *playerLayer = (AVPlayerLayer*)self.layer;
  [playerLayer removeFromSuperlayer];
  RCTOTVLogD(@"removePlayerLayer exit");
}

- (void)setStatisticsGroups: (int)statisticsGroup
{
  RCTOTVLogD(@"setStatisticsGroups enter");
  _enableNetworkStats = [self isEnabled:ENABLE_STATISTICS_NETWORK];
  _enablePlaybackStats = [self isEnabled:ENABLE_STATISTICS_PLAYBACK];
  _enableRenderingStats = [self isEnabled:ENABLE_STATISTICS_RENDERING];
  _enableEventStats = [self isEnabled:ENABLE_STATISTICS_EVENT];
  _enableDrmSecurityStats = [self isEnabled:ENABLE_STATISTICS_DRM_SECURITY];

  RCTOTVLogI(@"setStatisticsGroups _enableNetworkStats:%i", _enableNetworkStats);
  RCTOTVLogI(@"setStatisticsGroups _enablePlaybackStats:%i", _enablePlaybackStats);
  RCTOTVLogI(@"setStatisticsGroups _enableRenderingStats:%i", _enableRenderingStats);
  RCTOTVLogI(@"setStatisticsGroups _enableEventStats:%i", _enableEventStats);
  RCTOTVLogI(@"setStatisticsGroups _enableDrmSecurityStats:%i", _enableDrmSecurityStats);

  RCTOTVLogD(@"setStatisticsGroups exit");
}

-(BOOL)isEnabled:(int) statGroup
{
  RCTOTVLogD(@"isEnabled enter & exit");
  return (_statisticsTypes & statGroup) == statGroup;
}

- (void)toggleStatistics: (int)enable
{
  RCTOTVLogD(@"toggleStatistics enter");

  [self stopStatisticsUpdate];

  if (enable) {
    RCTOTVLogD(@"inside if(enable). starting statisticsupdate timer.");
    [self startStatisticsUpdates];
  }
  RCTOTVLogD(@"toggleStatistics exit");
}

- (void)addPlayerItemObservers
{
  RCTOTVLogD(@"addPlayerItemObservers enter");

  [_playerItem addObserver:self forKeyPath:statusKeyPath options:0 context:nil];
  [_playerItem addObserver:self forKeyPath:playbackLikelyToKeepUpKeyPath options:0 context:nil];
  _playerItemObserversSet = YES;
  RCTOTVLogD(@"addPlayerItemObservers exit");

}

- (void)addPlayerObservers
{
  RCTOTVLogD(@"addPlayerObservers enter");
  [_player addObserver:self
            forKeyPath:playerTimeControlStatusKeyPath
               options:(NSKeyValueObservingOptionNew | NSKeyValueObservingOptionOld)
               context:nil];
  _playerObserversSet = YES;
  RCTOTVLogD(@"addPlayerObservers exit");
}

- (void)removePlayerObservers
{
  RCTOTVLogD(@"removePlayerObservers enter");
  if (_playerObserversSet) {
    [_player removeObserver:self forKeyPath:playerTimeControlStatusKeyPath];
    _playerObserversSet = NO;
  }
  RCTOTVLogD(@"removePlayerObservers exit");
}

/**
 It may crash if trying to remove the observer when there is no observer set
 */
- (void)removePlayerItemObservers
{
  RCTOTVLogD(@"removePlayerItemObservers enter");
  if (_playerItemObserversSet) {
    [_playerItem removeObserver:self forKeyPath:statusKeyPath];
    [_playerItem removeObserver:self forKeyPath:playbackLikelyToKeepUpKeyPath];
    _playerItemObserversSet = NO;
  }
  RCTOTVLogD(@"removePlayerItemObservers exit");
}


- (void)attachPlayerErrorListeners
{
  RCTOTVLogD(@"attachPlayerErrorListeners enter");
  [[NSNotificationCenter defaultCenter] addObserver:self
                                          selector:@selector(playerErrorNotificationHandler:)
                                          name:AVPlayerItemNewErrorLogEntryNotification
                                          object:[_player currentItem]];

  _errorHandlingListenersSet = YES;

  RCTOTVLogD(@"attachPlayerErrorListeners exit");
}

- (void)removePlayerErrorListeners
{
  RCTOTVLogD(@" removePlayerErrorListeners enter");

  if (_errorHandlingListenersSet) {
    [[NSNotificationCenter defaultCenter] removeObserver:self
                                            name:AVPlayerItemNewErrorLogEntryNotification
                                            object:nil];

    _errorHandlingListenersSet = NO;
  }
  RCTOTVLogD(@"removePlayerErrorListeners exit");
}

- (void)attachPlayerListeners
{
  RCTOTVLogD(@"attachPlayerListeners enter");
  [[NSNotificationCenter defaultCenter] addObserver:self
                                          selector:@selector(availableBitratesChangedHandler:)
                                          name: otvAvailableBitratesChanged
                                          object:nil];

  [[NSNotificationCenter defaultCenter] addObserver:self
                                          selector:@selector(selectedBitrateChangedHandler:)
                                          name: otvSelectedBitrateChanged
                                          object:nil];

  [[NSNotificationCenter defaultCenter] addObserver:self
                                          selector:@selector(selectedResoloutionsChangedHandler:)
                                          name: otvSelectedResoloutionsChanged
                                          object:nil];

  _playerListenersListenersSet = YES;
  RCTOTVLogD(@"attachPlayerListeners exit");
}

- (void)removePlayerListeners
{
  RCTOTVLogD(@"removePlayerListeners enter");
  if (_playerListenersListenersSet) {
   [[NSNotificationCenter defaultCenter] removeObserver:self
                                          name: otvAvailableBitratesChanged
                                          object:nil];

    [[NSNotificationCenter defaultCenter] removeObserver:self
                                          name: otvSelectedBitrateChanged
                                          object:nil];

    [[NSNotificationCenter defaultCenter] removeObserver:self
                                          name: otvSelectedResoloutionsChanged
                                          object:nil];

    _playerListenersListenersSet = NO;
  }
  RCTOTVLogD(@"removePlayerListeners exit");
}

-(void)startStatisticsUpdates
{
  RCTOTVLogD(@"startStatisticsUpdates enter");
  if (_statisticsTypes && _updateStatisticsTimer == nil) {
    RCTOTVLogI(@"starting stat updates");

    const Float64 statisticsUpdateIntervalMS = _statisticsUpdateInterval / 1000;
    __weak RCTOTVPlayerView *weakSelf = self;
    _updateStatisticsTimer = [_player addPeriodicTimeObserverForInterval:CMTimeMakeWithSeconds(statisticsUpdateIntervalMS, NSEC_PER_SEC)
                                                          queue:NULL
                                                     usingBlock:^(CMTime time) { [weakSelf sendStatisticsUpdate]; }
                     ];
  }
  RCTOTVLogD(@"startStatisticsUpdates exit");
}

-(void)stopStatisticsUpdate
{
  RCTOTVLogD(@"stopStatisticsUpdate enter");
  if (_updateStatisticsTimer) {
    [_player removeTimeObserver:_updateStatisticsTimer];
    _updateStatisticsTimer = nil;
    RCTOTVLogI(@"Statistics observer removed");
  }
  RCTOTVLogD(@"stopStatisticsUpdate exit");
}

-(void)addPlayerTimeObserver
{
  RCTOTVLogD(@"addPlayerTimeObserver enter");
  RCTOTVLogI(@"_progressUpdateInterval is %f", _progressUpdateInterval);
  __weak RCTOTVPlayerView *weakSelf = self;
  _timeObserver = [_player addPeriodicTimeObserverForInterval:CMTimeMakeWithSeconds(_progressUpdateInterval, NSEC_PER_SEC)
                                                        queue:NULL
                                                   usingBlock:^(CMTime time) { [weakSelf sendProgressUpdate]; }
                   ];
  RCTOTVLogD(@"addPlayerTimeObserver exit");
}

-(void)addLivePlayerTimeObserver
{
  RCTOTVLogD(@"addLivePlayerTimeObserver enter");
  RCTOTVLogI(@"_progressUpdateInterval is %f", _progressUpdateInterval);
  typeof(self) __weak weakSelf = self;
  [weakSelf scheduleLoopInSeconds:_progressUpdateInterval];
  RCTOTVLogD(@"addLivePlayerTimeObserver exit");
}

//use dispatch queue with weak references to simulate a timer but without the strong reference to a runloop.
- (void)scheduleLoopInSeconds:(NSTimeInterval)_progressUpdateInterval
{
  typeof(self) __weak weakSelf = self;
  if ([weakSelf isLiveStream] && _player != nil && _player.currentItem != nil) {
    dispatch_time_t dipatchTime = dispatch_time(DISPATCH_TIME_NOW, (int64_t)(_progressUpdateInterval * NSEC_PER_SEC));
    dispatch_queue_t queue = dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0);
    dispatch_after(dipatchTime, queue, ^{
      [weakSelf sendProgressUpdate];
      [weakSelf scheduleLoopInSeconds:_progressUpdateInterval];
    });
  }
}



/* Cancels the previously registered time observer. */
-(void)removePlayerTimeObserver
{
  RCTOTVLogD(@"removePlayerTimeObserver enter");

  if (_timeObserver)
  {
    [_player removeTimeObserver:_timeObserver];
    _timeObserver = nil;
  }
  if (_liveTimeObserver)
  {
    [_liveTimeObserver invalidate];
    _liveTimeObserver = nil;
  }

  RCTOTVLogD(@"removePlayerTimeObserver exit");

}

-(BOOL)isLiveStream {
  return CMTIME_IS_INDEFINITE([_player currentItem].duration);
}
- (void)sendProgressUpdate
{
  RCTOTVLogD(@"sendProgressUpdate enter");
  AVPlayerItem *video = [_player currentItem];
  if (video == nil || video.status != AVPlayerItemStatusReadyToPlay) {
    return;
  }

  CMTime playerDuration = [video duration];
  if (CMTIME_IS_INVALID(playerDuration)) {
    return;
  }

  __weak RCTOTVPlayerView *weakSelf = self;
  if ([weakSelf isLiveStream]) {
    NSDate* currentProgrameDateTime = _player.currentItem.currentDate;
    NSTimeInterval timeIntervalSince1970  = [currentProgrameDateTime timeIntervalSince1970];

    CMTime currentTime = _player.currentTime;
    const Float64 currentTimeSecs = CMTimeGetSeconds(currentTime);

    double seekableStart = [[self calculateSeekableTimerangeStart]doubleValue];

    double currentTimeDouble = currentTimeSecs - seekableStart;
    if(self.onVideoProgress) {
      self.onVideoProgress(@{
                             @"currentPosition": [NSNumber numberWithDouble:currentTimeDouble],
                             @"currentTime": [NSNumber numberWithDouble:timeIntervalSince1970],
                             @"playableDuration": [self calculatePlayableDuration],
                             @"seekableDuration": [self calculateSeekableDuration],
                             });
    }
  } else {
    CMTime currentTime = _player.currentTime;
    //const Float64 duration = CMTimeGetSeconds(playerDuration);
    const Float64 currentTimeSecs = CMTimeGetSeconds(currentTime);

    if( currentTimeSecs >= 0 && self.onVideoProgress) {
      self.onVideoProgress(@{
                             @"currentPosition": [NSNumber numberWithDouble:currentTimeSecs],
                             @"currentTime": [NSNumber numberWithDouble:currentTimeSecs],
                             @"playableDuration": [self calculatePlayableDuration],
                             @"seekableDuration": [self calculateSeekableDuration],
                             });
    }
  }
  //if playback is progressing. reset error codes to default state.
  _lastPlayerItemErrorCode = -1;
  _lastThumbnailPlayerItemErrorCode = -1;
  _lastSSMErrorCode = -1;
  _lastDRMErrorCode = -1;

  RCTOTVLogD(@"sendProgressUpdate exit");
}

- (NSNumber *)calculatePlayableDuration
{
  RCTOTVLogD(@"calculatePlayableDuration enter");

  AVPlayerItem *video = _player.currentItem;
  if (video.status == AVPlayerItemStatusReadyToPlay) {
    __block CMTimeRange effectiveTimeRange;
    [video.loadedTimeRanges enumerateObjectsUsingBlock:^(id obj, NSUInteger idx, BOOL *stop) {
      CMTimeRange timeRange = [obj CMTimeRangeValue];
      if (CMTimeRangeContainsTime(timeRange, video.currentTime)) {
        effectiveTimeRange = timeRange;
        *stop = YES;
      }
    }];
    Float64 playableDuration = CMTimeGetSeconds(CMTimeRangeGetEnd(effectiveTimeRange));
    if (playableDuration > 0) {
      RCTOTVLogD(@"calculatePlayableDuration exit");
      return [NSNumber numberWithFloat:playableDuration];
    }
  }
  RCTOTVLogI(@"calculatePlayableDuration exit with zero duration");
  return [NSNumber numberWithInteger:0];
}

- (NSNumber *)calculateSeekableDuration
{
  RCTOTVLogD(@"calculateSeekableDuration enter");
  CMTimeRange timeRange = [self playerItemSeekableTimeRange];
  if (CMTIME_IS_NUMERIC(timeRange.duration))
  {
    RCTOTVLogD(@"calculateSeekableDuration exit");
    return [NSNumber numberWithFloat:CMTimeGetSeconds(timeRange.duration)];
  }
  RCTOTVLogI(@"calculateSeekableDuration exit for non numeric duration");
  return [NSNumber numberWithInteger:0];
}

- (NSNumber *)calculateSeekableTimerangeStart
{
  RCTOTVLogD(@"calculateSeekableTimerangeStart enter");
  CMTimeRange timeRange = [self playerItemSeekableTimeRange];
  if (CMTIME_IS_NUMERIC(timeRange.start))
  {
    RCTOTVLogD(@"calculateSeekableTimerangeStart exit");
    return [NSNumber numberWithFloat:CMTimeGetSeconds(timeRange.start)];
  }
  RCTOTVLogI(@"calculateSeekableTimerangeStart exit for non numeric duration");
  return [NSNumber numberWithInteger:0];
}


- (CMTimeRange)playerItemSeekableTimeRange
{
  RCTOTVLogD(@"playerItemSeekableTimeRange enter");

  AVPlayerItem *playerItem = [_player currentItem];
  if (playerItem.status == AVPlayerItemStatusReadyToPlay)
  {
    RCTOTVLogD(@"playerItemSeekableTimeRange exit with CMTimeRangeValue");
    return [playerItem seekableTimeRanges].firstObject.CMTimeRangeValue;
  }
  RCTOTVLogI(@"playerItemSeekableTimeRange exit with kCMTimeRangeZero");
  return (kCMTimeRangeZero);
}

- (void) sendOnPlaying {
  if(self.onVideoPlaying) {
    self.onVideoPlaying(@{});
  }
}

- (void) sendOnStop {
  if(self.onVideoStopped) {
    self.onVideoStopped(@{});
  }
}

- (void) sendOnThumbnailAvailable {
  if(self.onThumbnailAvailable) {
    self.onThumbnailAvailable(@{});
  }
}

- (void)sendOnLogAvailable:(NSString *)info {
    if(self.onLog) {
      self.onLog(@{@"logs": info});
    }
}

- (void)observeValueForKeyPath:(NSString *)keyPath ofObject:(id)object change:(NSDictionary *)change context:(void *)context
{
  RCTOTVLogD(@"Observe key path enter");
  if (object == _playerItem) {
    if ([keyPath isEqualToString:statusKeyPath]) {
      // Handle player item status change.
      [self handlePlayerItemStatusChange];
    }
    // check to see if we have recovered from stalled state
    if ([keyPath isEqualToString:playbackLikelyToKeepUpKeyPath]) {
      if (_playbackStalled == YES && _playerItem.playbackLikelyToKeepUp == YES) {
        [self sendOnPlaying];
        [_player setRate:_rate];
        _playbackStalled = NO;
      }
    }
  } else if (object == _player) {
    RCTOTVLogI(@"Observe player key path %@", keyPath);
    if ([keyPath isEqualToString:playerTimeControlStatusKeyPath]) {
      [self handlePlayerTimeControlStatusChange];
    }
  }
  RCTOTVLogD(@"Observe key path exit");
}

- (void) handlePlayerItemStatusChange
{
  RCTOTVLogD(@"handlePlayerItemStatusChange enter");
    // Handle player item status change.
    if (_playerItem.status == AVPlayerItemStatusReadyToPlay) {
      //Attach time observers only when ready to play so we can tell if its live or vod content.
      //if its a live stream use a generic timer so we send onProgressEvent during a paused state.
      if ([self isLiveStream]) {
        [self addLivePlayerTimeObserver];
      } else {
        [self addPlayerTimeObserver];
      }

      float duration = CMTimeGetSeconds(_playerItem.asset.duration);
      if (isnan(duration)) {
        RCTOTVLogI(@"handlePlayerItemStatusChange duration is NaN");
        duration = 0.0;
      }
      else {
        RCTOTVLogI(@"handlePlayerItemStatusChange duration is %f", duration);
      }
       NSObject *width = @"undefined";
       NSObject *height = @"undefined";
       NSString *orientation = @"undefined";

       if ([_playerItem.asset tracksWithMediaType:AVMediaTypeVideo].count > 0) {
         AVAssetTrack *videoTrack = [[_playerItem.asset tracksWithMediaType:AVMediaTypeVideo] objectAtIndex:0];
         width = [NSNumber numberWithFloat:videoTrack.naturalSize.width];
         height = [NSNumber numberWithFloat:videoTrack.naturalSize.height];
         CGAffineTransform preferredTransform = [videoTrack preferredTransform];

         if ((videoTrack.naturalSize.width == preferredTransform.tx
              && videoTrack.naturalSize.height == preferredTransform.ty)
             || (preferredTransform.tx == 0 && preferredTransform.ty == 0))
         {
           orientation = @"landscape";
         } else {
           orientation = @"portrait";
         }
      }

      if (self.onVideoLoad && _videoLoadStarted) {
        NSNumber *realDuration;
        // If we are zero, assume we are live
        // Due to a current issue (OTVPL-3230) with React we will not be using INFINITY values
        // realDuration = Double.POSITIVE_INFINITY;
        /* realDuration = (duration < 0.1 ) ? // Close enough check for 0 on a LIVE duration
          [NSNumber numberWithFloat:INFINITY] : [NSNumber numberWithFloat:duration];
          */

        realDuration = (duration < 0.1 ) ? // Close enough check for 0 on a LIVE duration
          [NSNumber numberWithFloat:LIVE_DURATION] : [NSNumber numberWithFloat:duration];
        // self.onVideoLoad(@{@"duration": [NSNumber numberWithFloat:duration],
        RCTOTVLogI(@"realDuration for onVideoLoad event is %f,", [realDuration floatValue]);
        RCTOTVLogD(@"Sending onVideoLoad event from native");
        self.onVideoLoad(@{@"duration" : realDuration,
                           // @"currentTime": [NSNumber numberWithFloat:CMTimeGetSeconds(_playerItem.currentTime)],
                           @"canPlayReverse": [NSNumber numberWithBool:_playerItem.canPlayReverse],
                           @"canPlayFastForward": [NSNumber numberWithBool:_playerItem.canPlayFastForward],
                           @"canPlaySlowForward": [NSNumber numberWithBool:_playerItem.canPlaySlowForward],
                           @"canPlaySlowReverse": [NSNumber numberWithBool:_playerItem.canPlaySlowReverse],
                           @"canStepBackward": [NSNumber numberWithBool:_playerItem.canStepBackward],
                           @"canStepForward": [NSNumber numberWithBool:_playerItem.canStepForward],
                           @"naturalSize": @{
                               @"width": width,
                               @"height": height,
                               @"orientation": orientation}});
        RCTOTVLogD(@"Sent onVideoLoad event from native");
        _videoLoadStarted = NO;
        if (self->_autoplay) {
          RCTOTVLogI(@"autoplay is true. Starting playback.");
          [self play];
        }

        [self attachListeners];
        [self applyModifiers];

        [self setStatisticsGroups:self->_statisticsTypes];
        [self startStatisticsUpdates];
      }
    } else if (_playerItem.status == AVPlayerItemStatusFailed) {
        RCTOTVLogE(@" Error code: %ld", (long)_playerItem.error.code);
        RCTOTVLogE(@" Error domain: %@", _playerItem.error.domain);
        RCTOTVLogE(@" Error localizedDescription: %@", _playerItem.error.localizedDescription);
        RCTOTVLogE(@" Error localizedFailureReason: %@", _playerItem.error.localizedFailureReason);
        RCTOTVLogE(@" Error localizedRecoverySuggestion: %@", _playerItem.error.localizedRecoverySuggestion);
        // post notification to application.
        //[self sendPlayerObserverErrorToApplication:_playerItem.error];
        [self processPlayerErrorNotification:_playerItem.error errorObjType:PLAYER_OBSERVER_ERROR_TYPE];
    }
  RCTOTVLogD(@"handlePlayerItemStatusChange exit");
}

- (void) handlePlayerTimeControlStatusChange
{
  RCTOTVLogD(@"handlePlayerTimeControlStatusChange enter");

  switch ([_player timeControlStatus]) {
    case AVPlayerTimeControlStatusPaused:
      if (!_paused && self.onVideoPaused) {
        self.onVideoPaused(@{});
        RCTOTVLogI(@"playerTimeControl trigger onPaused event");
      } else {
        RCTOTVLogI(@"onPaused event is not bound");
      }
      _paused = true;
      break;
    case AVPlayerTimeControlStatusPlaying:
      if (self.onVideoPlaying) {
        self.onVideoPlaying(@{});
        RCTOTVLogI(@"playerTimeControl trigger onPlaying event");
      } else {
        RCTOTVLogI(@"onPlaying event is not bound");
      }
      _paused = false;
      break;
    default:
      RCTOTVLogI(@"playerTimeControl unhandled status %ld", (long)_player.timeControlStatus);
      break;
  }
  RCTOTVLogD(@"handlePlayerTimeControlStatusChange exit");
}

- (void) tracksChanged
{
  RCTOTVLogD(@"tracksChanged enter");

  bool changed = false;
  bool fireOnTextTrackSelected = false;
  bool fireOnAudioTrackSelected = false;

  NSArray* textTracks = [self getTracksInfo: OTVTrackTypeSubtitle];
  NSArray* audioTracks = [self getTracksInfo: OTVTrackTypeAudio];

  //only fire ontracksChanged when new tracks are added.
  //risk that count stays the same but tracks changes.
  if (textTracks.count != previousTextTracks.count) {
    previousTextTracks = textTracks;
    changed = true;
  }

  if (audioTracks.count != previousAudioTracks.count) {
    previousAudioTracks = audioTracks;
    changed = true;
  }

  int textTrackIndex = [[[self getTrackSelected: OTVTrackTypeSubtitle] valueForKey:@"index"]intValue];
  if (_selectedTextTrack != textTrackIndex) {
    _selectedTextTrack = textTrackIndex;
      fireOnTextTrackSelected = true;
  }
  int audioTrackIndex = [[[self getTrackSelected: OTVTrackTypeAudio] valueForKey:@"index"]intValue];
  if (_selectedAudioTrack != audioTrackIndex) {
    _selectedAudioTrack = audioTrackIndex;
      fireOnAudioTrackSelected = true;
  }

  if (self.onTracksChanged && changed) {
    self.onTracksChanged(@{@"audioTracks": [self getTracksInfo:OTVTrackTypeAudio],
                         @"textTracks": [self getTracksInfo:OTVTrackTypeSubtitle]
    });
  }

  if (fireOnAudioTrackSelected) {
    if (self.onAudioTrackSelected) {
      self.onAudioTrackSelected(@{@"index": [NSNumber numberWithInt: audioTrackIndex]});
    }
  }

  if (fireOnTextTrackSelected){
    if (self.onTextTrackSelected) {
      self.onTextTrackSelected(@{@"index": [NSNumber numberWithInt: textTrackIndex]});
    }
  }
  RCTOTVLogD(@"tracksChanged exit");
}

- (NSArray*) getTracksInfo: (OTVTrackType)type
{
  RCTOTVLogI(@"tracksChanged enter with track type: %@", type == OTVTrackTypeSubtitle ? @"TEXT": @"AUDIO");
  NSMutableArray *outputTracks = [[NSMutableArray alloc] init];
  NSArray* tracks = [_player tracksWithType:type];
  NSInteger selectedTrackIndex = [_player selectedTrackWithType:type];

  for (int i = 0; i < tracks.count; ++i) {
    OTVTrackInfo *track = [tracks objectAtIndex:i];
    assert(track);

    RCTOTVLogI(@"Adding track to list");
    if (type == OTVTrackTypeSubtitle) {
      NSArray* characterArray = @[];
      NSDictionary *outputTrack = @{
                                  @"encodeType": [NSNumber numberWithInt:1000],
                                  @"title": track.name ? track.name: [NSNull null],
                                  @"language": track.language ? track.language: [NSNull null],
                                  @"characteristics": characterArray
                                  };
      RCTOTVLogI(@"%@", outputTrack);
      [outputTracks addObject:outputTrack];
    } else {
      NSDictionary *outputTrack = @{
                                  @"encodeType": [NSNumber numberWithInt:1000],
                                  @"title": track.name ? track.name: [NSNull null],
                                  @"language": track.language ? track.language: [NSNull null],
                                  };
      RCTOTVLogI(@"%@", outputTrack);
      [outputTracks addObject:outputTrack];
    }
  }
  RCTOTVLogD(@"tracksChanged exit");
  return outputTracks;
}

- (NSDictionary*) getTrackSelected: (OTVTrackType)type
{
  RCTOTVLogI(@"getTrackSelected enter with track type: %@", type == OTVTrackTypeSubtitle ? @"TEXT": @"AUDIO");
  NSInteger index = [_player selectedTrackWithType:type];
  NSArray* tracksInfo = [self getTracksInfo:type];
  if (index == -1 || (index >= [tracksInfo count])) {
    RCTOTVLogI(@"getTrackSelected exit with no track");
    return @{@"index": [NSNumber numberWithInt:-1], @"title": @"", @"language":@"" };
  } else {
    RCTOTVLogI(@"getTrackSelected exit with index: %ld", index);
    return [self getTracksInfo:type][index];
  }
}


- (void)attachListeners
{
  RCTOTVLogD(@"attachListeners enter");

  // listen for end of file
  [[NSNotificationCenter defaultCenter] removeObserver:self
                                                  name:AVPlayerItemDidPlayToEndTimeNotification
                                                object:[_player currentItem]];
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(playerItemDidReachEnd:)
                                               name:AVPlayerItemDidPlayToEndTimeNotification
                                             object:[_player currentItem]];

  [[NSNotificationCenter defaultCenter] removeObserver:self
                                                  name:AVPlayerItemPlaybackStalledNotification
                                                object:nil];
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(playbackStalled:)
                                               name:AVPlayerItemPlaybackStalledNotification
                                             object:nil];

  RCTOTVLogD(@"attachListeners exit");
}

-(void)attachSSMErrorListners
{
  RCTOTVLogD(@"attachSSMErrorListners enter");

  [[NSNotificationCenter defaultCenter] addObserver:self
                                            selector:@selector(onSSMError:)
                                                name:otvSSMSetupErrorNotification
                                              object:nil];

  [[NSNotificationCenter defaultCenter] addObserver:self
                                            selector:@selector(onSSMError:)
                                                name:otvSSMTeardownErrorNotification
                                              object:nil];

  [[NSNotificationCenter defaultCenter] addObserver:self
                                            selector:@selector(onSSMError:)
                                                name:otvSSMHeartbeatErrorNotification
                                              object:nil];
  RCTOTVLogD(@"attachSSMErrorListners exit");

}

-(void)removeSSMErrorListners
{
  RCTOTVLogD(@"removeSSMErrorListners enter");
  [[NSNotificationCenter defaultCenter] removeObserver:self
                                                    name:otvSSMSetupErrorNotification
                                                  object:nil];

  [[NSNotificationCenter defaultCenter] removeObserver:self
                                                   name:otvSSMTeardownErrorNotification
                                                 object:nil];


  [[NSNotificationCenter defaultCenter] removeObserver:self
                                                   name:otvSSMHeartbeatErrorNotification
                                                 object:nil];
  RCTOTVLogD(@"removeSSMErrorListners exit");
}

-(void)attachLogListners
{
    RCTOTVLogD(@"attachLogListners enter");

    [[NSNotificationCenter defaultCenter] addObserver:self
                                              selector:@selector(onLog:)
                                                  name:otvLogNotification
                                                object:nil];
    RCTOTVLogD(@"attachLogListners exit");
}

-(void)removeLogListners
{
    RCTOTVLogD(@"removeLogListners enter");

    [[NSNotificationCenter defaultCenter] removeObserver:self
                                                     name:otvLogNotification
                                                   object:nil];

    RCTOTVLogD(@"removeLogListners exit");

}

- (void) onLog:(NSNotification *) notification
{
    // [notification name] should always be @"TestNotification"
    // unless you use this method for observation of other notifications
    // as well.

    if ([[notification name] isEqualToString: otvLogNotification]) {
        NSDictionary* userInfo = notification.userInfo;
        if ([notification.userInfo valueForKey:@"logs"]){
          NSString *log = [notification.userInfo valueForKey:@"logs"];
            [self sendOnLogAvailable:log];
        }
    }
}

- (void)onSSMError:(NSNotification *)notification
{
  RCTOTVLogD(@"onSSMError enter");
  NSError* error = nil;
  NSString* message = @"";

  if ([notification.userInfo valueForKey:@"error"]){
    error = [notification.userInfo valueForKey:@"error"];
  }
  if ([notification.userInfo valueForKey:@"message"]){
    message = [notification.userInfo valueForKey:@"message"];
  }

  RCTOTVLogE(@"SSM Service Error happened: Error : %@ and message: %@", error, message);

  if(self.onVideoError) {
    NSInteger errorCode = 0;
    NSString *errorDomain = @"SSMErrorDomain";
    NSString *localizedDesc = @"";
    NSString *localizedFailureReason = @"";
    NSString *localizedRecoverySuggestion = @"";
    NSString *platform = @"";
#if TARGET_OS_IOS
      platform = @"iOS";
#else
      platform = @"tvOS";
#endif
    if (error.localizedDescription) {
      localizedDesc = error.localizedDescription;
    }
    localizedFailureReason = message;

    if ([notification.name isEqualToString:otvSSMSetupErrorNotification]) {
      RCTOTVLogI(@"OTVSSMSetupErrorNotification");
      errorCode = SSMErrorCodeSetup;
    } else if ([notification.name isEqualToString:otvSSMHeartbeatErrorNotification]) {
      RCTOTVLogI(@"OTVSSMHeartbeatErrorNotification");
      errorCode = SSMErrorCodeHeartBeat;
    } else if ([notification.name isEqualToString:otvSSMTeardownErrorNotification]) {
      RCTOTVLogI(@"OTVSSMTeardownErrorNotification");
      errorCode = SSMErrorCodeTearDown;
    }

    if (_lastSSMErrorCode != errorCode){
      NSDictionary *details = @{ @"domain":errorDomain,
                                 @"code":@(errorCode),
                                 @"localizedDescription":localizedDesc,
                                 @"localizedFailureReason":localizedFailureReason,
                                 @"localizedRecoverySuggestion":localizedRecoverySuggestion
                                };
        NSDictionary *nativeError = @{ @"platform":platform, @"details":details};

        // Post the error notification to application.
        self.onVideoError(@{ @"code":@(errorCode), @"nativeError":nativeError});
    }

  }
  RCTOTVLogD(@"onSSMError exit");
}

-(void)attachDRMErrorListners
{
  RCTOTVLogD(@"attachDRMErrorListners enter");

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(onDRMError:)
                                           name:otvDRMLicenseErrorNotification
                                           object:nil];

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(onSSPLicenseSuccesful:)
                                           name:otvDRMLicenseDownloadedNotification
                                           object:nil];

  RCTOTVLogD(@"attachDRMErrorListners exit");
}

-(void)removeDRMErrorListners
{
  RCTOTVLogD(@"removeDRMErrorListners enter");

  [[NSNotificationCenter defaultCenter] removeObserver:self
                                                name:otvDRMLicenseErrorNotification
                                                object:nil];

  [[NSNotificationCenter defaultCenter] removeObserver:self
                                                name:otvDRMLicenseDownloadedNotification
                                                object:nil];

  RCTOTVLogD(@"removeDRMErrorListners exit");
}

- (void)onSSPLicenseSuccesful:(NSNotification *)notification {

  NSDictionary* dict = notification.userInfo;
  BOOL licenseSuccesful = [[dict valueForKey:@"success"]boolValue];
  if (licenseSuccesful) {
    //set last DRM error code back to default.
    _lastDRMErrorCode = -1;
  }
}

- (void)onDRMError:(NSNotification *)notification
{
  RCTOTVLogD(@"onDRMError enter");

  NSInteger errorCode = 0;
  NSString* errorType = [NSString stringWithFormat:@"%@", [notification object]];
  NSString* errorMessage;

  //DRM error encounted. Dont allow changes to setSource.
  _drmError = true;
  if ([errorType containsString:@"keyResponseWithExpiredLease"]){
    errorCode = DRMErrorCodeKeyResponseWithExpiredLease;
    errorType = @"License expiry";

    if ([notification.userInfo valueForKey:@"keyResponseWithExpiredLease"]){
      errorMessage = [notification.userInfo valueForKey:@"keyResponseWithExpiredLease"];
      RCTOTVLogE(@"DRMErrorMessage: %@", errorMessage);
    }
  } else if ([errorType containsString:@"keyResponseError"]){
    errorCode = DRMErrorCodeKeyResponseError;
    errorType = @"License response error";

    if ([notification.userInfo valueForKey:@"keyResponseError"]){
      errorMessage = [notification.userInfo valueForKey:@"keyResponseError"];
      RCTOTVLogE(@"DRMErrorMessage: %@", errorMessage);
    }
  }  else if ([errorType containsString:@"DRMErrorContentTokenNotAvailable"]){
    errorCode = DRMErrorContentTokenNotAvailable;
    errorType = @"DRM Token not available";
    errorMessage = @"DRM Token is not available.";
    RCTOTVLogE(@"DRMErrorMessage: %@", errorMessage);
  }

  RCTOTVLogE(@"DRM Error: %@ and Message: %@", errorType, errorMessage);

  //dont keep sending the same error code. Only send error once. Until state changes or license susscesful.
  if (_lastDRMErrorCode != errorCode) {
    _lastDRMErrorCode = errorCode;
    if(self.onVideoError) {
      NSString *errorDomain = @"DRMErrorDomain";
      NSString *localizedDesc = @"";
      NSString *localizedFailureReason = @"";
      NSString *localizedRecoverySuggestion = @"";
      NSString *platform = @"";
    #if TARGET_OS_IOS
        platform = @"iOS";
    #else
        platform = @"tvOS";
    #endif
      if (errorMessage) {
        localizedDesc = errorType;
        localizedFailureReason = errorMessage;
      }

      NSDictionary *details = @{ @"domain":errorDomain,
                                 @"code":@(errorCode),
                                 @"localizedDescription":localizedDesc,
                                 @"localizedFailureReason":localizedFailureReason,
                                 @"localizedRecoverySuggestion":localizedRecoverySuggestion
                                };

      NSDictionary *nativeError = @{ @"platform":platform, @"details":details};

      // Post the error notification to application.
      self.onVideoError(@{ @"code":@(errorCode), @"nativeError":nativeError});
    }
  }



  RCTOTVLogD(@"onDRMError exit");
}

- (void)playbackStalled:(NSNotification *)notification
{
  RCTOTVLogD(@"playbackStalled enter");

  if(self.onVideoWaiting) {
    self.onVideoWaiting(@{ });
  }

  _playbackStalled = YES;
  RCTOTVLogD(@"playbackStalled exit");
}

- (void)playerItemDidReachEnd:(NSNotification *)notification
{
  RCTOTVLogD(@"playerItemDidReachEnd enter");

  if(self.onVideoEnd) {
    self.onVideoEnd(@{ });
  }
  _paused = true;
  RCTOTVLogD(@"playerItemDidReachEnd exit");

}

- (void)availableBitratesChangedHandler:(NSNotification *)notification
{
  RCTOTVLogD(@"availableBitratesChanged enter");
  RCTOTVLogI(@"notification.name : %@", notification.name);
  NSArray* availableBitrates = [NSArray arrayWithArray:[_player.networkAnalytics.adaptiveStreaming availableBitrates]];
  RCTOTVLogI(@"notification.object : %@", availableBitrates);

  NSMutableDictionary* bitrates= [[NSMutableDictionary alloc] init];
  [bitrates setValue:availableBitrates forKey:@"availableBitrates"];

  if(self.onBitratesAvailable){
    RCTOTVLogI(@"sending onBitratesAvailable signal");
    self.onBitratesAvailable(bitrates);
  }
  RCTOTVLogD(@"availableBitratesChanged  exit");
}

- (void)selectedBitrateChangedHandler:(NSNotification *)notification
{
  RCTOTVLogD(@"selectedBitrateChanged enter");
  RCTOTVLogI(@"notification.name : %@", notification.name);
  RCTOTVLogI(@"notification.object : %@", notification.object);

  int selectedBitrateNum = [notification.object intValue];
  NSNumber *selectedBitrate = [NSNumber numberWithInt:selectedBitrateNum];
  NSMutableDictionary* dict= [[NSMutableDictionary alloc] init];
  [dict setValue:selectedBitrate forKey:@"selectedBitrate"];

  if(self.onSelectedBitrateChanged){
        RCTOTVLogI(@"onSelectedBitrateChanged enter");
        self.onSelectedBitrateChanged(dict);
  }
  RCTOTVLogD(@"selectedBitrateChanged  exit");
}

- (void)selectedResoloutionsChangedHandler:(NSNotification *)notification
{
  RCTOTVLogD(@"selectedResoloutionsChanged enter");
  RCTOTVLogI(@"notification.name : %@", notification.name);

  CGSize selectedResoloution = [_player.playbackAnalytics.player selectedResoloution];
  NSNumber *resolutionWidth = [NSNumber numberWithInt:selectedResoloution.width];
  NSNumber *resolutionHeight = [NSNumber numberWithInt:selectedResoloution.height];
  NSMutableDictionary* resolution= [[NSMutableDictionary alloc] init];
  [resolution setValue:resolutionWidth forKey:@"width" ];
  [resolution setValue:resolutionHeight forKey:@"height" ];

  if(self.onDownloadResChanged){
        RCTOTVLogD(@"onDownloadResChanged ");
        self.onDownloadResChanged(resolution);
    }
  RCTOTVLogD(@"selectedResoloutionsChanged  exit");
}

// Notification from AVPlayer/AVPlayerItem
- (void)playerErrorNotificationHandler:(NSNotification *)notification
{
  RCTOTVLogD(@"playerErrorNotificationHandler enter");
  RCTOTVLogI(@"notification.name : %@", notification.name);
  if ([notification.name isEqualToString:@"AVPlayerItemNewErrorLogEntry"]) {
      AVPlayerItemErrorLog *errorLog = [_playerItem errorLog];
      AVPlayerItemErrorLogEvent *errorEvent = (AVPlayerItemErrorLogEvent *) [errorLog.events lastObject];
      if (errorEvent)
      {
          [self processPlayerErrorNotification:errorEvent errorObjType:PLAYER_ITEM_ERROR_LOG_ENTRY_TYPE];
      }
  }
  RCTOTVLogD(@"playerErrorNotificationHandler  exit");
}

- (void)thumbnailsError:(NSNotification *)notification
{
  RCTOTVLogD(@"thumbnailsError enter");
  RCTOTVLogI(@"notification.name : %@", notification.name);

  RCTOTVLogI(@"playerErrorNotificationHandler enter");
  NSInteger errorCode = 0;
  NSString *errorDomain = @"";
  NSString *localizedDesc = @"";
  NSString *localizedFailureReason = @"";
  NSString *localizedRecoverySuggestion = @"";
  NSString *platform = @"";
#if TARGET_OS_IOS
    platform = @"iOS";
#else
    platform = @"tvOS";
#endif


  NSDictionary* userInfo = notification.userInfo;

  int thumbnailError = [userInfo[@"error"]intValue];

  //due to the way enums works in objective c, ive had to use Int values .
  // 1 = positionError 2 = itemError
  if (thumbnailError == 1) {
    errorCode = ThumbnailPostionError;
    errorDomain = userInfo[@"domain"];
    localizedDesc = userInfo[@"message"];
    localizedFailureReason = userInfo[@"statusCode"];
  }else if (thumbnailError == 2){
    errorCode = ThumbnailItemError;
    errorDomain = userInfo[@"domain"];
    localizedDesc = userInfo[@"message"];
    localizedFailureReason = userInfo[@"statusCode"];
  }

  RCTOTVLogE(@"mapped error Code: %ld", (long)errorCode);
  RCTOTVLogE(@"error Domain: %@", errorDomain);

  if (thumbnailError == 2 && _lastThumbnailPlayerItemErrorCode == errorCode) {
    //dont log the same player item error unless we have stream progress.
  }else {
    if (thumbnailError == 2) {
      _lastThumbnailPlayerItemErrorCode = errorCode;
    }

    NSDictionary *details = @{ @"domain":errorDomain,
                              @"code":@(errorCode),
                              @"localizedDescription":localizedDesc,
                              @"localizedFailureReason":localizedFailureReason,
                              @"localizedRecoverySuggestion":localizedRecoverySuggestion
                            };
    NSDictionary *nativeError = @{ @"platform":platform, @"details":details};
    if(self.onVideoError) {
       self.onVideoError(@{ @"code":@(errorCode), @"nativeError":nativeError});
    }
  }


  RCTOTVLogD(@"thumbnailsError  exit");
}

- (void)processPlayerErrorNotification: (NSObject *) errorObj errorObjType:(NSInteger)errorObjType
{
    RCTOTVLogD(@"playerErrorNotificationHandler enter");
    NSInteger errorCode = 0;
    NSString *errorDomain = @"";
    NSString *localizedDesc = @"";
    NSString *localizedFailureReason = @"";
    NSString *localizedRecoverySuggestion = @"";
    NSString *platform = @"";
#if TARGET_OS_IOS
      platform = @"iOS";
#else
      platform = @"tvOS";
#endif
    if (errorObjType == PLAYER_ITEM_ERROR_LOG_ENTRY_TYPE) {
        AVPlayerItemErrorLogEvent * errorObject = (AVPlayerItemErrorLogEvent *) errorObj;

        RCTOTVLogE(@"errorStatusCode: %ld", (long) errorObject.errorStatusCode);
        RCTOTVLogE(@"errorDomain: %@", errorObject.errorDomain);

        errorDomain = errorObject.errorDomain;
        errorCode = [self getMappedErrorCode:errorObject.errorStatusCode];

        if (errorObject.errorComment) {
            localizedDesc          = errorObject.errorComment;
            localizedFailureReason = errorObject.errorComment;
            RCTOTVLogE(@"errorComment: %@", errorObject.errorComment);
        }
    }
    else if (errorObjType == PLAYER_OBSERVER_ERROR_TYPE) {
        NSError * errorObject = (NSError *) errorObj;

        RCTOTVLogE(@"error Code: %ld", (long) errorObject.code);
        RCTOTVLogE(@"error Domain: %@", errorObject.domain);

        errorDomain = errorObject.domain;
        errorCode = [self getMappedErrorCode:errorObject.code];

        if (errorObject.localizedDescription) {
            localizedDesc = errorObject.localizedDescription;
            RCTOTVLogE(@"error localizedDescription: %@", localizedDesc);
        }

        if (errorObject.localizedFailureReason) {
            localizedFailureReason = errorObject.localizedFailureReason;
            RCTOTVLogE(@"error localizedFailureReason: %@", localizedFailureReason);
        }

        if (errorObject.localizedRecoverySuggestion) {
            localizedRecoverySuggestion = errorObject.localizedRecoverySuggestion;
            RCTOTVLogE(@"error localizedRecoverySuggestion: %@", localizedRecoverySuggestion);
        }
    }

    RCTOTVLogE(@"mapped error Code: %ld", (long)errorCode);
    RCTOTVLogD(@"error Domain: %@", errorDomain);


  if (_lastPlayerItemErrorCode != errorCode) {
    _lastPlayerItemErrorCode = errorCode;

    NSDictionary *details = @{ @"domain":errorDomain,
                              @"code":@(errorCode),
                              @"localizedDescription":localizedDesc,
                              @"localizedFailureReason":localizedFailureReason,
                              @"localizedRecoverySuggestion":localizedRecoverySuggestion
                            };
    NSDictionary *nativeError = @{ @"platform":platform, @"details":details};
    if(self.onVideoError) {
        self.onVideoError(@{ @"code":@(errorCode), @"nativeError":nativeError});
    }
  }
    RCTOTVLogD(@"playerErrorNotificationHandler exit");
}

- (NSInteger) getMappedErrorCode:(NSInteger) errorStatusCode
{
    NSInteger errorCode = 0;
    switch (errorStatusCode)
    {
        /* Note: These constants are taken from Apple documentation. */
        case NSURLErrorResourceUnavailable:
            errorCode = 1002;                  //NSURLErrorDomain (code -1008) e.g. manifest is not accessible could be due to network
            break;

        case NSURLErrorNotConnectedToInternet:
            errorCode = 3001;                  //NSURLErrorDomain (code -1009)
            break;

        case NSURLErrorTimedOut:
            errorCode = 3002;
            break;

        /* Note: Note : These constant names are defined on the top. CoreMediaErrorDomain HTTP Errors */
        case HTTPErrorBadRequest:
        case HTTPErrorUnauthorized:
        case HTTPErrorForbidden:
        case HTTPErrorForbidden1:
        case HTTPErrorRangeNotSatisfiable:
        case HTTPErrorConflict:
        case HTTPErrorResourceNoLongerAvailable:
        case HTTPErrorResourceExpecationFailed:
        case HTTPErrorUnknownErrorOnMissingChunks:
        case HTTPErrorUnhandled:
        case HTTPErrorInternalError:
        case HTTPErrorBadGateway:
        case HTTPErrorServiceUnavailable:
        case HTTPErrorGatewayTimeout:
        case HTTPErrorResourceMissing:
            errorCode = 3003;
            break;

        case SegmentExceedsSpecifiedBandwidthForVariant:
            errorCode = 1004;     // CoreMediaErrorDomain -Assumption: this falls in SOURCE error category.
            break;
        case PlaylistParseError:
            errorCode = 1003;     // CoreMediaErrorDomain
            break;

        default:
            errorCode = 1000;     //Unknown error
            break;
    }
    return errorCode;
}

+(Class)layerClass
{
    return [AVPlayerLayer class];
}

/*
// Only override drawRect: if you perform custom drawing.
// An empty implementation adversely affects performance during animation.
- (void)drawRect:(CGRect)rect {
    // Drawing code
}
*/

@end
