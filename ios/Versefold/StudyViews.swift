import SwiftUI

/// Studies tab: the user's own guided studies — active, paused, completed.
/// A personal workspace, not a catalog. No streaks anywhere.
struct StudiesView: View {
    @EnvironmentObject var library: LibraryStore
    @Environment(\.dismiss) private var dismiss
    @State private var showBuilder = false

    var body: some View {
        NavigationStack {
            Group {
                if library.studies.isEmpty {
                    emptyState
                } else {
                    List {
                        ForEach(library.studies) { plan in
                            NavigationLink(value: plan.id) { studyRow(plan) }
                        }
                        .onDelete { offsets in
                            for offset in offsets { library.removeStudy(library.studies[offset].id) }
                        }
                    }
                    .listStyle(.plain)
                }
            }
            .navigationTitle("Studies")
            .navigationDestination(for: UUID.self) { id in
                if let plan = library.studies.first(where: { $0.id == id }) {
                    StudyDetailView(planId: plan.id)
                }
            }
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Done") { dismiss() }
                }
                ToolbarItem(placement: .primaryAction) {
                    Button { showBuilder = true } label: { Image(systemName: "plus") }
                        .tint(Brand.hunter)
                        .accessibilityLabel("Create study")
                }
            }
            .sheet(isPresented: $showBuilder) { StudyBuilderView(prefill: nil) }
            .background(Brand.ivory.ignoresSafeArea())
        }
    }

    private var emptyState: some View {
        VStack(spacing: 10) {
            Image(systemName: "book.closed").font(.system(size: 34)).foregroundStyle(Brand.stone)
            Text("No studies yet").font(.scripture(size: 22)).foregroundStyle(Brand.ink)
            Text("Select a passage while reading and choose \u{201C}Create study\u{201D}, or start one here.")
                .font(.system(size: 14)).foregroundStyle(Brand.stone)
                .multilineTextAlignment(.center).padding(.horizontal, 40)
            Button("Create a study") { showBuilder = true }
                .buttonStyle(.borderedProminent).tint(Brand.hunter)
        }
    }

    private func studyRow(_ plan: StudyPlan) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(plan.title).font(.system(size: 16, weight: .semibold)).foregroundStyle(Brand.ink)
                Spacer()
                if plan.state == .paused {
                    Text("Paused").font(.system(size: 11, weight: .medium))
                        .padding(.horizontal, 8).padding(.vertical, 3)
                        .background(Capsule().fill(Brand.parchment)).foregroundStyle(Brand.ink.opacity(0.7))
                }
            }
            let done = plan.days.filter(\.completed).count
            Text("\(plan.days.count) days · \(done) completed")
                .font(.system(size: 13)).foregroundStyle(Brand.stone)
        }
        .padding(.vertical, 4)
    }
}

// MARK: - Study builder

struct StudyBuilderView: View {
    @EnvironmentObject var library: LibraryStore
    @Environment(\.dismiss) private var dismiss
    @StateObject private var client = AIClient()

    let prefill: VerseSelection?

    @State private var theme = ""
    @State private var days = 7
    @State private var minutes = 15
    @State private var depth = "standard"
    @State private var generating = false
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            Form {
                Section("Source") {
                    if let prefill {
                        Label(prefill.reference, systemImage: "text.book.closed")
                            .foregroundStyle(Brand.hunter)
                    } else {
                        TextField("Passage, book, or theme (e.g. \u{201C}rest\u{201D})", text: $theme)
                    }
                }
                Section("Shape") {
                    Picker("Length", selection: $days) {
                        Text("3 days").tag(3); Text("7 days").tag(7); Text("14 days").tag(14)
                    }
                    Picker("Time each day", selection: $minutes) {
                        Text("10 minutes").tag(10); Text("15 minutes").tag(15)
                        Text("20 minutes").tag(20); Text("30 minutes").tag(30)
                    }
                    Picker("Depth", selection: $depth) {
                        Text("Gentle").tag("gentle"); Text("Standard").tag("standard"); Text("Deeper").tag("deeper")
                    }
                }
                if let errorMessage {
                    Section { Text(errorMessage).foregroundStyle(Brand.ink.opacity(0.8)) }
                }
                Section {
                    Button {
                        Task { await generate() }
                    } label: {
                        if generating {
                            HStack { ProgressView().tint(.white); Text("Preparing your study…") }
                                .frame(maxWidth: .infinity)
                        } else {
                            Text("Create study").frame(maxWidth: .infinity)
                        }
                    }
                    .buttonStyle(.borderedProminent).tint(Brand.hunter)
                    .disabled(generating || (prefill == nil && theme.trimmingCharacters(in: .whitespaces).isEmpty))
                } footer: {
                    Text("Studies are saved to your device. Pause or return anytime — there are no streaks and nothing expires.")
                }
            }
            .navigationTitle("New study")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } } }
        }
    }

    private func generate() async {
        generating = true
        errorMessage = nil
        do {
            let res = try await client.generateStudy(
                source: prefill?.passageId ?? theme,
                sourceType: prefill != nil ? "passage" : "theme",
                days: days, minutesPerDay: minutes, depth: depth, lens: nil
            )
            let plan = StudyPlan(
                id: UUID(),
                title: res.plan.title,
                description: res.plan.description,
                days: res.plan.days.map {
                    StudyDay(
                        dayNumber: $0.dayNumber, title: $0.title,
                        primaryReading: $0.primaryReading, supportingReadings: $0.supportingReadings,
                        context: $0.context, centralTheme: $0.centralTheme,
                        reflectionQuestions: $0.reflectionQuestions, prayerPrompt: $0.prayerPrompt,
                        practicalResponse: $0.practicalResponse, personalNote: "", completed: false
                    )
                },
                state: .active, createdAt: Date(),
                promptVersion: "study-v1", modelVersion: "server"
            )
            library.addStudy(plan)
            dismiss()
        } catch {
            errorMessage = error.localizedDescription
        }
        generating = false
    }
}

// MARK: - Study detail (day list, pause/resume, personal notes)

struct StudyDetailView: View {
    @EnvironmentObject var library: LibraryStore
    @EnvironmentObject var scripture: ScriptureStore
    let planId: UUID

    private var plan: StudyPlan? { library.studies.first { $0.id == planId } }

    var body: some View {
        if let plan {
            List {
                Section {
                    Text(plan.description).font(.system(size: 14)).foregroundStyle(Brand.ink.opacity(0.8))
                    Button(plan.state == .paused ? "Resume study" : "Pause study") {
                        var updated = plan
                        updated.state = plan.state == .paused ? .active : .paused
                        library.updateStudy(updated)
                    }
                    .tint(Brand.hunter)
                }
                ForEach(plan.days) { day in
                    Section("Day \(day.dayNumber) — \(day.title)") {
                        dayView(plan: plan, day: day)
                    }
                }
            }
            .navigationTitle(plan.title)
            .navigationBarTitleDisplayMode(.inline)
        } else {
            Text("Study not found.").foregroundStyle(Brand.stone)
        }
    }

    @ViewBuilder
    private func dayView(plan: StudyPlan, day: StudyDay) -> some View {
        Button {
            jump(to: day.primaryReading, plan: plan, day: day)
        } label: {
            Label(Self.displayRef(day.primaryReading), systemImage: "book")
                .foregroundStyle(Brand.hunter)
        }
        if !day.supportingReadings.isEmpty {
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    Text("Also:").font(.system(size: 13)).foregroundStyle(Brand.stone)
                    ForEach(day.supportingReadings, id: \.self) { ref in
                        Button {
                            jump(to: ref, plan: plan, day: day)
                        } label: {
                            Text(Self.displayRef(ref))
                                .font(.system(size: 13, weight: .medium))
                                .foregroundStyle(Brand.hunter)
                                .padding(.horizontal, 10).padding(.vertical, 5)
                                .background(Capsule().fill(Brand.hunter.opacity(0.08)))
                        }
                        // .plain keeps each chip its own tap target inside the
                        // List row (otherwise one tap fires every button).
                        .buttonStyle(.plain)
                    }
                }
            }
        }
        Text(day.context).font(.system(size: 14))
        Text(day.centralTheme).font(.system(size: 14, weight: .semibold))
        ForEach(day.reflectionQuestions, id: \.self) { q in
            Label(q, systemImage: "questionmark.circle").font(.system(size: 14))
        }
        Label(day.prayerPrompt, systemImage: "hands.sparkles").font(.system(size: 14)).foregroundStyle(Brand.ink.opacity(0.8))
        TextField("Personal note (private)", text: noteBinding(plan: plan, day: day), axis: .vertical)
            .font(.system(size: 14))
        Toggle("Mark day complete", isOn: completedBinding(plan: plan, day: day))
            .tint(Brand.hunter)
    }

    private func jump(to osisRef: String, plan: StudyPlan, day: StudyDay) {
        let parts = osisRef.split(separator: "-").first.map(String.init) ?? osisRef
        let segments = parts.split(separator: ".")
        guard segments.count >= 2, let chapter = Int(segments[1]) else { return }
        // Leave a breadcrumb so the reader can offer a quick way back here.
        scripture.markStudyJump(.init(planId: plan.id, title: plan.title, day: day.dayNumber))
        // Verse-level readings (JOS.1.5) land centered on that verse.
        scripture.jumpVerse = segments.count >= 3 ? Int(segments[2]) : nil
        scripture.location = ReadingLocation(osis: String(segments[0]), chapter: chapter)
    }

    /// "GEN.2.15" -> "GEN 2:15", "COL.3.23-COL.3.24" -> "COL 3:23-24"
    static func displayRef(_ ref: String) -> String {
        func side(_ s: String) -> String {
            let seg = s.split(separator: ".").map(String.init)
            if seg.count >= 3 { return "\(seg[0]) \(seg[1]):\(seg[2])" }
            if seg.count == 2 { return "\(seg[0]) \(seg[1])" }
            return s
        }
        let sides = ref.split(separator: "-").map(String.init)
        guard sides.count == 2 else { return side(ref) }
        let a = sides[0].split(separator: ".").map(String.init)
        let b = sides[1].split(separator: ".").map(String.init)
        if a.count >= 3, b.count >= 3, a[0] == b[0], a[1] == b[1] {
            return "\(side(sides[0]))-\(b[2])" // same chapter: collapse the range
        }
        return "\(side(sides[0]))-\(side(sides[1]))"
    }

    private func noteBinding(plan: StudyPlan, day: StudyDay) -> Binding<String> {
        Binding(
            get: { library.studies.first { $0.id == plan.id }?.days.first { $0.dayNumber == day.dayNumber }?.personalNote ?? "" },
            set: { newValue in
                var updated = plan
                if let idx = updated.days.firstIndex(where: { $0.dayNumber == day.dayNumber }) {
                    updated.days[idx].personalNote = newValue
                    library.updateStudy(updated)
                }
            }
        )
    }

    private func completedBinding(plan: StudyPlan, day: StudyDay) -> Binding<Bool> {
        Binding(
            get: { library.studies.first { $0.id == plan.id }?.days.first { $0.dayNumber == day.dayNumber }?.completed ?? false },
            set: { newValue in
                var updated = plan
                if let idx = updated.days.firstIndex(where: { $0.dayNumber == day.dayNumber }) {
                    updated.days[idx].completed = newValue
                    if updated.days.allSatisfy(\.completed) { updated.state = .completed }
                    library.updateStudy(updated)
                }
            }
        )
    }
}
