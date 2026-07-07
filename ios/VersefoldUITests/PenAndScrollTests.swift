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
        app.launchArguments += ["-skipGuide"]
        app.launch()

        let verse1 = verseRow(app, 1)
        XCTAssertTrue(verse1.waitForExistence(timeout: 10), "reader should open to a chapter")

        // 1. Fresh launch: vertical scrolling works.
        assertScrolls(app, anchor: verse1, "swipe up must scroll the chapter")
        XCTAssertTrue(verse1.waitForExistence(timeout: 5))

        // 2. Hold-then-drag paints words and offers the style chooser;
        //    save an actual marker stroke.
        let verse2 = verseRow(app, 2)
        XCTAssertTrue(verse2.exists, "verse 2 should be on screen")
        verse2.press(forDuration: 0.8, thenDragTo: verseRow(app, 3))
        let marker = app.buttons["Marker"]
        XCTAssertTrue(marker.waitForExistence(timeout: 3),
                      "style chooser should appear after a pen stroke")
        marker.tap()

        // 2b. Regression: a verse that already carries ink must accept
        //     another stroke (word frames survive from its first layout).
        verse2.press(forDuration: 0.8, thenDragTo: verseRow(app, 3))
        let eraser = app.buttons["Erase marks"]
        XCTAssertTrue(eraser.waitForExistence(timeout: 3),
                      "second stroke over ink should offer the eraser")
        // 2c. Erase the stroked words — leaves the verse clean again.
        eraser.tap()
        let gone = XCTNSPredicateExpectation(
            predicate: NSPredicate(format: "exists == false"), object: marker)
        XCTAssertEqual(XCTWaiter().wait(for: [gone], timeout: 3), .completed,
                       "chooser should dismiss after erasing")

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

    /// The margin-note loop: add a note via the selection bar, see the
    /// hand-drawn mark appear in the gutter, open it from the mark, delete
    /// it, and watch the mark disappear.
    func testMarginNoteFlow() throws {
        let app = XCUIApplication()
        app.launchArguments += ["-skipGuide"]
        app.launch()

        let verse5 = verseRow(app, 5)
        XCTAssertTrue(verse5.waitForExistence(timeout: 10))

        // Create a note through the existing selection-bar flow.
        verse5.tap()
        app.buttons["More passage actions"].tap()
        XCTAssertTrue(app.buttons["Add note"].waitForExistence(timeout: 3))
        app.buttons["Add note"].tap()
        let editor = app.textViews.firstMatch
        XCTAssertTrue(editor.waitForExistence(timeout: 3))
        editor.tap()
        editor.typeText("Margin note test")
        app.buttons["Save"].tap()

        // The hand-drawn mark appears beside the verse.
        let mark = app.buttons["Notes on verse 5"]
        XCTAssertTrue(mark.waitForExistence(timeout: 3),
                      "margin mark should appear beside a noted verse")

        // Tapping it opens the verse's notes for editing.
        mark.tap()
        XCTAssertTrue(app.textViews.firstMatch.waitForExistence(timeout: 3))

        // Clean up: delete every note on the verse (there may be leftovers
        // from earlier runs); the mark must vanish with them.
        while app.buttons["Delete note"].firstMatch.exists {
            app.buttons["Delete note"].firstMatch.tap()
        }
        app.buttons["Done"].tap()
        XCTAssertFalse(mark.waitForExistence(timeout: 2),
                       "margin mark should disappear once the note is deleted")
    }
}
