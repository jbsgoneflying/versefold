/**
 * Durable artifact + metering store. JSON-file for the vertical slice / beta;
 * the interface maps 1:1 onto Postgres tables for scale (see architecture doc).
 * Artifacts are user-owned: listable, exportable, and deletable per device.
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname } from "node:path";
import { randomUUID } from "node:crypto";

export interface Artifact {
  id: string;
  deviceId: string;
  type: "explanation" | "study" | "card" | "ask";
  createdAt: string;
  promptVersion: string;
  modelVersion: string;
  payload: unknown;
}

export interface UsageRecord {
  deviceId: string;
  date: string; // YYYY-MM-DD
  requests: number;
  inputTokens: number;
  outputTokens: number;
}

/**
 * A background study generation. POST creates one and returns immediately;
 * the app polls until it's complete (or failed) — readers keep reading while
 * the study builds.
 */
export interface StudyJob {
  id: string;
  deviceId: string;
  status: "running" | "complete" | "failed";
  createdAt: string;
  daysReady: number;
  totalDays: number;
  artifactId?: string;
  plan?: unknown;
  dropped?: string[];
  error?: string;
}

interface StoreShape {
  artifacts: Artifact[];
  usage: UsageRecord[];
  feedback: Array<{ id: string; deviceId: string; createdAt: string; message: string; context?: string }>;
  studyJobs?: StudyJob[];
}

export class Store {
  private data: StoreShape = { artifacts: [], usage: [], feedback: [], studyJobs: [] };

  constructor(private readonly filePath: string) {
    if (existsSync(filePath)) {
      try {
        this.data = JSON.parse(readFileSync(filePath, "utf8")) as StoreShape;
      } catch {
        // start fresh on corrupt store
      }
    }
    this.data.studyJobs ??= [];
    // Jobs from a previous process are orphans — their generation died with it.
    for (const job of this.data.studyJobs) {
      if (job.status === "running") {
        job.status = "failed";
        job.error = "The study build was interrupted. Please try again.";
      }
    }
  }

  private persist(): void {
    mkdirSync(dirname(this.filePath), { recursive: true });
    writeFileSync(this.filePath, JSON.stringify(this.data, null, 2));
  }

  saveArtifact(a: Omit<Artifact, "id" | "createdAt">): Artifact {
    const artifact: Artifact = { ...a, id: randomUUID(), createdAt: new Date().toISOString() };
    this.data.artifacts.push(artifact);
    this.persist();
    return artifact;
  }

  listArtifacts(deviceId: string): Artifact[] {
    return this.data.artifacts.filter((a) => a.deviceId === deviceId);
  }

  /** Delete AI history for a device (product requirement: user data deletable). */
  deleteArtifacts(deviceId: string): number {
    const before = this.data.artifacts.length;
    this.data.artifacts = this.data.artifacts.filter((a) => a.deviceId !== deviceId);
    this.persist();
    return before - this.data.artifacts.length;
  }

  recordUsage(deviceId: string, inputTokens: number, outputTokens: number): UsageRecord {
    const date = new Date().toISOString().slice(0, 10);
    let rec = this.data.usage.find((u) => u.deviceId === deviceId && u.date === date);
    if (!rec) {
      rec = { deviceId, date, requests: 0, inputTokens: 0, outputTokens: 0 };
      this.data.usage.push(rec);
    }
    rec.requests += 1;
    rec.inputTokens += inputTokens;
    rec.outputTokens += outputTokens;
    this.persist();
    return rec;
  }

  usageToday(deviceId: string): UsageRecord | undefined {
    const date = new Date().toISOString().slice(0, 10);
    return this.data.usage.find((u) => u.deviceId === deviceId && u.date === date);
  }

  totalUsage(): { requests: number; inputTokens: number; outputTokens: number } {
    return this.data.usage.reduce(
      (acc, u) => ({
        requests: acc.requests + u.requests,
        inputTokens: acc.inputTokens + u.inputTokens,
        outputTokens: acc.outputTokens + u.outputTokens,
      }),
      { requests: 0, inputTokens: 0, outputTokens: 0 }
    );
  }

  /** Per-day rollup for cost monitoring dashboards / launch runbook. */
  dailyUsage(): Array<{ date: string; devices: number; requests: number; inputTokens: number; outputTokens: number }> {
    const byDate = new Map<string, { devices: Set<string>; requests: number; inputTokens: number; outputTokens: number }>();
    for (const u of this.data.usage) {
      const day = byDate.get(u.date) ?? { devices: new Set(), requests: 0, inputTokens: 0, outputTokens: 0 };
      day.devices.add(u.deviceId);
      day.requests += u.requests;
      day.inputTokens += u.inputTokens;
      day.outputTokens += u.outputTokens;
      byDate.set(u.date, day);
    }
    return [...byDate.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, d]) => ({
        date,
        devices: d.devices.size,
        requests: d.requests,
        inputTokens: d.inputTokens,
        outputTokens: d.outputTokens,
      }));
  }

  createStudyJob(deviceId: string, totalDays: number): StudyJob {
    const job: StudyJob = {
      id: randomUUID(),
      deviceId,
      status: "running",
      createdAt: new Date().toISOString(),
      daysReady: 0,
      totalDays,
    };
    this.data.studyJobs!.push(job);
    // Completed jobs only matter until the app collects them; keep the tail.
    if (this.data.studyJobs!.length > 200) {
      this.data.studyJobs = this.data.studyJobs!.slice(-200);
    }
    this.persist();
    return job;
  }

  updateStudyJob(id: string, patch: Partial<Omit<StudyJob, "id" | "deviceId" | "createdAt">>): StudyJob | undefined {
    const job = this.data.studyJobs!.find((j) => j.id === id);
    if (!job) return undefined;
    Object.assign(job, patch);
    this.persist();
    return job;
  }

  getStudyJob(id: string): StudyJob | undefined {
    return this.data.studyJobs!.find((j) => j.id === id);
  }

  saveFeedback(deviceId: string, message: string, context?: string) {
    const item = { id: randomUUID(), deviceId, createdAt: new Date().toISOString(), message, context };
    this.data.feedback.push(item);
    this.persist();
    return item;
  }
}
