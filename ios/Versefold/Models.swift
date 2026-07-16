import Foundation

// MARK: - Bundled Scripture

struct BibleIndex: Codable {
    let translation: String
    let copyright: String
    let books: [BookMeta]
}

struct BookMeta: Codable, Identifiable, Hashable {
    let osis: String
    let name: String
    let chapters: Int
    var id: String { osis }
}

struct BibleBook: Codable {
    let osis: String
    let name: String
    let chapters: [BibleChapter]
}

struct BibleChapter: Codable {
    let chapter: Int
    let verses: [BibleVerse]
}

struct BibleVerse: Codable, Identifiable, Hashable {
    let v: Int
    let t: String
    var id: Int { v }
}

/// A reading location, persisted as the launch destination.
struct ReadingLocation: Codable, Equatable {
    var osis: String
    var chapter: Int
    static let `default` = ReadingLocation(osis: "JHN", chapter: 1)
}

/// A contiguous verse selection within one chapter.
struct VerseSelection: Equatable {
    var osis: String
    var bookName: String
    var chapter: Int
    var verses: ClosedRange<Int>

    /// OSIS-style passage id, e.g. JHN.3.16 or JHN.3.16-JHN.3.18
    var passageId: String {
        if verses.count == 1 { return "\(osis).\(chapter).\(verses.lowerBound)" }
        return "\(osis).\(chapter).\(verses.lowerBound)-\(osis).\(chapter).\(verses.upperBound)"
    }

    var reference: String {
        if verses.count == 1 { return "\(bookName) \(chapter):\(verses.lowerBound)" }
        return "\(bookName) \(chapter):\(verses.lowerBound)-\(verses.upperBound)"
    }
}

// MARK: - User library (owned, local-first, deletable)

struct Highlight: Codable, Identifiable {
    let id: UUID
    let osis: String
    let bookName: String
    let chapter: Int
    let verseStart: Int
    let verseEnd: Int
    let createdAt: Date

    // Pen marks (optional — nil on all four means a whole-verse highlight;
    // pre-existing saved highlights decode unchanged). Word indices refer to
    // whitespace-split tokens of the verse in `translation`, so marks reflow
    // with text-size changes but stay pinned to the words they were drawn on.
    var wordStart: Int?
    var wordEnd: Int?
    var style: String?        // "marker" | "underline"
    var translation: String?  // translation the mark was drawn in

    var isPenMark: Bool { wordStart != nil && wordEnd != nil }

    var penStyle: PenStyle? {
        guard isPenMark else { return nil }
        return PenStyle(rawValue: style ?? "") ?? .marker
    }
}

enum PenStyle: String, Codable {
    case marker
    case underline
}

struct Note: Codable, Identifiable {
    let id: UUID
    let osis: String
    let bookName: String
    let chapter: Int
    let verseStart: Int
    let verseEnd: Int
    var text: String
    let createdAt: Date
}

struct Bookmark: Codable, Identifiable {
    let id: UUID
    let osis: String
    let bookName: String
    let chapter: Int
    let createdAt: Date
}

/// A saved AI explanation — an AI artifact, stored distinctly from user notes
/// (content categories never blur). Deletable via Settings > Delete AI history.
struct SavedExplanation: Codable, Identifiable {
    let id: UUID
    let reference: String
    let passageId: String
    let lens: String
    let summary: String
    let blocks: [ExplanationBlockDTO]
    let references: [String]
    let promptVersion: String
    let modelVersion: String
    let createdAt: Date
}

struct SavedCard: Codable, Identifiable {
    let id: UUID
    let reference: String
    let scriptureText: String
    let translation: String
    let attribution: String
    var personalText: String?   // user confession/prayer — always separate from Scripture
    var themeName: String
    let createdAt: Date
}

// MARK: - Studies (durable artifacts, never recomputed; no streak fields exist)

struct StudyPlan: Codable, Identifiable {
    let id: UUID
    var title: String
    var description: String
    var days: [StudyDay]
    var state: StudyState
    let createdAt: Date
    var promptVersion: String
    var modelVersion: String
}

enum StudyState: String, Codable {
    case active, paused, completed
}

struct StudyDay: Codable, Identifiable {
    let dayNumber: Int
    var title: String
    var primaryReading: String
    var supportingReadings: [String]
    var context: String
    var centralTheme: String
    var reflectionQuestions: [String]
    var prayerPrompt: String
    var practicalResponse: String?
    var personalNote: String
    var completed: Bool
    var id: Int { dayNumber }
}

// MARK: - AI DTOs (mirror backend schemas; content kinds never blur)

struct ExplainResponse: Codable {
    let passage: PassageDTO
    let explanation: ExplanationDTO
    let basis: BasisDTO
    let grounding: String
    let promptVersion: String
    let modelVersion: String
    let artifactId: String?
}

struct PassageDTO: Codable {
    let passageId: String
    let reference: String
    let text: String
    let copyright: String
    let translation: String
}

struct ExplanationDTO: Codable {
    let summary: String
    let blocks: [ExplanationBlockDTO]
    let references: [String]
}

struct ExplanationBlockDTO: Codable, Identifiable, Hashable {
    let kind: String
    let text: String
    let disputed: Bool
    var id: Int { hashValue }

    var kindLabel: String {
        switch kind {
        case "historical_context": return "Historical context"
        case "interpretation": return "Interpretation"
        case "application": return "Application"
        case "reflection_question": return "Reflection"
        case "prayer_prompt": return "Prayer"
        case "paraphrase": return "Paraphrase"
        case "ai_study_note": return "Study note"
        case "scripture_reference": return "See also"
        default: return kind.replacingOccurrences(of: "_", with: " ").capitalized
        }
    }
}

struct BasisDTO: Codable {
    let references: [String]
    let dropped: [String]
}

/// In-flight unfold content from the SSE stream — display-only; the final
/// validated `ExplainResponse` always replaces it.
struct ExplainPartial: Codable {
    let summary: String?
    let blocks: [ExplanationBlockDTO]?
}

struct StudyGenResponse: Codable {
    let artifactId: String
    let plan: StudyPlanDTO
}

struct StudyJobStart: Codable {
    let jobId: String
    let totalDays: Int
}

struct StudyJobStatus: Codable {
    let jobId: String
    let status: String // "running" | "complete" | "failed"
    let daysReady: Int
    let totalDays: Int
    let artifactId: String?
    let plan: StudyPlanDTO?
    let error: String?
}

struct StudyPlanDTO: Codable {
    let title: String
    let description: String
    let days: [StudyDayDTO]
}

struct StudyDayDTO: Codable {
    let dayNumber: Int
    let title: String
    let primaryReading: String
    let supportingReadings: [String]
    let context: String
    let centralTheme: String
    let reflectionQuestions: [String]
    let prayerPrompt: String
    let practicalResponse: String?
}
