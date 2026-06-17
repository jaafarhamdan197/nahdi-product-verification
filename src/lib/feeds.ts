export type FeedKey = "ar" | "en" | "uae";

export interface FeedItem {
  id: string;
  title: string;
  availability: string;
  price: string;
  sale_price: string;
  image_link: string;
}

export const FEED_CONFIG: Record<FeedKey, { label: string; url: string }> = {
  ar: {
    label: "Nahdi Online KSA - Arabic",
    url: process.env.FEED_URL_AR ?? "",
  },
  en: {
    label: "Nahdi Online KSA - English",
    url: process.env.FEED_URL_EN ?? "",
  },
  uae: {
    label: "Nahdi Online UAE - English",
    url: process.env.FEED_URL_UAE ?? "",
  },
};

export const ALL_FEED_KEYS: FeedKey[] = ["ar", "en", "uae"];

export function isFeedKey(value: unknown): value is FeedKey {
  return typeof value === "string" && (ALL_FEED_KEYS as string[]).includes(value);
}

export interface FeedSnapshot {
  key: FeedKey;
  items: Map<string, FeedItem>;
  /** Number of items in the feed. */
  size: number;
  /** When the underlying feed data was fetched from Channable. */
  fetchedAt: string;
}

// Feeds are large (the KSA Arabic feed alone is ~22MB / ~48k items), so we
// keep a short-lived in-memory snapshot per feed. A search followed by an
// Excel export — or several searches in a row — then reuse the same fetch
// instead of re-downloading tens of MB each time. The cache lives on the
// server module scope, so it survives across warm serverless invocations and
// is simply re-fetched on a cold start. TTL is configurable via env.
const FEED_TTL_MS = (() => {
  const seconds = Number(process.env.FEED_CACHE_TTL_SECONDS);
  return Number.isFinite(seconds) && seconds >= 0 ? seconds * 1000 : 10 * 60 * 1000;
})();

const feedCache = new Map<FeedKey, FeedSnapshot>();

function isFresh(snapshot: FeedSnapshot): boolean {
  if (FEED_TTL_MS === 0) return false;
  return Date.now() - new Date(snapshot.fetchedAt).getTime() < FEED_TTL_MS;
}

async function downloadFeed(key: FeedKey): Promise<FeedSnapshot> {
  const { url } = FEED_CONFIG[key];
  if (!url) {
    throw new Error(
      `Missing feed URL for "${key}". Set the FEED_URL_${key.toUpperCase()} environment variable.`
    );
  }

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch the ${key} feed: ${res.status} ${res.statusText}`);
  }

  const data: unknown = await res.json();
  if (!Array.isArray(data)) {
    throw new Error(`Unexpected feed format for "${key}": expected a JSON array.`);
  }

  const items = new Map<string, FeedItem>();
  for (const raw of data as FeedItem[]) {
    if (raw && raw.id != null) {
      items.set(String(raw.id), raw);
    }
  }

  return { key, items, size: items.size, fetchedAt: new Date().toISOString() };
}

/** Fetch a single feed, using the in-memory snapshot when still fresh. */
export async function getFeed(key: FeedKey, forceRefresh = false): Promise<FeedSnapshot> {
  if (!forceRefresh) {
    const cached = feedCache.get(key);
    if (cached && isFresh(cached)) return cached;
  }
  const snapshot = await downloadFeed(key);
  feedCache.set(key, snapshot);
  return snapshot;
}

export async function getFeeds(
  keys: FeedKey[],
  forceRefresh = false
): Promise<FeedSnapshot[]> {
  return Promise.all(keys.map((key) => getFeed(key, forceRefresh)));
}
