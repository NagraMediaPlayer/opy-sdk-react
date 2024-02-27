// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
//
//  OTVReactNativeLicenseDelegate.swift
//  OPYSDKFPS
import Foundation
import AVFoundation

#if os(tvOS)
  import OPYSDKFPSTv
#else
  import OPYSDKFPS
#endif

/// `OTVMediaToken` is alias as `String` class to make SSP specific token more clear.

public typealias OTVMediaToken = String

/// `OTVReactNativeLicenseDelegate` is a default implementation of SSP with SSM Service.

public class OTVReactNativeLicenseDelegate: OTVReactCommonLicenseDelegate {
    
  private let ssmBaseURL: URL?
  
  @objc internal var syncSSMSetupTeardown: Bool
  private var singleMediaToken: OTVMediaToken = ""
  private var ssmService: OTVSSMService?
  
  private var contentKeySession: AVContentKeySession?
  private var keyRequest: AVContentKeyRequest?
  private var isRenewal = false
  private var tokenCallbackCompletionHandler: (()-> String)?
  private var initialLicenseRequest = false;
  private var internalHTTPHeaderType: String = "nv-authorizations"
  
  
  // Introduced this flag as ssmService.sessionToken cannot be used
  // to distinguish first or renew license case for ssm enc content.
  internal var isFirstSSMSession: Bool = false
    
  /// Set the type for the HTTP requesting headers
  /// - Parameter type: String value of HTTP header type. Defaults to nv-authorizations. If an empty string is passed it was also default to nv-authorizations
  @objc public func setHTTPHeaderType(type: String) {
    if !type.isEmpty{
      internalHTTPHeaderType = type
    }
  }
  
  /// Creates an instance of `OTVReactNativeLicenseDelegate`.
  /// - Parameters:
  ///   - certificateURL: URL of certificate file.
  ///   - licenseURL: URL of license request.
  ///   - ssmServerURL: Optional URL of SSM service request. Default is nil if SSM service not required.
  ///   - syncSSMSetupTeardown: If ssmServerURL is provided this defines whether the setup and teardown network requests block the main thread or not. Default is to block.
  
  @objc public init(certificateURL: URL, licenseURL: URL, ssmServerURL: URL?, syncSSMSetupTeardown: Bool) {
    RCTOTVLog.debug("certificate url \(certificateURL.absoluteString), license url \(licenseURL.absoluteString), ssm server url \(ssmServerURL?.absoluteString ?? "") sync \(syncSSMSetupTeardown) ")
    ssmBaseURL = ssmServerURL
    self.syncSSMSetupTeardown = syncSSMSetupTeardown
    super.init(certificateURL: certificateURL, licenseURL: licenseURL)
    attachObservers()
    _leave(self)
  }
  
  /// Creates an instance of `OTVReactNativeLicenseDelegate`.
  /// - Parameters:
  ///   - certificateURL: URL of certificate file.
  ///   - licenseURL: URL of license request.
  ///   - ssmServerURL: Optional URL of SSM service request.
  
  @objc public convenience init(certificateURL: URL, licenseURL: URL, ssmServerURL: URL?) {
    self.init(certificateURL: certificateURL, licenseURL: licenseURL, ssmServerURL: ssmServerURL, syncSSMSetupTeardown: true)
    _leave(self)
  }
  
  /// Creates an instance of `OTVReactNativeLicenseDelegate`.
  /// - Parameters:
  ///   - certificateURL: URL of certificate file.
  ///   - licenseURL: URL of license request.
  
  @objc public convenience override init(certificateURL: URL, licenseURL: URL) {
    self.init(certificateURL: certificateURL, licenseURL: licenseURL, ssmServerURL: nil, syncSSMSetupTeardown: true)
    _leave(self)
  }
  
  /// :nodoc:
  deinit {
    _enter(self)
    NotificationCenter.default.removeObserver(self)
    removeStream()
    _leave(self)
  }
  
  /// Overrided function to pass HTTP header for license request. It is based on the setStream(token:with:) to generate SSP required headers.
  /// Overrided function to pass HTTP header for license request. It is based on the setStream(token:with:) to generate SSP required headers.
  var waitingForNewToken = false
  
  @objc override public func generateHTTPHeaders(assetID: String) -> [String: String]? {
    objc_sync_enter(self)
    defer {
      objc_sync_exit(self)
    }
    
    // if we are waiting for token refresh then set the header to nil in order to not fire repeated license requests.
    if waitingForNewToken {
      // Ensure subsequent requests don't come along too fast
      RCTOTVLog.debug("Waiting for new stream token, returning to ensure subsequent requests dont come along too fast.")
      Thread.sleep(forTimeInterval: 0.2)
      return nil
    }
    var newToken = ""
    if let callback = tokenCallbackCompletionHandler, !initialLicenseRequest {
      waitingForNewToken = true
      newToken = callback()
      waitingForNewToken = false
      return generateHTTPHeadersImp(token: newToken)
    } else {
      initialLicenseRequest = false
      return generateHTTPHeadersImp(token: singleMediaToken)
    }
  }
  
  func generateHTTPHeadersImp(token: String?) -> [String: String]? {
    
    RCTOTVLog.info("#### OLD media token: ", singleMediaToken)
    RCTOTVLog.info("#### new media token: ", token ?? "")
    
    var headerValue: String? = token
    let oldToken = singleMediaToken
    singleMediaToken = token ?? ""
    if let ssmService = ssmService, ssmBaseURL != nil {
      if let sessionToken = ssmService.sessionToken {
        // For an initial license, we use content and session tokens
        headerValue = singleMediaToken + "," + sessionToken
        RCTOTVLog.info("#### isRenewal: \(isRenewal)")
        if isRenewal {
          // For renewal we only use the sessionToken
          headerValue = sessionToken
        } else {
          if !isFirstSSMSession {
            // This is not a renew license case use case for SSM enc content.
            // Also this is not the first license case, so teardown the existing
            // ssm session and do the SSM setup again.
            RCTOTVLog.info("#### Calling doSSMSetupAgain() to teardown the existing session & setup ssm session again with new token")
            // set the singlemediatoken to the new token
            
            
            doSSMSetupAgain(token: singleMediaToken, oldToken: oldToken)
                        
            // Note that session token would have changed after doSSMSetupAgain() call
            // so get the new sessionToken from ssmService and assign it and content token in headerValue
            if let sessionToken = ssmService.sessionToken {
              headerValue = singleMediaToken + "," + sessionToken
            }else {
              RCTOTVLog.info("#### Session token is nil")
            }
          }
          //set isFirstSSMSession to false as this will be called after the first license request.
          isFirstSSMSession = false
        }
      } else {
        RCTOTVLog.info("SSM Session- enabled, but no session token yet. Generating nil HTTP headers.")
        headerValue = nil
        // Ensure subsequent requests don't come along too fast
        Thread.sleep(forTimeInterval: 0.2)
      }
    }
    
    if let headerValue = headerValue {
      RCTOTVLog.info("headerType: \(internalHTTPHeaderType) header: \(headerValue)")
      return [internalHTTPHeaderType: headerValue]
    }
    else {
      RCTOTVLog.info("Header is nil")
      return nil
    }
  }
  
  @objc override public func getLicenseRequestUrl() -> URL {
    if isRenewal {
      if var urlComponents = URLComponents(string: licenseURL.absoluteString) {
        var queryItems: [URLQueryItem] = urlComponents.queryItems ?? []
        let queryItem = URLQueryItem(name: "renew", value: "true")
        queryItems.append(queryItem)
        urlComponents.queryItems = queryItems
        if let url = urlComponents.url {
          return url
        }
      }
    }
    return super.getLicenseRequestUrl()
  }
  
  @objc override public func getCkcFromLicenseResponse(response: [String : Any]) -> String? {
    // Before getting the Ckc, check if we're in enforced mode
    if let ssmService = ssmService, ssmBaseURL != nil {
      if let sessionToken = response["sessionToken"] as? String {
        ssmService.setSSMMode(mode: "licenseRenewal", renewalDelegate: self)
        ssmService.sessionToken = sessionToken
      }
    }
    isRenewal = false
    // Now find the key
    return super.getCkcFromLicenseResponse(response: response)
  }
  
  @objc public override func ckcMessageWith(spc: Data, assetID: String, session: AVContentKeySession, keyRequest: AVContentKeyRequest) -> Data? {
    contentKeySession = session
    self.keyRequest = keyRequest
    
    return super.ckcMessageWith(spc: spc, assetID: assetID, session: session, keyRequest: keyRequest)
  }
  
  /// Set the token and the url which associated with the stream.
  /// - Parameters:
  ///   - token: the stream's SSP specific media token.
  ///   - url: URL of the stream.
  ///   - success: closure for when the stream token and url are sucessfully set. Default to empty.
  ///   - failure: closure for when the stream token and url fail to be set. Default to empty.
  /// - note: If repeated license request require a new media token please use setToken() as any repeated license request will use the original token set from this function.

  @objc public func setStream(token: OTVMediaToken, with url: URL,
                              success: @escaping () -> Void = { /* Default Empty Closure */ },
                              failure: @escaping () -> Void = { /* Default Empty Closure */ }) {
    _enter(self)
    objc_sync_enter(self)
    defer { objc_sync_exit(self) }
    
    RCTOTVLog.info("Token \(token) set for \(url)")
    singleMediaToken = token
    
    if let ssmBaseURL = ssmBaseURL {
      let ssmService = OTVSSMService(ssmServerURL: ssmBaseURL, networkHandle: networkRequest, syncSetupTeardown: syncSSMSetupTeardown)
      ssmService.setupSession(token, success: success, failure: failure)
      self.ssmService = ssmService
      // This flag will be reset when first time license is acquired successfully for
      //  encrypted content playback OR when next ssm enc content playback is triggered
      //  before license request for previous enc content playback comes from framework.
      isFirstSSMSession = true
    } else {
      success()
    }
    _leave(self)

  }
  
  /// Application to set the initial stream token and callback which will be used by SDK to request for a new SSP content token, when a new license is requested.
  /// - Parameters:
  ///   - initialToken:  The stream's SSP specific media token to be used for the initial playback
  ///   - tokenCallback: Callback to be used to request the new media token. This callback is fired when a new licnese request is generated.
  /// - note: If repeated license requests do not need a new media token, please use setStream() as this function will request a new media token for each licnese request after the first.
  @objc public func setToken(initialToken: OTVMediaToken, tokenCallback: @escaping ()-> (String)) {
    _enter(self)
    let assetURL: URL = URL(string: "http://")!
    
    initialLicenseRequest = true
    tokenCallbackCompletionHandler = tokenCallback
    
    RCTOTVLog.info("Stream Token value: \(String(describing: initialToken))")
    
    // Set up the Stream with acquired content token
    setStream(token: initialToken, with: assetURL)
    _leave(self)
  }
  
  /// Application to set the initial stream token and callback which will be used by SDK to request for a new SSP content token, when a new license is requested.
  /// - Parameters:
  ///   - tokenCallback: Callback to be used to request the new media token. This callback is fired when a new licnese request is generated.
  /// - note: If repeated license requests do not need a new media token, please use setStream() as this function will request a new media token for each licnese request after the first.
  @objc public func setCallback(tokenCallback: @escaping ()-> (String)) {
    _enter(self)
   
    initialLicenseRequest = false
    tokenCallbackCompletionHandler = tokenCallback
    _leave(self)

  }
  
  /// Setup SSM
  /// - Parameters:
  ///   - token: the stream's SSP specific media token.
  ///   - success: closure for when the stream token and url are sucessfully set. Default to empty.
  ///   - failure: closure for when the stream token and url fail to be set. Default to empty.
  /// - note: If repeated license request require a new media token please use setToken() as any repeated license request will use the original token set from this function.

  @objc public func setupSSM(token: OTVMediaToken,
                              success: @escaping () -> Void = { /* Default Empty Closure */ },
                              failure: @escaping () -> Void = { /* Default Empty Closure */ }) {
    _enter(self)
    singleMediaToken = token
    
    if let ssmBaseURL = ssmBaseURL {
      let ssmService = OTVSSMService(ssmServerURL: ssmBaseURL, networkHandle: networkRequest, syncSetupTeardown: syncSSMSetupTeardown)
      ssmService.setupSession(token, success: success, failure: failure)
      self.ssmService = ssmService
      // This flag will be reset when first time license is acquired successfully for
      //  encrypted content playback OR when next ssm enc content playback is triggered
      //  before license request for previous enc content playback comes from framework.
      isFirstSSMSession = true
    }
    _leave(self)
  }
  
  
  @objc public func removeStream() {
    _enter(self)
    if ssmBaseURL != nil, let ssmService = ssmService {
      ssmService.tearDownSession(singleMediaToken)
    }
    _leave(self)

  }
  
  internal func triggerLicenceRenewal() {
    if let keyRequest = keyRequest, let contentKeySession = contentKeySession {
      RCTOTVLog.info("Triggering license renewal")
      isRenewal = true
      contentKeySession.renewExpiringResponseData(for: keyRequest)
    }
  }
  // MARK: Notification handling
  
  private func attachObservers() {
    
    NotificationCenter.default.addObserver(self,
                                           selector: #selector(onSSPLicenseDownloadEnded(notification:)),
                                           name: .OTVLicenseDownloadEnded,
                                           object: nil)
  }
  
  @objc func onSSPLicenseDownloadEnded(notification: Notification) {
    _enter(self)
    let success = notification.userInfo?["success"] as? Bool ?? false
    if success {
      RCTOTVLog.info("License downloaded successful. Reset the flag")
    }
    _leave(self)
  }
  
  internal func doSSMSetupAgain(token: OTVMediaToken, oldToken: OTVMediaToken) {
    _enter(self)
    
    if ssmBaseURL != nil, let ssmService = ssmService {
      // Tear down the current ssm session in synchronous mode.
      ssmService.tearDownSession(oldToken, syncMode: true)
      
      // Acquire the content token again
      RCTOTVLog.info("new Token value: \(String(describing: token))")

      let success = { () in
        RCTOTVLog.info("success completion handler")
      }
      let failure = { () in
        RCTOTVLog.error("failure completion handler")
      }
      ssmService.setupSession(token, success: success, failure: failure)
        
      }
    _leave(self)
  }
}
