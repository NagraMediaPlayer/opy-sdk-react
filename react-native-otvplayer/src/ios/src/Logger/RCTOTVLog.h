// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
//
//  RCTOTVLog.h

#import <Foundation/Foundation.h>

typedef NS_ENUM(NSInteger, RCTOTVLogType) {
  RCTOTVLogTypeDebug = 0,
  RCTOTVLogTypeInfo = 1,
  RCTOTVLogTypeWarning = 2,
  RCTOTVLogTypeError = 3,
};

NS_SWIFT_NAME(RCTOTVLogProtocol)
@protocol RCTOTVLogProtocol<NSObject>
- (void)log:(enum RCTOTVLogType)level :(NSArray * _Nonnull)items :(NSString * _Nonnull)file :(NSString * _Nonnull)function :(NSInteger)line :(NSInteger)column;
- (void)log:(enum RCTOTVLogType)level :(NSString * _Nonnull)message;
@property (nonatomic) enum RCTOTVLogType outputLogLevel;
@end


#ifdef __cplusplus
extern "C"{
#endif

void formatDebug(NSString* _Nonnull file, NSString* _Nonnull function, int line, NSString* _Nonnull format, ...);
void formatInfo(NSString* _Nonnull file, NSString* _Nonnull function, int line, NSString* _Nonnull format, ...);
void formatWarning(NSString* _Nonnull file, NSString* _Nonnull function, int line, NSString* _Nonnull format, ...);
void formatError(NSString* _Nonnull file, NSString* _Nonnull function, int line, NSString* _Nonnull format, ...);
void setLoggingLevel(enum RCTOTVLogType);

#ifdef __cplusplus
}
#endif

#define RCTOTVLogD(...)            (formatDebug(@(__FILE__), @(__FUNCTION__), __LINE__, ## __VA_ARGS__))
#define RCTOTVLogI(...)            (formatInfo(@(__FILE__), @(__FUNCTION__), __LINE__, ## __VA_ARGS__))
#define RCTOTVLogW(...)            (formatWarning(@(__FILE__), @(__FUNCTION__), __LINE__, ## __VA_ARGS__))
#define RCTOTVLogE(...)            (formatError(@(__FILE__), @(__FUNCTION__), __LINE__, ## __VA_ARGS__))
#define RCTOTVLogSetLevel(LEVEL)   (setLoggingLevel(LEVEL))
