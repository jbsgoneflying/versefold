import SwiftUI

/// "Unfold" — the passage explanation experience. Scripture (from the app's
/// own source) is always shown above the AI layer; AI blocks are labeled by
/// kind and never styled like Scripture. Every answer carries a Basis section.
struct UnfoldView: View {
    @EnvironmentObject var library: LibraryStore
    @Environment(\.dismiss) private var dismiss
    @StateObject private var client = AIClient()

    let selection: VerseSelection
    /// nil = plain Unfold; non-nil = "Ask about this passage" with a question field.
    let initialQuestion: String?

    /// Unfold always answers through the deeper-study lens — one voice,
    /// no mode picking.
    private let lens = "for_deeper_study"

    @State private var question = ""
    @State private var response: ExplainResponse?
    @State private var loading = false
    @State private var errorMessage: String?

    private var isAskMode: Bool { initialQuestion != nil }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    scriptureHeader
                    if isAskMode { questionField }
                    if loading { loadingView }
                    if let errorMessage { errorView(errorMessage) }
                    if let response { explanationView(response) }
                }
                .padding(20)
            }
            .background(Brand.ivory.ignoresSafeArea())
            .navigationTitle(isAskMode ? "Ask" : "Unfold")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Close") { dismiss() } }
            }
            .task { if !isAskMode { await load() } }
        }
    }

    // MARK: Scripture (exact source text, visually distinct from AI)

    private var scriptureHeader: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(selection.reference + " · KJV")
                .font(.system(size: 12, weight: .semibold)).textCase(.uppercase).kerning(1)
                .foregroundStyle(Brand.hunter)
            if let text = response?.passage.text {
                Text(text)
                    .font(.scripture(size: 18))
                    .foregroundStyle(Brand.ink)
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(RoundedRectangle(cornerRadius: 14).fill(Brand.paper))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(Brand.stone.opacity(0.25)))
    }

    private var questionField: some View {
        HStack(spacing: 10) {
            TextField("Ask about this passage…", text: $question, axis: .vertical)
                .font(.system(size: 15))
                .padding(12)
                .background(RoundedRectangle(cornerRadius: 12).fill(Brand.paper))
            Button {
                Task { await load() }
            } label: {
                Image(systemName: "arrow.up.circle.fill").font(.system(size: 28)).foregroundStyle(Brand.hunter)
            }
            .disabled(question.trimmingCharacters(in: .whitespaces).isEmpty || loading)
            .accessibilityLabel("Ask")
        }
    }

    // MARK: AI layer (labeled, sourced, separate)

    private func explanationView(_ res: ExplainResponse) -> some View {
        VStack(alignment: .leading, spacing: 16) {
            Text(res.explanation.summary)
                .font(.system(size: 16, weight: .medium))
                .foregroundStyle(Brand.ink)

            ForEach(res.explanation.blocks) { block in
                VStack(alignment: .leading, spacing: 4) {
                    HStack(spacing: 6) {
                        Text(block.kindLabel)
                            .font(.system(size: 11, weight: .semibold)).textCase(.uppercase).kerning(0.8)
                            .foregroundStyle(Brand.stone)
                        if block.disputed {
                            Text("Interpretations differ")
                                .font(.system(size: 10, weight: .medium))
                                .padding(.horizontal, 6).padding(.vertical, 2)
                                .background(Capsule().fill(Brand.parchment))
                                .foregroundStyle(Brand.ink.opacity(0.7))
                        }
                    }
                    Text(block.text).font(.system(size: 15)).foregroundStyle(Brand.ink.opacity(0.85))
                }
            }

            basisView(res)

            HStack {
                Button {
                    Task { await save(res) }
                } label: {
                    Label("Save to Library", systemImage: "books.vertical")
                        .font(.system(size: 14, weight: .semibold))
                }
                .buttonStyle(.borderedProminent)
                .tint(Brand.hunter)
                Spacer()
                Text("AI-assisted · \(res.modelVersion)")
                    .font(.system(size: 10)).foregroundStyle(Brand.stone)
            }
            .padding(.top, 4)
        }
    }

    private func basisView(_ res: ExplainResponse) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("Basis")
                .font(.system(size: 11, weight: .semibold)).textCase(.uppercase).kerning(1)
                .foregroundStyle(Brand.hunter)
            Text(res.basis.references.map(readableRef).joined(separator: " · "))
                .font(.system(size: 13)).foregroundStyle(Brand.ink.opacity(0.7))
            Text("This explanation is AI-assisted commentary, not Scripture. References were verified against the \(res.passage.translation) text.")
                .font(.system(size: 11)).foregroundStyle(Brand.stone)
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(RoundedRectangle(cornerRadius: 12).fill(Brand.parchment.opacity(0.5)))
    }

    private var loadingView: some View {
        HStack(spacing: 10) {
            ProgressView().tint(Brand.hunter)
            Text("Unfolding…").font(.system(size: 14)).foregroundStyle(Brand.stone)
        }
        .frame(maxWidth: .infinity, alignment: .center)
        .padding(.vertical, 30)
    }

    private func errorView(_ message: String) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(message).font(.system(size: 14)).foregroundStyle(Brand.ink.opacity(0.8))
            Button("Try again") { Task { await load() } }
                .font(.system(size: 14, weight: .semibold)).tint(Brand.hunter)
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(RoundedRectangle(cornerRadius: 12).fill(Brand.parchment.opacity(0.6)))
    }

    // MARK: Actions

    private func load(depth: String = "deeper") async {
        loading = true
        errorMessage = nil
        do {
            response = try await client.explain(
                passageId: selection.passageId,
                lens: lens,
                question: isAskMode && !question.isEmpty ? question : nil,
                depth: depth
            )
        } catch {
            errorMessage = error.localizedDescription
        }
        loading = false
    }

    private func save(_ res: ExplainResponse) async {
        library.addExplanation(SavedExplanation(
            id: UUID(),
            reference: res.passage.reference,
            passageId: res.passage.passageId,
            lens: lens,
            summary: res.explanation.summary,
            blocks: res.explanation.blocks,
            references: res.basis.references,
            promptVersion: res.promptVersion,
            modelVersion: res.modelVersion,
            createdAt: Date()
        ))
        dismiss()
    }

    private func readableRef(_ osis: String) -> String {
        osis.replacingOccurrences(of: ".", with: " ")
    }
}
