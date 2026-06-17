import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { fixtureTracks } from "../lib/analysis/fixtures";
import { parseLrc } from "../lib/analysis/adapters/lrc";
import type { AnalysisCandidate, TrackIdentity } from "../lib/analysis/types";

const PORT = Number(process.env.LOCAL_ANALYSIS_WORKER_PORT || 8788);

const server = createServer(async (request, response) => {
  if (request.method === "GET" && request.url === "/health") {
    sendJson(response, 200, { ok: true, service: "saeshify-local-analysis-worker" });
    return;
  }

  if (request.method === "POST" && request.url === "/analyze") {
    const body = await readJson<{ track?: TrackIdentity }>(request);
    const track = body.track || fixtureTracks[0];
    const fixture = fixtureTracks[0];
    const parsed = parseLrc(fixture.lrc, "local-worker", track.durationMs || fixture.durationMs);
    const candidate: AnalysisCandidate = {
      source: "local-worker",
      track: { ...track, durationMs: track.durationMs || fixture.durationMs },
      words: parsed.words.map((word) => ({ ...word, source: "local-worker", confidence: 0.86 })),
      lines: parsed.lines,
      confidence: 0.86,
      message: "local worker stub used fixture timing. replace with whisperx adapter for real audio."
    };
    sendJson(response, 200, candidate);
    return;
  }

  sendJson(response, 404, { error: "not found" });
});

server.listen(PORT, () => {
  console.log(`saeshify local analysis worker listening on http://localhost:${PORT}`);
});

function sendJson(response: ServerResponse<IncomingMessage>, status: number, data: unknown) {
  response.writeHead(status, { "content-type": "application/json" });
  response.end(JSON.stringify(data));
}

async function readJson<T>(request: IncomingMessage): Promise<T> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  if (chunks.length === 0) return {} as T;
  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as T;
}
