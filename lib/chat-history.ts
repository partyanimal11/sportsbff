/**
 * Chat history — localStorage-backed conversation persistence.
 *
 * Phase 1: stores conversations in localStorage. No Supabase yet — when we
 * wire auth later, we'll migrate this shape to a `conversations` + `messages`
 * table and keep the same API surface.
 *
 * Each conversation auto-titles from the first user message.
 */

const STORAGE_KEY = 'sportsbff.chat-history';
const MAX_CONVERSATIONS = 50; // cap localStorage growth

export type ChatRole = 'user' | 'assistant';

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

export type Conversation = {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number; // unix ms
  updatedAt: number; // unix ms
  /** Whether Tea'd Up was on when the convo started — for re-creating the system prompt later. */
  teadUpOn?: boolean;
};

function readAll(): Conversation[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Conversation[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(list: Conversation[]) {
  if (typeof window === 'undefined') return;
  try {
    // Keep the most-recent N conversations only
    const trimmed = list
      .slice()
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, MAX_CONVERSATIONS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // Quota exceeded — silently drop oldest
    try {
      const trimmed = list.slice().sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 20);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch {
      // give up
    }
  }
}

/** All conversations, newest first. */
export function listConversations(): Conversation[] {
  return readAll().sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getConversation(id: string): Conversation | null {
  return readAll().find((c) => c.id === id) ?? null;
}

/** Insert OR update a conversation by id. */
export function saveConversation(conv: Conversation): void {
  const all = readAll();
  const idx = all.findIndex((c) => c.id === conv.id);
  if (idx >= 0) all[idx] = conv;
  else all.push(conv);
  writeAll(all);
}

export function deleteConversation(id: string): void {
  const all = readAll().filter((c) => c.id !== id);
  writeAll(all);
}

export function clearAllConversations(): void {
  writeAll([]);
}

/** Generate a chat title from the first user message. Caps at ~40 chars. */
export function makeTitle(messages: ChatMessage[]): string {
  const firstUser = messages.find((m) => m.role === 'user');
  if (!firstUser) return 'New conversation';
  const t = firstUser.content.replace(/\s+/g, ' ').trim();
  if (t.length <= 40) return t;
  return t.slice(0, 38) + '…';
}

export function newConversationId(): string {
  return `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Format a Unix-ms timestamp as a relative time. Used in the history drawer.
 */
export function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const min = 60 * 1000;
  const hour = 60 * min;
  const day = 24 * hour;
  if (diff < min) return 'just now';
  if (diff < hour) return `${Math.floor(diff / min)}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  if (diff < 7 * day) return `${Math.floor(diff / day)}d ago`;
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
