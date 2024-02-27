//
//  OTVLog.h
//  sdk
//
//  STRICTLY CONFIDENTIAL
//  Created by Nagra on 12/07/2019.
//  Copyright (C) 2018 Nagravision S.A, All Rights Reserved.
//  This software is the proprietary information of Nagravision S.A.
//

#import <Foundation/Foundation.h>

typedef NS_ENUM(NSInteger, OTVLogType) {
  OTVLogTypeDebug = 0,
  OTVLogTypeInfo = 1,
  OTVLogTypeWarning = 2,
  OTVLogTypeError = 3,
};

NS_SWIFT_NAME(OTVLogProtocol)
@protocol OTVLogProtocol<NSObject>
- (void)log:(enum OTVLogType)level :(NSArray * _Nonnull)items :(NSString * _Nonnull)file :(NSString * _Nonnull)function :(NSInteger)line :(NSInteger)column;
- (void)log:(enum OTVLogType)level :(NSString * _Nonnull)message;
@property (nonatomic) enum OTVLogType outputLogLevel;
@end


#ifdef __cplusplus
extern "C"{
#endif

void formatDebug(NSString* file, NSString* function, int line, NSString* format, ...);
void formatInfo(NSString* file, NSString* function, int line, NSString* format, ...);
void formatWarning(NSString* file, NSString* function, int line, NSString* format, ...);
void formatError(NSString* file, NSString* function, int line, NSString* format, ...);
void setLogLevel(enum OTVLogType);
#ifdef __cplusplus
}
#endif

#define OTVLogD(...)            (formatDebug(@(__FILE__), @(__FUNCTION__), __LINE__, ## __VA_ARGS__))
#define OTVLogI(...)            (formatInfo(@(__FILE__), @(__FUNCTION__), __LINE__, ## __VA_ARGS__))
#define OTVLogW(...)            (formatWarning(@(__FILE__), @(__FUNCTION__), __LINE__, ## __VA_ARGS__))
#define OTVLogE(...)            (formatError(@(__FILE__), @(__FUNCTION__), __LINE__, ## __VA_ARGS__))
#define OTVLogSetLevel(LEVEL)   (setLogLevel(LEVEL))
