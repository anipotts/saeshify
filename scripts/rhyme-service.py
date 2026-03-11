#!/usr/bin/env python3
"""Rhyme scheme analysis service — runs on cuda5 alongside whisperx-service.

Pipeline:
  1. YouTube discovery via ISRC or artist+title search
  2. Audio download via yt-dlp
  3. Word-level alignment via local WhisperX service (port 8765)
  4. Lyrics fetch from LRCLIB (optional ground truth)
  5. Grapheme-to-Phoneme via CMUDict + g2p_en for OOV words
  6. Line detection by pause gaps
  7. End-rhyme detection via vowel nucleus matching
  8. JSON output with per-word timestamps, phonemes, rhyme families

Endpoints:
  POST /analyze   — full rhyme analysis pipeline
  GET  /health    — health check
  GET  /status    — uptime + job count
"""

import os
import sys
import json
import shutil
import subprocess
import tempfile
import time
import asyncio
import threading
import re
from typing import Optional
from collections import defaultdict

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn

app = FastAPI()
_start_time = time.time()
_analysis_count = 0
_currently_processing: Optional[str] = None
_lock = threading.Lock()

# Supabase credentials
_SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
_SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

# WhisperX service URL (runs alongside on cuda5)
WHISPERX_URL = os.environ.get("WHISPERX_URL", "http://localhost:8765")

# ─── CMUDict + G2P setup ────────────────────────────────────────────────────

_cmudict = None

def get_cmudict():
    global _cmudict
    if _cmudict is None:
        import cmudict as cmu
        _cmudict = cmu.dict()
        print(f"[rhyme] CMUDict loaded: {len(_cmudict)} entries")
    return _cmudict

_g2p = None

def get_g2p():
    global _g2p
    if _g2p is None:
        from g2p_en import G2p
        _g2p = G2p()
        print("[rhyme] g2p_en model loaded")
    return _g2p


def word_to_phonemes(word: str) -> list[str]:
    """Convert a word to ARPAbet phonemes using CMUDict, falling back to g2p_en."""
    clean = re.sub(r"[^a-zA-Z']", "", word).lower()
    if not clean:
        return []

    d = get_cmudict()
    if clean in d:
        return d[clean][0]  # first pronunciation variant

    # OOV fallback
    g2p = get_g2p()
    phones = g2p(clean)
    # g2p_en returns a list of phoneme strings
    return [p for p in phones if p.strip()]


# ─── Rhyme detection ────────────────────────────────────────────────────────

VOWELS = {
    'AA', 'AE', 'AH', 'AO', 'AW', 'AY', 'EH', 'ER', 'EY',
    'IH', 'IY', 'OW', 'OY', 'UH', 'UW',
}


def get_rhyme_tail(phonemes: list[str]) -> str:
    """Extract the rhyme tail: last stressed vowel + everything after it."""
    # Strip stress markers for comparison but find last vowel
    last_vowel_idx = -1
    for i, p in enumerate(phonemes):
        base = re.sub(r'\d', '', p)
        if base in VOWELS:
            last_vowel_idx = i

    if last_vowel_idx < 0:
        return ""

    # Return from last vowel onward, stripping stress digits
    tail = [re.sub(r'\d', '', p) for p in phonemes[last_vowel_idx:]]
    return " ".join(tail)


def detect_end_rhymes(lines: list[dict], words: list[dict]) -> dict:
    """Detect end-of-line rhymes by comparing rhyme tails.

    Returns a dict mapping family_id -> {phoneme_pattern, word_indices}.
    """
    # Get the last word with phonemes for each line
    line_endings = []
    for line in lines:
        if not line["word_indices"]:
            line_endings.append(None)
            continue

        # Find last word in line that has phonemes
        last_word = None
        for idx in reversed(line["word_indices"]):
            w = words[idx]
            if w.get("phonemes"):
                last_word = (idx, w)
                break
        line_endings.append(last_word)

    # Group by rhyme tail
    tail_groups: dict[str, list[int]] = defaultdict(list)
    for line_idx, ending in enumerate(line_endings):
        if ending is None:
            continue
        word_idx, w = ending
        phoneme_list = w["phonemes"].split()
        tail = get_rhyme_tail(phoneme_list)
        if tail and len(tail.split()) >= 1:
            tail_groups[tail].append(word_idx)

    # Only keep groups with 2+ members (actual rhymes)
    families = {}
    family_idx = 0
    for tail, word_indices in tail_groups.items():
        if len(word_indices) < 2:
            continue
        family_id = f"f{family_idx}"
        families[family_id] = {
            "phoneme_pattern": tail,
            "word_indices": word_indices,
            "member_count": len(word_indices),
        }
        family_idx += 1

    return families


# ─── YouTube discovery ───────────────────────────────────────────────────────

def find_youtube_video(isrc: str = None, artist: str = None, title: str = None) -> str:
    """Find a YouTube video ID via ISRC or artist+title search."""
    queries = []
    if isrc:
        queries.append(isrc)
    if artist and title:
        queries.append(f"{artist} {title} official audio")
        queries.append(f"{artist} {title}")

    for query in queries:
        try:
            r = subprocess.run(
                [sys.executable, "-m", "yt_dlp",
                 "--default-search", "ytsearch1",
                 "--print", "id",
                 "--no-playlist", "--no-warnings",
                 query],
                capture_output=True, text=True, timeout=30,
            )
            if r.returncode == 0 and r.stdout.strip():
                vid = r.stdout.strip().split('\n')[0]
                if re.match(r'^[a-zA-Z0-9_-]{11}$', vid):
                    print(f"[rhyme] YouTube match for '{query}': {vid}")
                    return vid
        except Exception as e:
            print(f"[rhyme] YouTube search failed for '{query}': {e}")

    raise HTTPException(404, "Could not find YouTube video for this track")


def download_audio(vid: str, tmpdir: str, timeout: int = 300) -> str:
    """Download audio via yt-dlp."""
    outpath = os.path.join(tmpdir, "audio.%(ext)s")
    r = subprocess.run(
        [sys.executable, "-m", "yt_dlp",
         "-f", "bestaudio[abr<=128][ext=webm]/bestaudio[abr<=128]/bestaudio",
         "--no-playlist", "--no-warnings",
         "-o", outpath,
         f"https://www.youtube.com/watch?v={vid}"],
        capture_output=True, text=True, timeout=timeout,
    )
    if r.returncode != 0:
        raise HTTPException(502, f"Audio download failed: {r.stderr[:300]}")

    import glob as g
    files = g.glob(os.path.join(tmpdir, "audio.*"))
    if not files:
        raise HTTPException(502, "No audio file found after download")

    audio_path = files[0]
    fsize = os.path.getsize(audio_path)
    if fsize < 1000:
        raise HTTPException(502, f"Audio too small ({fsize} bytes)")
    print(f"[rhyme] {vid}: downloaded {fsize:,} bytes")
    return audio_path


# ─── Lyrics fetch ────────────────────────────────────────────────────────────

def fetch_lyrics(artist: str, title: str) -> Optional[str]:
    """Fetch lyrics from LRCLIB (free, no API key needed)."""
    try:
        from urllib.request import Request, urlopen
        from urllib.parse import quote

        url = f"https://lrclib.net/api/get?artist_name={quote(artist)}&track_name={quote(title)}"
        req = Request(url, headers={"User-Agent": "saeshify-rhyme/1.0"})
        resp = urlopen(req, timeout=10)
        data = json.loads(resp.read())

        # Prefer plain lyrics (synced lyrics have timestamps we don't need)
        lyrics = data.get("plainLyrics") or data.get("syncedLyrics")
        if lyrics:
            print(f"[rhyme] Lyrics fetched from LRCLIB ({len(lyrics)} chars)")
            return lyrics
    except Exception as e:
        print(f"[rhyme] LRCLIB fetch failed: {e}")

    return None


# ─── WhisperX alignment ─────────────────────────────────────────────────────

def get_word_timestamps(video_id: str) -> list[dict]:
    """Call the existing WhisperX service for word-level timestamps."""
    from urllib.request import Request, urlopen

    data = json.dumps({"video_id": video_id}).encode()
    req = Request(
        f"{WHISPERX_URL}/transcribe",
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    resp = urlopen(req, timeout=3600)
    result = json.loads(resp.read())

    # Flatten segments into word list
    words = []
    for seg in result.get("segments", []):
        for w in seg.get("words", []):
            words.append({
                "text": w["text"],
                "startMs": w["startMs"],
            })

        # If no word-level timestamps, use segment-level
        if not seg.get("words"):
            for token in seg["text"].split():
                words.append({
                    "text": token,
                    "startMs": int(seg["offset"] * 1000),
                })

    return words


# ─── Line detection ──────────────────────────────────────────────────────────

def detect_lines(words: list[dict], lyrics_text: Optional[str] = None) -> list[dict]:
    """Group words into lines by pause gaps (>300ms) or lyrics newlines."""
    if not words:
        return []

    # Simple pause-based line detection
    lines = []
    current_line_words: list[int] = []
    PAUSE_THRESHOLD_MS = 300

    for i, w in enumerate(words):
        if current_line_words and i > 0:
            prev_end = words[i - 1].get("end_ms", words[i - 1]["start_ms"] + 200)
            gap = w["start_ms"] - prev_end
            if gap > PAUSE_THRESHOLD_MS:
                # End current line
                lines.append(_build_line(words, current_line_words))
                current_line_words = []

        current_line_words.append(i)

    if current_line_words:
        lines.append(_build_line(words, current_line_words))

    return lines


def _build_line(words: list[dict], indices: list[int]) -> dict:
    texts = [words[i]["text"] for i in indices]
    return {
        "text": " ".join(texts),
        "start_ms": words[indices[0]]["start_ms"],
        "end_ms": words[indices[-1]].get("end_ms", words[indices[-1]]["start_ms"] + 200),
        "word_indices": indices,
    }


# ─── Supabase upsert ────────────────────────────────────────────────────────

def supabase_upsert_analysis(track_id: str, analysis: dict):
    """Upsert rhyme analysis to Supabase."""
    if not _SUPABASE_URL or not _SUPABASE_KEY:
        return

    from urllib.request import Request, urlopen

    data = json.dumps({
        "spotify_track_id": track_id,
        "youtube_video_id": analysis.get("youtube_video_id"),
        "isrc": analysis.get("isrc"),
        "words": analysis["words"],
        "rhyme_families": analysis["rhyme_families"],
        "lines": analysis["lines"],
        "metadata": analysis["metadata"],
        "source": "v1",
        "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "expires_at": time.strftime(
            "%Y-%m-%dT%H:%M:%SZ",
            time.gmtime(time.time() + 90 * 86400)
        ),
    }).encode()

    req = Request(
        f"{_SUPABASE_URL}/rest/v1/rhyme_analyses",
        data=data,
        headers={
            "apikey": _SUPABASE_KEY,
            "Authorization": f"Bearer {_SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates",
        },
        method="POST",
    )
    urlopen(req, timeout=15)


def supabase_heartbeat(job_id: str, worker_id: str,
                       status: str = None, progress_pct: int = None):
    """Call heartbeat_rhyme_job RPC."""
    if not _SUPABASE_URL or not _SUPABASE_KEY:
        return

    from urllib.request import Request, urlopen

    params = {"p_job_id": job_id, "p_worker_id": worker_id}
    if status:
        params["p_status"] = status
    if progress_pct is not None:
        params["p_progress_pct"] = progress_pct

    data = json.dumps(params).encode()
    req = Request(
        f"{_SUPABASE_URL}/rest/v1/rpc/heartbeat_rhyme_job",
        data=data,
        headers={
            "apikey": _SUPABASE_KEY,
            "Authorization": f"Bearer {_SUPABASE_KEY}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        urlopen(req, timeout=10)
    except Exception as e:
        print(f"[rhyme] heartbeat failed: {e}")


# ─── Main analysis endpoint ─────────────────────────────────────────────────

class AnalyzeRequest(BaseModel):
    spotify_track_id: str
    isrc: Optional[str] = None
    artist: Optional[str] = None
    title: Optional[str] = None
    job_id: Optional[str] = None
    worker_id: Optional[str] = None


@app.post("/analyze")
def analyze(req: AnalyzeRequest):
    global _analysis_count, _currently_processing

    if not _lock.acquire(blocking=False):
        raise HTTPException(503, "Busy with another analysis")

    _currently_processing = req.spotify_track_id
    tmpdir = tempfile.mkdtemp(dir="/tmp", prefix="rhyme-")

    try:
        # Step 1: Find YouTube video
        print(f"[rhyme] {req.spotify_track_id}: searching YouTube...")
        if req.job_id and req.worker_id:
            supabase_heartbeat(req.job_id, req.worker_id, status="downloading", progress_pct=5)

        youtube_id = find_youtube_video(req.isrc, req.artist, req.title)

        # Step 2: Get word timestamps from WhisperX
        print(f"[rhyme] {req.spotify_track_id}: getting word alignment from WhisperX...")
        if req.job_id and req.worker_id:
            supabase_heartbeat(req.job_id, req.worker_id, status="analyzing", progress_pct=20)

        raw_words = get_word_timestamps(youtube_id)
        if not raw_words:
            raise HTTPException(500, "WhisperX returned no words")

        # Step 3: Fetch lyrics (optional, for future forced alignment)
        lyrics_text = None
        if req.artist and req.title:
            lyrics_text = fetch_lyrics(req.artist, req.title)

        if req.job_id and req.worker_id:
            supabase_heartbeat(req.job_id, req.worker_id, progress_pct=40)

        # Step 4: G2P conversion
        print(f"[rhyme] {req.spotify_track_id}: running G2P on {len(raw_words)} words...")
        words = []
        for i, rw in enumerate(raw_words):
            phonemes = word_to_phonemes(rw["text"])
            start_ms = rw["startMs"]
            # Estimate end_ms from next word's start, or +200ms
            end_ms = raw_words[i + 1]["startMs"] if i + 1 < len(raw_words) else start_ms + 200
            words.append({
                "text": rw["text"],
                "start_ms": start_ms,
                "end_ms": end_ms,
                "phonemes": " ".join(phonemes),
                "rhyme_family": None,
                "line_index": -1,
            })

        if req.job_id and req.worker_id:
            supabase_heartbeat(req.job_id, req.worker_id, progress_pct=60)

        # Step 5: Line detection
        print(f"[rhyme] {req.spotify_track_id}: detecting lines...")
        lines = detect_lines(words, lyrics_text)
        for line_idx, line in enumerate(lines):
            for wi in line["word_indices"]:
                words[wi]["line_index"] = line_idx

        # Step 6: Rhyme detection
        print(f"[rhyme] {req.spotify_track_id}: detecting rhymes...")
        raw_families = detect_end_rhymes(lines, words)

        if req.job_id and req.worker_id:
            supabase_heartbeat(req.job_id, req.worker_id, progress_pct=80)

        # Assign family IDs to words and build color-mapped families
        from lib_colors import RHYME_PALETTE  # noqa — will use inline

        # Use inline palette
        palette = [
            '#FF5733', '#33B5FF', '#FFC300', '#9B59B6', '#2ECC71',
            '#FF69B4', '#00BCD4', '#FF8C00', '#7B68EE', '#32CD32',
            '#E91E63', '#00E5FF', '#FFD700', '#BA68C8', '#76FF03', '#FF4081',
        ]

        rhyme_families = {}
        for i, (fid, fdata) in enumerate(raw_families.items()):
            color = palette[i % len(palette)]
            rhyme_families[fid] = {
                "color": color,
                "phoneme_pattern": fdata["phoneme_pattern"],
                "member_count": fdata["member_count"],
            }
            for wi in fdata["word_indices"]:
                words[wi]["rhyme_family"] = fid

        # Compute metadata
        rhyming_words = sum(1 for w in words if w["rhyme_family"] is not None)
        duration_ms = words[-1]["end_ms"] if words else 0
        metadata = {
            "duration_ms": duration_ms,
            "word_count": len(words),
            "rhyme_density": round(rhyming_words / max(len(words), 1), 3),
            "offset_ms": 0,
            "pipeline_version": "v1",
        }

        analysis = {
            "spotify_track_id": req.spotify_track_id,
            "youtube_video_id": youtube_id,
            "isrc": req.isrc,
            "words": words,
            "rhyme_families": rhyme_families,
            "lines": lines,
            "metadata": metadata,
        }

        # Step 7: Upsert to Supabase
        try:
            supabase_upsert_analysis(req.spotify_track_id, analysis)
        except Exception as e:
            print(f"[rhyme] Supabase upsert failed: {e}")

        _analysis_count += 1
        print(f"[rhyme] {req.spotify_track_id}: done — {len(words)} words, "
              f"{len(rhyme_families)} rhyme families, density={metadata['rhyme_density']}")

        return analysis

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, str(e))
    finally:
        _currently_processing = None
        _lock.release()
        shutil.rmtree(tmpdir, ignore_errors=True)


# ─── Health + Status ─────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok", "service": "rhyme-pipeline"}


@app.get("/status")
async def status():
    return {
        "uptime_seconds": int(time.time() - _start_time),
        "analysis_count": _analysis_count,
        "currently_processing": _currently_processing,
    }


# ─── Service registration ───────────────────────────────────────────────────

async def register_service():
    if not _SUPABASE_URL or not _SUPABASE_KEY:
        print("[rhyme] No Supabase env vars — skipping registration")
        return

    from urllib.request import Request, urlopen

    service_url = f"http://{os.uname().nodename}:8767"
    data = json.dumps({
        "service_name": "rhyme-pipeline",
        "url": service_url,
        "updated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }).encode()

    try:
        req = Request(
            f"{_SUPABASE_URL}/rest/v1/service_registry",
            data=data,
            headers={
                "apikey": _SUPABASE_KEY,
                "Authorization": f"Bearer {_SUPABASE_KEY}",
                "Content-Type": "application/json",
                "Prefer": "resolution=merge-duplicates",
            },
            method="POST",
        )
        urlopen(req, timeout=5)
        print(f"[rhyme] Registered as '{service_url}' in service_registry")
    except Exception as e:
        print(f"[rhyme] Registration failed: {e}")


async def registration_heartbeat_loop():
    while True:
        await asyncio.sleep(30 * 60)
        await register_service()


@app.on_event("startup")
async def startup():
    get_cmudict()  # warm up
    get_g2p()      # warm up
    await register_service()
    asyncio.create_task(registration_heartbeat_loop())


if __name__ == "__main__":
    get_cmudict()
    get_g2p()
    uvicorn.run(app, host="0.0.0.0", port=8767)
