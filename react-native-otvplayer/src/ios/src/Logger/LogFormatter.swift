// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
//
//  LogFormatter.swift
//

import Foundation

public enum Component {
  case date(String)
  case message
  case level
  case file(fullPath: Bool, fileExtension: Bool)
  case line
  case column
  case function
  case location
  case thread
  case block(() -> Any?)
}

class LogFormatter: NSObject {
  private var format: String
  
  private var components: [Component]
  
  private let dateFormatter = DateFormatter()
  
  public convenience init(_ format: String, _ components: Component...) {
    self.init(format, components)
  }
  
  public init(_ format: String, _ components: [Component]) {
    self.format = format
    self.components = components
  }
  
  func format(level: RCTOTVLogType, items: [Any], date: Date, thread: String, file: String, function: String, line: Int, column: Int) -> String {
    let arguments = components.map { (component: Component) -> CVarArg in
      switch component {
        case let .date(dateFormat):
          return format(date: date, dateFormat: dateFormat)
        case let .file(fullPath, fileExtension):
          return format(file: file, fullPath: fullPath, fileExtension: fileExtension)
        case .function:
          return String(function)
        case .line:
          return String(line)
        case .column:
          return String(column)
        case .level:
          return format(level: level)
        case .message:
          return items.map({ String(describing: $0) }).joined(separator: " ")
        case .location:
          return format(file: file, line: line)
        case .thread:
          return String(thread)
        case let .block(block):
          return block().flatMap({ String(describing: $0) }) ?? ""
      }
    }
    
    return String(format: format, arguments: arguments)
  }
}

extension LogFormatter {
  public static let `default` = LogFormatter("[%@ - %@] %@ %@: %@ %@", [
    .date("yyyy-MM-dd hh:mm:ss.SSS"),
    .level,
    .thread,
    .location,
    .function,
    .message
  ])
  
  public static let minimal = LogFormatter("[%@] %@ %@ %@: %@", [
    .level,
    .thread,
    .location,
    .function,
    .message
  ])
  
  public static let detailed = LogFormatter("[%@ - %@] %@.%@:%@ %@: %@", [
    .date("yyyy-MM-dd hh:mm:ss.SSS"),
    .level,
    .thread,
    .file(fullPath: false, fileExtension: false),
    .function,
    .line,
    .message
  ])
}

private extension LogFormatter {
  /**
   Formats a date with the specified date format.
   
   - parameter date:       The date.
   - parameter dateFormat: The date format.
   
   - returns: A formatted date.
   */
  func format(date: Date, dateFormat: String) -> String {
    dateFormatter.dateFormat = dateFormat
    return dateFormatter.string(from: date)
  }
  
  /**
   Formats a file path with the specified parameters.
   
   - parameter file:          The file path.
   - parameter fullPath:      Whether the full path should be included.
   - parameter fileExtension: Whether the file extension should be included.
   
   - returns: A formatted file path.
   */
  func format(file: String, fullPath: Bool, fileExtension: Bool) -> String {
    var file = file
    
    if !fullPath { file = file.lastPathComponent }
    if !fileExtension { file = file.stringByDeletingPathExtension }
    
    return file
  }
  
  /**
   Formats a Location component with a specified file path and line number.
   
   - parameter file: The file path.
   - parameter line: The line number.
   
   - returns: A formatted Location component.
   */
  func format(file: String, line: Int) -> String {
    return [
      format(file: file, fullPath: false, fileExtension: true),
      String(line)
    ].joined(separator: ":")
  }
  
  /**
   Formats a Level component.
   
   - parameter level: The Level component.
   
   - returns: A formatted Level component.
   */
  func format(level: RCTOTVLogType) -> String {
    return level.description
  }
  
}


extension String {
  /// The last path component of the receiver.
  var lastPathComponent: String {
    return NSString(string: self).lastPathComponent
  }
  
  /// A new string made by deleting the extension from the receiver.
  var stringByDeletingPathExtension: String {
    return NSString(string: self).deletingPathExtension
  }
}
