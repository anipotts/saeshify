#!/usr/bin/env npx tsx
/**
 * Priority queue worker for rhyme analysis.
 *
 * Runs on cuda5 alongside rhyme-service.py and whisperx-service.py.
 * Polls Supabase rhyme_queue for jobs, dispatches to local rhyme-service,
 * writes results back.
 *
 * Priority: P0 (user request) preempts P2 (batch background).
 *
 * Usage:
 *   npx tsx scripts/rhyme-queue-worker.ts [options]
 *
 * Options:
 *   --rhyme-url URL   Rhyme service URL (default: http://localhost:8767)
 *   --once            Process one job then exit
 */

process.loadEnvFile('.env.local');

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { hostname } from 'os';

// ─── Types ──────────────────────────────────────────────────────────────────

interface QueueJob {
  id: string;
  spotify_track_id: string;
  isrc: string | null;
  artist: string | null;
  title: string | null;
  priority: number;
  status: string;
  requested_by: string;
  worker_id: string;
  progress_pct: number;
  attempt_count: number;
  max_attempts: number;
  error_message: string | null;
}

// ─── Config ─────────────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (flag: string): string | null => {
    const idx = args.indexOf(flag);
    return idx >= 0 && idx + 1 < args.length ? args[idx + 1] : null;
  };
  return {
    rhymeUrl: get('--rhyme-url') || 'http://localhost:8767',
    once: args.includes('--once'),
  };
}

const WORKER_ID = `${hostname()}-${process.pid}`;
const POLL_INTERVAL = 3_000;
const HEARTBEAT_INTERVAL = 15_000;
const ANALYSIS_TIMEOUT = 1_800_000; // 30 minutes

// ─── Clients ────────────────────────────────────────────────────────────────

function getSupabase(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
  if (!key) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url, key);
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function log(ctx: string, step: string, msg: string) {
  const ts = new Date().toISOString().slice(11, 19);
  console.log(`[${ts}] [${ctx}] ${step}: ${msg}`);
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── Core: Claim job ────────────────────────────────────────────────────────

async function claimJob(client: SupabaseClient): Promise<QueueJob | null> {
  const { data, error } = await client.rpc('claim_next_rhyme_job', {
    p_worker_id: WORKER_ID,
  });

  if (error) {
    log('WORKER', 'CLAIM', `RPC error: ${error.message}`);
    return null;
  }

  const jobs = data as QueueJob[] | null;
  if (!jobs || jobs.length === 0) return null;
  return jobs[0];
}

// ─── Core: Process job ──────────────────────────────────────────────────────

async function processJob(
  client: SupabaseClient,
  job: QueueJob,
  rhymeUrl: string,
): Promise<void> {
  log(job.spotify_track_id, 'START', `priority=${job.priority}, attempt=${job.attempt_count}`);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ANALYSIS_TIMEOUT);

  const heartbeatTimer = setInterval(async () => {
    try {
      await client.rpc('heartbeat_rhyme_job', {
        p_job_id: job.id,
        p_worker_id: WORKER_ID,
      });

      // Preemption check for batch jobs
      if (job.priority >= 2) {
        const preempt = await shouldPreempt(client, job.priority);
        if (preempt) {
          log(job.spotify_track_id, 'PREEMPT', 'Higher-priority job waiting, aborting...');
          controller.abort();
        }
      }
    } catch (e) {
      log(job.spotify_track_id, 'HEARTBEAT', `failed: ${e instanceof Error ? e.message : e}`);
    }
  }, HEARTBEAT_INTERVAL);

  try {
    const analyzeUrl = `${rhymeUrl}/analyze`;
    log(job.spotify_track_id, 'ANALYZE', `calling ${analyzeUrl}...`);

    const response = await fetch(analyzeUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        spotify_track_id: job.spotify_track_id,
        isrc: job.isrc,
        artist: job.artist,
        title: job.title,
        job_id: job.id,
        worker_id: WORKER_ID,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => 'unknown');
      const err = new Error(`Rhyme service HTTP ${response.status}: ${errText.slice(0, 300)}`);
      (err as any).statusCode = response.status;
      throw err;
    }

    const result = await response.json();
    log(job.spotify_track_id, 'ANALYZE', `done — ${result.words?.length || 0} words, ${Object.keys(result.rhyme_families || {}).length} families`);

    // Mark job complete
    await client.rpc('complete_rhyme_job', {
      p_job_id: job.id,
      p_worker_id: WORKER_ID,
    });

    log(job.spotify_track_id, 'COMPLETE', 'analysis cached');

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log(job.spotify_track_id, 'FAILED', msg);

    await client.rpc('fail_rhyme_job', {
      p_job_id: job.id,
      p_worker_id: WORKER_ID,
      p_error: msg.slice(0, 500),
    });

    throw err;
  } finally {
    clearTimeout(timeout);
    clearInterval(heartbeatTimer);
  }
}

// ─── Preemption check ───────────────────────────────────────────────────────

async function shouldPreempt(client: SupabaseClient, currentPriority: number): Promise<boolean> {
  const { data } = await client.rpc('should_preempt_rhyme', {
    p_current_priority: currentPriority,
  });
  return data === true;
}

// ─── Main Worker Loop ───────────────────────────────────────────────────────

async function main() {
  const config = parseArgs();
  const client = getSupabase();

  console.log(`\n=== Saeshify Rhyme Queue Worker ===`);
  console.log(`  Worker ID: ${WORKER_ID}`);
  console.log(`  Rhyme Service: ${config.rhymeUrl}`);
  console.log(`  Mode: ${config.once ? 'single job' : 'continuous loop'}`);
  console.log('');

  // Verify rhyme service is reachable
  try {
    const health = await fetch(`${config.rhymeUrl}/health`, {
      signal: AbortSignal.timeout(5_000),
    });
    if (!health.ok) throw new Error(`HTTP ${health.status}`);
    const data = await health.json();
    log('WORKER', 'INIT', `Rhyme service healthy: ${JSON.stringify(data)}`);
  } catch (e) {
    log('WORKER', 'INIT', `Rhyme service unreachable at ${config.rhymeUrl}: ${e instanceof Error ? e.message : e}`);
    log('WORKER', 'INIT', 'Will retry on each job attempt...');
  }

  let jobsProcessed = 0;
  let consecutiveFailures = 0;

  while (true) {
    try {
      if (consecutiveFailures > 0) {
        const backoffMs = Math.min(POLL_INTERVAL * Math.pow(2, consecutiveFailures), 60_000);
        log('WORKER', 'BACKOFF', `waiting ${Math.round(backoffMs / 1000)}s after ${consecutiveFailures} failure(s)`);
        await sleep(backoffMs);
      }

      const job = await claimJob(client);

      if (job) {
        // Preemption check for batch jobs before starting
        if (job.priority >= 2) {
          const preempt = await shouldPreempt(client, job.priority);
          if (preempt) {
            log(job.spotify_track_id, 'PREEMPT', 'Higher-priority job waiting, re-queuing');
            await client.rpc('fail_rhyme_job', {
              p_job_id: job.id,
              p_worker_id: WORKER_ID,
              p_error: 'Preempted by higher-priority job',
            });
            continue;
          }
        }

        try {
          await processJob(client, job, config.rhymeUrl);
          jobsProcessed++;
          consecutiveFailures = 0;
        } catch {
          consecutiveFailures++;
        }

        if (config.once) break;
      } else {
        consecutiveFailures = 0;

        if (config.once) {
          log('WORKER', 'IDLE', 'no jobs, --once mode, exiting');
          break;
        }

        await sleep(POLL_INTERVAL);
      }
    } catch (err) {
      log('WORKER', 'ERROR', `loop error: ${err instanceof Error ? err.message : err}`);
      consecutiveFailures++;
      await sleep(POLL_INTERVAL * 2);
    }
  }

  console.log(`\n=== Worker Summary ===`);
  console.log(`  Jobs processed: ${jobsProcessed}`);
  console.log('');
}

main().catch(err => {
  console.error('Rhyme queue worker failed:', err);
  process.exit(1);
});
