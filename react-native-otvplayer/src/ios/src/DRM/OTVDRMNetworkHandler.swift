// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
//
//  OTVDRMNetworkHandler.swift
//  OPYSDKFPS


import Foundation

#if os(tvOS)
  import OPYSDKFPSTv;
#else
  import OPYSDKFPS;
#endif

// Internal enum
enum LicenseRequestResult {
  case success(Data?)
  case failure(Int, Error?, String?)
}

final class OTVDRMNetworkHandler {
  func postSynchronousLicenseRequest(licenseServerUrl: URL, customDataHeader: [String: String], keyRequest: Data) -> LicenseRequestResult {
    RCTOTVLog.info("Posting license server request to server: \(licenseServerUrl)")
    
    let request = NSMutableURLRequest(url: licenseServerUrl)
    return postSync(request: request, data: keyRequest, headers: customDataHeader)
  }

  func postSync(request: NSMutableURLRequest,
                data: Data? = nil,
                headers: [String: String]? = nil) -> LicenseRequestResult {
    return makeSyncHttpRequest(request: request, method: "POST", data: data, headers: headers)
  }

  private func makeSyncHttpRequest(request: NSMutableURLRequest,
                                   method: String,
                                   data: Data?,
                                   headers: [String: String]?) -> LicenseRequestResult {
    self.addDataAndHeaders(request: request, method: method, data: data, headers: headers)
    let session = URLSession.shared

    let semaphore: DispatchSemaphore = DispatchSemaphore(value: 0)

    var retval = LicenseRequestResult.failure(-1, nil, nil)
    request.setValue("application/octet-stream", forHTTPHeaderField: "Content-Type")

    session.dataTask(with: request as URLRequest) { (data: Data?, response: URLResponse?, error: Error?) in
      if let response = response as? HTTPURLResponse, response.statusCode / 100 == 2 {
        retval = .success(data)
      } else {
        let statusCode = (response as? HTTPURLResponse)?.statusCode
        RCTOTVLog.error("Received response code: \(statusCode ?? -1)")
        
        var additionErrorMessage: String?
        if let data = data, let errorBody = String(data: data, encoding: String.Encoding.utf8) {
          RCTOTVLog.error("Received response: \(errorBody)")
          additionErrorMessage = errorBody
        }
        retval = .failure(statusCode ?? -1, error, additionErrorMessage)
      }
      
      semaphore.signal() // mark as done, no more wait
      }.resume()
    
    _ = semaphore.wait(timeout: DispatchTime.distantFuture)
    return retval
  }

  private func addDataAndHeaders(request: NSMutableURLRequest,
                                 method: String,
                                 data: Data?,
                                 headers: [String: String]?) {
    request.httpMethod = method
    request.httpBody = data
    
    if let headers = headers {
      for (field, value) in headers {
        request.addValue(value, forHTTPHeaderField: field)
      }
    }
  }
}
