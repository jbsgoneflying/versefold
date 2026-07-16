import Foundation

/// Client for the Versefold backend. The app holds NO third-party keys;
/// every AI/scripture-remote call goes through our server, which enforces
/// rights, quotas, moderation, and citation validation.
@MainActor
final class AIClient: ObservableObject {
    /// Deployed backend. For local backend development, temporarily switch
    /// to http://localhost:8787 (requires an ATS exception for cleartext).
    static var baseURL = URL(string: "https://api.versefold.app")!

    enum AIError: LocalizedError {
        case offline
        case quota(String)
        case server(String)

        var errorDescription: String? {
            switch self {
            case .offline:
                return "The study layer isn't reachable right now. Your reading, notes, and saved studies are unaffected."
            case .quota(let message), .server(let message):
                return message
            }
        }
    }

    /// Anonymous device identity (no account required). App Attest assertion
    /// is added here when TestFlight distribution begins.
    static var deviceId: String {
        if let existing = UserDefaults.standard.string(forKey: "deviceId") { return existing }
        let fresh = UUID().uuidString
        UserDefaults.standard.set(fresh, forKey: "deviceId")
        return fresh
    }

    private func makeRequest(_ path: String, method: String, body: [String: Any]?) throws -> URLRequest {
        var req = URLRequest(url: Self.baseURL.appendingPathComponent(path))
        req.httpMethod = method
        req.setValue(Self.deviceId, forHTTPHeaderField: "x-versefold-device")
        // Generous ceiling for slow connections; generation itself is fast now.
        req.timeoutInterval = 120
        if let body {
            req.setValue("application/json", forHTTPHeaderField: "Content-Type")
            req.httpBody = try JSONSerialization.data(withJSONObject: body)
        }
        return req
    }

    private func request(_ path: String, method: String = "GET", body: [String: Any]? = nil) async throws -> Data {
        let req = try makeRequest(path, method: method, body: body)

        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await URLSession.shared.data(for: req)
        } catch {
            // One quiet retry for idempotent calls: a momentary network blip
            // must not fail a poll that would have succeeded a second later.
            guard method == "GET" else { throw AIError.offline }
            try? await Task.sleep(for: .seconds(1.5))
            do {
                (data, response) = try await URLSession.shared.data(for: req)
            } catch {
                throw AIError.offline
            }
        }

        guard let http = response as? HTTPURLResponse else { throw AIError.offline }
        if http.statusCode == 429 {
            let message = (try? JSONDecoder().decode([String: String].self, from: data))?["error"]
            throw AIError.quota(message ?? "Daily study limit reached — resets tomorrow.")
        }
        guard (200..<300).contains(http.statusCode) else {
            let message = (try? JSONDecoder().decode([String: String].self, from: data))?["error"]
            throw AIError.server(message ?? "Something went wrong. Please try again.")
        }
        return data
    }

    // MARK: AI experiences

    func explain(
        passageId: String,
        lens: String,
        question: String? = nil,
        depth: String = "standard",
        save: Bool = false
    ) async throws -> ExplainResponse {
        var body: [String: Any] = [
            "translation": "kjv",
            "passageId": passageId,
            "lens": lens,
            "depth": depth,
            "save": save,
        ]
        if let question { body["question"] = question }
        let data = try await request("v1/ai/explain", method: "POST", body: body)
        return try JSONDecoder().decode(ExplainResponse.self, from: data)
    }

    /// Streaming unfold over SSE: real sentences appear while the model still
    /// writes. `onPartial` fires on the main actor with the text so far; the
    /// returned value is the final, citation-validated response (identical to
    /// what `explain` returns). Callers should fall back to `explain` on error.
    func explainStreaming(
        passageId: String,
        lens: String,
        question: String? = nil,
        depth: String = "standard",
        save: Bool = false,
        onPartial: @escaping (ExplainPartial) -> Void
    ) async throws -> ExplainResponse {
        var body: [String: Any] = [
            "translation": "kjv",
            "passageId": passageId,
            "lens": lens,
            "depth": depth,
            "save": save,
        ]
        if let question { body["question"] = question }
        let req = try makeRequest("v1/ai/explain/stream", method: "POST", body: body)

        let bytes: URLSession.AsyncBytes
        let response: URLResponse
        do {
            (bytes, response) = try await URLSession.shared.bytes(for: req)
        } catch {
            throw AIError.offline
        }
        guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
            throw AIError.server("The study layer is busy right now. Please try again.")
        }

        let decoder = JSONDecoder()
        var eventName = ""
        for try await line in bytes.lines {
            if line.hasPrefix("event:") {
                eventName = line.dropFirst(6).trimmingCharacters(in: .whitespaces)
            } else if line.hasPrefix("data:") {
                let payload = Data(line.dropFirst(5).trimmingCharacters(in: .whitespaces).utf8)
                switch eventName {
                case "partial":
                    if let partial = try? decoder.decode(ExplainPartial.self, from: payload) {
                        onPartial(partial)
                    }
                case "complete":
                    return try decoder.decode(ExplainResponse.self, from: payload)
                case "error":
                    let message = (try? decoder.decode([String: String].self, from: payload))?["message"]
                    throw AIError.server(message ?? "Unfold failed. Please try again.")
                default:
                    break
                }
            }
        }
        throw AIError.offline // stream ended without a terminal event
    }

    func generateStudy(
        source: String,
        sourceType: String,
        days: Int,
        minutesPerDay: Int,
        depth: String,
        lens: String?
    ) async throws -> StudyGenResponse {
        var body: [String: Any] = [
            "source": source,
            "sourceType": sourceType,
            "days": days,
            "minutesPerDay": minutesPerDay,
            "depth": depth,
        ]
        if let lens { body["lens"] = lens }
        let data = try await request("v1/ai/study", method: "POST", body: body)
        return try JSONDecoder().decode(StudyGenResponse.self, from: data)
    }

    /// Kick off a background study build on the server. Returns immediately;
    /// poll `studyJobStatus` for progress. The reader keeps reading meanwhile.
    func startStudyJob(
        source: String,
        sourceType: String,
        days: Int,
        minutesPerDay: Int,
        depth: String,
        lens: String?
    ) async throws -> StudyJobStart {
        var body: [String: Any] = [
            "source": source,
            "sourceType": sourceType,
            "days": days,
            "minutesPerDay": minutesPerDay,
            "depth": depth,
        ]
        if let lens { body["lens"] = lens }
        let data = try await request("v1/ai/study/jobs", method: "POST", body: body)
        return try JSONDecoder().decode(StudyJobStart.self, from: data)
    }

    func studyJobStatus(_ jobId: String) async throws -> StudyJobStatus {
        let data = try await request("v1/ai/study/jobs/\(jobId)")
        return try JSONDecoder().decode(StudyJobStatus.self, from: data)
    }

    /// Craft short confessions built on a passage's meaning, for the card's
    /// personal section. Returns editable suggestions, never Scripture text.
    func craftConfessions(passageId: String, focus: String? = nil) async throws -> [String] {
        var body: [String: Any] = ["translation": "kjv", "passageId": passageId]
        if let focus, !focus.isEmpty { body["focus"] = focus }
        let data = try await request("v1/ai/card", method: "POST", body: body)
        struct CardResponse: Codable { let confessions: [String] }
        return try JSONDecoder().decode(CardResponse.self, from: data).confessions
    }

    /// Search by meaning: the backend embeds the query and matches it against
    /// pre-embedded KJV verses (public domain). Returns OSIS refs like "PSA.27.1";
    /// verse text is rendered from the local bundle, never sent over the wire.
    func semanticSearch(_ query: String, limit: Int = 12) async throws -> [String] {
        let data = try await request("v1/search/semantic", method: "POST",
                                     body: ["query": query, "limit": limit])
        struct Response: Codable {
            struct Hit: Codable { let ref: String }
            let hits: [Hit]
        }
        return try JSONDecoder().decode(Response.self, from: data).hits.map(\.ref)
    }

    /// Privacy: delete all server-side AI history for this device.
    func deleteAIHistory() async throws {
        _ = try await request("v1/artifacts", method: "DELETE")
    }

    func sendFeedback(_ message: String, context: String? = nil) async throws {
        var body: [String: Any] = ["message": message]
        if let context { body["context"] = context }
        _ = try await request("v1/feedback", method: "POST", body: body)
    }
}
