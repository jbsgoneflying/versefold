import SwiftUI

/// Versefold brand palette. Hunter green is used with restraint —
/// actions and accents only, never washes.
enum Brand {
    static let ink = Color(red: 0.067, green: 0.094, blue: 0.125)          // #111820
    static let hunter = Color(red: 0.122, green: 0.227, blue: 0.180)       // #1f3a2e
    static let evergreen = Color(red: 0.090, green: 0.208, blue: 0.149)    // #173526
    static let ivory = Color(red: 0.980, green: 0.973, blue: 0.945)        // #faf8f1
    static let parchment = Color(red: 0.937, green: 0.910, blue: 0.847)    // #efe8d8
    static let stone = Color(red: 0.549, green: 0.525, blue: 0.471)        // #8c8678
    static let paper = Color.white
}

/// Reader themes: light, warm, dark, low-light. Scripture stays the focal contrast.
enum ReaderTheme: String, CaseIterable, Codable, Identifiable {
    case ivory, parchment, dark, lowLight

    var id: String { rawValue }

    var label: String {
        switch self {
        case .ivory: return "Ivory"
        case .parchment: return "Parchment"
        case .dark: return "Dark"
        case .lowLight: return "Low light"
        }
    }

    var background: Color {
        switch self {
        case .ivory: return Brand.ivory
        case .parchment: return Brand.parchment
        case .dark: return Color(red: 0.09, green: 0.10, blue: 0.11)
        case .lowLight: return Color(red: 0.05, green: 0.05, blue: 0.05)
        }
    }

    var text: Color {
        switch self {
        case .ivory, .parchment: return Brand.ink
        case .dark: return Color(red: 0.92, green: 0.90, blue: 0.86)
        case .lowLight: return Color(red: 0.72, green: 0.68, blue: 0.60)
        }
    }

    var meta: Color {
        switch self {
        case .ivory, .parchment: return Brand.stone
        case .dark, .lowLight: return Color(red: 0.55, green: 0.53, blue: 0.48)
        }
    }
}

extension Font {
    /// Scripture typography: serif, generous, Dynamic Type aware.
    static func scripture(size: CGFloat) -> Font {
        .system(size: size, design: .serif)
    }
}
