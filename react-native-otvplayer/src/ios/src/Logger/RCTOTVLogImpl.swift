// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
//
//  RCTOTVLogImpl.swift 

import Foundation
import os

extension RCTOTVLogType: Comparable {
  static let name = ["debg", "info", "warn", "erro"]
  var description: String {
    return String(describing: RCTOTVLogType.name[self.rawValue]).uppercased()
  }

  public static func < (lhs: RCTOTVLogType, rhs: RCTOTVLogType) -> Bool {
    return lhs.rawValue < rhs.rawValue
  }
}

internal class LogImpl: NSObject {
  @objc static public let shared: LogImpl = LogImpl()
  enum `Logger` {
    case debugConsole
    case deviceConsole
  }
#if DEBUG
  private let formatter: LogFormatter = .default
  var logger: Logger  = .debugConsole
#else
  private var formatter: LogFormatter = .minimal
  var logger: Logger  = .deviceConsole
#endif
  internal let queue = DispatchQueue(label: "rctotv.log")
  internal var outputLogLevel: RCTOTVLogType = .warning
  internal var logProvider: RCTOTVILogProvider?

  override private init() {
    super.init()
    self.logSdkVersion()
  }
  
  internal func getBundleName() -> String? {
    let bundle = Bundle(for: type(of: self))
    return bundle.infoDictionary?["CFBundleName"] as? String
  }

  internal func getBundleVersion() -> String? {
    let bundle = Bundle(for: type(of: self))
    return bundle.infoDictionary?["CFBundleShortVersionString"] as? String
  }

  private func getSdkInfo() -> String? {
    guard let name = getBundleName(),
          let version = getBundleVersion() else {return nil}
    #if DEBUG
    return  name + " - " + version + " - DEBUG"
    #else
    return  name + " - " + version
    #endif
  }
  
  func logSdkVersion() {
    if let fpsSdkVersion = getSdkInfo() {
      os_log("%{public}@", log: LogImpl.Logger.osLogger, type: .debug, fpsSdkVersion)
    }
  }
}

extension LogImpl: RCTOTVLogProtocol {
  @objc(log::::::)
  public func log(_ level: RCTOTVLogType, _ items: [Any], _ file: String, _ function: String, _ line: Int, _ column: Int) {
    guard level >= outputLogLevel else { return }

    let date = Date()
    let currentThread = Thread.current
    let thread = "\(currentThread.hash)\(currentThread.isMainThread ? "T": "t")"
    let message = formatter.format(
      level: level,
      items: items,
      date: date,
      thread: thread,
      file: file,
      function: function,
      line: line,
      column: column
    )
    LogImpl.shared.queue.async {
      self.logger.output(level, message)
    }
  }
  
  public func log(_ level: RCTOTVLogType, _ message: String) {
    LogImpl.shared.queue.async {
      self.logger.output(level, message)
    }
  }
}

extension LogImpl.Logger {
  static let osLogger: OSLog = OSLog(subsystem: Bundle.main.bundleIdentifier!, category: "RCTOTVSDK")

  func logOutput(_ level: RCTOTVLogType, _ message: String) {
    switch level {
    case .debug:
      os_log("%{public}@", log: LogImpl.Logger.osLogger, type: .debug, message)
      LogImpl.shared.logProvider?.logProvider(xLog: message)
    case .info:
      os_log("%{public}@", log: LogImpl.Logger.osLogger, type: .info, message)
      LogImpl.shared.logProvider?.logProvider(xLog: message)
    case .warning:
      os_log("%{public}@", log: LogImpl.Logger.osLogger, type: .default, message)
      LogImpl.shared.logProvider?.logProvider(xLog: message)
    case .error:
      os_log("%{public}@", log: LogImpl.Logger.osLogger, type: .error, message)
      LogImpl.shared.logProvider?.logProvider(xLog: message)
    @unknown default: break
        
    }
  }
  
  func output(_ level: RCTOTVLogType, _ message: String) {
    switch self {
    case .debugConsole:
      print(message)
      LogImpl.shared.logProvider?.logProvider(xLog: message)
    case .deviceConsole:
      logOutput(level, message)
      print(message)
    }
  }
}

@objc(RCTOTVLogImpl)
internal class RCTOTVLogImpl: LogImpl {}

internal func getAddress(_ obj: AnyObject) -> UnsafeMutableRawPointer {
  return Unmanaged.passUnretained(obj).toOpaque()
}
