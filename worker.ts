// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore OpenNext generates this module during cf:build.
import handler from "./.open-next/worker.js";
import { dispatchScheduled } from "./lib/cron/scheduled";

const worker = {
  fetch: handler.fetch,
  async scheduled(event: { cron: string }, env: { CRON_SECRET?: string; CRON_ROUTES?: string }, ctx: unknown) {
    await dispatchScheduled(event.cron, env, request => handler.fetch(request, env, ctx));
  },
};

export default worker;
