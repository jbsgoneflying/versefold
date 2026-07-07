import XCTest

/// The guide's whole contract: it greets a first launch, gets out of the way
/// forever once dismissed, and stays reachable from the reader menu.
final class GuideTests: XCTestCase {

    override func setUpWithError() throws {
        continueAfterFailure = false
    }

    func testFirstRunGuideThenMenuReopen() throws {
        // 1. Simulated first run: the guide presents itself (after the splash).
        let app = XCUIApplication()
        app.launchArguments += ["-resetGuide"]
        app.launch()

        let continueButton = app.buttons["Continue"]
        XCTAssertTrue(continueButton.waitForExistence(timeout: 10),
                      "guide should present itself on first launch")

        // 2. Walk every page; the button becomes "Begin reading" at the end.
        let begin = app.buttons["Begin reading"]
        var taps = 0
        while !begin.exists && taps < 6 {
            continueButton.tap()
            taps += 1
        }
        XCTAssertTrue(begin.waitForExistence(timeout: 2),
                      "last page should offer Begin reading")
        begin.tap()

        // 3. Dismissing lands in the reader.
        let verse1 = app.staticTexts
            .matching(NSPredicate(format: "label BEGINSWITH %@", "Verse 1.")).firstMatch
        XCTAssertTrue(verse1.waitForExistence(timeout: 10),
                      "reader should be underneath the guide")

        // 4. Second launch (no reset): the guide must NOT reappear.
        app.terminate()
        app.launchArguments = []
        app.launch()
        XCTAssertTrue(verse1.waitForExistence(timeout: 10))
        XCTAssertFalse(app.buttons["Continue"].waitForExistence(timeout: 4),
                       "guide must not return after being dismissed")

        // 5. But the menu reopens it on demand.
        app.buttons["Studies, Library, and Settings"].tap()
        let howTo = app.buttons["How to use Versefold"]
        XCTAssertTrue(howTo.waitForExistence(timeout: 3))
        howTo.tap()
        XCTAssertTrue(app.buttons["Continue"].waitForExistence(timeout: 3),
                      "menu entry should reopen the guide")
        app.buttons["Skip guide"].tap()
        XCTAssertTrue(verse1.waitForExistence(timeout: 5))
    }
}
