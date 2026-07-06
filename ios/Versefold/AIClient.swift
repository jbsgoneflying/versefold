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

    private func request(_ path: String, method: String = "GET", body: [String: Any]? = nil) async throws -> Data {
        var req = URLRequest(url: Self.baseURL.appendingPathComponent(path))
        req.httpMethod = method
        req.setValue(Self.deviceId, forHTTPHeaderField: "x-versefold-device")
        req.timeoutInterval = 60
        if let body {
            req.setValue("application/json", forHTTPHeaderField: "Content-Type")
            req.httpBody = try JSONSerialization.data(withJSONObject: body)
        }

        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await URLSession.shared.data(for: req)
        } catch {
            throw AIError.offline
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
