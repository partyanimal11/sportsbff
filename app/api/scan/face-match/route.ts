/**
 * POST /api/scan/face-match
 *
 * Standalone face-match endpoint for testing. Takes a user image + one or
 * more candidate player IDs (NBA only for v1). For each candidate, runs
 * apna-mart/face-match comparing the user's photo against the candidate's
 * ESPN headshot. Returns the best match.
 *
 * Body shape (JSON):
 *   { imageUrl: string, candidates: ["lebron-james", "stephen-curry"] }
 *
 * OR multipart/form-data with:
 *   - image: file
 *   - candidates: comma-separated playerIds
 *
 * Response:
 *   { bestMatch: { id, name, team, similarity } | null,
 *     scored: [{ id, name, similarity }, ...] }
 *
 * Used by /api/scan internally and externally for debugging.
 */
import { NextRequest, NextResponse } from 'next/server';
import { verifyAgainstCandidates, getNbaFaceEntry } from '@/lib/face-match';

export const runtime = 'nodejs';
export const maxDuration = 60;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(req: NextRequest) {
  let imageInput: string | null = null;
  let candidatePlayerIds: string[] = [];

  const contentType = req.headers.get('content-type') ?? '';
  if (contentType.includes('multipart/form-data')) {
    try {
      const form = await req.formData();
      const file = form.get('image');
      if (file instanceof Blob) {
        const bytes = new Uint8Array(await file.arrayBuffer());
        const base64 = Buffer.from(bytes).toString('base64');
        imageInput = `data:image/jpeg;base64,${base64}`;
      }
      const candStr = form.get('candidates');
      if (typeof candStr === 'string') {
        candidatePlayerIds = candStr.split(',').map((s) => s.trim()).filter(Boolean);
      }
    } catch {
      // fall through
    }
  } else {
    try {
      const body = (await req.json()) as { imageUrl?: string; candidates?: string[] };
      if (body.imageUrl) imageInput = body.imageUrl;
      if (Array.isArray(body.candidates)) candidatePlayerIds = body.candidates;
    } catch {
      // fall through
    }
  }

  if (!imageInput) {
    return NextResponse.json(
      { error: 'No image provided (use form-data `image` or JSON `imageUrl`)' },
      { status: 400, headers: CORS_HEADERS }
    );
  }
  if (candidatePlayerIds.length === 0) {
    return NextResponse.json(
      { error: 'No candidates provided. Pass `candidates: ["lebron-james", ...]`' },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const candidates = candidatePlayerIds
    .map((id) => getNbaFaceEntry(id))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  if (candidates.length === 0) {
    return NextResponse.json(
      { error: 'None of the provided candidate IDs found in NBA face index' },
      { status: 404, headers: CORS_HEADERS }
    );
  }

  const result = await verifyAgainstCandidates(imageInput, candidates, 0.65);

  return NextResponse.json(
    {
      bestMatch: result.bestMatch
        ? {
            id: result.bestMatch.entry.id,
            name: result.bestMatch.entry.name,
            team: result.bestMatch.entry.team,
            jersey: result.bestMatch.entry.jersey,
            similarity: result.bestMatch.similarity,
          }
        : null,
      scored: result.scored.map((s) => ({
        id: s.entry.id,
        name: s.entry.name,
        similarity: s.similarity,
      })),
    },
    { headers: CORS_HEADERS }
  );
}
