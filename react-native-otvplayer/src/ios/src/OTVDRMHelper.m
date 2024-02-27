// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
//
//  RCTOTVDRMHelper.m
//  React-otvplayer

@import Foundation;
#import "OTVDRMHelper.h"


//singleton instance of OTVDRMHelper.

static OTVDRMHelper *_otvDRMHelper;

@implementation OTVDRMHelper

BOOL hasDRM = false;

+ (OTVDRMHelper*) shared
{
  if (_otvDRMHelper == nil)
  {
    _otvDRMHelper = [[OTVDRMHelper alloc]init];
  }

  return _otvDRMHelper;
}

-(void)clearStreamDelegate {
  OTVDRMManager* drmManager = [OTVDRMManager shared];
  _delegate = nil;
  [drmManager setLicenseDelegate:_delegate];
}

- (void) setDRMTokenType:(NSString*) tokenType
{
  RCTOTVLogD(@"setDRMTokenType enter");
  if (_delegate != nil) {
    [_delegate setHTTPHeaderTypeWithType: tokenType];
  } else {
    RCTOTVLogW(@"License Delegate is nil, please initialize delegate before calling this function");
  }
  RCTOTVLogD(@"setDRMTokenType leave");
}

-(BOOL)hasDRM {
  return hasDRM;
}
- (void) setDrmConfig:(NSDictionary*) drmConfig
{
  RCTOTVLogD(@"setDrmConfig enter");
  if (drmConfig) {
    RCTOTVLogI(@"setDrmConfig drmConfig:");
    RCTOTVLogI( @"%@", drmConfig);
  }
  else {
    RCTOTVLogI(@"setDrmConfig: drmConfig is missing");
  }
  
  ssmSyncMode = true;
  
  NSURL* configSSMServerURL = nil;
  NSURL* configCertificateURL = nil;
  NSURL* configLicenseURL = nil;
  BOOL configSSMSyncMode = true;
  
  if ([drmConfig valueForKey:@"ssmServerURL"]) {
    configSSMServerURL = [[NSURL alloc]initWithString:[drmConfig valueForKey:@"ssmServerURL"]];
    
    if ([drmConfig valueForKey:@"ssmSyncMode"]) {
      configSSMSyncMode = [[drmConfig valueForKey:@"ssmSyncMode"] boolValue];
     }
  }

  if ([drmConfig valueForKey:@"certificateURL"]) {
    configCertificateURL = [[NSURL alloc]initWithString:[drmConfig valueForKey:@"certificateURL"]];
  }

  if ([drmConfig valueForKey:@"licenseURL"]) {
    configLicenseURL = [[NSURL alloc]initWithString:[drmConfig valueForKey:@"licenseURL"]];
  }
  
  if (configLicenseURL == nil|| configCertificateURL == nil) {
    RCTOTVLogE(@"setDrmConfig failed as either the certificateURL or licenseURL is nil.");
    OTVDRMManager* drmManager = [OTVDRMManager shared];
    _delegate = nil;
    [drmManager setLicenseDelegate:_delegate];
    hasDRM = false;
  } else {
    hasDRM = true;
    if (configSSMServerURL != nil) {
      if (ssmDelegate && [ssmURL isEqual:configSSMServerURL]  && [licenseURL isEqual:configLicenseURL]  && [certificateURL isEqual:configCertificateURL]) {
        ssmDelegate.syncSSMSetupTeardown = configSSMSyncMode;
        _delegate = ssmDelegate;
      } else {
        ssmURL = configSSMServerURL;
        licenseURL = configLicenseURL;
        certificateURL = configCertificateURL;
        ssmSyncMode = configSSMSyncMode;
        ssmDelegate = [[OTVReactNativeLicenseDelegate alloc]initWithCertificateURL:certificateURL licenseURL:licenseURL ssmServerURL:ssmURL syncSSMSetupTeardown:ssmSyncMode];
        _delegate = ssmDelegate;
      }
    } else {
      if (sspDelegate &&  [licenseURL isEqual:configLicenseURL]  && [certificateURL isEqual:configCertificateURL]) {
        _delegate = sspDelegate;
      } else {
        licenseURL = configLicenseURL;
        certificateURL = configCertificateURL;
        sspDelegate = [[OTVReactNativeLicenseDelegate alloc]initWithCertificateURL:certificateURL licenseURL:licenseURL];
        _delegate = sspDelegate;
      }
    }

    OTVDRMManager* drmManager = [OTVDRMManager shared];
    [drmManager setLicenseDelegate:_delegate];
  }
  
  RCTOTVLogD(@"setDrmConfig exit");
}

@end
