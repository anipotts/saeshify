-- Rhyme scheme analysis pipeline.
-- Supabase acts as message bus between Vercel (producer) and cuda5 (consumer).
-- Mirrors transcript_queue pattern from chalk/invideo.

-- ─── Cached rhyme analyses ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS rhyme_analyses (
  spotify_track_id text PRIMARY KEY,
  youtube_video_id text,
  isrc text,
  words jsonb NOT NULL DEFAULT '[]'::jsonb,       -- [{text, start_ms, end_ms, phonemes, rhyme_family, line_index}]
  rhyme_families jsonb NOT NULL DEFAULT '{}'::jsonb, -- {family_id: {color, phoneme_pattern, member_count}}
  lines jsonb NOT NULL DEFAULT '[]'::jsonb,        -- [{text, start_ms, end_ms, word_indices}]
  metadata jsonb DEFAULT '{}'::jsonb,              -- {duration_ms, word_count, rhyme_density, offset_ms, pipeline_version}
  source text NOT NULL DEFAULT 'v1',
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '90 days')
);

ALTER TABLE rhyme_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read rhyme analyses"
  ON rhyme_analyses FOR SELECT USING (true);

CREATE POLICY "Service role manages rhyme analyses"
  ON rhyme_analyses FOR ALL USING (true) WITH CHECK (true);

-- ─── Priority queue for rhyme analysis jobs ─────────────────────────────────

CREATE TABLE IF NOT EXISTS rhyme_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  spotify_track_id text NOT NULL UNIQUE,
  isrc text,
  artist text,
  title text,
  youtube_video_id text,                           -- filled during processing
  priority smallint NOT NULL DEFAULT 0,            -- 0 = user request (P0), 2 = batch (P2)
  status text NOT NULL DEFAULT 'pending',          -- pending -> downloading -> analyzing -> completed / failed
  requested_by text NOT NULL DEFAULT 'user',
  worker_id text,
  heartbeat_at timestamptz,
  progress_pct smallint NOT NULL DEFAULT 0,        -- 0-100
  attempt_count int NOT NULL DEFAULT 0,
  max_attempts int NOT NULL DEFAULT 3,
  error_message text,
  requested_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz
);

ALTER TABLE rhyme_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read rhyme queue status"
  ON rhyme_queue FOR SELECT USING (true);

CREATE POLICY "Service role manages rhyme queue"
  ON rhyme_queue FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX idx_rhyme_queue_claim
  ON rhyme_queue (status, priority, requested_at)
  WHERE status = 'pending';

CREATE INDEX idx_rhyme_queue_track
  ON rhyme_queue (spotify_track_id);

-- ─── RPC: enqueue_rhyme_analysis ────────────────────────────────────────────
-- Returns: 'cached' | 'escalated' | 'enqueued' | 'in_progress'
CREATE OR REPLACE FUNCTION enqueue_rhyme_analysis(
  p_spotify_track_id text,
  p_isrc text DEFAULT NULL,
  p_artist text DEFAULT NULL,
  p_title text DEFAULT NULL,
  p_priority smallint DEFAULT 0,
  p_requested_by text DEFAULT 'user'
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing record;
BEGIN
  -- Check if analysis already cached
  IF EXISTS (
    SELECT 1 FROM rhyme_analyses
    WHERE spotify_track_id = p_spotify_track_id
      AND words IS NOT NULL
      AND jsonb_array_length(words) > 0
  ) THEN
    RETURN 'cached';
  END IF;

  -- Check if job already exists
  SELECT * INTO v_existing
  FROM rhyme_queue
  WHERE spotify_track_id = p_spotify_track_id;

  IF v_existing IS NOT NULL THEN
    IF v_existing.status IN ('completed', 'failed') AND v_existing.attempt_count >= v_existing.max_attempts THEN
      UPDATE rhyme_queue SET
        priority = LEAST(v_existing.priority, p_priority),
        status = 'pending',
        requested_by = p_requested_by,
        attempt_count = 0,
        error_message = NULL,
        requested_at = now()
      WHERE spotify_track_id = p_spotify_track_id;
      RETURN 'enqueued';
    ELSIF p_priority < v_existing.priority THEN
      UPDATE rhyme_queue SET
        priority = p_priority,
        requested_by = p_requested_by
      WHERE spotify_track_id = p_spotify_track_id;
      RETURN 'escalated';
    ELSE
      RETURN 'in_progress';
    END IF;
  END IF;

  INSERT INTO rhyme_queue (spotify_track_id, isrc, artist, title, priority, requested_by)
  VALUES (p_spotify_track_id, p_isrc, p_artist, p_title, p_priority, p_requested_by);

  RETURN 'enqueued';
END;
$$;

-- ─── RPC: claim_next_rhyme_job ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION claim_next_rhyme_job(p_worker_id text)
RETURNS SETOF rhyme_queue
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_job rhyme_queue;
BEGIN
  -- Reclaim stale jobs (heartbeat older than 60s while in active status)
  UPDATE rhyme_queue SET
    status = 'pending',
    worker_id = NULL,
    heartbeat_at = NULL,
    attempt_count = attempt_count + 1
  WHERE status IN ('downloading', 'analyzing')
    AND heartbeat_at < now() - interval '60 seconds';

  -- Mark jobs that exceeded max attempts as failed
  UPDATE rhyme_queue SET
    status = 'failed',
    error_message = COALESCE(error_message, 'Max attempts exceeded')
  WHERE status = 'pending'
    AND attempt_count >= max_attempts;

  -- Claim next pending job (priority ASC = P0 first, then by request time)
  SELECT * INTO v_job
  FROM rhyme_queue
  WHERE status = 'pending'
    AND attempt_count < max_attempts
  ORDER BY priority ASC, requested_at ASC
  FOR UPDATE SKIP LOCKED
  LIMIT 1;

  IF v_job IS NULL THEN
    RETURN;
  END IF;

  UPDATE rhyme_queue SET
    status = 'downloading',
    worker_id = p_worker_id,
    heartbeat_at = now(),
    started_at = COALESCE(started_at, now()),
    attempt_count = attempt_count + 1
  WHERE id = v_job.id;

  v_job.status := 'downloading';
  v_job.worker_id := p_worker_id;
  v_job.heartbeat_at := now();
  v_job.attempt_count := v_job.attempt_count + 1;
  RETURN NEXT v_job;
END;
$$;

-- ─── RPC: heartbeat_rhyme_job ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION heartbeat_rhyme_job(
  p_job_id uuid,
  p_worker_id text,
  p_status text DEFAULT NULL,
  p_progress_pct smallint DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE rhyme_queue SET
    heartbeat_at = now(),
    status = COALESCE(p_status, status),
    progress_pct = COALESCE(p_progress_pct, progress_pct)
  WHERE id = p_job_id
    AND worker_id = p_worker_id;
END;
$$;

-- ─── RPC: complete_rhyme_job ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION complete_rhyme_job(
  p_job_id uuid,
  p_worker_id text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE rhyme_queue SET
    status = 'completed',
    completed_at = now(),
    heartbeat_at = now(),
    progress_pct = 100
  WHERE id = p_job_id
    AND worker_id = p_worker_id;
END;
$$;

-- ─── RPC: fail_rhyme_job ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION fail_rhyme_job(
  p_job_id uuid,
  p_worker_id text,
  p_error text DEFAULT 'Unknown error'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_attempt_count int;
  v_max_attempts int;
BEGIN
  SELECT attempt_count, max_attempts INTO v_attempt_count, v_max_attempts
  FROM rhyme_queue
  WHERE id = p_job_id AND worker_id = p_worker_id;

  IF v_attempt_count < v_max_attempts THEN
    UPDATE rhyme_queue SET
      status = 'pending',
      error_message = p_error,
      worker_id = NULL,
      heartbeat_at = NULL
    WHERE id = p_job_id AND worker_id = p_worker_id;
  ELSE
    UPDATE rhyme_queue SET
      status = 'failed',
      error_message = p_error,
      heartbeat_at = now()
    WHERE id = p_job_id AND worker_id = p_worker_id;
  END IF;
END;
$$;

-- ─── RPC: should_preempt_rhyme ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION should_preempt_rhyme(p_current_priority smallint)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS(
    SELECT 1 FROM rhyme_queue
    WHERE status = 'pending'
      AND priority < p_current_priority
  );
$$;
