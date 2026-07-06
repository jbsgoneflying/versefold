import SwiftUI

/// Settings: reader preferences, privacy controls (export, delete AI history,
/// delete everything), feedback, and attribution. Reached from a secondary
/// control — settings is not a tab.
struct SettingsView: View {
    @EnvironmentObject var library: LibraryStore
    @EnvironmentObject var scripture: ScriptureStore
    @Environment(\.dismiss) private var dismiss
    @StateObject private var client = AIClient()

    @AppStorage("readerTheme") private var themeRaw = ReaderTheme.ivory.rawValue
    @AppStorage("scriptureSize") private var scriptureSize = 19.0
    @AppStorage("lineSpacing") private var lineSpacing = 8.0
    @AppStorage("showVerseNumbers") private var showVerseNumbers = true

    @State private var feedback = ""
    @State private var statusMessage: String?
    @State private var confirmDeleteAI = false
    @State private var confirmDeleteAll = false

    var body: some View {
        NavigationStack {
            Form {
                Section("Reading") {
                    Picker("Theme", selection: $themeRaw) {
                        ForEach(ReaderTheme.allCases) { t in Text(t.label).tag(t.rawValue) }
                    }
                    VStack(alignment: .leading) {
                        Text("Scripture size").font(.system(size: 13)).foregroundStyle(Brand.stone)
                        Slider(value: $scriptureSize, in: 15...28, step: 1).tint(Brand.hunter)
                    }
                    VStack(alignment: .leading) {
                        Text("Line spacing").font(.system(size: 13)).foregroundStyle(Brand.stone)
                        Slider(value: $lineSpacing, in: 4...16, step: 1).tint(Brand.hunter)
                    }
                    Toggle("Verse numbers", isOn: $showVerseNumbers).tint(Brand.hunter)
                }

                Section {
                    if let url = exportURL() {
                        ShareLink(item: url) {
                            Label("Export my data", systemImage: "square.and.arrow.up")
                        }
                    }
                    Button(role: .destructive) { confirmDeleteAI = true } label: {
                        Label("Delete AI history", systemImage: "trash")
                    }
                    Button(role: .destructive) { confirmDeleteAll = true } label: {
                        Label("Delete all my data", systemImage: "trash.fill")
                    }
                } header: {
                    Text("Privacy")
                } footer: {
                    Text("Reading requires no account. Notes stay on your device and are never used by the study layer without your explicit permission. No ads, no data sales.")
                }

                Section("Feedback (private beta)") {
                    TextField("What's working? What isn't?", text: $feedback, axis: .vertical)
                    Button("Send feedback") {
                        Task {
                            try? await client.sendFeedback(feedback)
                            feedback = ""
                            statusMessage = "Thank you — received."
                        }
                    }
                    .disabled(feedback.trimmingCharacters(in: .whitespaces).isEmpty)
                    .tint(Brand.hunter)
                }

                if let statusMessage {
                    Section { Text(statusMessage).foregroundStyle(Brand.hunter) }
                }

                Section("About") {
                    LabeledContent("Translation", value: scripture.index.translation)
                    LabeledContent("Attribution", value: scripture.index.copyright)
                    LabeledContent("Version", value: "0.1.0 (private beta)")
                }
            }
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar { Button("Done") { dismiss() } }
            .confirmationDialog("Delete AI history?", isPresented: $confirmDeleteAI, titleVisibility: .visible) {
                Button("Delete AI history", role: .destructive) {
                    Task {
                        try? await client.deleteAIHistory()
                        library.deleteAIHistory()
                        statusMessage = "AI history deleted (device and server)."
                    }
                }
            } message: {
                Text("Removes saved explanations from this device and all AI artifacts stored for this device on the server.")
            }
            .confirmationDialog("Delete ALL data?", isPresented: $confirmDeleteAll, titleVisibility: .visible) {
                Button("Delete everything", role: .destructive) {
                    Task {
                        try? await client.deleteAIHistory()
                        library.deleteAll()
                        statusMessage = "All data deleted."
                    }
                }
            } message: {
                Text("Removes highlights, notes, bookmarks, cards, studies, and AI history. This cannot be undone.")
            }
        }
    }

    /// Writes the user's data export to a temp file for the share sheet.
    private func exportURL() -> URL? {
        guard let data = library.exportJSON() else { return nil }
        let url = FileManager.default.temporaryDirectory.appendingPathComponent("versefold-export.json")
        try? data.write(to: url, options: .atomic)
        return url
    }
}
