// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
//
//  refAppCommonUITests.swift
//  refAppCommonUITests
//

import XCTest

class refAppCommonUITests: XCTestCase {

  func testToLaunchWithoutiOSDeploy() {
    // UI tests must launch the application that they test.
    let app = XCUIApplication()
    app.launch()

    // Use recording to get started writing UI tests.
    // Use XCTAssert and related functions to verify your tests produce the correct results.
     
    // Wait for the 'tests have finished' label to appear
    let label = app.staticTexts["Auto-test is Complete"]
    let exp = expectation(description: "Auto-test is Complete")
    // Check every 30s if the 'tests have finished' label has appeared
    // expectation(for:evaluatingObject:) can do this in less code but checks
    // more frequently and our sync SSM tests block the main thread which causes
    // failures as the UI tests think the cucumber app has frozen and gives up
    _ = Timer.scheduledTimer(withTimeInterval: 30, repeats: true) {
      timer in
      
      if label.exists {
        exp.fulfill()
        timer.invalidate()
      }
    }
    
    waitForExpectations(timeout: .infinity, handler: nil)
  }
}
