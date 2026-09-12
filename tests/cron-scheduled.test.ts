import { describe, it, expect, vi } from "vitest";
import { dispatchScheduled } from "../lib/cron/scheduled";
const cron = "0 1 * * *";
const env = { CRON_SECRET: "test-secret", CRON_ROUTES: JSON.stringify({ [cron]: ["/api/cron/spotify-sync"] }) };
describe("scheduled dispatch", () => {
  it("rejects missing secrets and unmapped schedules without dispatch", async () => {
    const dispatch = vi.fn();
    await expect(dispatchScheduled(cron, {}, dispatch)).rejects.toThrow("CRON_SECRET");
    await expect(dispatchScheduled("other", env, dispatch)).rejects.toThrow("no configured");
    expect(dispatch).not.toHaveBeenCalled();
  });
  it("rejects arbitrary destinations before forwarding credentials", async () => {
    const dispatch = vi.fn();
    await expect(dispatchScheduled(cron, { ...env, CRON_ROUTES: JSON.stringify({ [cron]: ["https://example.com"] }) }, dispatch)).rejects.toThrow("Invalid cron route");
    expect(dispatch).not.toHaveBeenCalled();
  });
  it("dispatches the authenticated internal route", async () => {
    const dispatch = vi.fn(async (_request: Request) => Response.json({ success: true }));
    await dispatchScheduled(cron, env, dispatch);
    const request = dispatch.mock.calls[0][0] as Request;
    expect(new URL(request.url).pathname).toBe("/api/cron/spotify-sync");
    expect(request.headers.get("authorization")).toBe("Bearer test-secret");
  });
  it("propagates HTTP and per-user failures", async () => {
    await expect(dispatchScheduled(cron, env, async () => new Response("", { status: 500 }))).rejects.toThrow("500");
    await expect(dispatchScheduled(cron, env, async () => Response.json({ results: [{ status: "failed" }] }))).rejects.toThrow("reported failures");
  });
});
