import SwiftUI

/// Pen-style partial-verse marks: a verse rendered word-by-word so a finger
/// drag can paint exact words, and saved marks can decorate them with a
/// hand-drawn marker band or wavy underline — like ink in a paper Bible.
///
/// The words publish their bounds as anchor preferences; the verse row
/// resolves them and hands them to `PenInk`, which draws ONE continuous
/// stroke per line of text (word frames merged into line runs), so a mark
/// reads as a single sweep of the pen, never a row of per-word slabs.
///
/// Performance: this layout exists ONLY for verses that carry pen marks (or
/// the one actively being marked). Everything else stays a single `Text`.

// MARK: - Ink palette

extension ReaderTheme {
    /// Classic soft highlighter on light pages; muted gold in the dark.
    var markerInk: Color {
        switch self {
        case .ivory, .parchment: return Color(red: 0.99, green: 0.86, blue: 0.32).opacity(0.40)
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
        case .ivory, .parchment: return Brand.hunter.opacity(0.16)
        case .dark, .lowLight: return Color.white.opacity(0.14)
        }
    }
}

// MARK: - Pen gesture (UIKit level)

/// The pen lives in UIKit, not SwiftUI, for two verified-by-UI-test reasons:
/// 1. Any SwiftUI long-press→drag sequence on the verse rows blocks the
///    ScrollView's pan outright — the reader stops scrolling entirely.
/// 2. `scrollDisabled(_:)` can't freeze the page mid-stroke: toggling it
///    rebuilds the scroll view's gestures, cancelling the stroke itself.
/// One `UILongPressGestureRecognizer` on the underlying UIScrollView solves
/// both: it coexists natively with the pan (movement fails it, stillness arms
/// it), keeps tracking the same finger while it paints, and the scroll freeze
/// is a plain `isScrollEnabled` flip UIKit is happy to do mid-touch.
final class ScrollLock {
    weak var scrollView: UIScrollView?

    func lock() { scrollView?.isScrollEnabled = false }
    func unlock() { scrollView?.isScrollEnabled = true }
}

/// Verse-row frames in chapter-content coordinates, written by the rows as
/// they lay out. A plain class: updates must never invalidate any view.
final class PenGeometry {
    var rowFrames: [Int: CGRect] = [:]

    func verse(at point: CGPoint) -> Int? {
        rowFrames.first { $0.value.contains(point) }?.key
    }
}

/// Invisible helper placed as the chapter content's background: finds the
/// enclosing UIScrollView, hands it to the lock, and installs the pen
/// recognizer on it. Its own view doubles as the coordinate anchor — its
/// bounds ARE the chapter content, so `location(in:)` matches the named
/// coordinate space the verse rows measure themselves in.
struct PenGestureInstaller: UIViewRepresentable {
    let lock: ScrollLock
    var onBegan: (CGPoint) -> Void
    var onMoved: (CGPoint) -> Void
    var onLifted: () -> Void

    func makeCoordinator() -> Coordinator { Coordinator() }

    final class Coordinator: NSObject {
        var onBegan: ((CGPoint) -> Void)?
        var onMoved: ((CGPoint) -> Void)?
        var onLifted: (() -> Void)?
        weak var anchorView: UIView?
        weak var installedOn: UIScrollView?

        @objc func handlePen(_ recognizer: UILongPressGestureRecognizer) {
            guard let anchor = anchorView else { return }
            let point = recognizer.location(in: anchor)
            switch recognizer.state {
            case .began: onBegan?(point)
            case .changed: onMoved?(point)
            // A cancelled stroke is treated like a lift: finish or stand down.
            case .ended, .cancelled, .failed: onLifted?()
            default: break
            }
        }
    }

    func makeUIView(context: Context) -> UIView {
        let view = UIView()
        view.isUserInteractionEnabled = false
        view.isHidden = true
        context.coordinator.anchorView = view
        return view
    }

    func updateUIView(_ uiView: UIView, context: Context) {
        let coordinator = context.coordinator
        coordinator.onBegan = onBegan
        coordinator.onMoved = onMoved
        coordinator.onLifted = onLifted
        coordinator.anchorView = uiView
        DispatchQueue.main.async { [weak uiView] in
            var candidate = uiView?.superview
            while let view = candidate {
                if let scrollView = view as? UIScrollView {
                    lock.scrollView = scrollView
                    if coordinator.installedOn !== scrollView {
                        let pen = UILongPressGestureRecognizer(
                            target: coordinator, action: #selector(Coordinator.handlePen(_:))
                        )
                        pen.minimumPressDuration = 0.35
                        pen.allowableMovement = 12
                        // On recognition, kill the touch for SwiftUI so the
                        // tap-to-select underneath never double-fires.
                        pen.cancelsTouchesInView = true
                        scrollView.addGestureRecognizer(pen)
                        coordinator.installedOn = scrollView
                    }
                    return
                }
                candidate = view.superview
            }
        }
    }
}

// MARK: - Word geometry preferences

/// Word bounds as anchors — resolved by the verse row into its own space.
struct WordAnchorsKey: PreferenceKey {
    static let defaultValue: [Int: Anchor<CGRect>] = [:]
    static func reduce(value: inout [Int: Anchor<CGRect>], nextValue: () -> [Int: Anchor<CGRect>]) {
        value.merge(nextValue()) { _, new in new }
    }
}

/// Resolved word frames (row space) — the reader hit-tests drags against these.
struct WordFramesKey: PreferenceKey {
    static let defaultValue: [Int: CGRect] = [:]
    static func reduce(value: inout [Int: CGRect], nextValue: () -> [Int: CGRect]) {
        value.merge(nextValue()) { _, new in new }
    }
}

// MARK: - Marked verse (word flow that publishes word bounds)

struct MarkedVerseText: View {
    let verseNumber: Int
    let words: [String]
    let showVerseNumber: Bool
    let fontSize: Double
    let lineSpacing: Double
    let theme: ReaderTheme

    var body: some View {
        WordFlowLayout(wordSpacing: fontSize * 0.27, lineSpacing: CGFloat(lineSpacing)) {
            if showVerseNumber {
                Text("\(verseNumber)")
                    .font(.system(size: max(11, fontSize * 0.55)))
                    .foregroundStyle(theme.meta)
                    .baselineOffset(4)
            }
            ForEach(words.indices, id: \.self) { index in
                Text(words[index])
                    .font(.scripture(size: fontSize))
                    .foregroundStyle(theme.text)
                    .anchorPreference(key: WordAnchorsKey.self, value: .bounds) { [index: $0] }
            }
        }
    }
}

// MARK: - Ink

/// Draws every saved stroke plus the live one from resolved word frames.
struct PenInk: View {
    let theme: ReaderTheme
    /// Stable per-verse seed so the "ink" wobble never changes between renders.
    let seed: Int
    /// Saved marks on this verse (word ranges + style).
    let marks: [(range: ClosedRange<Int>, style: PenStyle)]
    /// Range currently being painted by the finger, if any.
    let liveRange: ClosedRange<Int>?
    /// Word frames in the same space as this view's bounds.
    let frames: [Int: CGRect]

    var body: some View {
        Canvas { context, _ in
            for mark in marks {
                for (i, run) in lineRuns(mark.range).enumerated() {
                    switch mark.style {
                    case .marker:
                        drawMarker(context, run: run, color: theme.markerInk, salt: i &+ mark.range.lowerBound)
                    case .underline:
                        drawUnderline(context, run: run, salt: i &+ mark.range.lowerBound)
                    }
                }
            }
            if let live = liveRange {
                for (i, run) in lineRuns(live).enumerated() {
                    drawMarker(context, run: run, color: theme.liveInk, salt: i)
                }
            }
        }
        .allowsHitTesting(false)
    }

    /// Merge the frames of a word range into one rect per line of text, so
    /// each line gets a single unbroken stroke.
    private func lineRuns(_ range: ClosedRange<Int>) -> [CGRect] {
        var runs: [CGRect] = []
        var current: CGRect?
        for index in range {
            guard let frame = frames[index] else { continue }
            if let run = current, abs(frame.midY - run.midY) < run.height * 0.6 {
                current = run.union(frame)
            } else {
                if let run = current { runs.append(run) }
                current = frame
            }
        }
        if let run = current { runs.append(run) }
        return runs
    }

    // Deterministic 0...1 wobble — the hand-drawn feel, stable across renders.
    private func wobble(_ salt: Int) -> CGFloat {
        let x = sin(Double(seed &* 131 &+ salt &* 97) * 12.9898) * 43758.5453
        return CGFloat(x - x.rounded(.down))
    }

    private func jitter(_ salt: Int, _ amplitude: CGFloat) -> CGFloat {
        (wobble(salt) - 0.5) * amplitude
    }

    /// One sweep of a chisel-tip marker: rounded ends, gently uneven top and
    /// bottom edges, and a whisper of rotation. Drawn once per line run.
    private func drawMarker(_ context: GraphicsContext, run: CGRect, color: Color, salt: Int) {
        let band = run.insetBy(dx: -3.5, dy: -1)
        var ctx = context
        ctx.translateBy(x: band.midX, y: band.midY)
        ctx.rotate(by: .degrees(Double(jitter(salt &* 7 &+ 1, 0.7))))
        ctx.translateBy(x: -band.midX, y: -band.midY)
        ctx.fill(markerPath(in: band, salt: salt), with: .color(color))
    }

    private func markerPath(in r: CGRect, salt: Int) -> Path {
        var p = Path()
        let endRadius = r.height / 2
        // Short runs (one small word) don't have room for wavy edges.
        guard r.width > endRadius * 2 + 24 else {
            p.addRoundedRect(in: r, cornerSize: CGSize(width: endRadius * 0.7, height: endRadius * 0.7))
            return p
        }
        func j(_ s: Int) -> CGFloat { jitter(salt &* 31 &+ s, 2.2) }
        let left = r.minX + endRadius, right = r.maxX - endRadius
        p.move(to: CGPoint(x: left, y: r.minY + j(1)))
        // Top edge in two loose curves.
        p.addQuadCurve(
            to: CGPoint(x: r.midX, y: r.minY + j(2)),
            control: CGPoint(x: r.minX + r.width * 0.28, y: r.minY + j(3) * 1.4)
        )
        p.addQuadCurve(
            to: CGPoint(x: right, y: r.minY + j(4)),
            control: CGPoint(x: r.minX + r.width * 0.74, y: r.minY + j(5) * 1.4)
        )
        // Rounded lift-off.
        p.addQuadCurve(
            to: CGPoint(x: right, y: r.maxY + j(6)),
            control: CGPoint(x: r.maxX + endRadius * 0.8, y: r.midY)
        )
        // Bottom edge back.
        p.addQuadCurve(
            to: CGPoint(x: r.midX, y: r.maxY + j(7)),
            control: CGPoint(x: r.minX + r.width * 0.72, y: r.maxY + j(8) * 1.4)
        )
        p.addQuadCurve(
            to: CGPoint(x: left, y: r.maxY + j(9)),
            control: CGPoint(x: r.minX + r.width * 0.26, y: r.maxY + j(10) * 1.4)
        )
        // Rounded landing.
        p.addQuadCurve(
            to: CGPoint(x: left, y: r.minY + j(1)),
            control: CGPoint(x: r.minX - endRadius * 0.8, y: r.midY)
        )
        p.closeSubpath()
        return p
    }

    /// A long, gently drifting line just under the words — one stroke per
    /// line run, long wavelength, so it reads as a steady hand, not a scribble.
    private func drawUnderline(_ context: GraphicsContext, run: CGRect, salt: Int) {
        let baseline = run.maxY - run.height * 0.10
        func j(_ s: Int, _ amp: CGFloat) -> CGFloat { jitter(salt &* 53 &+ s, amp) }

        var p = Path()
        p.move(to: CGPoint(x: run.minX - 1.5, y: baseline + j(1, 1.4)))
        let segments = max(Int(run.width / 70), 1)
        for s in 0..<segments {
            let toX = run.minX + run.width * CGFloat(s + 1) / CGFloat(segments)
            let controlX = run.minX + run.width * (CGFloat(s) + 0.5) / CGFloat(segments)
            p.addQuadCurve(
                to: CGPoint(x: toX + (s == segments - 1 ? 1.5 : 0), y: baseline + j(s * 2 + 2, 1.6)),
                control: CGPoint(x: controlX, y: baseline + j(s * 2 + 3, 2.6))
            )
        }
        context.stroke(
            p,
            with: .color(theme.underlineInk),
            style: StrokeStyle(lineWidth: 1.8, lineCap: .round, lineJoin: .round)
        )
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
