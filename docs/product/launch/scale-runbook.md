# Scale Runbook (referenced by architecture doc)

Trigger: sustained > 50 req/s on the API, or droplet CPU > 70% for a week, or the JSON-file
store exceeding ~100MB.

1. **Data**: move `Store` to managed Postgres (tables mirror `Artifact`/`UsageRecord`/feedback),
   move `ScriptureCache` file tier to managed Redis. Both are adapter-shaped already.
2. **Compute**: containerize the backend (Dockerfile), run 2+ instances behind a DO load
   balancer; keep nginx as edge/TLS.
3. **Edge**: CDN (Cloudflare) in front of `api.versefold.app` for cacheable scripture GETs
   (respect per-translation TTLs); landing page already static.
4. **Secrets**: move from .env files to DO/1Password-managed secrets injected at deploy.
5. **Observability**: structured logs shipped to a hosted sink; uptime checks on /health;
   p95 latency dashboards; token-spend dashboard fed by `/metrics`.
6. **Queues**: study generation moves to a background job queue (BullMQ on Redis) with a
   polling/completion endpoint — the app already treats studies as saved artifacts.
