// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
//
//  RCTOTVILogProvider.swift


import Foundation

/// The `RCTOTVILogProvider` protocol defines a method that allows application to receive the log message from SDK in production build.

@objc public protocol RCTOTVILogProvider: NSObjectProtocol {
    
    /// This method is used by SDK to pass the log message to application.
    /// - Parameter xLog: log message
    func logProvider(xLog: String)

}
