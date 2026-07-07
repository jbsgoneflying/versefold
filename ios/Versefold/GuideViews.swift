import SwiftUI

/// The guide: six quiet pages that teach the whole app. Shown automatically
/// on first launch (after the splash) and reachable forever from the reader
/// menu as "How to use Versefold". Demos are drawn with the app's real
/// components — the marker ink and margin marks here are the same code that
/// draws them in the reader, so what you learn is exactly what you get.
struct GuideView: View {
    @Environment(\.dismiss) private var dismiss

    @State private var page = 0
    private static let lastPage = 5

    var body: some View {
        ZStack {
            Brand.ivory.ignoresSafeArea()

            VStack(spacing: 0) {
                HStack {
                    Spacer()
                    Button("Skip") { dismiss() }
                        .font(.system(size: 15, weight: .medium))
                        .tint(Brand.stone)
                        .opacity(page == Self.lastPage ? 0 : 1)
                        .accessibilityLabel("Skip guide")
                }
                .padding(.horizontal, 24)
                .padding(.top, 18)

                TabView(selection: $page) {
                    welcomePage.tag(0)
                    selectionPage.tag(1)
                    penPage.tag(2)
                    notesPage.tag(3)
                    studyPage.tag(4)
                    translationsPage.tag(5)
                }
                .tabViewStyle(.page(indexDisplayMode: .never))
                .animation(.easeInOut(duration: 0.3), value: page)

                VStack(spacing: 20) {
                    pageDots

                    Button {
                        if page < Self.lastPage {
                            withAnimation { page += 1 }
                        } else {
                            dismiss()
                        }
                    } label: {
                        Text(page == Self.lastPage ? "Begin reading" : "Continue")
                            .font(.system(size: 16, weight: .semibold))
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 6)
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(Brand.hunter)
                    .padding(.horizontal, 40)
                    .accessibilityLabel(page == Self.lastPage ? "Begin reading" : "Continue")
                }
                .padding(.bottom, 28)
            }
        }
    }

    private var pageDots: some View {
        HStack(spacing: 8) {
            ForEach(0...Self.lastPage, id: \.self) { i in
                Circle()
                    .fill(i == page ? Brand.hunter : Brand.stone.opacity(0.35))
                    .frame(width: i == page ? 8 : 6, height: i == page ? 8 : 6)
            }
        }
        .animation(.easeInOut(duration: 0.2), value: page)
        .accessibilityHidden(true)
    }

    // MARK: Page scaffold

    private func guidePage(
        heading: String, text: String, @ViewBuilder demo: () -> some View
    ) -> some View {
        VStack(spacing: 0) {
            Spacer(minLength: 12)
            demo()
                .frame(maxWidth: .infinity)
                .frame(height: 300)
            Spacer(minLength: 24)
            VStack(spacing: 12) {
                Text(heading)
                    .font(.scripture(size: 27))
                    .foregroundStyle(Brand.ink)
                    .multilineTextAlignment(.center)
                Text(text)
                    .font(.system(size: 15))
                    .foregroundStyle(Brand.ink.opacity(0.72))
                    .multilineTextAlignment(.center)
                    .lineSpacing(3.5)
            }
            .padding(.horizontal, 36)
            Spacer(minLength: 20)
        }
    }

    /// A paper-like frame the demos sit on, so every page reads as a page.
    private func demoCard(@ViewBuilder content: () -> some View) -> some View {
        content()
            .padding(22)
            .frame(maxWidth: .infinity)
            .background(RoundedRectangle(cornerRadius: 18).fill(Brand.paper))
            .overlay(RoundedRectangle(cornerRadius: 18).stroke(Brand.stone.opacity(0.18)))
            .shadow(color: .black.opacity(0.05), radius: 14, y: 6)
            .padding(.horizontal, 34)
    }

    // MARK: 1 — Welcome

    private var welcomePage: some View {
        guidePage(
            heading: "Scripture first.\nEverything else quiet.",
            text: "Versefold opens straight to the Word — no feed, no streaks, nothing pulling at you. Tap the book name in the top corner to go anywhere in the Bible."
        ) {
            VStack(spacing: 22) {
                Image("LaunchMark")
                    .resizable().scaledToFit()
                    .frame(height: 92)
                Image("SplashWordmark")
                    .resizable().scaledToFit()
                    .frame(height: 30)
                // The control this page teaches: the book-name button.
                HStack(spacing: 5) {
                    Text("John 1")
                        .font(.system(size: 14, weight: .semibold))
                    Image(systemName: "chevron.down").font(.system(size: 10, weight: .semibold))
                }
                .foregroundStyle(Brand.ink)
                .padding(.horizontal, 14).padding(.vertical, 8)
                .background(Capsule().fill(Brand.paper))
                .overlay(Capsule().stroke(Brand.stone.opacity(0.3)))
                .padding(.top, 8)
            }
        }
    }

    // MARK: 2 — Touch a verse

    private var selectionPage: some View {
        guidePage(
            heading: "Touch a verse",
            text: "Tap any verse to choose it — tap more to grow the selection. The bar that appears offers Unfold (a careful, deeper explanation), Compare, and more: notes, highlights, cards, and studies."
        ) {
            demoCard {
                VStack(alignment: .leading, spacing: 18) {
                    (Text("9 ").font(.system(size: 11)).foregroundStyle(Brand.stone)
                        + Text("Be strong and of a good courage; be not afraid, neither be thou dismayed: for the Lord thy God is with thee.")
                        .font(.scripture(size: 17)).foregroundStyle(Brand.ink))
                        .lineSpacing(6)
                        .padding(10)
                        .background(RoundedRectangle(cornerRadius: 10).fill(Brand.hunter.opacity(0.08)))

                    // A miniature of the real selection bar.
                    HStack(spacing: 10) {
                        Text("Joshua 1:9")
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundStyle(Brand.ink)
                        Spacer()
                        Text("Unfold").font(.system(size: 13, weight: .semibold)).foregroundStyle(Brand.hunter)
                        Text("Compare").font(.system(size: 13, weight: .medium)).foregroundStyle(Brand.hunter)
                        Image(systemName: "ellipsis.circle").font(.system(size: 14)).foregroundStyle(Brand.stone)
                    }
                    .padding(.horizontal, 14).padding(.vertical, 10)
                    .background(
                        Capsule().fill(Brand.ivory)
                            .shadow(color: .black.opacity(0.10), radius: 6, y: 2)
                    )
                }
            }
        }
    }

    // MARK: 3 — Pen and marker

    private var penPage: some View {
        guidePage(
            heading: "Mark it like paper",
            text: "Press and hold a verse, then drag across the words you want. Choose Marker or Underline — the ink lands on exactly those words. Stroke over ink again to erase it."
        ) {
            demoCard {
                VStack(alignment: .leading, spacing: 20) {
                    PenDemo()
                    HStack(spacing: 10) {
                        Label("Marker", systemImage: "highlighter")
                            .font(.system(size: 12, weight: .medium))
                            .padding(.horizontal, 10).padding(.vertical, 6)
                            .background(Capsule().fill(Brand.hunter.opacity(0.1)))
                            .foregroundStyle(Brand.hunter)
                        Label("Underline", systemImage: "underline")
                            .font(.system(size: 12, weight: .medium))
                            .padding(.horizontal, 10).padding(.vertical, 6)
                            .background(Capsule().fill(Brand.hunter.opacity(0.1)))
                            .foregroundStyle(Brand.hunter)
                        Image(systemName: "eraser")
                            .font(.system(size: 12, weight: .medium))
                            .padding(.horizontal, 10).padding(.vertical, 6)
                            .background(Capsule().fill(Brand.parchment.opacity(0.8)))
                            .foregroundStyle(Brand.stone)
                    }
                }
            }
        }
    }

    // MARK: 4 — Margin notes

    private var notesPage: some View {
        guidePage(
            heading: "Leave notes in the margin",
            text: "Add a note to a verse and a small hand-penned mark appears beside it — in every translation. Tap the mark anytime to read, edit, or add more. Notes stay private, on your device."
        ) {
            demoCard {
                HStack(alignment: .top, spacing: 12) {
                    MarginNoteMark(seed: 5, color: Brand.hunter.opacity(0.8))
                        .frame(width: 15, height: 15)
                        .padding(.top, 4)
                    (Text("1 ").font(.system(size: 11)).foregroundStyle(Brand.stone)
                        + Text("In the beginning was the Word, and the Word was with God, and the Word was God.")
                        .font(.scripture(size: 17)).foregroundStyle(Brand.ink))
                        .lineSpacing(6)
                }
            }
        }
    }

    // MARK: 5 — Study and remember

    private var studyPage: some View {
        guidePage(
            heading: "Study and remember",
            text: "Build a guided study from any verse or theme — your length, your pace, no streaks, nothing expires. Or turn one verse into a confession card to keep on your lips through the day."
        ) {
            HStack(alignment: .center, spacing: 26) {
                VStack(alignment: .leading, spacing: 14) {
                    Label("Day 1 · Courage", systemImage: "book")
                    Label("Reflection", systemImage: "questionmark.circle")
                    Label("Prayer", systemImage: "hands.sparkles")
                }
                .font(.system(size: 13, weight: .medium))
                .foregroundStyle(Brand.ink.opacity(0.75))
                .padding(16)
                .background(RoundedRectangle(cornerRadius: 14).fill(Brand.paper))
                .overlay(RoundedRectangle(cornerRadius: 14).stroke(Brand.stone.opacity(0.18)))

                miniCard
            }
        }
    }

    /// A true miniature of the confession card — the real view, scaled down.
    private var miniCard: some View {
        ScriptureCardView(
            scripture: "Be strong and of a good courage; be not afraid.",
            reference: "Joshua 1:9",
            translation: "KJV",
            personalText: "The Lord my God is with me wherever I go.",
            theme: CardTheme.all[0],
            typeSize: 30
        )
        .frame(width: 393, height: 852)
        .clipShape(RoundedRectangle(cornerRadius: 52))
        .scaleEffect(0.3)
        .frame(width: 393 * 0.3, height: 852 * 0.3)
        .shadow(color: .black.opacity(0.16), radius: 10, y: 5)
    }

    // MARK: 6 — Translations & search

    private var translationsPage: some View {
        guidePage(
            heading: "Read it your way",
            text: "Flip between KJV, NIV, and AMP instantly from the top bar. Search by meaning — \u{201C}strength in the Lord\u{201D} finds the passages that carry it, not just the words. Themes and text size live in Settings."
        ) {
            VStack(spacing: 22) {
                HStack(spacing: 10) {
                    ForEach(["KJV", "NIV", "AMP"], id: \.self) { t in
                        Text(t)
                            .font(.system(size: 14, weight: .semibold))
                            .kerning(0.5)
                            .padding(.horizontal, 16).padding(.vertical, 8)
                            .background(Capsule().fill(t == "KJV" ? Brand.hunter : Brand.paper))
                            .overlay(Capsule().stroke(t == "KJV" ? Brand.hunter : Brand.stone.opacity(0.35)))
                            .foregroundStyle(t == "KJV" ? Brand.ivory : Brand.ink.opacity(0.7))
                    }
                }
                HStack(spacing: 10) {
                    Image(systemName: "magnifyingglass").foregroundStyle(Brand.stone)
                    Text("strength in the Lord")
                        .font(.system(size: 15)).italic()
                        .foregroundStyle(Brand.ink.opacity(0.6))
                    Spacer()
                }
                .padding(.horizontal, 16).padding(.vertical, 12)
                .background(Capsule().fill(Brand.paper))
                .overlay(Capsule().stroke(Brand.stone.opacity(0.25)))
                .padding(.horizontal, 44)
            }
        }
    }
}

// MARK: - Live pen demo

/// A mock verse that marks itself: the marker sweeps across four words, then
/// the underline draws beneath three more — real `MarkedVerseText` + `PenInk`,
/// so the demo is pixel-true to the reader. Loops gently forever.
private struct PenDemo: View {
    @State private var markerEnd: Int?
    @State private var underlineEnd: Int?

    private static let words: [String] = [
        "Thy", "word", "is", "a", "lamp", "unto", "my", "feet,",
        "and", "a", "light", "unto", "my", "path.",
    ]
    private static let markerRange = 1...4    // "word is a lamp"
    private static let underlineRange = 10...13 // "light unto my path."

    private var marks: [(range: ClosedRange<Int>, style: PenStyle)] {
        var result: [(range: ClosedRange<Int>, style: PenStyle)] = []
        if let end = markerEnd {
            result.append((range: Self.markerRange.lowerBound...end, style: .marker))
        }
        if let end = underlineEnd {
            result.append((range: Self.underlineRange.lowerBound...end, style: .underline))
        }
        return result
    }

    var body: some View {
        MarkedVerseText(
            verseNumber: 105, words: Self.words, showVerseNumber: true,
            fontSize: 19, lineSpacing: 9, theme: .ivory
        )
        .backgroundPreferenceValue(WordAnchorsKey.self) { anchors in
            GeometryReader { geo in
                PenInk(
                    theme: .ivory, seed: 11, marks: marks, liveRange: nil,
                    frames: anchors.mapValues { geo[$0] }
                )
            }
        }
        .task { await loop() }
    }

    private func loop() async {
        while !Task.isCancelled {
            markerEnd = nil
            underlineEnd = nil
            try? await Task.sleep(nanoseconds: 800_000_000)
            for end in Self.markerRange {
                markerEnd = end
                try? await Task.sleep(nanoseconds: 240_000_000)
            }
            try? await Task.sleep(nanoseconds: 600_000_000)
            for end in Self.underlineRange {
                underlineEnd = end
                try? await Task.sleep(nanoseconds: 240_000_000)
            }
            try? await Task.sleep(nanoseconds: 2_600_000_000)
        }
    }
}
