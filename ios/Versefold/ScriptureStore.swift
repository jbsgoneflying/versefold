import Foundation

/// Loads the bundled public-domain KJV (offline, instant) and provides
/// chapter access, search, and last-read position. This store is the app's
/// only source of Scripture text — AI responses never carry verse text.
@MainActor
final class ScriptureStore: ObservableObject {
    @Published private(set) var index: BibleIndex
    @Published var location: ReadingLocation {
        didSet { Self.persistLocation(location) }
    }
    /// Transient: verse to scroll to + flash after a search/reference jump.
    @Published var jumpVerse: Int?
    /// Search state survives closing the sheet, so returning resumes the search.
    @Published var searchQuery = ""
    /// Reading translation. KJV renders from the offline bundle; NIV/AMP come
    /// through the backend proxy (display right only — see translation-rights.md).
    @Published var translation: String {
        didSet { UserDefaults.standard.set(translation, forKey: "readingTranslation") }
    }
    /// Session-only cache of licensed chapters, keyed "niv:DEU.28". Never
    /// written to disk: NIV/AMP rights allow display but not offline storage.
    @Published private(set) var remoteChapters: [String: RemoteChapter] = [:]
    @Published private(set) var remoteLoading = false
    @Published private(set) var remoteError: String?

    /// A breadcrumb back to the study a reading was opened from. Deliberately
    /// transient: it survives only the jump itself — any further navigation
    /// (swipe, book picker, search) clears it, so it never lingers.
    struct StudyReturn: Equatable {
        let planId: UUID
        let title: String
        let day: Int
    }
    @Published var studyReturn: StudyReturn?
    private var studyJumpInFlight = false

    func markStudyJump(_ ret: StudyReturn) {
        studyReturn = ret
        studyJumpInFlight = true
    }

    /// The reader calls this on every location change: the change caused by
    /// the study jump keeps the breadcrumb; any later one dissolves it.
    func noteLocationChanged() {
        if studyJumpInFlight {
            studyJumpInFlight = false
        } else {
            studyReturn = nil
        }
    }

    private var bookCache: [String: BibleBook] = [:]

    init() {
        self.index = Self.loadIndex()
        self.location = Self.loadLocation()
        self.translation = UserDefaults.standard.string(forKey: "readingTranslation") ?? "kjv"
    }

    var attribution: String { "\(index.translation) — \(index.copyright)" }

    // MARK: Translations

    struct TranslationOption: Identifiable {
        let key: String
        let abbreviation: String
        let name: String
        var id: String { key }
    }

    static let translationOptions: [TranslationOption] = [
        TranslationOption(key: "kjv", abbreviation: "KJV", name: "King James Version"),
        TranslationOption(key: "niv", abbreviation: "NIV", name: "New International Version"),
        TranslationOption(key: "amp", abbreviation: "AMP", name: "Amplified Bible"),
    ]

    var translationAbbreviation: String {
        Self.translationOptions.first { $0.key == translation }?.abbreviation ?? translation.uppercased()
    }

    struct RemoteChapter: Codable {
        let translation: String
        let reference: String
        let copyright: String
        let verses: [BibleVerse]
    }

    static func remoteKey(_ translation: String, _ osis: String, _ chapter: Int) -> String {
        "\(translation):\(osis).\(chapter)"
    }

    func cachedRemoteChapter(translation: String, osis: String, chapter: Int) -> RemoteChapter? {
        remoteChapters[Self.remoteKey(translation, osis, chapter)]
    }

    /// Fetch a licensed chapter through the backend if it isn't already in the
    /// session cache. Flipping back to an already-seen translation is instant.
    func loadRemoteChapter(translation: String, osis: String, chapter: Int) async {
        let key = Self.remoteKey(translation, osis, chapter)
        guard remoteChapters[key] == nil else { return }
        remoteLoading = true
        remoteError = nil
        defer { remoteLoading = false }
        do {
            var req = URLRequest(url: AIClient.baseURL
                .appendingPathComponent("v1/scripture/\(translation)/chapter/\(osis)/\(chapter)"))
            req.timeoutInterval = 20
            let (data, response) = try await URLSession.shared.data(for: req)
            guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
                throw URLError(.badServerResponse)
            }
            struct Envelope: Codable { let chapter: RemoteChapter }
            remoteChapters[key] = try JSONDecoder().decode(Envelope.self, from: data).chapter
        } catch {
            remoteError = "This translation needs a connection. KJV is always available offline."
        }
    }

    func meta(for osis: String) -> BookMeta? {
        index.books.first { $0.osis == osis }
    }

    func book(_ osis: String) -> BibleBook? {
        if let cached = bookCache[osis] { return cached }
        guard let url = Bundle.main.url(forResource: osis, withExtension: "json", subdirectory: "kjv"),
              let data = try? Data(contentsOf: url),
              let book = try? JSONDecoder().decode(BibleBook.self, from: data)
        else { return nil }
        bookCache[osis] = book
        return book
    }

    func chapter(osis: String, number: Int) -> BibleChapter? {
        guard let book = book(osis) else { return nil }
        return book.chapters.first { $0.chapter == number }
    }

    // MARK: Navigation

    func goToNextChapter() {
        guard let meta = meta(for: location.osis) else { return }
        if location.chapter < meta.chapters {
            location.chapter += 1
        } else if let idx = index.books.firstIndex(where: { $0.osis == location.osis }),
                  idx + 1 < index.books.count {
            location = ReadingLocation(osis: index.books[idx + 1].osis, chapter: 1)
        }
    }

    func goToPreviousChapter() {
        if location.chapter > 1 {
            location.chapter -= 1
        } else if let idx = index.books.firstIndex(where: { $0.osis == location.osis }), idx > 0 {
            let prev = index.books[idx - 1]
            location = ReadingLocation(osis: prev.osis, chapter: prev.chapters)
        }
    }

    // MARK: Search (keyword + reference jump)

    struct SearchHit: Identifiable {
        let id = UUID()
        let osis: String
        let bookName: String
        let chapter: Int
        let verse: Int
        let text: String
    }

    /// Reference like "John 3:16" / "john 3" → location, else nil.
    func parseReference(_ query: String) -> (ReadingLocation, Int?)? {
        let trimmed = query.trimmingCharacters(in: .whitespaces)
        let pattern = "^([1-3]?\\s?[A-Za-z ]+?)\\s+(\\d{1,3})(?::(\\d{1,3}))?$"
        guard let regex = try? NSRegularExpression(pattern: pattern),
              let match = regex.firstMatch(in: trimmed, range: NSRange(trimmed.startIndex..., in: trimmed))
        else { return nil }

        func group(_ i: Int) -> String? {
            guard let range = Range(match.range(at: i), in: trimmed) else { return nil }
            return String(trimmed[range])
        }

        guard let bookRaw = group(1), let chapterRaw = group(2) else { return nil }
        let bookQuery = bookRaw.lowercased().replacingOccurrences(of: " ", with: "")
        guard let book = index.books.first(where: {
            $0.name.lowercased().replacingOccurrences(of: " ", with: "").hasPrefix(bookQuery)
        }) else { return nil }
        let chapter = min(max(1, Int(chapterRaw) ?? 1), book.chapters)
        let verse = group(3).flatMap { Int($0) }
        return (ReadingLocation(osis: book.osis, chapter: chapter), verse)
    }

    func search(_ query: String, limit: Int = 60) -> [SearchHit] {
        let needle = query.trimmingCharacters(in: .whitespaces).lowercased()
        guard needle.count >= 3 else { return [] }
        var hits: [SearchHit] = []
        for metaBook in index.books {
            guard let book = book(metaBook.osis) else { continue }
            for chapter in book.chapters {
                for verse in chapter.verses where verse.t.lowercased().contains(needle) {
                    hits.append(SearchHit(
                        osis: book.osis, bookName: book.name,
                        chapter: chapter.chapter, verse: verse.v, text: verse.t
                    ))
                    if hits.count >= limit { return hits }
                }
            }
        }
        return hits
    }

    /// Resolve an OSIS ref like "PSA.27.1" to a hit with local bundle text.
    func hit(forRef ref: String) -> SearchHit? {
        let parts = ref.split(separator: ".")
        guard parts.count == 3,
              let chapterNum = Int(parts[1]), let verseNum = Int(parts[2]),
              let book = book(String(parts[0])),
              let chapter = book.chapters.first(where: { $0.chapter == chapterNum }),
              let verse = chapter.verses.first(where: { $0.v == verseNum })
        else { return nil }
        return SearchHit(osis: book.osis, bookName: book.name,
                         chapter: chapterNum, verse: verseNum, text: verse.t)
    }

    // MARK: Persistence

    private static func loadIndex() -> BibleIndex {
        guard let url = Bundle.main.url(forResource: "index", withExtension: "json", subdirectory: "kjv"),
              let data = try? Data(contentsOf: url),
              let index = try? JSONDecoder().decode(BibleIndex.self, from: data)
        else {
            return BibleIndex(translation: "KJV", copyright: "Public Domain", books: [])
        }
        return index
    }

    private static func loadLocation() -> ReadingLocation {
        guard let data = UserDefaults.standard.data(forKey: "readingLocation"),
              let loc = try? JSONDecoder().decode(ReadingLocation.self, from: data)
        else { return .default }
        return loc
    }

    private static func persistLocation(_ loc: ReadingLocation) {
        if let data = try? JSONEncoder().encode(loc) {
            UserDefaults.standard.set(data, forKey: "readingLocation")
        }
    }
}
