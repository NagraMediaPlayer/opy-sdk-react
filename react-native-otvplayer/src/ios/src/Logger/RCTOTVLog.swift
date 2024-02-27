// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
//
//  RCTOTVLog.swift


import Foundation

internal class RCTOTVLog {
  public static func setLogging(level: RCTOTVLogType) {
    LogImpl.shared.outputLogLevel = level
  }
  public static func setLogProvider(xLogProvider: RCTOTVILogProvider ) {
    LogImpl.shared.logProvider = xLogProvider
  }
  public static func debug(_ items: Any..., file: String = #file, function: String = #function, line: Int = #line, column: Int = #column) {
    LogImpl.shared.log(.debug, items, file, function, line, column)
  }
  public static func info(_ items: Any..., file: String = #file, function: String = #function, line: Int = #line, column: Int = #column) {
    LogImpl.shared.log(.info, items, file, function, line, column)
  }
  public static func warning(_ items: Any..., file: String = #file, function: String = #function, line: Int = #line, column: Int = #column) {
    LogImpl.shared.log(.warning, items, file, function, line, column)
  }
  public static func error(_ items: Any..., file: String = #file, function: String = #function, line: Int = #line, column: Int = #column) {
    LogImpl.shared.log(.error, items, file, function, line, column)
  }
}

//swiftlint:disable variable_name
internal func _enter(_ obj: AnyObject? = nil, with info: Any..., file: String = #file, function: String = #function, line: Int = #line, column: Int = #column) {
  let debug = debugInfo(info)
  if let obj = obj {
    RCTOTVLog.debug("Enter", getAddress(obj), debug, file: file, function: function, line: line, column: column)
  } else {
    RCTOTVLog.debug("Enter", debug, file: file, function: function, line: line, column: column)
  }
}

//swiftlint:disable variable_name
internal func _leave(_ obj: AnyObject? = nil, with info: Any..., file: String = #file, function: String = #function, line: Int = #line, column: Int = #column) {
  let debug = debugInfo(info)
  if let obj = obj {
    RCTOTVLog.debug("Leave", getAddress(obj), debug, file: file, function: function, line: line, column: column)
  } else {
    RCTOTVLog.debug("Leave", debug, file: file, function: function, line: line, column: column)
  }
}

//swiftlint:disable variable_name
internal func _enterAndLeave(_ obj: AnyObject, with info: Any..., file: String = #file, function: String = #function, line: Int = #line, column: Int = #column) {
  let debug = debugInfo(info)
  RCTOTVLog.debug("Enter & Leave", getAddress(obj), debug, file: file, function: function, line: line, column: column)
}

private func debugInfo(_ info: [Any]) -> String {
  var debug = info.map({ String(describing: $0) }).joined(separator: " - ")
  if info.count > 0 {
    debug = "with:: " + debug
  } else {
    debug = ""
  }
  return debug
}
