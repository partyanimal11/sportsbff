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

type NbaFaceEntry = {
  id: string;
  name: string;
  team: string;
  jersey: string;
  pos: string;
  espnId?: number | string;
  headshot: string | null;
};

const NBA_FACES: Record<string, NbaFaceEntry> = (nbaFacesData as { players: Record<string, NbaFaceEntry> }).players;

/* ─────────────────────────── helpers ────────────────────────────────────── */

/** Look up a player's headshot URL by their slug-id. Returns null if not in our index. */
export function getNbaHeadshot(playerId: string): string | null {
  return NBA_FACES[playerId]?.headshot ?? null;
}

/** Get the full NBA face entry for a player. */
export function getNbaFaceEntry(playerId: string): NbaFaceEntry | null {
  return NBA_FACES[playerId] ?? null;
}

/**
 * Find candidate NBA players by team + jersey number. Used to build the
 * candidate set BEFORE running face match (so we don't compare against all 538).
 */
export function findCandidatesByTeamAndNumber(
  team?: string | null,
  jerseyNumber?: string | number | null
): NbaFaceEntry[] {
  if (!team && !jerseyNumber) return [];
  const teamLower = (team ?? '').toLowerCase();
  const num = jerseyNumber == null ? '' : String(jerseyNumber).replace(/^0+/, '') || '0';

  const out: NbaFaceEntry[] = [];
  for (const entry of Object.values(NBA_FACES)) {
    if (teamLower) {
      // Match on team code OR full team name in case vision returns "Lakers" vs "lal"
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
    // Use Replicate's sync mode (Prefer: wait) — keeps connection open up to ~60s
    // for the prediction to finish. Saves us a poll loop.
    const modelId = DEFAULT_MODEL;
    const isVersionPinned = modelId.includes(':');

    const body: Record<string, unknown> = {
      input: { image1, image2 },
    };
    if (isVersionPinned) {
      body.version = modelId.split(':')[1];
    } else {
      // No version pinned → use the model name; Replicate resolves to latest
      // (Note: this requires a slightly different endpoint shape — `models/<name>/predictions`)
    }

    const url = isVersionPinned
      ? REPLICATE_API
      : `https://api.replicate.com/v1/models/${modelId}/predictions`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Prefer: 'wait',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) return null;
    const data = (await res.json()) as {
      status?: string;
      output?: unknown;
      error?: string;
      id?: string;
    };

    let output = data.output;
    // Poll if not done synchronously
    if (data.status !== 'succeeded' && data.id) {
      const pollUrl = `${REPLICATE_API}/${data.id}`;
      for (let i = 0; i < 25; i++) {
        await new Promise((r) => setTimeout(r, 1000));
        const pollRes = await fetch(pollUrl, { headers: { Authorization: `Bearer ${token}` } });
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
 * The output shape of apna-mart/face-match isn't perfectly documented (the
 * Replicate page shows an empty Output schema). It returns an object with
 * fields like `similarity_score`, `match`, `confidence`. We try multiple
 * field names to be safe.
 */
function parseSimilarity(output: unknown): FaceMatchResult | null {
  if (output == null) return null;

  // Direct number output (some models)
  if (typeof output === 'number') {
    return { similarity: output, matched: output >= 0.65 };
  }

  if (typeof output === 'object') {
    const o = output as Record<string, unknown>;

    // Try common similarity-score key names
    const simKeys = [
      'similarity_score',
      'similarity',
      'score',
      'face_similarity',
      'cosine_similarity',
      'distance', // careful — distance is INVERSE of similarity
    ];
    for (const k of simKeys) {
      const v = o[k];
      if (typeof v === 'number') {
        const sim = k === 'distance' ? 1 - v : v;
        const matchKey = o.match ?? o.matched ?? o.is_match;
        const matched =
          typeof matchKey === 'boolean' ? matchKey : sim >= 0.65;
        return { similarity: sim, matched };
      }
    }

    // Sometimes the result is nested
    if ('result' in o) return parseSimilarity(o.result);
    if ('output' in o) return parseSimilarity(o.output);
  }

  return null;
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
