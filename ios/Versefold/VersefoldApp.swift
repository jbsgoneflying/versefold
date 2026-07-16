import SwiftUI

/// Versefold — a quiet Bible app. Opens to Scripture (last location), never a
/// feed. The reader IS the app: no tab bar, nothing below the Word. Studies,
/// Library, and Settings are rooms reached from one toolbar menu, and closing
/// them always returns to reading.
@main
struct VersefoldApp: App {
    @StateObject private var scripture = ScriptureStore()
    @StateObject private var library: LibraryStore
    /// Watches server-side study builds so readers can navigate away while
    /// a study is written and get a soft nudge when it's ready.
    @StateObject private var studyJobs: StudyJobMonitor

    init() {
        let library = LibraryStore()
        _library = StateObject(wrappedValue: library)
        _studyJobs = StateObject(wrappedValue: StudyJobMonitor(library: library))
    }

    /// Cold launch only — state is born true and never comes back, so
    /// returning from the background never replays the splash.
    @State private var showSplash = true

    var body: some Scene {
        WindowGroup {
            ZStack {
                ReaderView()
                    .environmentObject(scripture)
                    .environmentObject(library)
                    .environmentObject(studyJobs)
                    .tint(Brand.hunter)

                if showSplash {
                    SplashView {
                        withAnimation(.easeInOut(duration: 0.5)) {
                            showSplash = false
                        }
                    }
                    .zIndex(1)
                    .transition(.opacity)
                }
            }
        }
    }
}
