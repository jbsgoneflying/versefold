import Foundation

/// Local-first store for everything the user owns: highlights, notes,
/// bookmarks, cards, and studies. JSON file in Documents for the beta;
/// interface maps onto GRDB/CloudKit for the sync phase. All data is
/// exportable and deletable — it belongs to the user.
@MainActor
final class LibraryStore: ObservableObject {
    @Published private(set) var highlights: [Highlight] = []
    @Published private(set) var notes: [Note] = []
    @Published private(set) var bookmarks: [Bookmark] = []
    @Published private(set) var cards: [SavedCard] = []
    @Published private(set) var studies: [StudyPlan] = []
    @Published private(set) var explanations: [SavedExplanation] = []

    private struct Snapshot: Codable {
        var highlights: [Highlight] = []
        var notes: [Note] = []
        var bookmarks: [Bookmark] = []
        var cards: [SavedCard] = []
        var studies: [StudyPlan] = []
        var explanations: [SavedExplanation] = []
    }

    private static var fileURL: URL {
        FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("versefold-library.json")
    }

    init() { load() }

    // MARK: Highlights

    func addHighlight(for selection: VerseSelection) {
        highlights.append(Highlight(
            id: UUID(), osis: selection.osis, bookName: selection.bookName,
            chapter: selection.chapter,
            verseStart: selection.verses.lowerBound, verseEnd: selection.verses.upperBound,
            createdAt: Date()
        ))
        save()
    }

    func removeHighlight(_ id: UUID) {
        highlights.removeAll { $0.id == id }
        save()
    }

    func isHighlighted(osis: String, chapter: Int, verse: Int) -> Bool {
        highlights.contains {
            $0.osis == osis && $0.chapter == chapter && ($0.verseStart...$0.verseEnd).contains(verse)
        }
    }

    // MARK: Notes

    func addNote(for selection: VerseSelection, text: String) {
        notes.append(Note(
            id: UUID(), osis: selection.osis, bookName: selection.bookName,
            chapter: selection.chapter,
            verseStart: selection.verses.lowerBound, verseEnd: selection.verses.upperBound,
            text: text, createdAt: Date()
        ))
        save()
    }

    func removeNote(_ id: UUID) {
        notes.removeAll { $0.id == id }
        save()
    }

    // MARK: Bookmarks

    func toggleBookmark(osis: String, bookName: String, chapter: Int) {
        if let existing = bookmarks.first(where: { $0.osis == osis && $0.chapter == chapter }) {
            bookmarks.removeAll { $0.id == existing.id }
        } else {
            bookmarks.append(Bookmark(id: UUID(), osis: osis, bookName: bookName, chapter: chapter, createdAt: Date()))
        }
        save()
    }

    func isBookmarked(osis: String, chapter: Int) -> Bool {
        bookmarks.contains { $0.osis == osis && $0.chapter == chapter }
    }

    // MARK: Cards

    func addCard(_ card: SavedCard) {
        cards.append(card)
        save()
    }

    func removeCard(_ id: UUID) {
        cards.removeAll { $0.id == id }
        save()
    }

    // MARK: Studies (pause/resume without penalty; no streak state exists)

    func addStudy(_ plan: StudyPlan) {
        studies.append(plan)
        save()
    }

    func updateStudy(_ plan: StudyPlan) {
        if let idx = studies.firstIndex(where: { $0.id == plan.id }) {
            studies[idx] = plan
            save()
        }
    }

    func removeStudy(_ id: UUID) {
        studies.removeAll { $0.id == id }
        save()
    }

    // MARK: AI artifacts (kept distinct from user-authored notes)

    func addExplanation(_ e: SavedExplanation) {
        explanations.append(e)
        save()
    }

    /// Delete AI history locally (paired with the backend delete).
    func deleteAIHistory() {
        explanations = []
        save()
    }

    // MARK: Privacy: export + delete everything

    func exportJSON() -> Data? {
        let snapshot = Snapshot(
            highlights: highlights, notes: notes, bookmarks: bookmarks,
            cards: cards, studies: studies, explanations: explanations
        )
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        encoder.dateEncodingStrategy = .iso8601
        return try? encoder.encode(snapshot)
    }

    func deleteAll() {
        highlights = []; notes = []; bookmarks = []; cards = []; studies = []; explanations = []
        save()
    }

    // MARK: Persistence

    private func load() {
        guard let data = try? Data(contentsOf: Self.fileURL) else { return }
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        if let snapshot = try? decoder.decode(Snapshot.self, from: data) {
            highlights = snapshot.highlights
            notes = snapshot.notes
            bookmarks = snapshot.bookmarks
            cards = snapshot.cards
            studies = snapshot.studies
            explanations = snapshot.explanations
        }
    }

    private func save() {
        let snapshot = Snapshot(
            highlights: highlights, notes: notes, bookmarks: bookmarks,
            cards: cards, studies: studies, explanations: explanations
        )
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        if let data = try? encoder.encode(snapshot) {
            try? data.write(to: Self.fileURL, options: .atomic)
        }
    }
}
