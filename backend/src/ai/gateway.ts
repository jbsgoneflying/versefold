/**
 * Provider-agnostic model gateway. OpenAI (Responses API) is the first
 * provider; the interface allows fallback/substitution without touching
 * product code. Records token usage for cost metering.
 */
import { config } from "../config.js";

export interface ModelRequest {
  model: string;
  system: string;
  input: string;
  schema?: { name: string; strict: boolean; schema: Record<string, unknown> };
  maxOutputTokens?: number;
}

export interface ModelResponse {
  text: string;
  model: string;
  usage: { inputTokens: number; outputTokens: number };
}

export interface ModelGateway {
  complete(req: ModelRequest): Promise<ModelResponse>;
  moderate(text: string): Promise<{ flagged: boolean; categories?: Record<string, boolean> }>;
}

interface OpenAIResponsesBody {
  model: string;
  instructions: string;
  input: string;
  max_output_tokens?: number;
  text?: { format: { type: "json_schema"; name: string; strict: boolean; schema: Record<string, unknown> } };
}

export class OpenAIGateway implements ModelGateway {
  constructor(
    private readonly apiKey = config.openaiKey,
    private readonly base = config.openaiBase
  ) {}

  async complete(req: ModelRequest): Promise<ModelResponse> {
    const body: OpenAIResponsesBody = {
      model: req.model,
      instructions: req.system,
      input: req.input,
      max_output_tokens: req.maxOutputTokens ?? 2048,
    };
    if (req.schema) {
      body.text = {
        format: {
          type: "json_schema",
          name: req.schema.name,
          strict: req.schema.strict,
          schema: req.schema.schema,
        },
      };
    }

    const res = await fetch(`${this.base}/responses`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      const err = new Error(`Model provider error ${res.status}: ${detail.slice(0, 300)}`);
      (err as Error & { statusCode: number }).statusCode = 502;
      throw err;
    }

    const data = (await res.json()) as {
      output?: Array<{ type: string; content?: Array<{ type: string; text?: string }> }>;
      output_text?: string;
      model?: string;
      usage?: { input_tokens?: number; output_tokens?: number };
    };

    const text =
      data.output_text ??
      data.output
        ?.flatMap((item) => item.content ?? [])
        .map((c) => c.text ?? "")
        .join("") ??
      "";

    return {
      text,
      model: data.model ?? req.model,
      usage: {
        inputTokens: data.usage?.input_tokens ?? 0,
        outputTokens: data.usage?.output_tokens ?? 0,
      },
    };
  }

  async moderate(text: string): Promise<{ flagged: boolean; categories?: Record<string, boolean> }> {
    const res = await fetch(`${this.base}/moderations`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: "omni-moderation-latest", input: text }),
    });
    if (!res.ok) return { flagged: false }; // moderation outage must not block reading-adjacent features
    const data = (await res.json()) as {
      results?: Array<{ flagged: boolean; categories?: Record<string, boolean> }>;
    };
    const result = data.results?.[0];
    return { flagged: result?.flagged ?? false, categories: result?.categories };
  }
}

let gateway: ModelGateway = new OpenAIGateway();
export function getGateway(): ModelGateway {
  return gateway;
}
/** Test seam + future provider fallback. */
export function setGateway(g: ModelGateway): void {
  gateway = g;
}
