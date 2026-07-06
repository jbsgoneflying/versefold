import SwiftUI

/// The reader is the app: opens to the last location, no feed, no chrome
/// around Scripture. Tools appear only after the reader selects verses.
struct ReaderView: View {
    @EnvironmentObject var scripture: ScriptureStore
    @EnvironmentObject var library: LibraryStore

    @AppStorage("readerTheme") private var themeRaw = ReaderTheme.ivory.rawValue
    @AppStorage("scriptureSize") private var scriptureSize = 19.0
    @AppStorage("lineSpacing") private var lineSpacing = 8.0
    @AppStorage("showVerseNumbers") private var showVerseNumbers = true
    @AppStorage("focusMode") private var focusMode = false

    @State private var selectedVerses: Set<Int> = []
    @State private var showBookPicker = false
    @State private var showSearch = false
    @State private var showSettings = false
    @State private var showStudies = false
    @State private var showLibrary = false
    @State private var showReturnStudy = false
    @State private var activeSheet: PassageSheet?
    /// Verse briefly emphasized after a search jump; fades back to normal.
    @State private var flashedVerse: Int?

    private var theme: ReaderTheme { ReaderTheme(rawValue: themeRaw) ?? .ivory }

    private var selection: VerseSelection? {
        guard let first = selectedVerses.min(), let last = selectedVerses.max(),
              let meta = scripture.meta(for: scripture.location.osis) else { return nil }
        return VerseSelection(
            osis: meta.osis, bookName: meta.name,
            chapter: scripture.location.chapter, verses: first...last
        )
    }

    var body: some View {
        NavigationStack {
            ZStack {
                theme.background.ignoresSafeArea()
                chapterScroll
            }
            // Selection bar floats over the text: taps keep extending the
            // range (5 then 15 selects 5-15) while actions stay one tap away.
            .overlay(alignment: .bottom) {
                if let selection {
                    selectionBar(selection)
                        .transition(.move(edge: .bottom).combined(with: .opacity))
                } else if let ret = scripture.studyReturn {
                    studyReturnChip(ret)
                        .transition(.move(edge: .bottom).combined(with: .opacity))
                }
            }
            .animation(.spring(duration: 0.3), value: selectedVerses)
            .animation(.spring(duration: 0.3), value: scripture.studyReturn)
            .toolbar { if !focusMode { readerToolbar } }
            .toolbarBackground(theme.background, for: .navigationBar)
            .sheet(isPresented: $showBookPicker) { BookPickerView() }
            .sheet(isPresented: $showSearch) { SearchView(onJump: clearSelection) }
            .sheet(isPresented: $showSettings) { SettingsView() }
            .sheet(isPresented: $showStudies) { StudiesView() }
            .sheet(isPresented: $showLibrary) { LibraryView() }
            .sheet(isPresented: $showReturnStudy) {
                if let ret = scripture.studyReturn {
                    NavigationStack {
                        StudyDetailView(planId: ret.planId)
                            .toolbar { Button("Done") { showReturnStudy = false } }
                    }
                }
            }
            .sheet(item: $activeSheet) { sheet in
                passageSheetView(sheet)
            }
            .onChange(of: scripture.location) {
                clearSelection()
                // The study breadcrumb survives its own jump, then dissolves
                // on any further navigation — it never lingers.
                scripture.noteLocationChanged()
                // Jumping to a passage from a study day or library item
                // returns straight to the Word.
                showStudies = false
                showLibrary = false
                showReturnStudy = false
            }
            .onTapGesture(count: 2) { withAnimation { focusMode.toggle() } }
        }
    }

    // MARK: Chapter body

    private var chapterScroll: some View {
        ScrollViewReader { proxy in
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    header
                        .id("chapterTop")
                    chapterBody
                    chapterFooter
                }
                .padding(.horizontal, 24)
                .padding(.vertical, 16)
            }
            // Licensed translations stream through the backend; the session
            // cache makes flipping back and forth instant after the first look.
            .task(id: "\(scripture.translation)|\(scripture.location.osis).\(scripture.location.chapter)") {
                guard scripture.translation != "kjv" else { return }
                await scripture.loadRemoteChapter(
                    translation: scripture.translation,
                    osis: scripture.location.osis,
                    chapter: scripture.location.chapter
                )
            }
            .gesture(
                DragGesture(minimumDistance: 60).onEnded { value in
                    if value.translation.width < -60 { scripture.goToNextChapter() }
                    if value.translation.width > 60 { scripture.goToPreviousChapter() }
                }
            )
            // A new book/chapter always starts at verse 1, not the previous
            // scroll offset — unless a search jump is targeting a verse.
            .onChange(of: scripture.location) {
                if scripture.jumpVerse == nil {
                    proxy.scrollTo("chapterTop", anchor: .top)
                }
            }
            // Search/reference jump: scroll to the verse and flash it briefly.
            .onChange(of: scripture.jumpVerse) {
                guard let target = scripture.jumpVerse else { return }
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) {
                    withAnimation(.easeInOut(duration: 0.45)) {
                        proxy.scrollTo(target, anchor: .center)
                        flashedVerse = target
                    }
                    scripture.jumpVerse = nil
                    DispatchQueue.main.asyncAfter(deadline: .now() + 1.8) {
                        withAnimation(.easeOut(duration: 0.9)) { flashedVerse = nil }
                    }
                }
            }
        }
    }

    /// Verses for the current location in the reading translation:
    /// KJV from the offline bundle, NIV/AMP from the session cache.
    private var displayedVerses: [BibleVerse]? {
        if scripture.translation == "kjv" {
            return scripture.chapter(osis: scripture.location.osis, number: scripture.location.chapter)?.verses
        }
        return scripture.cachedRemoteChapter(
            translation: scripture.translation,
            osis: scripture.location.osis,
            chapter: scripture.location.chapter
        )?.verses
    }

    @ViewBuilder
    private var chapterBody: some View {
        if let verses = displayedVerses {
            versesView(verses)
        } else if scripture.translation != "kjv" && scripture.remoteLoading {
            HStack(spacing: 10) {
                ProgressView().controlSize(.small)
                Text("Opening \(scripture.translationAbbreviation)\u{2026}")
                    .font(.system(size: 14)).foregroundStyle(theme.meta)
            }
            .padding(.top, 12)
        } else if scripture.translation != "kjv", let error = scripture.remoteError {
            VStack(alignment: .leading, spacing: 10) {
                Text(error).font(.system(size: 14)).foregroundStyle(theme.meta)
                Button("Switch to KJV") { scripture.translation = "kjv" }
                    .font(.system(size: 14, weight: .medium)).tint(Brand.hunter)
            }
            .padding(.top, 12)
        } else {
            Text("Passage unavailable.").foregroundStyle(theme.meta)
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 4) {
            if let meta = scripture.meta(for: scripture.location.osis) {
                Text(meta.name)
                    .font(.scripture(size: 30)).fontWeight(.semibold)
                    .foregroundStyle(theme.text)
                Text("Chapter \(scripture.location.chapter)")
                    .font(.system(size: 13, weight: .medium))
                    .textCase(.uppercase).kerning(1.2)
                    .foregroundStyle(theme.meta)
            }
        }
        .padding(.top, 8)
        .accessibilityElement(children: .combine)
    }

    private func versesView(_ verses: [BibleVerse]) -> some View {
        VStack(alignment: .leading, spacing: CGFloat(lineSpacing)) {
            ForEach(verses) { verse in
                verseRow(verse)
                    .id(verse.v)
            }
        }
    }

    private func verseRow(_ verse: BibleVerse) -> some View {
        let isSelected = selectedVerses.contains(verse.v)
        let isFlashed = flashedVerse == verse.v
        let isHighlighted = library.isHighlighted(
            osis: scripture.location.osis, chapter: scripture.location.chapter, verse: verse.v
        )
        return (
            Text(showVerseNumbers ? "\(verse.v) " : "")
                .font(.system(size: max(11, scriptureSize * 0.55)))
                .foregroundStyle(theme.meta)
                .baselineOffset(4)
            + Text(verse.t)
                .font(.scripture(size: scriptureSize))
                .foregroundStyle(theme.text)
        )
        .lineSpacing(CGFloat(lineSpacing))
        .padding(.horizontal, 6)
        .padding(.vertical, 2)
        .background(
            RoundedRectangle(cornerRadius: 6)
                .fill(isFlashed
                      ? Brand.hunter.opacity(0.22)
                      : isSelected
                      ? Brand.hunter.opacity(0.14)
                      : isHighlighted ? Brand.parchment.opacity(theme == .ivory ? 1.0 : 0.25) : .clear)
        )
        .contentShape(Rectangle())
        .onTapGesture { toggleVerse(verse.v) }
        .accessibilityLabel("Verse \(verse.v). \(verse.t)")
        .accessibilityAddTraits(isSelected ? .isSelected : [])
    }

    private var chapterFooter: some View {
        VStack(alignment: .leading, spacing: 12) {
            Divider().overlay(theme.meta.opacity(0.3))
            Text(displayedAttribution)
                .font(.system(size: 12))
                .foregroundStyle(theme.meta)
        }
        .padding(.top, 24)
        .padding(.bottom, 60)
    }

    /// Licensed translations must carry the publisher's copyright line.
    private var displayedAttribution: String {
        if scripture.translation == "kjv" { return scripture.attribution }
        let remote = scripture.cachedRemoteChapter(
            translation: scripture.translation,
            osis: scripture.location.osis,
            chapter: scripture.location.chapter
        )
        if let copyright = remote?.copyright, !copyright.isEmpty {
            return "\(scripture.translationAbbreviation) — \(copyright)"
        }
        return scripture.translationAbbreviation
    }

    // MARK: Toolbar + selection

    @ToolbarContentBuilder
    private var readerToolbar: some ToolbarContent {
        ToolbarItem(placement: .topBarLeading) {
            Button { showBookPicker = true } label: {
                HStack(spacing: 4) {
                    Text(scripture.meta(for: scripture.location.osis)?.name ?? "")
                    Text("\(scripture.location.chapter)")
                    Image(systemName: "chevron.down").font(.system(size: 10))
                }
                .font(.system(size: 15, weight: .medium))
                .foregroundStyle(theme.text)
            }
            .accessibilityLabel("Choose book and chapter")
        }
        ToolbarItemGroup(placement: .topBarTrailing) {
            // Translation flip: swaps the text in place — location, selection
            // targets, and scroll anchors all stay put.
            Menu {
                ForEach(ScriptureStore.translationOptions) { option in
                    Button {
                        scripture.translation = option.key
                    } label: {
                        if scripture.translation == option.key {
                            Label("\(option.abbreviation) — \(option.name)", systemImage: "checkmark")
                        } else {
                            Text("\(option.abbreviation) — \(option.name)")
                        }
                    }
                }
            } label: {
                Text(scripture.translationAbbreviation)
                    .font(.system(size: 13, weight: .semibold))
                    .kerning(0.5)
                    .foregroundStyle(theme.text)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Capsule().stroke(theme.meta.opacity(0.45), lineWidth: 1))
            }
            .accessibilityLabel("Choose translation, currently \(scripture.translationAbbreviation)")
            Button { showSearch = true } label: { Image(systemName: "magnifyingglass") }
                .tint(theme.meta)
                .accessibilityLabel("Search")
            // Everything that isn't the Word lives behind this one menu —
            // no tab bar below Scripture.
            Menu {
                Button { showStudies = true } label: {
                    Label("Studies", systemImage: "list.bullet.rectangle")
                }
                Button { showLibrary = true } label: {
                    Label("Library", systemImage: "books.vertical")
                }
                Divider()
                Button { showSettings = true } label: {
                    Label("Settings", systemImage: "gearshape")
                }
            } label: {
                Image(systemName: "line.3.horizontal")
            }
            .tint(theme.meta)
            .accessibilityLabel("Studies, Library, and Settings")
        }
    }

    private func toggleVerse(_ v: Int) {
        if selectedVerses.contains(v) {
            // Tapping an end verse trims the range; tapping the only verse clears.
            selectedVerses.remove(v)
            if let lo = selectedVerses.min(), let hi = selectedVerses.max() {
                selectedVerses = Set(lo...hi)
            }
        } else {
            selectedVerses.insert(v)
            // Keep selection contiguous: fill any gap.
            if let lo = selectedVerses.min(), let hi = selectedVerses.max() {
                selectedVerses = Set(lo...hi)
            }
        }
    }

    // MARK: Study return chip (transient breadcrumb)

    private func studyReturnChip(_ ret: ScriptureStore.StudyReturn) -> some View {
        HStack(spacing: 10) {
            Button {
                showReturnStudy = true
            } label: {
                HStack(spacing: 8) {
                    Image(systemName: "arrow.uturn.backward")
                        .font(.system(size: 12, weight: .semibold))
                    Text("Back to study \u{00B7} Day \(ret.day)")
                        .font(.system(size: 13, weight: .semibold))
                        .lineLimit(1)
                }
                .foregroundStyle(Brand.hunter)
            }
            Button {
                scripture.studyReturn = nil
            } label: {
                Image(systemName: "xmark.circle.fill")
                    .font(.system(size: 15))
                    .foregroundStyle(theme.meta.opacity(0.7))
            }
            .accessibilityLabel("Dismiss")
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 9)
        .background(
            Capsule()
                .fill(.regularMaterial)
                .shadow(color: .black.opacity(0.12), radius: 10, y: 3)
        )
        .padding(.bottom, 10)
    }

    // MARK: Floating selection bar

    private func selectionBar(_ selection: VerseSelection) -> some View {
        HStack(spacing: 4) {
            VStack(alignment: .leading, spacing: 1) {
                Text(selection.reference)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(theme.text)
                    .lineLimit(1)
                if selection.verses.count > 1 {
                    Text("\(selection.verses.count) verses")
                        .font(.system(size: 11)).foregroundStyle(theme.meta)
                }
            }
            .layoutPriority(1)
            Spacer(minLength: 10)
            Button("Unfold") { activeSheet = .unfold(selection) }
                .font(.system(size: 14, weight: .semibold))
                .tint(Brand.hunter)
            Button("Compare") { activeSheet = .compare(selection) }
                .font(.system(size: 14, weight: .medium))
                .tint(Brand.hunter)
                .padding(.leading, 8)
            // Anchored menu — quieter than a full-screen dialog and consistent
            // with the translation picker.
            Menu {
                Button { activeSheet = .note(selection) } label: {
                    Label("Add note", systemImage: "square.and.pencil")
                }
                Button {
                    library.addHighlight(for: selection)
                    clearSelection()
                } label: {
                    Label("Highlight", systemImage: "highlighter")
                }
                Button { activeSheet = .card(selection) } label: {
                    Label("Confession card", systemImage: "rectangle.portrait.on.rectangle.portrait")
                }
                Button { activeSheet = .study(selection) } label: {
                    Label("Create study", systemImage: "list.bullet.rectangle")
                }
                Button { activeSheet = .ask(selection) } label: {
                    Label("Ask about this passage", systemImage: "questionmark.bubble")
                }
                Divider()
                Button {
                    UIPasteboard.general.string = passageText(for: selection)
                    clearSelection()
                } label: {
                    Label("Copy", systemImage: "doc.on.doc")
                }
            } label: {
                Image(systemName: "ellipsis.circle").font(.system(size: 17))
            }
            .tint(theme.meta)
            .padding(.leading, 6)
            .accessibilityLabel("More passage actions")
            Button { clearSelection() } label: {
                Image(systemName: "xmark.circle.fill").font(.system(size: 17))
            }
            .tint(theme.meta.opacity(0.7))
            .padding(.leading, 2)
            .accessibilityLabel("Clear selection")
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
        .background(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .fill(.regularMaterial)
                .shadow(color: .black.opacity(0.12), radius: 12, y: 4)
        )
        .padding(.horizontal, 14)
        .padding(.bottom, 10)
    }

    private func clearSelection() {
        selectedVerses = []
    }

    private func passageText(for selection: VerseSelection) -> String {
        // Copy respects the reading translation (passageExport is granted for
        // all configured translations) and carries its abbreviation.
        let verses = (displayedVerses ?? [])
            .filter { selection.verses.contains($0.v) }
            .map(\.t).joined(separator: " ")
        return "\u{201C}\(verses)\u{201D} — \(selection.reference) (\(scripture.translationAbbreviation))"
    }

    @ViewBuilder
    private func passageSheetView(_ sheet: PassageSheet) -> some View {
        switch sheet {
        case .unfold(let sel): UnfoldView(selection: sel, initialQuestion: nil)
        case .ask(let sel): UnfoldView(selection: sel, initialQuestion: "")
        case .note(let sel): NoteEditorView(selection: sel) { clearSelection() }
        case .study(let sel): StudyBuilderView(prefill: sel)
        case .card(let sel): CardComposerView(selection: sel, scriptureText: passageBareText(for: sel))
        case .compare(let sel): CompareView(selection: sel)
        }
    }

    /// Cards always render KJV text: cardExport is a public-domain-only right,
    /// so this stays on the bundle regardless of the reading translation.
    private func passageBareText(for selection: VerseSelection) -> String {
        guard let chapter = scripture.chapter(osis: selection.osis, number: selection.chapter) else { return "" }
        return chapter.verses.filter { selection.verses.contains($0.v) }.map(\.t).joined(separator: " ")
    }
}

enum PassageSheet: Identifiable {
    case unfold(VerseSelection), ask(VerseSelection), note(VerseSelection), study(VerseSelection),
         card(VerseSelection), compare(VerseSelection)
    var id: String {
        switch self {
        case .unfold(let s): return "unfold-\(s.passageId)"
        case .ask(let s): return "ask-\(s.passageId)"
        case .note(let s): return "note-\(s.passageId)"
        case .study(let s): return "study-\(s.passageId)"
        case .card(let s): return "card-\(s.passageId)"
        case .compare(let s): return "compare-\(s.passageId)"
        }
    }
}

// MARK: - Compare translations

/// The same selection shown side by side in every available translation —
/// KJV from the bundle, NIV/AMP through the backend. Fetches land in the
/// session cache, so a subsequent reader flip is instant too.
struct CompareView: View {
    @EnvironmentObject var scripture: ScriptureStore
    @Environment(\.dismiss) private var dismiss
    let selection: VerseSelection

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    ForEach(ScriptureStore.translationOptions) { option in
                        translationSection(option)
                    }
                }
                .padding(20)
            }
            .background(Brand.ivory.opacity(0.4))
            .navigationTitle(selection.reference)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar { Button("Done") { dismiss() } }
            .task {
                for option in ScriptureStore.translationOptions where option.key != "kjv" {
                    await scripture.loadRemoteChapter(
                        translation: option.key, osis: selection.osis, chapter: selection.chapter
                    )
                }
            }
        }
    }

    @ViewBuilder
    private func translationSection(_ option: ScriptureStore.TranslationOption) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 8) {
                Text(option.abbreviation)
                    .font(.system(size: 12, weight: .bold)).kerning(1.0)
                    .foregroundStyle(scripture.translation == option.key ? Brand.ivory : Brand.hunter)
                    .padding(.horizontal, 8).padding(.vertical, 3)
                    .background(
                        Capsule().fill(scripture.translation == option.key ? Brand.hunter : Brand.hunter.opacity(0.1))
                    )
                Text(option.name).font(.system(size: 12)).foregroundStyle(Brand.stone)
                Spacer()
                if scripture.translation != option.key {
                    Button("Read") {
                        scripture.translation = option.key
                        dismiss()
                    }
                    .font(.system(size: 13, weight: .medium)).tint(Brand.hunter)
                }
            }
            if let verses = verses(for: option) {
                VStack(alignment: .leading, spacing: 6) {
                    ForEach(verses) { verse in
                        (Text("\(verse.v) ").font(.system(size: 11)).foregroundStyle(Brand.stone).baselineOffset(3)
                            + Text(verse.t).font(.scripture(size: 17)).foregroundStyle(Brand.ink))
                            .lineSpacing(5)
                    }
                }
                if let copyright = copyrightLine(for: option) {
                    Text(copyright).font(.system(size: 10)).foregroundStyle(Brand.stone.opacity(0.8))
                }
            } else if scripture.remoteLoading {
                HStack(spacing: 8) {
                    ProgressView().controlSize(.small)
                    Text("Loading\u{2026}").font(.system(size: 13)).foregroundStyle(Brand.stone)
                }
            } else {
                Text("Unavailable offline.").font(.system(size: 13)).foregroundStyle(Brand.stone)
            }
            Divider()
        }
    }

    private func verses(for option: ScriptureStore.TranslationOption) -> [BibleVerse]? {
        let all: [BibleVerse]?
        if option.key == "kjv" {
            all = scripture.chapter(osis: selection.osis, number: selection.chapter)?.verses
        } else {
            all = scripture.cachedRemoteChapter(
                translation: option.key, osis: selection.osis, chapter: selection.chapter
            )?.verses
        }
        return all.map { $0.filter { selection.verses.contains($0.v) } }
    }

    private func copyrightLine(for option: ScriptureStore.TranslationOption) -> String? {
        guard option.key != "kjv" else { return nil }
        let copyright = scripture.cachedRemoteChapter(
            translation: option.key, osis: selection.osis, chapter: selection.chapter
        )?.copyright
        guard let copyright, !copyright.isEmpty else { return nil }
        return copyright
    }
}

// MARK: - Book/chapter picker

struct BookPickerView: View {
    @EnvironmentObject var scripture: ScriptureStore
    @Environment(\.dismiss) private var dismiss
    @State private var expandedBook: String?

    var body: some View {
        NavigationStack {
            ScrollViewReader { proxy in
                List {
                    ForEach(scripture.index.books) { book in
                        Section {
                            if expandedBook == book.osis {
                                chapterGrid(book)
                            }
                        } header: {
                            Button {
                                withAnimation { expandedBook = expandedBook == book.osis ? nil : book.osis }
                            } label: {
                                HStack {
                                    Text(book.name).font(.scripture(size: 18)).foregroundStyle(Brand.ink)
                                    Spacer()
                                    Image(systemName: expandedBook == book.osis ? "chevron.up" : "chevron.down")
                                        .font(.system(size: 11)).foregroundStyle(Brand.stone)
                                }
                            }
                            .textCase(nil)
                            .id(book.osis)
                        }
                    }
                }
                .listStyle(.plain)
                // Bring the tapped book and its chapter grid into view once the
                // expansion has been laid out.
                .onChange(of: expandedBook) {
                    guard let expandedBook else { return }
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.05) {
                        withAnimation { proxy.scrollTo(expandedBook, anchor: .top) }
                    }
                }
                // Open at the book currently being read, with its chapters showing.
                .onAppear {
                    expandedBook = scripture.location.osis
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                        proxy.scrollTo(scripture.location.osis, anchor: .top)
                    }
                }
            }
            .navigationTitle("Books")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar { Button("Done") { dismiss() } }
        }
    }

    private func chapterGrid(_ book: BookMeta) -> some View {
        LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 6), spacing: 8) {
            ForEach(1...book.chapters, id: \.self) { ch in
                Button {
                    scripture.location = ReadingLocation(osis: book.osis, chapter: ch)
                    dismiss()
                } label: {
                    Text("\(ch)")
                        .font(.system(size: 15, weight: .medium))
                        .frame(maxWidth: .infinity, minHeight: 40)
                        .background(RoundedRectangle(cornerRadius: 8).fill(Brand.ivory))
                        .foregroundStyle(Brand.ink)
                }
                // .plain scopes the tap to each button; without it, List fires
                // every button in the row on a single tap (always landing on
                // the last chapter).
                .buttonStyle(.plain)
                .accessibilityLabel("\(book.name) chapter \(ch)")
            }
        }
        .padding(.vertical, 4)
    }
}

// MARK: - Search

struct SearchView: View {
    @EnvironmentObject var scripture: ScriptureStore
    @Environment(\.dismiss) private var dismiss
    @StateObject private var client = AIClient()
    @State private var hits: [ScriptureStore.SearchHit] = []
    @State private var meaningHits: [ScriptureStore.SearchHit] = []
    @State private var meaningLoading = false
    @State private var meaningTask: Task<Void, Never>?
    var onJump: () -> Void

    private var query: String { scripture.searchQuery }

    var body: some View {
        NavigationStack {
            List {
                if let (location, verse) = scripture.parseReference(query) {
                    Button {
                        jump(to: location, verse: verse)
                    } label: {
                        Label(
                            "Go to \(scripture.meta(for: location.osis)?.name ?? "") \(location.chapter)"
                                + (verse.map { ":\($0)" } ?? ""),
                            systemImage: "arrow.right.circle"
                        )
                        .foregroundStyle(Brand.hunter)
                    }
                }
                if !meaningHits.isEmpty || meaningLoading {
                    Section {
                        if meaningLoading && meaningHits.isEmpty {
                            HStack(spacing: 8) {
                                ProgressView().controlSize(.small)
                                Text("Searching by meaning\u{2026}")
                                    .font(.system(size: 13)).foregroundStyle(Brand.stone)
                            }
                        }
                        ForEach(meaningHits) { hit in
                            hitRow(hit)
                        }
                    } header: {
                        Label("By meaning", systemImage: "sparkles")
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundStyle(Brand.hunter)
                            .textCase(nil)
                    }
                }
                if !hits.isEmpty {
                    Section {
                        ForEach(hits) { hit in
                            hitRow(hit)
                        }
                    } header: {
                        Label("Contains the words", systemImage: "text.magnifyingglass")
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundStyle(Brand.stone)
                            .textCase(nil)
                    }
                }
                if !query.isEmpty && hits.isEmpty && meaningHits.isEmpty && !meaningLoading
                    && scripture.parseReference(query) == nil {
                    Text("No results for \u{201C}\(query)\u{201D}").foregroundStyle(Brand.stone)
                }
            }
            .listStyle(.plain)
            .searchable(text: $scripture.searchQuery, placement: .navigationBarDrawer(displayMode: .always),
                        prompt: "Search words, themes, or a reference")
            .onChange(of: scripture.searchQuery) { refresh() }
            // Query persists across sheet openings; restore its results too.
            .onAppear { if !query.isEmpty { refresh() } }
            .onDisappear { meaningTask?.cancel() }
            .navigationTitle("Search")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar { Button("Done") { dismiss() } }
        }
    }

    private func hitRow(_ hit: ScriptureStore.SearchHit) -> some View {
        Button {
            jump(to: ReadingLocation(osis: hit.osis, chapter: hit.chapter), verse: hit.verse)
        } label: {
            VStack(alignment: .leading, spacing: 4) {
                Text("\(hit.bookName) \(hit.chapter):\(hit.verse)")
                    .font(.system(size: 13, weight: .semibold)).foregroundStyle(Brand.hunter)
                Text(hit.text).font(.scripture(size: 15)).foregroundStyle(Brand.ink).lineLimit(3)
            }
            .padding(.vertical, 2)
        }
    }

    /// Word matches update instantly and offline; the meaning search is
    /// debounced so we only ask the backend once typing settles.
    private func refresh() {
        hits = scripture.search(query)
        meaningTask?.cancel()
        let trimmed = query.trimmingCharacters(in: .whitespaces)
        // Skip references ("John 3:16") and fragments — meaning search shines
        // on phrases like "confidence and strength in the Lord".
        guard trimmed.count >= 4, scripture.parseReference(trimmed) == nil else {
            meaningHits = []
            meaningLoading = false
            return
        }
        meaningLoading = true
        meaningTask = Task {
            try? await Task.sleep(nanoseconds: 450_000_000)
            guard !Task.isCancelled else { return }
            do {
                let refs = try await client.semanticSearch(trimmed)
                guard !Task.isCancelled else { return }
                meaningHits = refs.compactMap { scripture.hit(forRef: $0) }
            } catch {
                // Quiet degradation: word search results are already on screen.
                if !Task.isCancelled { meaningHits = [] }
            }
            meaningLoading = false
        }
    }

    /// Set the verse target first so the reader scrolls to it (not chapter top).
    private func jump(to location: ReadingLocation, verse: Int?) {
        scripture.jumpVerse = verse
        scripture.location = location
        onJump()
        dismiss()
    }
}

// MARK: - Note editor (private, local, never sent to the model without consent)

struct NoteEditorView: View {
    @EnvironmentObject var library: LibraryStore
    @Environment(\.dismiss) private var dismiss
    let selection: VerseSelection
    var onSave: () -> Void
    @State private var text = ""

    var body: some View {
        NavigationStack {
            VStack(alignment: .leading, spacing: 12) {
                Text(selection.reference)
                    .font(.system(size: 13, weight: .semibold)).foregroundStyle(Brand.hunter)
                TextEditor(text: $text)
                    .font(.system(size: 16))
                    .scrollContentBackground(.hidden)
                    .background(RoundedRectangle(cornerRadius: 12).fill(Brand.ivory))
                Text("Notes are private and stay on your device. They are never shared or used by the study layer without your explicit permission.")
                    .font(.system(size: 12)).foregroundStyle(Brand.stone)
            }
            .padding()
            .navigationTitle("Add note")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        library.addNote(for: selection, text: text)
                        onSave(); dismiss()
                    }
                    .disabled(text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
            }
        }
    }
}
