import SwiftUI

/// Library: everything the user owns — highlights, notes, bookmarks, saved
/// passages/cards, and saved AI artifacts (kept in their own, labeled section).
struct LibraryView: View {
    @EnvironmentObject var library: LibraryStore
    @EnvironmentObject var scripture: ScriptureStore
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            List {
                if isEmpty {
                    Section {
                        VStack(spacing: 8) {
                            Image(systemName: "books.vertical").font(.system(size: 30)).foregroundStyle(Brand.stone)
                            Text("Your library is empty")
                                .font(.scripture(size: 20)).foregroundStyle(Brand.ink)
                            Text("Highlights, notes, cards, and saved studies will gather here as you read.")
                                .font(.system(size: 13)).foregroundStyle(Brand.stone)
                                .multilineTextAlignment(.center)
                        }
                        .frame(maxWidth: .infinity).padding(.vertical, 30)
                        .listRowBackground(Color.clear)
                    }
                }

                if !library.highlights.isEmpty {
                    Section("Highlights") {
                        ForEach(library.highlights.reversed()) { h in
                            Button { jump(h.osis, h.chapter, verse: h.verseStart) } label: {
                                referenceLabel("\(h.bookName) \(h.chapter):\(refRange(h.verseStart, h.verseEnd))", date: h.createdAt)
                            }
                        }
                        .onDelete { offsets in
                            let items = Array(library.highlights.reversed())
                            for o in offsets { library.removeHighlight(items[o].id) }
                        }
                    }
                }

                if !library.notes.isEmpty {
                    Section("Notes (private)") {
                        ForEach(library.notes.reversed()) { n in
                            Button { jump(n.osis, n.chapter, verse: n.verseStart) } label: {
                                VStack(alignment: .leading, spacing: 4) {
                                    referenceLabel("\(n.bookName) \(n.chapter):\(refRange(n.verseStart, n.verseEnd))", date: n.createdAt)
                                    Text(n.text).font(.system(size: 14)).foregroundStyle(Brand.ink.opacity(0.8)).lineLimit(3)
                                }
                            }
                        }
                        .onDelete { offsets in
                            let items = Array(library.notes.reversed())
                            for o in offsets { library.removeNote(items[o].id) }
                        }
                    }
                }

                if !library.bookmarks.isEmpty {
                    Section("Bookmarks") {
                        ForEach(library.bookmarks.reversed()) { b in
                            Button { jump(b.osis, b.chapter) } label: {
                                referenceLabel("\(b.bookName) \(b.chapter)", date: b.createdAt)
                            }
                        }
                    }
                }

                if !library.cards.isEmpty {
                    Section("Scripture cards") {
                        ForEach(library.cards.reversed()) { card in
                            VStack(alignment: .leading, spacing: 4) {
                                referenceLabel(card.reference, date: card.createdAt)
                                Text("\u{201C}\(card.scriptureText)\u{201D}")
                                    .font(.scripture(size: 14)).foregroundStyle(Brand.ink.opacity(0.85)).lineLimit(2)
                                if let personal = card.personalText {
                                    Text(personal).font(.system(size: 12)).italic()
                                        .foregroundStyle(Brand.stone).lineLimit(2)
                                }
                            }
                        }
                        .onDelete { offsets in
                            let items = Array(library.cards.reversed())
                            for o in offsets { library.removeCard(items[o].id) }
                        }
                    }
                }

                if !library.explanations.isEmpty {
                    Section("Saved explanations (AI-assisted)") {
                        ForEach(library.explanations.reversed()) { e in
                            VStack(alignment: .leading, spacing: 4) {
                                referenceLabel(e.reference, date: e.createdAt)
                                Text(e.summary).font(.system(size: 14)).foregroundStyle(Brand.ink.opacity(0.8)).lineLimit(3)
                                Text("AI-assisted · not Scripture")
                                    .font(.system(size: 10, weight: .semibold)).textCase(.uppercase).kerning(0.8)
                                    .foregroundStyle(Brand.stone)
                            }
                        }
                    }
                }
            }
            .listStyle(.insetGrouped)
            .navigationTitle("Library")
            .toolbar { Button("Done") { dismiss() } }
            .background(Brand.ivory.ignoresSafeArea())
        }
    }

    private var isEmpty: Bool {
        library.highlights.isEmpty && library.notes.isEmpty && library.bookmarks.isEmpty
            && library.cards.isEmpty && library.explanations.isEmpty
    }

    private func referenceLabel(_ text: String, date: Date) -> some View {
        HStack {
            Text(text).font(.system(size: 14, weight: .semibold)).foregroundStyle(Brand.hunter)
            Spacer()
            Text(date, style: .date).font(.system(size: 11)).foregroundStyle(Brand.stone)
        }
    }

    private func refRange(_ start: Int, _ end: Int) -> String {
        start == end ? "\(start)" : "\(start)-\(end)"
    }

    /// Land on the exact verse, centered and briefly flashed (same path as
    /// search jumps), not the top of the chapter.
    private func jump(_ osis: String, _ chapter: Int, verse: Int? = nil) {
        scripture.jumpVerse = verse
        scripture.location = ReadingLocation(osis: osis, chapter: chapter)
        dismiss() // covers the already-on-this-chapter case too
    }
}
