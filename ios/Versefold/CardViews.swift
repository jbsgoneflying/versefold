import SwiftUI
import Photos

/// Confession / lock-screen card. Rendering is fully deterministic — the model
/// never renders the card, and Scripture text is never altered. Personal
/// confession text is visually and semantically separate from Scripture.
struct CardTheme: Identifiable {
    let id: String
    let name: String
    let background: Color
    let text: Color
    let meta: Color

    static let all: [CardTheme] = [
        CardTheme(id: "evergreen", name: "Evergreen", background: Brand.evergreen, text: Brand.ivory, meta: Brand.ivory.opacity(0.6)),
        CardTheme(id: "ivory", name: "Ivory", background: Brand.ivory, text: Brand.ink, meta: Brand.stone),
        CardTheme(id: "parchment", name: "Parchment", background: Brand.parchment, text: Brand.ink, meta: Brand.stone),
        CardTheme(id: "ink", name: "Deep ink", background: Brand.ink, text: Brand.ivory, meta: Brand.ivory.opacity(0.55)),
    ]
}

struct CardComposerView: View {
    @EnvironmentObject var library: LibraryStore
    @Environment(\.dismiss) private var dismiss
    @StateObject private var client = AIClient()

    let selection: VerseSelection
    let scriptureText: String

    @State private var themeId = "evergreen"
    @State private var personalText = ""
    @State private var typeSize: Double = 26
    @State private var exportMessage: String?
    @State private var suggestions: [String] = []
    @State private var crafting = false
    @State private var craftError: String?

    private var theme: CardTheme { CardTheme.all.first { $0.id == themeId } ?? CardTheme.all[0] }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    practiceIntro

                    cardPreview

                    confessionSection
                    themePicker
                    sizeSlider

                    if let exportMessage {
                        Text(exportMessage).font(.system(size: 13)).foregroundStyle(Brand.hunter)
                    }

                    actions
                }
                .padding(20)
            }
            .background(Brand.ivory.ignoresSafeArea())
            .navigationTitle("Confession card")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .cancellationAction) { Button("Close") { dismiss() } } }
        }
    }

    /// WYSIWYG: the preview IS the export — same 393x852pt canvas the image
    /// renderer uses, scaled down visually. Fonts, wrapping, and spacing in
    /// the preview match the saved PNG exactly.
    private var cardPreview: some View {
        let canvas = CGSize(width: 393, height: 852)
        let previewHeight: CGFloat = 420
        let scale = previewHeight / canvas.height
        return ScriptureCardView(
            scripture: scriptureText,
            reference: selection.reference,
            translation: "KJV",
            personalText: personalText.isEmpty ? nil : personalText,
            theme: theme,
            typeSize: typeSize
        )
        .frame(width: canvas.width, height: canvas.height)
        .clipShape(RoundedRectangle(cornerRadius: 56))
        .scaleEffect(scale)
        .frame(width: canvas.width * scale, height: previewHeight)
        .shadow(color: .black.opacity(0.15), radius: 20, y: 10)
    }

    /// Why this exists: meditate (Hebrew "hagah") literally means to mutter —
    /// to keep the word on your lips through the day.
    private var practiceIntro: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("Meditate. Mutter. Remember.")
                .font(.system(size: 12, weight: .semibold)).textCase(.uppercase).kerning(1)
                .foregroundStyle(Brand.hunter)
            Text("\u{201C}Meditate\u{201D} in Scripture (Joshua 1:8, Psalm 1:2) is the Hebrew *hagah* — to murmur, to mutter. This card pairs the verse with a confession in your own voice, built on its meaning, to keep on your lips through the day.")
                .font(.system(size: 13))
                .foregroundStyle(Brand.ink.opacity(0.75))
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(RoundedRectangle(cornerRadius: 12).fill(Brand.parchment.opacity(0.55)))
    }

    private var confessionSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Your confession")
                .font(.system(size: 12, weight: .medium)).foregroundStyle(Brand.stone)

            TextField("In your own words\u{2026} or craft one below", text: $personalText, axis: .vertical)
                .font(.system(size: 15))
                .padding(12)
                .background(RoundedRectangle(cornerRadius: 12).fill(Brand.paper))

            Button {
                Task { await craft() }
            } label: {
                if crafting {
                    HStack(spacing: 8) { ProgressView().tint(Brand.hunter); Text("Listening to the passage\u{2026}") }
                        .font(.system(size: 14))
                } else {
                    Label(suggestions.isEmpty ? "Craft a confession from this verse" : "Craft fresh options",
                          systemImage: "sparkle")
                        .font(.system(size: 14, weight: .semibold))
                }
            }
            .buttonStyle(.bordered)
            .tint(Brand.hunter)
            .disabled(crafting)

            if let craftError {
                Text(craftError).font(.system(size: 12)).foregroundStyle(Brand.ink.opacity(0.7))
            }

            ForEach(suggestions, id: \.self) { suggestion in
                Button {
                    personalText = suggestion
                } label: {
                    HStack(alignment: .top, spacing: 8) {
                        Image(systemName: personalText == suggestion ? "checkmark.circle.fill" : "circle")
                            .font(.system(size: 14))
                            .foregroundStyle(Brand.hunter)
                            .padding(.top, 2)
                        Text(suggestion)
                            .font(.system(size: 14))
                            .foregroundStyle(Brand.ink.opacity(0.85))
                            .multilineTextAlignment(.leading)
                    }
                    .padding(10)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(RoundedRectangle(cornerRadius: 10).fill(
                        personalText == suggestion ? Brand.hunter.opacity(0.08) : Brand.paper))
                    .overlay(RoundedRectangle(cornerRadius: 10).stroke(
                        personalText == suggestion ? Brand.hunter.opacity(0.4) : Brand.stone.opacity(0.2)))
                }
                .buttonStyle(.plain)
            }

            Text(suggestions.isEmpty
                 ? "Your words appear separately below the verse and are always distinguished from Scripture."
                 : "Crafted from the passage's meaning — tap one, then edit it until it sounds like you.")
                .font(.system(size: 11)).foregroundStyle(Brand.stone)
        }
    }

    private func craft() async {
        crafting = true
        craftError = nil
        do {
            suggestions = try await client.craftConfessions(passageId: selection.passageId)
        } catch {
            craftError = error.localizedDescription
        }
        crafting = false
    }

    private var themePicker: some View {
        HStack(spacing: 12) {
            ForEach(CardTheme.all) { t in
                Button {
                    themeId = t.id
                } label: {
                    Circle().fill(t.background)
                        .frame(width: 36, height: 36)
                        .overlay(Circle().stroke(themeId == t.id ? Brand.hunter : Brand.stone.opacity(0.3),
                                                 lineWidth: themeId == t.id ? 2 : 1))
                }
                .accessibilityLabel("\(t.name) theme")
            }
        }
    }

    private var sizeSlider: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("Text size").font(.system(size: 12, weight: .medium)).foregroundStyle(Brand.stone)
            Slider(value: $typeSize, in: 18...36, step: 1).tint(Brand.hunter)
        }
    }

    private var actions: some View {
        VStack(spacing: 10) {
            Button {
                exportToPhotos()
            } label: {
                Label("Save to Photos", systemImage: "square.and.arrow.down")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.borderedProminent).tint(Brand.hunter)

            ShareLink(item: Image(uiImage: renderImage()), preview: SharePreview(selection.reference, image: Image(uiImage: renderImage()))) {
                Label("Share", systemImage: "square.and.arrow.up").frame(maxWidth: .infinity)
            }
            .buttonStyle(.bordered).tint(Brand.hunter)

            Button {
                saveToLibrary()
            } label: {
                Label("Save to Library", systemImage: "books.vertical").frame(maxWidth: .infinity)
            }
            .buttonStyle(.bordered).tint(Brand.hunter)
        }
    }

    // MARK: Deterministic export (lock-screen resolution)

    @MainActor
    private func renderImage() -> UIImage {
        let card = ScriptureCardView(
            scripture: scriptureText,
            reference: selection.reference,
            translation: "KJV",
            personalText: personalText.isEmpty ? nil : personalText,
            theme: theme,
            typeSize: typeSize
        )
        .frame(width: 393, height: 852) // iPhone point canvas; 3x scale below

        let renderer = ImageRenderer(content: card)
        renderer.scale = 3
        return renderer.uiImage ?? UIImage()
    }

    private func exportToPhotos() {
        let image = renderImage()
        UIImageWriteToSavedPhotosAlbum(image, nil, nil, nil)
        exportMessage = "Saved to Photos."
    }

    private func saveToLibrary() {
        library.addCard(SavedCard(
            id: UUID(),
            reference: selection.reference,
            scriptureText: scriptureText,
            translation: "KJV",
            attribution: "Public Domain",
            personalText: personalText.isEmpty ? nil : personalText,
            themeName: themeId,
            createdAt: Date()
        ))
        exportMessage = "Saved to your Library."
    }
}

/// The card itself. Exact Scripture wording, attribution, reference;
/// personal text in a clearly distinct block. Quiet, minimal, on-brand.
struct ScriptureCardView: View {
    let scripture: String
    let reference: String
    let translation: String
    let personalText: String?
    let theme: CardTheme
    let typeSize: Double

    var body: some View {
        ZStack {
            theme.background
            VStack(spacing: 0) {
                Spacer(minLength: 70)

                // Confession first — the reader's own voice, top of the card
                if let personalText {
                    Text(personalText)
                        .font(.system(size: max(16, typeSize * 0.8)))
                        .italic()
                        .foregroundStyle(theme.text.opacity(0.92))
                        .multilineTextAlignment(.center)
                        .lineSpacing(4)
                        .minimumScaleFactor(0.5)
                        .padding(.horizontal, 40)
                }

                Spacer(minLength: 30)

                starDivider

                Spacer(minLength: 30)

                // Scripture — exact text, serif, always shown in full
                // (minimumScaleFactor shrinks long passages to fit rather than clipping)
                VStack(spacing: 14) {
                    Text("\u{201C}\(scripture)\u{201D}")
                        .font(.system(size: typeSize, design: .serif))
                        .foregroundStyle(theme.text)
                        .multilineTextAlignment(.center)
                        .lineSpacing(5)
                        .minimumScaleFactor(0.35)
                        .padding(.horizontal, 36)

                    Text("\(reference) \u{00B7} \(translation)")
                        .font(.system(size: 13, weight: .medium))
                        .kerning(1)
                        .foregroundStyle(theme.meta)
                }

                Spacer(minLength: 70)
            }

            // Quiet credit line — cards travel (texts, stories), and this is
            // the only trace of where they came from. Kept in the meta tone
            // so it reads as a colophon, never an ad.
            VStack {
                Spacer()
                Text("versefold.app")
                    .font(.system(size: 11, weight: .medium))
                    .kerning(1.2)
                    .foregroundStyle(theme.meta.opacity(0.7))
                    .padding(.bottom, 26)
            }
        }
    }

    /// Hairline — four-point star — hairline. Echoes the star in the brand mark.
    private var starDivider: some View {
        HStack(spacing: 14) {
            Rectangle().fill(theme.meta.opacity(0.45)).frame(height: 1)
            FourPointStar()
                .fill(theme.meta.opacity(0.9))
                .frame(width: 16, height: 16)
            Rectangle().fill(theme.meta.opacity(0.45)).frame(height: 1)
        }
        .padding(.horizontal, 56)
    }
}

/// The brand's four-point star: points at the compass ends with gentle
/// concave curves toward the center.
struct FourPointStar: Shape {
    func path(in rect: CGRect) -> Path {
        let center = CGPoint(x: rect.midX, y: rect.midY)
        let rx = rect.width / 2
        let ry = rect.height / 2
        var path = Path()
        path.move(to: CGPoint(x: center.x, y: center.y - ry))
        path.addQuadCurve(to: CGPoint(x: center.x + rx, y: center.y), control: center)
        path.addQuadCurve(to: CGPoint(x: center.x, y: center.y + ry), control: center)
        path.addQuadCurve(to: CGPoint(x: center.x - rx, y: center.y), control: center)
        path.addQuadCurve(to: CGPoint(x: center.x, y: center.y - ry), control: center)
        path.closeSubpath()
        return path
    }
}
