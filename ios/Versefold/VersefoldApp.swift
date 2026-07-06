import SwiftUI

/// Versefold — a quiet Bible app. Opens to Scripture (last location), never a
/// feed. The reader IS the app: no tab bar, nothing below the Word. Studies,
/// Library, and Settings are rooms reached from one toolbar menu, and closing
/// them always returns to reading.
@main
struct VersefoldApp: App {
    @StateObject private var scripture = ScriptureStore()
    @StateObject private var library = LibraryStore()

    var body: some Scene {
        WindowGroup {
            ReaderView()
                .environmentObject(scripture)
                .environmentObject(library)
                .tint(Brand.hunter)
        }
    }
}
