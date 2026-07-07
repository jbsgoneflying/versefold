import XCTest

/// Stages the app and captures App Store screenshots. Run explicitly with:
///   xcodebuild test -only-testing:VersefoldUITests/AppStoreScreenshotTests \
///     -destination 'platform=iOS Simulator,name=iPhone 17 Pro Max'
/// PNGs land in /tmp/versefold-shots on the host (the simulator shares the
/// Mac's filesystem, so a plain file write is the most reliable export).
final class AppStoreScreenshotTests: XCTestCase {

    override func setUpWithError() throws {
        continueAfterFailure = false
    }

    private func verseRow(_ app: XCUIApplication, _ n: Int) -> XCUIElement {
        app.staticTexts.matching(NSPredicate(format: "label BEGINSWITH %@", "Verse \(n).")).firstMatch
    }

    /// The runner's sandbox can't write to the host, so "capturing" is just
    /// holding each staged screen still while a host-side `simctl` loop
    /// photographs the simulator once per second.
    private func snap(_ name: String) {
        Thread.sleep(forTimeInterval: 4.0)
    }

    func testCaptureScreenshots() throws {
        let app = XCUIApplication()
        app.launchArguments += ["-skipGuide"]
        app.launch()

        // 1. The splash moment (mark + wordmark on ivory).
        Thread.sleep(forTimeInterval: 1.0)
        snap("01-splash")

        let verse1 = verseRow(app, 1)
        XCTAssertTrue(verse1.waitForExistence(timeout: 10))

        // 2. Ink a verse so the reader shows the pen at its best.
        let verse2 = verseRow(app, 2)
        verse2.press(forDuration: 0.8, thenDragTo: verseRow(app, 3))
        let marker = app.buttons["Marker"]
        if marker.waitForExistence(timeout: 3) { marker.tap() }
        Thread.sleep(forTimeInterval: 0.8)
        snap("02-reader")

        // 3. Selection bar with Unfold / Compare on a chosen verse.
        verse1.tap()
        Thread.sleep(forTimeInterval: 0.6)
        snap("03-selection")

        // 4. Confession card composer (shows the card + colophon).
        app.buttons["More passage actions"].tap()
        let cardAction = app.buttons["Confession card"]
        XCTAssertTrue(cardAction.waitForExistence(timeout: 3))
        cardAction.tap()
        XCTAssertTrue(app.navigationBars["Confession card"].waitForExistence(timeout: 5))
        Thread.sleep(forTimeInterval: 1.0)
        snap("04-card")
        app.buttons["Close"].tap()
        app.buttons["Clear selection"].tap()

        // 5. Book & chapter picker.
        app.buttons["Choose book and chapter"].tap()
        Thread.sleep(forTimeInterval: 1.0)
        snap("05-picker")
        // A swipe would scroll the book list, not dismiss the sheet.
        app.buttons["Done"].firstMatch.tap()

        // 6. Settings with the About block.
        app.buttons["Studies, Library, and Settings"].tap()
        let settings = app.buttons["Settings"]
        XCTAssertTrue(settings.waitForExistence(timeout: 3))
        settings.tap()
        XCTAssertTrue(app.navigationBars["Settings"].waitForExistence(timeout: 5))
        app.swipeUp()
        app.swipeUp()
        Thread.sleep(forTimeInterval: 0.6)
        snap("06-about")
        app.buttons["Done"].firstMatch.tap()

        // 7. The guide's pen page (marks itself on a loop — a great shot).
        app.buttons["Studies, Library, and Settings"].tap()
        let howTo = app.buttons["How to use Versefold"]
        XCTAssertTrue(howTo.waitForExistence(timeout: 3))
        howTo.tap()
        let next = app.buttons["Continue"]
        XCTAssertTrue(next.waitForExistence(timeout: 3))
        next.tap() // to page 2
        next.tap() // to page 3, the pen demo
        Thread.sleep(forTimeInterval: 2.2) // let the marker finish sweeping
        snap("07-guide-pen")
    }
}
