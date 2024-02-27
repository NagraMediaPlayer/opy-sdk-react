// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
//
//  OTVReactCommonLicenseDelegate.swift
//  sdk
//

import Foundation
import AVFoundation

#if os(tvOS)
import OPYSDKFPSTv
#else
import OPYSDKFPS
#endif

//swiftlint:disable default_access_control_level_should_be_public

/// `OTVCommonLicenceDelegate` is a default implementation of `OTVLicenseDelegate`.
open class OTVReactCommonLicenseDelegate: NSObject, OTVLicenseDelegate {
  let networkRequest = OTVDRMNetworkHandler()
  
  let certificateURL: URL
  let licenseURL: URL
  
  var certificateData: Data?
  
  /// Creates an instance of `OTVCommonLicenceDelegate`.
  /// - Parameters:
  ///   - certificateURL: URL of certificate file.
  ///   - licenseURL: URL of license request.
  
  @objc public init(certificateURL: URL, licenseURL: URL) {
    _enter()
    self.certificateURL = certificateURL
    self.licenseURL = licenseURL
    
    super.init()
    _leave(self)
    
  }
  
  // MARK: - OTVLicenseDelegate stub (overridable)
  
  /// Returns scheme for fairplay "skd". This function can be override for mutltidrm. More in `OTVLicenseDelegate`.
  @objc open func scheme() -> String? {
    return "skd"
  }
  
  /// Returns the content identifier. This function can be override for mutltidrm. More in `OTVLicenseDelegate`.
  @objc open func contentIdentifier(url: URL) -> Data? {
    if let host = url.host,
       let decodedUrlData = Data(unpaddedBase64Encoded: host) {
      RCTOTVLog.info("host \(host)")
      return decodedUrlData
    }
    
    RCTOTVLog.warning("ContentIdentifier url \(url) may not be correct.")
    return nil
  }
  
  /// Returns the certificate. This function can be override for mutltidrm. More in `OTVLicenseDelegate`.
  @objc open func certificate() -> Data? {
    if let certificateData = self.certificateData {
      return certificateData
    }
    
    do {
      let urlExtra = OTVEvent.buildExtra([OTVEvent.ExtraKey.url: certificateURL.absoluteString])
      OTVEventTimeline.shared.addToTimeline(type: OTVEvent.EventType.licenceRequest,
                                            command: OTVEvent.EventCommand.LicenceRequest.provisionRequestStart,
                                            extra: urlExtra)
      
      self.certificateData = try Data(contentsOf: certificateURL)
      
      OTVEventTimeline.shared.addToTimeline(type: OTVEvent.EventType.licenceRequest,
                                            command: OTVEvent.EventCommand.LicenceRequest.provisionRequestSuccess,
                                            extra: urlExtra)
    }
    catch {
      let errorMessage = "Error downloading FPS certificate: \(error.localizedDescription)"
      RCTOTVLog.error(errorMessage)
      
      let failureExtra = OTVEvent.buildExtra([OTVEvent.ExtraKey.url: certificateURL.absoluteString,
                                              OTVEvent.ExtraKey.error: errorMessage])
      OTVEventTimeline.shared.addToTimeline(type: OTVEvent.EventType.licenceRequest,
                                            command: OTVEvent.EventCommand.LicenceRequest.provisionRequestFailure,
                                            extra: failureExtra)
    }
    
    return self.certificateData
  }
  
  /// Returns the Content Key Context (CKC) message.
  /// This function can be override for mutltidrm. More in `OTVLicenseDelegate`.
  @objc open func ckcMessage(spc: Data) -> Data? {
    return ckcMessageWithID(spc: spc, assetID: "")
  }
  
  /// Returns the Content Key Context (CKC) message.
  /// This function can be override for mutltidrm. More in `OTVLicenseDelegate`.
  @objc open func ckcMessageWithID(spc: Data, assetID: String) -> Data? {
    if let requestHeader = generateHTTPHeaders(assetID: assetID) {
      let requestUrl = getLicenseRequestUrl()
      if let ckcMessage = returnCKCMessage(requestBody: spc, headers: requestHeader, requestUrl: requestUrl) {
        return ckcMessage
      }
      else {
        RCTOTVLog.error("Failed to get CKC message")
      }
    }
    else {
      RCTOTVLog.warning("Generated HTTP headers are nil, skipping license request")
    }
    
    return nil
  }
  
  @objc open func ckcMessageWith(spc: Data, assetID: String, session: AVContentKeySession, keyRequest: AVContentKeyRequest) -> Data? {
    return ckcMessageWithID(spc: spc, assetID: assetID)
  }
  
  // MARK: - OTVCommonLicenseDelegate function (overridable)
  /// Returns the license HTTP Request custom headers.
  /// This function must be overridden for multidrm.
  /// Default returns empty Dictionary. If a nil Dictionary is returned the licence request is not sent.
  /// - Parameter assetID: client should use passed assetID to generate correctly http headers.
  @objc open func generateHTTPHeaders(assetID: String) -> [String: String]? {
    return [:]
  }
  
  @objc open func getLicenseRequestUrl() -> URL {
    return licenseURL
  }
  
  @objc open func getCkcFromLicenseResponse(response: [String: Any]) -> String? {
    return response["CkcMessage"] as? String
  }
  
  // MARK: - private function to handle license request
  private func returnCKCMessage(requestBody: Data, headers: [String: String], requestUrl: URL) -> Data? {
    let urlExtra = OTVEvent.buildExtra([OTVEvent.ExtraKey.url: requestUrl.absoluteString])
    OTVEventTimeline.shared.addToTimeline(type: OTVEvent.EventType.licenceRequest,
                                          command: OTVEvent.EventCommand.LicenceRequest.keyRequestStart,
                                          extra: urlExtra)
    
    let result = networkRequest.postSynchronousLicenseRequest(licenseServerUrl: requestUrl,
                                                              customDataHeader: headers,
                                                              keyRequest: requestBody)
    var errorMessage: String?
    switch result {
      case let .success(response):
        if let response = response {
          if let jsonBody = try? JSONSerialization.jsonObject(with: response, options: []) as? [String: Any] {
            RCTOTVLog.info("FPS license server request success")
            
            if let ckcData = getCkcFromLicenseResponse(response: jsonBody) {
              OTVEventTimeline.shared.addToTimeline(type: OTVEvent.EventType.licenceRequest,
                                                    command: OTVEvent.EventCommand.LicenceRequest.keyRequestSuccess,
                                                    extra: urlExtra)
              return Data(unpaddedBase64Encoded: ckcData)
            }
            else {
              errorMessage = "No CkcMessage in FPS license server response"
            }
          } else {
            RCTOTVLog.info("FPS license server request success. Received license in binary format.")
            OTVEventTimeline.shared.addToTimeline(type: OTVEvent.EventType.licenceRequest,
                                                  command: OTVEvent.EventCommand.LicenceRequest.keyRequestSuccess,
                                                  extra: urlExtra)
            return response
          }
        }
      case let .failure(statusCode, error, message):
        errorMessage = "FPS license server request error: \(error?.localizedDescription ?? "unknown") -  \(message ?? "")"
    }
    
    RCTOTVLog.error(errorMessage)
    let failureExtra = OTVEvent.buildExtra([OTVEvent.ExtraKey.url: requestUrl.absoluteString,
                                            OTVEvent.ExtraKey.error: errorMessage])
    OTVEventTimeline.shared.addToTimeline(type: OTVEvent.EventType.licenceRequest,
                                          command: OTVEvent.EventCommand.LicenceRequest.keyRequestFailure,
                                          extra: failureExtra)
    return nil
  }
}




extension Data {
  
  /// Initialize a `Data` from a Base-64 encoded String using the given options, where the string's length isn't necessarily a multiple of 4 (which fails with the standard Data(base64Encoded: options:) initialiser).
  /// Returns nil when the input is not recognized as valid Base-64.
  /// - parameters:
  ///   - base64String: The string to parse
  ///   - options: Encoding options. Default value is `[]`
  
  init?(unpaddedBase64Encoded value: String, options: Data.Base64DecodingOptions = []) {
    var base64 = value
    let remainder = base64.count % 4
    if remainder > 0 {
      // Decoding fails if the string length isn't a multiple of 4
      base64 = base64.padding(toLength: base64.count + 4 - remainder, withPad: "=", startingAt: 0)
    }
    
    self.init(base64Encoded: base64, options: options)
  }
  
}
