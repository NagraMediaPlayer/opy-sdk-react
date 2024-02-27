// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
//
//  OTVSSMService.swift

import Foundation
#if os(tvOS)
  import OPYSDKFPSTv;
#else
  import OPYSDKFPS;
#endif

extension Notification.Name {
  // MARK: - SSM Service Notification
  /// Notification when SSM Service setup error. Notification userinfo include the error to specific
  /// which HTTP error and the message about SSM response detail.
  public static let OTVSSMSetupErrorNotification = Notification.Name(rawValue: "OTVSSMSetupErrorNotification")

  /// Notification when SSM Service teardown error. Notification userinfo include the error to specific
  /// which HTTP error and the message about SSM response detail.
  public static let OTVSSMTeardownErrorNotification = Notification.Name(rawValue: "OTVSSMTeardownErrorNotification")

  /// Notification when SSM Service heat beat error. Notification userinfo include the error to specific
  /// which HTTP error and the message about SSM response detail.
  public static let OTVSSMHeartbeatErrorNotification = Notification.Name(rawValue: "OTVSSMHeartbeatErrorNotification")
}

final class OTVSSMService: NSObject {
  private let ssmBaseURL: URL
  private let networkHandler: OTVDRMNetworkHandler
  private let syncSetupTeardown: Bool
  private var enforced = false
  private var renewalDelegate: OTVReactNativeLicenseDelegate?

  internal var sessionToken: String?
  private var hbTimer: DispatchSourceTimer?

  private let ssmHeaderKey = "nv-authorizations"
  private let ssmEnforcedMode = "licenseRenewal"
  private let ssmHeartbeatMode = "heartbeat"
  
  private var contentToken = ""
  private class var ssmTimerQueue: DispatchQueue {
    return DispatchQueue(label: "ssm.heartbeat.timer.queue")
  }
  
  @objc public enum OTVSSMServiceError : Int {
    case setupError = 3010
    case tearDownError = 3020
    case heartbeatError =  3030
    case customerCallbackError = 3040
    case requestError = 3050
  }

  init(ssmServerURL: URL, networkHandle: OTVDRMNetworkHandler, syncSetupTeardown: Bool) {
    ssmBaseURL = ssmServerURL
    networkHandler = networkHandle
    self.syncSetupTeardown = syncSetupTeardown
    
    super.init()
  }

  // MARK: - SSM Service restful endpoint
  private var ssmSessionBaseURL: URL {
    return ssmBaseURL.appendingPathComponent("sessions", isDirectory: true)
  }

  private var ssmSetupRequest: NSMutableURLRequest {
    let url = ssmSessionBaseURL.appendingPathComponent("setup")
    return NSMutableURLRequest(url: url)
  }

  private var ssmTearDownRequest: NSMutableURLRequest {
    let url = ssmSessionBaseURL.appendingPathComponent("teardown")
    return NSMutableURLRequest(url: url)
  }

  private var ssmHeartBeatRequest: NSMutableURLRequest {
    let url = ssmSessionBaseURL.appendingPathComponent("heartbeat")
    return NSMutableURLRequest(url: url)
  }

  // MARK: - SSM JSON field constant;

  private let tokenField = "sessionToken"
  private let heartbeatField = "heartbeat"

  // MARK: - SSM setup
  func setupSession(_ authToken: String, success: @escaping () -> Void, failure: @escaping () -> Void) {
    contentToken = authToken
    let headers = [ssmHeaderKey: authToken]
    let extraValue = OTVEvent.buildExtra([OTVEvent.ExtraKey.contentToken: contentToken])
    OTVEventTimeline.shared.addToTimeline(type: OTVEvent.EventType.sessionManagement,
                                          command: OTVEvent.EventCommand.SessionManagement.setupStart,
                                          extra: extraValue)
    
    if syncSetupTeardown {
      RCTOTVLog.info("Making SSM setup request synchronously, blocking main thread")
      
      let semaphore = DispatchSemaphore(value: 0)
      let waitTime = DispatchTime.now() + 5
  
      OTVSSMService.ssmTimerQueue.async {
        self.sendSetupRequest(headers: headers, success: success, failure: failure)
        semaphore.signal()
      }
      _ = semaphore.wait(timeout: waitTime)
    }
    else {
      RCTOTVLog.info("Making SSM setup request asynchronously")
      OTVSSMService.ssmTimerQueue.async {
        self.sendSetupRequest(headers: headers, success: success, failure: failure)
      }
    }
  }

  // MARK: - SSM teardown
  func tearDownSession(_ token: String, syncMode: Bool = false) {
    _enter(self)
    RCTOTVLog.info("syncMode: \(syncMode), syncSetupTeardown:\(syncSetupTeardown)")
    RCTOTVLog.info("SSM Session- teardown.")
    var syncTearDownFlag = false
    if let timer = self.hbTimer {
      timer.cancel()
    }

    guard let sessionToken = sessionToken else {
      RCTOTVLog.info("SSM teardown- session token not present.")
      _leave(self)
      return
    }
    
    let extraValue = OTVEvent.buildExtra([OTVEvent.ExtraKey.contentToken: contentToken,
                                          OTVEvent.ExtraKey.sessionToken: sessionToken])
    OTVEventTimeline.shared.addToTimeline(type: OTVEvent.EventType.sessionManagement,
                                          command: OTVEvent.EventCommand.SessionManagement.teardownStart,
                                          extra: extraValue)
    
    // Once we start teardown, we unset the sessionToken as early as possible to avoid trigger timer event.
    self.sessionToken = nil
    
    let headers = [self.ssmHeaderKey: sessionToken]

    if syncMode || syncSetupTeardown {
      syncTearDownFlag = true
    }

    // And we need make sure heartbeat and teardown post request happening in sequence.
    if syncTearDownFlag {
      RCTOTVLog.info("Making SSM teardown request synchronously, blocking main thread")
      let semaphore: DispatchSemaphore = DispatchSemaphore(value: 0)
      let waitTime = DispatchTime.now() + 3
      
      OTVSSMService.ssmTimerQueue.async {
        self.sendTeardownRequest(headers: headers)
        semaphore.signal()
      }
      _ = semaphore.wait(timeout: waitTime)
    }
    else {
      RCTOTVLog.info("Making SSM teardown request asynchronously")
      OTVSSMService.ssmTimerQueue.async {
        self.sendTeardownRequest(headers: headers)
      }
    }
    _leave(self)
  }

  // MARK: - SSM heartbeat
  func heartBeatFunc() {
    RCTOTVLog.info("SSM Heartbeat- triggered.")
    
    if let delegate = self.renewalDelegate {
      if self.enforced {
        RCTOTVLog.info("Enforced mode SSM, trigger a license renewal")
        delegate.triggerLicenceRenewal()
        return
      }
    }

    guard let sessionToken = self.sessionToken else {
      RCTOTVLog.info("SSM Heartbeat- session token not present.")
      return
    }

    let extraValue = OTVEvent.buildExtra([OTVEvent.ExtraKey.contentToken: contentToken,
                                          OTVEvent.ExtraKey.sessionToken: sessionToken])
    OTVEventTimeline.shared.addToTimeline(type: OTVEvent.EventType.sessionManagement,
                                          command: OTVEvent.EventCommand.SessionManagement.heartbeatStart,
                                          extra: extraValue)
    
    let headers = [ssmHeaderKey: sessionToken]

    networkRequestFunc(request: ssmHeartBeatRequest, headers: headers, success: { jsonBody in
      if let newSessionToken = jsonBody[self.tokenField] as? String {
        RCTOTVLog.info("SSM Heartbeat- new session token received.")
        self.sessionToken = newSessionToken
        let extraValue = OTVEvent.buildExtra([OTVEvent.ExtraKey.contentToken: self.contentToken,
                                              OTVEvent.ExtraKey.sessionToken: self.sessionToken])
        OTVEventTimeline.shared.addToTimeline(type: OTVEvent.EventType.sessionManagement,
                                              command: OTVEvent.EventCommand.SessionManagement.heartbeatSuccess,
                                              extra: extraValue)
      }
    }, failure: { statusCode, error, message  in
      if let ssmMessage = message, let dict = self.convertToDictionary(text: ssmMessage) {
        RCTOTVLog.error("SSM Heartbeat failure:  \(dict["errorCode"]), statusCode is \(String(describing: statusCode)), and message is \(String(describing: dict["message"]))")
      }
      let extraValue = OTVEvent.buildExtra([OTVEvent.ExtraKey.contentToken: self.contentToken,
                                            OTVEvent.ExtraKey.sessionToken: self.sessionToken,
                                            OTVEvent.ExtraKey.error: error?.localizedDescription])
      OTVEventTimeline.shared.addToTimeline(type: OTVEvent.EventType.sessionManagement,
                                            command: OTVEvent.EventCommand.SessionManagement.heartbeatFailure,
                                            extra: extraValue)
      self.sendSSMNotification(name: .OTVSSMHeartbeatErrorNotification, http: error, httpStatusCode: statusCode, ssm: message)
      return
    })
  }
  
  func setSSMMode(mode: String, renewalDelegate: OTVReactNativeLicenseDelegate?) {
    if mode == ssmEnforcedMode {
      if let delegate = renewalDelegate {
        self.enforced = true
        self.renewalDelegate = delegate
        return
      }
    }
    self.enforced = false
    self.renewalDelegate = nil
  }
  
  // MARK: Private functions
  private func sendSetupRequest(headers: [String: String], success: @escaping () -> Void, failure: @escaping () -> Void) {
    let startTime = DispatchTime.now()
    self.networkRequestFunc(request: self.ssmSetupRequest, headers: headers, success: { jsonBody in
      self.sessionToken = jsonBody[self.tokenField] as? String
      let heartBeat = jsonBody[self.heartbeatField] as? Int32
      let timeTaken = DispatchTime.now().timeInterval(since: startTime)
      RCTOTVLog.info("SSM Session- setup successful. Took \(timeTaken)s")
      let extraValue = OTVEvent.buildExtra([OTVEvent.ExtraKey.contentToken: self.contentToken,
                                            OTVEvent.ExtraKey.sessionToken: self.sessionToken])
      OTVEventTimeline.shared.addToTimeline(type: OTVEvent.EventType.sessionManagement,
                                            command: OTVEvent.EventCommand.SessionManagement.setupSuccess,
                                            extra: extraValue)
      success()
      
      if let heartBeat = heartBeat {
        let heartbeatSeconds = DispatchTimeInterval.seconds(Int(heartBeat))
        RCTOTVLog.info("SSM Heartbeat- started.")
        self.hbTimer = self.scheduleHeartbeat(interval: heartbeatSeconds)
      }
    }, failure: { statusCode, error, message in
      if let ssmMessage = message, let dict = self.convertToDictionary(text: ssmMessage) {
        RCTOTVLog.error("SSM Session- setup failure:  \(dict["errorCode"]), statusCode is \(String(describing: statusCode)), and message is \(String(describing: dict["message"]))")
      }
      let extraValue = OTVEvent.buildExtra([OTVEvent.ExtraKey.contentToken: self.contentToken,
                                            OTVEvent.ExtraKey.error: error?.localizedDescription])
      OTVEventTimeline.shared.addToTimeline(type: OTVEvent.EventType.sessionManagement,
                                            command: OTVEvent.EventCommand.SessionManagement.setupFailure,
                                            extra: extraValue)
      self.sendSSMNotification(name: .OTVSSMSetupErrorNotification, http: error, httpStatusCode: statusCode, ssm: message)
      failure()
    })
  }
  
  private func sendTeardownRequest(headers: [String: String]) {
    let startTime = DispatchTime.now()
    RCTOTVLog.info("SSM teardown started")
    self.networkRequestFunc(request: self.ssmTearDownRequest, headers: headers, success: { _ in
      let timeTaken = DispatchTime.now().timeInterval(since: startTime)
      RCTOTVLog.info("SSM teardown took \(timeTaken)s")
      let extraValue = OTVEvent.buildExtra([OTVEvent.ExtraKey.contentToken: self.contentToken,
                                            OTVEvent.ExtraKey.sessionToken: self.sessionToken])
      OTVEventTimeline.shared.addToTimeline(type: OTVEvent.EventType.sessionManagement,
                                            command: OTVEvent.EventCommand.SessionManagement.teardownSuccess,
                                            extra: extraValue)
    }, failure: { statusCode, error, message in
      RCTOTVLog.error("SSM Session- teardown failure.")
      let extraValue = OTVEvent.buildExtra([OTVEvent.ExtraKey.contentToken: self.contentToken,
                                            OTVEvent.ExtraKey.sessionToken: self.sessionToken,
                                            OTVEvent.ExtraKey.error: error?.localizedDescription])
      OTVEventTimeline.shared.addToTimeline(type: OTVEvent.EventType.sessionManagement,
                                         command: OTVEvent.EventCommand.SessionManagement.teardownFailure,
                                           extra: extraValue)
      self.sendSSMNotification(name: .OTVSSMTeardownErrorNotification, http: error, httpStatusCode: statusCode, ssm: message)
    })
  }

  private func scheduleHeartbeat(interval: DispatchTimeInterval) -> DispatchSourceTimer {
    let timer = DispatchSource.makeTimerSource(queue: OTVSSMService.ssmTimerQueue)
    // The first timer event should be triggered after one time interval.
    timer.schedule(deadline: .now() + interval, repeating: interval)
    timer.setEventHandler {
      self.heartBeatFunc()
    }
    timer.resume()

    return timer
  }

  // MARK: - common network post request for SSM

  private func networkRequestFunc(request: NSMutableURLRequest, headers: [String: String],
                                  success: @escaping (_ jsonbody: [String: Any]) -> Void,
                                  failure: @escaping (_ statusCode: Int,_ error: Error?, _ message: String?) -> Void) {
    let result = networkHandler.postSync(request: request, data: nil, headers: headers)
    switch result {
    case let .success(response):
      if let response = response,
        let jsonBody = try? JSONSerialization.jsonObject(with: response, options: []) as? [String: Any] {
          success(jsonBody)
      } else {
        RCTOTVLog.error("Network response incorrect/unexpected.")
      }
    case let .failure(statusCode, error, message):
        if let ssmMessage = message, let dict = convertToDictionary(text: ssmMessage) {
          RCTOTVLog.error("SSMService request error: \(dict["errorCode"]), statusCode is \(String(describing: statusCode)), and message is \(String(describing: dict["message"]))")
        }
      failure(statusCode, error, message)
    }
  }
  
  private func convertToDictionary(text: String) -> [String: Any]? {
    if let data = text.data(using: .utf8) {
        do {
            return try JSONSerialization.jsonObject(with: data, options: []) as? [String: Any]
        } catch {
          RCTOTVLog.error(error.localizedDescription)
        }
    }
    return nil
}
  
  private func sendSSMNotification(name: Notification.Name, http error: Error?, httpStatusCode statusCode: Int, ssm message: String?) {
    var userInfo: [AnyHashable: Any] = [:]
    
    if let error = error {
      userInfo["error"] = error
    }
    
    if let message = message {
      if let dict = convertToDictionary(text: message) {
        userInfo["errorCode"] = dict["errorCode"]
        userInfo["message"] = dict["message"]
      }
    }
    
    userInfo["code"] = statusCode

    NotificationCenter.default.post(name: name, object: nil, userInfo: userInfo)
  }
}

extension DispatchTime {
  
  /// Returns the number of seconds since the specified `DispatchTime`
  func timeInterval(since other: DispatchTime) -> TimeInterval {
    let nanosDiff = TimeInterval(uptimeNanoseconds) - TimeInterval(other.uptimeNanoseconds)
    return nanosDiff / (1_000_000 * 1_000)
  }
  
}
