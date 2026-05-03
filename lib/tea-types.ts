/**
 * Shared types between the curated tea pipeline and the live ingest pipeline.
 *
 * Pulled out of tea-blend.ts and live-tea-blobs.ts to break a circular import:
 *   tea-blend.ts imports loadLiveGossip from live-tea-blobs.ts
 *   live-tea-blobs.ts needs the GossipItem type
 * → both pull from this neutral file instead.
 */

export type GossipSource = {
  name: string;
  url: string;
  date: string;
};

export type GossipItem = {
  id: string;
  tier: 'confirmed' | 'reported' | 'speculation' | 'rumor';
  category: string;
  headline: string;
  summary: string;
  sources: GossipSource[];
};

/**
 * Live item shape. Mirrors GossipItem with extra fields needed for the live
 * pipeline: ingested_at (for FRESH badge + age sorting), player_id (gossip
 * only — null for news), confidence (classifier output).
 */
export type LiveTeaItem = GossipItem & {
  ingested_at: string;
  player_id: string | null;
  confidence: number;
  source_url: string;
  league: 'nba' | 'nfl' | 'wnba' | 'general';
};

export type PendingItem = LiveTeaItem & {
  pending_reason: string;
  guessed_player_id: string | null;
};

export type LiveTeaFile = {
  generated_at: string;
  count: number;
  items: LiveTeaItem[];
};

export type PendingFile = {
  generated_at: string;
  count: number;
  items: PendingItem[];
};
