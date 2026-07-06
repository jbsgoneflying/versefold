import SwiftUI

/// Pen-style partial-verse marks: a verse rendered word-by-word so a finger
/// drag can paint exact words, and saved marks can decorate them with a
/// hand-drawn marker band or wavy underline — like ink in a paper Bible.
///
/// Performance: this layout exists ONLY for verses that carry pen marks (or
/// the one actively being marked). Everything else stays a single `Text`.

// MARK: - Ink palette

extension ReaderTheme {
    /// Classic soft highlighter on light pages; muted gold in the dark.
    var markerInk: Color {
        switch self {
        case .ivory, .parchment: return Color(red: 0.98, green: 0.85, blue: 0.35).opacity(0.42)
        case .dark, .lowLight: return Color(red: 0.85, green: 0.70, blue: 0.28).opacity(0.30)
        }
    }

    var underlineInk: Color {
        switch self {
        case .ivory, .parchment: return Brand.hunter.opacity(0.85)
        case .dark, .lowLight: return Color(red: 0.72, green: 0.62, blue: 0.40).opacity(0.9)
        }
    }

    /// Provisional tint while the finger is still painting.
    var liveInk: Color {
        switch self {
        case .ivory, .parchment: return Brand.hunter.opacity(0.18)
        case .dark, .lowLight: return Color.white.opacity(0.14)
        }
    }
}

// MARK: - Word frames preference (drag hit-testing)

struct WordFramesKey: PreferenceKey {
    static let defaultValue: [Int: CGRect] = [:]
    static func reduce(value: inout [Int: CGRect], nextValue: () -> [Int: CGRect]) {
        value.merge(nextValue()) { _, new in new }
    }
}

// MARK: - Marked verse

struct MarkedVerseText: View {
    let verseNumber: Int
    let words: [String]
    let showVerseNumber: Bool
    let fontSize: Double
    let lineSpacing: Double
    let theme: ReaderTheme
    /// Saved marks on this verse (word ranges + style).
    let marks: [(range: ClosedRange<Int>, style: PenStyle)]
    /// Range currently being painted by the finger, if any.
    let liveRange: ClosedRange<Int>?
    /// Stable per-verse seed so the "ink" wobble never changes between renders.
    let seed: Int
    let coordinateSpace: String

    var body: some View {
        WordFlowLayout(wordSpacing: fontSize * 0.30, lineSpacing: CGFloat(lineSpacing)) {
            if showVerseNumber {
                Text("\(verseNumber)")
                    .font(.system(size: max(11, fontSize * 0.55)))
                    .foregroundStyle(theme.meta)
                    .baselineOffset(4)
            }
            ForEach(words.indices, id: \.self) { index in
                wordView(index)
            }
        }
    }

    private func wordView(_ index: Int) -> some View {
        Text(words[index])
            .font(.scripture(size: fontSize))
            .foregroundStyle(theme.text)
            .background(alignment: .center) { markerBand(index) }
            .overlay(alignment: .bottom) { underline(index) }
            .background(
                GeometryReader { geo in
                    Color.clear.preference(
                        key: WordFramesKey.self,
                        value: [index: geo.frame(in: .named(coordinateSpace))]
                    )
                }
            )
    }

    // Deterministic 0...1 wobble per (seed, word) — the hand-drawn feel.
    private func wobble(_ index: Int, _ salt: Int) -> CGFloat {
        let x = sin(Double(seed &* 131 &+ index &* 97 &+ salt &* 53) * 12.9898) * 43758.5453
        return CGFloat(x - x.rounded(.down))
    }

    private func mark(covering index: Int, style: PenStyle) -> ClosedRange<Int>? {
        marks.first { $0.style == style && $0.range.contains(index) }?.range
    }

    @ViewBuilder
    private func markerBand(_ index: Int) -> some View {
        let saved = mark(covering: index, style: .marker)
        let live = liveRange?.contains(index) == true
        if saved != nil || live {
            let range = saved ?? liveRange!
            let isStart = index == range.lowerBound
            let isEnd = index == range.upperBound
            let gap = fontSize * 0.30
            // One continuous band: each word's slab bleeds into the word gap,
            // rounded only at the stroke's ends. Slight height/offset wobble
            // keeps it looking drawn, not printed.
            UnevenRoundedRectangle(
                topLeadingRadius: isStart ? 5 : 0,
                bottomLeadingRadius: isStart ? 6 : 0,
                bottomTrailingRadius: isEnd ? 5 : 0,
                topTrailingRadius: isEnd ? 6 : 0
            )
            .fill(saved != nil ? theme.markerInk : theme.liveInk)
            .padding(.leading, isStart ? -2 : -gap / 2 - 1)
            .padding(.trailing, isEnd ? -2 : -gap / 2 - 1)
            .padding(.vertical, -1.5 - wobble(index, 1) * 1.5)
            .offset(y: (wobble(index, 2) - 0.5) * 1.6)
            .allowsHitTesting(false)
        }
    }

    @ViewBuilder
    private func underline(_ index: Int) -> some View {
        if let range = mark(covering: index, style: .underline) {
            let isStart = index == range.lowerBound
            let isEnd = index == range.upperBound
            let gap = fontSize * 0.30
            WavyUnderline(seed: seed &+ index, phase: index)
                .stroke(theme.underlineInk, style: StrokeStyle(lineWidth: 1.6, lineCap: .round))
                .frame(height: 4)
                .padding(.leading, isStart ? 0 : -gap / 2 - 1)
                .padding(.trailing, isEnd ? 0 : -gap / 2 - 1)
                .offset(y: 3 + (wobble(index, 3) - 0.5) * 1.2)
                .allowsHitTesting(false)
        }
    }
}

/// A gently uneven line — a hand can't draw straight, and shouldn't here.
struct WavyUnderline: Shape {
    let seed: Int
    let phase: Int

    func path(in rect: CGRect) -> Path {
        var path = Path()
        let midY = rect.midY
        func w(_ salt: Int) -> CGFloat {
            let x = sin(Double(seed &* 89 &+ salt &* 71) * 78.233) * 43758.5453
            return CGFloat(x - x.rounded(.down)) - 0.5
        }
        path.move(to: CGPoint(x: rect.minX, y: midY + w(1) * 1.4))
        let step = max(rect.width / 3, 6)
        var x = rect.minX
        var salt = 2
        while x < rect.maxX {
            let next = min(x + step, rect.maxX)
            path.addQuadCurve(
                to: CGPoint(x: next, y: midY + w(salt) * 1.6),
                control: CGPoint(x: (x + next) / 2, y: midY + w(salt + 1) * 2.2)
            )
            x = next
            salt += 2
        }
        return path
    }
}

// MARK: - Flow layout

/// Flows word views like natural text. Line breaks happen between words,
/// which is exactly how the plain `Text` renders it too.
struct WordFlowLayout: Layout {
    let wordSpacing: CGFloat
    let lineSpacing: CGFloat

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let maxWidth = proposal.width ?? .infinity
        var x: CGFloat = 0, y: CGFloat = 0, lineHeight: CGFloat = 0, widest: CGFloat = 0
        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if x > 0, x + size.width > maxWidth {
                x = 0
                y += lineHeight + lineSpacing
                lineHeight = 0
            }
            x += size.width + wordSpacing
            lineHeight = max(lineHeight, size.height)
            widest = max(widest, x - wordSpacing)
        }
        return CGSize(width: maxWidth.isFinite ? maxWidth : widest, height: y + lineHeight)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let maxWidth = bounds.width
        var x: CGFloat = 0, y: CGFloat = 0, lineHeight: CGFloat = 0
        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if x > 0, x + size.width > maxWidth {
                x = 0
                y += lineHeight + lineSpacing
                lineHeight = 0
            }
            subview.place(
                at: CGPoint(x: bounds.minX + x, y: bounds.minY + y),
                anchor: .topLeading,
                proposal: .unspecified
            )
            x += size.width + wordSpacing
            lineHeight = max(lineHeight, size.height)
        }
    }
}
