/**
 * Face-match lib — wraps Replicate's `apna-mart/face-match` model.
 *
 * The model takes TWO images (image1, image2) and returns a similarity score.
 * Architecture: vision identifies player + team + number → server narrows
 * to candidates → we verify each candidate by comparing user photo against
 * candidate's ESPN headshot. Highest similarity > threshold wins.
 *
 * Why this beats embedding-search:
 *   - No pre-compute step — always uses fresh ESPN headshots
 *   - No reference data to maintain (rosters update naturally as ESPN does)
 *   - Same model on every comparison — no embedding-space drift
 *
 * Why this beats raw vision:
 *   - Vision hallucinates names. Comparison can't — it just measures pixel
 *     geometry of two faces. The MPJ→SGA bug dies because face match
 *     compares the user's MPJ photo to the SGA headshot and sees no match.
 */

import nbaFacesData from '@/data/nba-faces.json';
import nflFacesData from '@/data/nfl-faces.json';
import wnbaFacesData from '@/data/wnba-faces.json';

const REPLICATE_API = 'https://api.replicate.com/v1/predictions';

/**
 * apna-mart/face-match version. Pin to a specific version hash for reproducibility.
 * Override via REPLICATE_FACE_MODEL env var if Aaron upgrades to a newer version.
 *
 * NOTE: the version hash below is a placeholder. Aaron must update it from
 * https://replicate.com/apna-mart/face-match (Versions tab → copy the latest hash).
 * Until then, the model identifier still resolves via Replicate's "latest"
 * lookup but pinning is best practice.
 */
const DEFAULT_MODEL =
  process.env.REPLICATE_FACE_MODEL ?? 'apna-mart/face-match';

/**
 * A face-index entry is identical across leagues — the same shape backs
 * NBA, NFL, and WNBA. We track which league via a separate `league` field
 * we add when reading from the per-league JSON files.
 */
export type FaceEntry = {
  id: string;
  name: string;
  team: string;
  jersey: string;
  pos: string;
  espnId?: number | string;
  headshot: string | null;
  league: 'nba' | 'nfl' | 'wnba';
};

/** Backwards-compat alias — older callers imported NbaFaceEntry. Same shape now. */
export type NbaFaceEntry = FaceEntry;

const NBA_FACES: Record<string, FaceEntry> = Object.fromEntries(
  Object.entries((nbaFacesData as { players: Record<string, Omit<FaceEntry, 'league'>> }).players).map(
    ([k, v]) => [k, { ...v, league: 'nba' as const }],
  ),
);
const NFL_FACES: Record<string, FaceEntry> = Object.fromEntries(
  Object.entries((nflFacesData as { players: Record<string, Omit<FaceEntry, 'league'>> }).players).map(
    ([k, v]) => [k, { ...v, league: 'nfl' as const }],
  ),
);
const WNBA_FACES: Record<string, FaceEntry> = Object.fromEntries(
  Object.entries((wnbaFacesData as { players: Record<string, Omit<FaceEntry, 'league'>> }).players).map(
    ([k, v]) => [k, { ...v, league: 'wnba' as const }],
  ),
);

const ALL_FACES: Record<string, FaceEntry> = { ...NFL_FACES, ...WNBA_FACES, ...NBA_FACES };
// NBA spread last so on slug collisions (rare cross-league name dupes) NBA wins.
// In practice, IDs are slugified full names so collisions only happen when the
// same person plays in two leagues — which doesn't actually occur with our data.

const FACES_BY_LEAGUE = {
  nba: NBA_FACES,
  nfl: NFL_FACES,
  wnba: WNBA_FACES,
} as const;

/* ─────────────────────────── helpers ────────────────────────────────────── */

/** Look up a player's headshot URL by their slug-id, across all three leagues. */
export function getHeadshot(playerId: string): string | null {
  return ALL_FACES[playerId]?.headshot ?? null;
}

/** Cross-league face entry lookup. */
export function getFaceEntry(playerId: string): FaceEntry | null {
  return ALL_FACES[playerId] ?? null;
}

/**
 * Look up a face entry restricted to a specific league. Use when you have a
 * league hint from vision and want to avoid cross-league collisions.
 */
export function getFaceEntryByLeague(
  playerId: string,
  league: 'nba' | 'nfl' | 'wnba',
): FaceEntry | null {
  return FACES_BY_LEAGUE[league]?.[playerId] ?? null;
}

/* ─── Backwards-compat: old call-sites used getNbaHeadshot / getNbaFaceEntry ─ */
/** @deprecated Use getHeadshot — works for all leagues. */
export function getNbaHeadshot(playerId: string): string | null {
  return NBA_FACES[playerId]?.headshot ?? null;
}
/** @deprecated Use getFaceEntry — works for all leagues. */
export function getNbaFaceEntry(playerId: string): FaceEntry | null {
  return NBA_FACES[playerId] ?? null;
}

/**
 * Find candidate players by team + jersey number across all leagues.
 * Pass `league` to scope to a single league; otherwise searches all three.
 */
export function findCandidatesByTeamAndNumber(
  team?: string | null,
  jerseyNumber?: string | number | null,
  league?: 'nba' | 'nfl' | 'wnba',
): FaceEntry[] {
  if (!team && !jerseyNumber) return [];
  const teamLower = (team ?? '').toLowerCase();
  const num = jerseyNumber == null ? '' : String(jerseyNumber).replace(/^0+/, '') || '0';

  const source = league ? FACES_BY_LEAGUE[league] : ALL_FACES;
  const out: FaceEntry[] = [];
  for (const entry of Object.values(source)) {
    if (teamLower) {
      const entryTeam = entry.team.toLowerCase();
      if (!teamLower.includes(entryTeam) && entryTeam !== teamLower) continue;
    }
    if (num) {
      const ej = (entry.jersey || '').replace(/^0+/, '') || '0';
      if (ej !== num) continue;
    }
    out.push(entry);
  }
  return out;
}

/* ─────────────────────────── Replicate call ─────────────────────────────── */

export type FaceMatchResult = {
  similarity: number;
  matched: boolean; // true if model's similarity ≥ 0.65 (tunable)
};

/**
 * Compare two face images via apna-mart/face-match on Replicate.
 *
 * `image1` and `image2` can be:
 *   - HTTPS URLs (preferred for ESPN headshots)
 *   - data:image/jpeg;base64,... URIs (for the user's scan photo)
 *
 * Returns null on:
 *   - missing REPLICATE_API_TOKEN
 *   - either image fails to load (e.g. dead ESPN URL)
 *   - model errors / no face detected
 *   - timeout
 *
 * Failure mode: silent. Caller treats null as "no useful signal" and
 * falls through to other identification paths.
 */
/**
 * DEBUG VERSION — returns the raw Replicate response for diagnosis.
 * Used by /api/scan/face-match?debug=1 only.
 */
export async function debugCompareFaces(
  image1: string,
  image2: string
): Promise<unknown> {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) return { error: 'no-token', tokenSet: false };

  const modelId = DEFAULT_MODEL;
  const isVersionPinned = modelId.includes(':');
  const body: Record<string, unknown> = { input: { image1, image2 } };
  if (isVersionPinned) body.version = modelId.split(':')[1];

  const url = isVersionPinned
    ? REPLICATE_API
    : `https://api.replicate.com/v1/models/${modelId}/predictions`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Prefer: 'wait',
      },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    let parsed: unknown = null;
    try { parsed = JSON.parse(text); } catch { /* keep text */ }
    return {
      url,
      modelId,
      isVersionPinned,
      requestBody: body,
      replicateStatus: res.status,
      replicateOk: res.ok,
      replicateBody: parsed ?? text.slice(0, 500),
    };
  } catch (err) {
    return { error: String(err) };
  }
}

export async function compareFaces(
  image1: string,
  image2: string
): Promise<FaceMatchResult | null> {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) return null;

  try {
    // 2026-05-01 perf: previously the initial fetch used `Prefer: wait` which
    // tells Replicate to hold the connection up to 60s for cold-start
    // predictions. That tanked our /api/scan response time when the model
    // was idle. Now we kick off ASYNC (no Prefer header) so the create
    // request returns in ~1s, then poll for up to 8 attempts.
    //
    // Total latency budget for face-match: ~1s create + ~8s poll = 9s max.
    // Even on a cold-start day we won't exceed 10s.
    const modelId = DEFAULT_MODEL;
    const isVersionPinned = modelId.includes(':');

    const body: Record<string, unknown> = {
      input: { image1, image2 },
    };
    if (isVersionPinned) {
      body.version = modelId.split(':')[1];
    }

    const url = isVersionPinned
      ? REPLICATE_API
      : `https://api.replicate.com/v1/models/${modelId}/predictions`;

    // AbortController gates the create request — even DNS / TLS / Replicate
    // throttling won't hang the function past 4s.
    const createCtrl = new AbortController();
    const createTimer = setTimeout(() => createCtrl.abort(), 4_000);
    let res: Response;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: createCtrl.signal,
      });
    } finally {
      clearTimeout(createTimer);
    }

    if (!res.ok) return null;
    const data = (await res.json()) as {
      status?: string;
      output?: unknown;
      error?: string;
      id?: string;
    };

    let output = data.output;
    // Poll if not done synchronously. Capped tight (8s total) — beyond that
    // Replicate is cold-starting and we'd rather ship vision's answer than
    // hang the whole scan. The route treats null as "couldn't verify, but
    // don't kill the result" so the user still sees a useful response.
    if (data.status !== 'succeeded' && data.id) {
      const pollUrl = `${REPLICATE_API}/${data.id}`;
      for (let i = 0; i < 8; i++) {
        await new Promise((r) => setTimeout(r, 1000));
        // Per-poll abort guard — each individual poll can't hang past 2s.
        const pollCtrl = new AbortController();
        const pollTimer = setTimeout(() => pollCtrl.abort(), 2_000);
        let pollRes: Response;
        try {
          pollRes = await fetch(pollUrl, {
            headers: { Authorization: `Bearer ${token}` },
            signal: pollCtrl.signal,
          });
        } catch {
          clearTimeout(pollTimer);
          continue;
        }
        clearTimeout(pollTimer);
        if (!pollRes.ok) continue;
        const pollData = (await pollRes.json()) as { status?: string; output?: unknown };
        if (pollData.status === 'succeeded') {
          output = pollData.output;
          break;
        }
        if (pollData.status === 'failed' || pollData.status === 'canceled') return null;
      }
    }

    if (!output) return null;
    return parseSimilarity(output);
  } catch {
    return null;
  }
}

/**
 * Parse Replicate's apna-mart/face-match output. The model returns something like:
 *   {
 *     "similarity": { "cosine": 1, "euclidean": 1, "percentage": 100, "score": 1 },
 *     "is_match": true,
 *     "threshold_used": 0.63,
 *     "confidence": "Very high confidence match",
 *     ...
 *   }
 *
 * 2026-05-01 fix: previously we only checked `typeof o.similarity === 'number'`.
 * The model returns it as a NESTED OBJECT, so the type check failed silently
 * and we returned null even on perfect matches. Result: every Miles-Bridges-
 * tier ID got rejected because we couldn't read the answer.
 *
 * Now: unwrap nested similarity objects (cosine / score / percentage / euclidean),
 * trust the model's own `is_match` boolean if present, fall back to common
 * flat-number key names for safety on other models.
 */
function parseSimilarity(output: unknown): FaceMatchResult | null {
  if (output == null) return null;

  // Direct number output (some models)
  if (typeof output === 'number') {
    return { similarity: output, matched: output >= 0.65 };
  }

  if (typeof output !== 'object') return null;
  const o = output as Record<string, unknown>;

  // Step 1: try to extract a numeric similarity, including from a nested object.
  let sim: number | null = null;

  const simRaw = o.similarity_score ?? o.similarity ?? o.score ?? o.face_similarity ?? o.cosine_similarity;
  if (typeof simRaw === 'number') {
    sim = simRaw;
  } else if (simRaw && typeof simRaw === 'object') {
    // apna-mart/face-match shape: { cosine, euclidean, percentage, score }
    const inner = simRaw as Record<string, unknown>;
    const candidates = [inner.cosine, inner.score, inner.euclidean];
    for (const c of candidates) {
      if (typeof c === 'number') { sim = c; break; }
    }
    // Last resort: percentage (0-100) → normalize to 0-1
    if (sim == null && typeof inner.percentage === 'number') {
      sim = inner.percentage > 1 ? inner.percentage / 100 : inner.percentage;
    }
  }

  // Distance is INVERSE of similarity — only use as last resort
  if (sim == null && typeof o.distance === 'number') {
    sim = 1 - (o.distance as number);
  }

  // Step 2: figure out match decision. The model's own boolean wins if present.
  const explicitMatch = o.is_match ?? o.matched ?? o.match;
  let matched: boolean;
  if (typeof explicitMatch === 'boolean') {
    matched = explicitMatch;
    // If we have an explicit match boolean but no numeric similarity yet, treat
    // matched=true as similarity≥1 so downstream sort + threshold work.
    if (sim == null) sim = matched ? 1 : 0;
  } else if (sim != null) {
    matched = sim >= 0.65;
  } else {
    // Try recursing into nested result/output wrappers
    if ('result' in o) return parseSimilarity(o.result);
    if ('output' in o) return parseSimilarity(o.output);
    return null;
  }

  return { similarity: sim, matched };
}

/* ─────────────────────────── verification flow ──────────────────────────── */

export type VerificationOutcome = {
  bestMatch: { entry: NbaFaceEntry; similarity: number } | null;
  /** All candidates with their scores — handy for logging/debugging. */
  scored: Array<{ entry: NbaFaceEntry; similarity: number }>;
};

/**
 * Given a user image and a list of candidate players, verify which (if any)
 * is the right match by running face-match against each.
 *
 * Calls are PARALLEL — total latency ≈ slowest single call (~3-5 sec).
 *
 * `threshold`: minimum similarity to consider a "real" match. Default 0.65
 * matches the model's own default similarity_threshold.
 */
export async function verifyAgainstCandidates(
  userImage: string,
  candidates: NbaFaceEntry[],
  threshold: number = 0.65
): Promise<VerificationOutcome> {
  if (candidates.length === 0) return { bestMatch: null, scored: [] };

  // Cap to 4 candidates to limit cost + latency
  const trimmed = candidates.slice(0, 4);

  const results = await Promise.all(
    trimmed.map(async (c) => {
      if (!c.headshot) return { entry: c, similarity: 0 };
      const r = await compareFaces(userImage, c.headshot);
      return { entry: c, similarity: r?.similarity ?? 0 };
    })
  );

  const sorted = results.sort((a, b) => b.similarity - a.similarity);
  const top = sorted[0];
  return {
    bestMatch: top && top.similarity >= threshold ? top : null,
    scored: sorted,
  };
}
