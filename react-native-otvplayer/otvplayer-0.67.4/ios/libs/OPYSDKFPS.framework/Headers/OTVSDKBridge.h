//
//  OTVAVURLAssetExtension.h
//  sdk
//
//  STRICTLY CONFIDENTIAL
//  Created by Nagra on 28/08/2019.
//  Copyright (C) 2018 Nagravision S.A, All Rights Reserved.
//  This software is the proprietary information of Nagravision S.A.
//

#ifndef OTVSDKBridge_h
#define OTVSDKBridge_h

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@class AVContentKeyRequest;
@class AVAssetResourceLoadingRequest;

NS_SWIFT_NAME(ContentKeyRequestDelegate)
@protocol ContentKeyRequestDelegate<NSObject>
- (BOOL) contentKeyLoadingRequest:(AVAssetResourceLoadingRequest *)loadingRequest;
- (BOOL) contentKeyRequest:(AVContentKeyRequest*) keyRequest;
@end

@class AVContentKeySession;
NS_SWIFT_NAME(OTVAVURLAssetExtension)
@protocol OTVAVURLAssetExtension<NSObject>
- (id<ContentKeyRequestDelegate>) createContentKeyRequestDelegate;
@property(nonatomic, readonly) NSDictionary<NSString *, id> *options;
@end

NS_ASSUME_NONNULL_END

#endif /* OTVSDKBridge_h */
