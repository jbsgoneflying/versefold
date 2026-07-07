import SwiftUI

/// Margin notes: a hand-drawn asterisk sits in the page gutter beside any
/// verse that carries a note — like the mark you'd pen in a paper Bible.
/// Notes anchor to the verse number, so the mark shows in every translation.
/// Tapping it opens the verse's notes for reading and editing in place;
/// closing the sheet lands you exactly where you were reading.

// MARK: - The margin mark

/// A loose, hand-penned asterisk: three short strokes crossing at slightly
/// wrong angles, seeded per verse so the ink never jitters between renders.
struct MarginNoteMark: View {
    let seed: Int
    let color: Color

    var body: some View {
        Canvas { context, size in
            let center = CGPoint(x: size.width / 2, y: size.height / 2)
            let radius = min(size.width, size.height) * 0.42

            func wobble(_ salt: Int) -> CGFloat {
                let x = sin(Double(seed &* 131 &+ salt &* 97) * 12.9898) * 43758.5453
                return CGFloat(x - x.rounded(.down)) - 0.5
            }

            for stroke in 0..<3 {
                let angle = CGFloat(stroke) * .pi / 3 + wobble(stroke * 5 + 1) * 0.22
                let dx = cos(angle) * radius
                let dy = sin(angle) * radius
                var path = Path()
                path.move(to: CGPoint(
                    x: center.x - dx + wobble(stroke * 5 + 2) * 1.4,
                    y: center.y - dy + wobble(stroke * 5 + 3) * 1.4
                ))
                path.addQuadCurve(
                    to: CGPoint(
                        x: center.x + dx + wobble(stroke * 5 + 4) * 1.4,
                        y: center.y + dy + wobble(stroke * 5 + 5) * 1.4
                    ),
                    control: CGPoint(
                        x: center.x + wobble(stroke * 7 + 6) * 2.4,
                        y: center.y + wobble(stroke * 7 + 7) * 2.4
                    )
                )
                context.stroke(
                    path,
                    with: .color(color),
                    style: StrokeStyle(lineWidth: 1.3, lineCap: .round)
                )
            }
        }
    }
}

// MARK: - The verse's notes page

/// Every note on one verse: edit in place, add another, delete. Saving
/// happens on Done; an emptied note is removed rather than kept blank.
struct VerseNotesView: View {
    @EnvironmentObject var library: LibraryStore
    @Environment(\.dismiss) private var dismiss

    let selection: VerseSelection

    @State private var drafts: [UUID: String] = [:]
    @State private var newDraft = ""

    private var notes: [Note] {
        library.verseNotes(osis: selection.osis, chapter: selection.chapter,
                           verse: selection.verses.lowerBound)
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    ForEach(notes) { note in
                        noteCard(note)
                    }

                    VStack(alignment: .leading, spacing: 6) {
                        Text(notes.isEmpty ? "New note" : "Add another")
                            .font(.system(size: 12, weight: .semibold))
                            .textCase(.uppercase).kerning(0.8)
                            .foregroundStyle(Brand.stone)
                        editor(text: $newDraft)
                    }

                    Text("Notes are private and stay on your device. They are never shared or used by the study layer without your explicit permission.")
                        .font(.system(size: 12)).foregroundStyle(Brand.stone)
                }
                .padding()
            }
            .background(Brand.ivory.ignoresSafeArea())
            .navigationTitle(selection.reference)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") {
                        saveAll()
                        dismiss()
                    }
                }
            }
        }
    }

    private func noteCard(_ note: Note) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text(note.createdAt, style: .date)
                    .font(.system(size: 11)).foregroundStyle(Brand.stone)
                Spacer()
                Button {
                    drafts[note.id] = nil
                    library.removeNote(note.id)
                } label: {
                    Image(systemName: "trash")
                        .font(.system(size: 13))
                        .foregroundStyle(Brand.stone)
                }
                .accessibilityLabel("Delete note")
            }
            editor(text: Binding(
                get: { drafts[note.id] ?? note.text },
                set: { drafts[note.id] = $0 }
            ))
        }
    }

    private func editor(text: Binding<String>) -> some View {
        TextEditor(text: text)
            .font(.system(size: 16))
            .frame(minHeight: 90)
            .padding(8)
            .scrollContentBackground(.hidden)
            .background(RoundedRectangle(cornerRadius: 12).fill(Brand.paper))
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .strokeBorder(Brand.stone.opacity(0.25), lineWidth: 1)
            )
    }

    private func saveAll() {
        for (id, text) in drafts {
            let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
            if trimmed.isEmpty {
                library.removeNote(id)
            } else {
                library.updateNote(id, text: trimmed)
            }
        }
        let fresh = newDraft.trimmingCharacters(in: .whitespacesAndNewlines)
        if !fresh.isEmpty {
            library.addNote(for: selection, text: fresh)
        }
    }
}
