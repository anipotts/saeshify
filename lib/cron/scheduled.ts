type CronEnv = { CRON_SECRET?: string; CRON_ROUTES?: string };
type Dispatch = (request: Request) => Promise<Response>;

// CRON_ROUTES maps approved cron expressions to one or more internal routes.
// No schedules are assumed or enabled by this module.
export async function dispatchScheduled(cron: string, env: CronEnv, dispatch: Dispatch) {
  if (!env.CRON_SECRET) throw new Error("CRON_SECRET is not configured");
  const routes: unknown = JSON.parse(env.CRON_ROUTES || "{}");
  if (!routes || typeof routes !== "object" || Array.isArray(routes)) throw new Error("Invalid CRON_ROUTES");
  const selected: unknown = (routes as Record<string, unknown>)[cron];
  if (!Array.isArray(selected) || selected.length === 0) throw new Error("Cron has no configured routes");
  const allowed = new Set(["/api/cron/notify", "/api/cron/spotify-sync"]);
  if (selected.some(route => typeof route !== "string" || !allowed.has(route))) throw new Error("Invalid cron route");
  for (const route of [...new Set(selected as string[])]) {
    const response = await dispatch(new Request(`https://scheduled.internal${route}`, {
      headers: { authorization: `Bearer ${env.CRON_SECRET}` },
    }));
    if (!response.ok) throw new Error(`Cron route ${route} failed: ${response.status}`);
    const result = await response.json() as { results?: Array<{ status?: string; error?: unknown }> };
    if (result.results?.some(item => item.status === "failed" || item.error)) throw new Error(`Cron route ${route} reported failures`);
  }
}
