//
//  ExceptionHandler.h
//  sdk
//
//  Created by Chris Mash on 15/02/2019.
//  Copyright © 2019 Nagra. All rights reserved.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface OTVExceptionHandler : NSObject

// Swift can't catch Objective-C exceptions but we can get Objective-C to catch it for us
+ (BOOL)tryCatch:(void(^)(void))tryBlock exception:(void(^)(NSException*))failBlock;

@end

NS_ASSUME_NONNULL_END
