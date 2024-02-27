// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
////
////  RCTOTVLog.m
//
#import "RCTOTVLog.h"


@interface RCTOTVLogImpl: NSObject<RCTOTVLogProtocol>
@property (nonnull, readonly, class) id<RCTOTVLogProtocol> shared;
@end

NSArray* parseArgs( va_list args, NSString* format)  {
  NSString *message = [[NSString alloc] initWithFormat:format arguments:args];
  return @[message];
}

void formatDebug(NSString* file, NSString* function, int line, NSString* format, ...) {
  va_list args;
  va_start(args, format);
  NSArray *items = parseArgs(args, format);
  va_end(args);
  [RCTOTVLogImpl.shared log: RCTOTVLogTypeDebug :items :file :function :line :0];
}

void formatInfo(NSString* file, NSString* function, int line, NSString* format, ...) {
  va_list args;
  va_start(args, format);
  NSArray *items = parseArgs(args, format);
  va_end(args);
  [RCTOTVLogImpl.shared log: RCTOTVLogTypeInfo :items :file :function :line :0];
}

void formatWarning(NSString* file, NSString* function, int line, NSString* format, ...) {
  va_list args;
  va_start(args, format);
  NSArray *items = parseArgs(args, format);
  va_end(args);
  [RCTOTVLogImpl.shared log: RCTOTVLogTypeWarning :items :file :function :line :0];
}

void formatError(NSString* file, NSString* function, int line, NSString* format, ...) {
  
  va_list args;
  va_start(args, format);
  NSArray *items = parseArgs(args, format);
  va_end(args);
  [RCTOTVLogImpl.shared log: RCTOTVLogTypeError :items :file :function :line :0];
}

void setLoggingLevel(enum RCTOTVLogType level) {
  RCTOTVLogImpl.shared.outputLogLevel = level;
}
