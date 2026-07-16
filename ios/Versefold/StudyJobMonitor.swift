import SwiftUI

/// Watches a background study build on the server so the reader never has to.
/// The builder starts a job and can be dismissed immediately; this monitor
/// polls quietly, saves the finished plan to the Library, and raises a soft
/// "your study is ready" signal for the reader. A pending job survives app
/// restarts (the server keeps building either way).
@MainActor
final class StudyJobMonitor: ObservableObject {
    struct PendingJob: Codable, Equatable {
        let jobId: String
        let sourceLabel: String // what the reader asked for, e.g. "Psalm 23"
    }

    struct ReadyStudy: Equatable, Identifiable {
        let planId: UUID
        let title: String
        var id: UUID { planId }
    }

    @Published private(set) var pending: PendingJob?
    @Published private(set) var daysReady = 0
    @Published private(set) var totalDays = 0
    /// A finished study, saved to the Library, waiting to be noticed.
    /// The reader's chip and the builder's auto-open both consume this.
    @Published var ready: ReadyStudy?
    /// A build that failed while the reader was elsewhere.
    @Published var failureMessage: String?

    private let client = AIClient()
    private let library: LibraryStore
    private var pollTask: Task<Void, Never>?
    private static let pendingKey = "pendingStudyJob"

    init(library: LibraryStore) {
        self.library = library
        // Resume watching a job started before the app was quit.
        if let data = UserDefaults.standard.data(forKey: Self.pendingKey),
           let job = try? JSONDecoder().decode(PendingJob.self, from: data) {
            pending = job
            poll(job)
        }
    }

    var isBuilding: Bool { pending != nil }

    /// Start a server-side build and begin watching it. Throws only when the
    /// job cannot be STARTED (offline, quota) — build failures surface later
    /// through `failureMessage`.
    func start(
        source: String,
        sourceType: String,
        days: Int,
        minutesPerDay: Int,
        depth: String,
        sourceLabel: String
    ) async throws {
        let started = try await client.startStudyJob(
            source: source, sourceType: sourceType,
            days: days, minutesPerDay: minutesPerDay, depth: depth, lens: nil
        )
        failureMessage = nil
        ready = nil
        daysReady = 0
        totalDays = started.totalDays
        let job = PendingJob(jobId: started.jobId, sourceLabel: sourceLabel)
        pending = job
        persist(job)
        poll(job)
    }

    func dismissReady() { ready = nil }
    func dismissFailure() { failureMessage = nil }

    private func poll(_ job: PendingJob) {
        pollTask?.cancel()
        pollTask = Task { [weak self] in
            var misses = 0
            while !Task.isCancelled {
                try? await Task.sleep(for: .seconds(2))
                guard let self, self.pending?.jobId == job.jobId else { return }
                do {
                    let status = try await self.client.studyJobStatus(job.jobId)
                    misses = 0
                    self.daysReady = status.daysReady
                    self.totalDays = status.totalDays
                    switch status.status {
                    case "complete":
                        self.finish(job, plan: status.plan)
                        return
                    case "failed":
                        self.fail(job, message: status.error)
                        return
                    default:
                        break // still running
                    }
                } catch {
                    // Transient blips are fine — the server keeps building.
                    // Give up only after ~a minute of continuous failures.
                    misses += 1
                    if misses >= 30 {
                        self.fail(job, message: "We lost touch with your study build. Please try again.")
                        return
                    }
                }
            }
        }
    }

    private func finish(_ job: PendingJob, plan dto: StudyPlanDTO?) {
        clear(job)
        guard let dto else {
            failureMessage = "Your study came back empty. Please try again."
            return
        }
        let plan = StudyPlan(
            id: UUID(),
            title: dto.title,
            description: dto.description,
            days: dto.days.map {
                StudyDay(
                    dayNumber: $0.dayNumber, title: $0.title,
                    primaryReading: $0.primaryReading, supportingReadings: $0.supportingReadings,
                    context: $0.context, centralTheme: $0.centralTheme,
                    reflectionQuestions: $0.reflectionQuestions, prayerPrompt: $0.prayerPrompt,
                    practicalResponse: $0.practicalResponse, personalNote: "", completed: false
                )
            },
            state: .active, createdAt: Date(),
            promptVersion: "study-v2", modelVersion: "server"
        )
        library.addStudy(plan)
        ready = ReadyStudy(planId: plan.id, title: plan.title)
    }

    private func fail(_ job: PendingJob, message: String?) {
        clear(job)
        failureMessage = message ?? "Study generation failed. Please try again."
    }

    private func clear(_ job: PendingJob) {
        if pending?.jobId == job.jobId { pending = nil }
        UserDefaults.standard.removeObject(forKey: Self.pendingKey)
    }

    private func persist(_ job: PendingJob) {
        if let data = try? JSONEncoder().encode(job) {
            UserDefaults.standard.set(data, forKey: Self.pendingKey)
        }
    }
}
