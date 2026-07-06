import XCTest

/// Drives the real reader UI: swipes to scroll, hold-then-drags the pen.
/// These exist because the pen/scroll bugs were gesture-arbitration issues
/// that no type check or unit test could ever see.
final class PenAndScrollTests: XCTestCase {

    override func setUpWithError() throws {
        continueAfterFailure = false
    }

    private func verseRow(_ app: XCUIApplication, _ n: Int) -> XCUIElement {
        // Verse rows expose "Verse N. <text>" accessibility labels.
        app.staticTexts.matching(NSPredicate(format: "label BEGINSWITH %@", "Verse \(n).")).firstMatch
    }

    /// Swipe up and assert the chapter actually moved.
    private func assertScrolls(_ app: XCUIApplication, anchor: XCUIElement, _ message: String) {
        let before = anchor.frame.minY
        app.swipeUp()
        let after = anchor.exists ? anchor.frame.minY : -10_000
        XCTAssertLessThan(after, before - 40, message)
        // Scroll back to the top for whatever comes next.
        app.swipeDown()
        app.swipeDown()
    }

    func testScrollAndPenCoexist() throws {
        let app = XCUIApplication()
        app.launch()

        let verse1 = verseRow(app, 1)
        XCTAssertTrue(verse1.waitForExistence(timeout: 10), "reader should open to a chapter")

        // 1. Fresh launch: vertical scrolling works.
        assertScrolls(app, anchor: verse1, "swipe up must scroll the chapter")
        XCTAssertTrue(verse1.waitForExistence(timeout: 5))

        // 2. Hold-then-drag paints words and offers the style chooser.
        let verse2 = verseRow(app, 2)
        XCTAssertTrue(verse2.exists, "verse 2 should be on screen")
        verse2.press(forDuration: 0.8, thenDragTo: verseRow(app, 3))
        let marker = app.buttons["Marker"]
        XCTAssertTrue(marker.waitForExistence(timeout: 3),
                      "style chooser should appear after a pen stroke")
        app.buttons["Cancel mark"].tap()
        XCTAssertTrue(marker.waitForExistence(timeout: 1) == false || !marker.exists)

        // 3. THE regression: scrolling must still work after using the pen.
        assertScrolls(app, anchor: verse1, "scroll must survive pen use")
        XCTAssertTrue(verse1.waitForExistence(timeout: 5))

        // 4. Arm-then-lift with no drag must not leave scrolling locked.
        verse1.press(forDuration: 0.8)
        if app.buttons["Cancel mark"].waitForExistence(timeout: 1) {
            app.buttons["Cancel mark"].tap() // a stray 0pt drag painted a word
        }
        assertScrolls(app, anchor: verse1, "scroll must survive an armed-but-unused pen")
    }
}
