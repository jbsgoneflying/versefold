import SwiftUI

/// The one-second brand moment on cold launch. Its first frame is identical
/// to the static system launch screen (the book mark centered on ivory), so
/// boot flows into it seamlessly: the mark eases open a breath, the wordmark
/// inks in beneath it, and the whole page fades away to Scripture.
struct SplashView: View {
    /// Called when the moment is over; the owner fades this view out.
    var onFinished: () -> Void

    @State private var opened = false

    var body: some View {
        ZStack {
            Color("LaunchBackground")

            // Matches UILaunchScreen's centered UIImageName exactly.
            Image("LaunchMark")
                .scaleEffect(opened ? 1.03 : 1.0)

            Image("SplashWordmark")
                .opacity(opened ? 1 : 0)
                .offset(y: opened ? 74 : 82)
        }
        // Full-screen, not safe-area, centering: the system launch screen
        // centers its image on the whole display, and the mark must not
        // move a single point at the handoff.
        .ignoresSafeArea()
        .accessibilityHidden(true)
        .onAppear {
            withAnimation(.easeOut(duration: 0.7).delay(0.2)) {
                opened = true
            }
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.4) {
                onFinished()
            }
        }
    }
}
