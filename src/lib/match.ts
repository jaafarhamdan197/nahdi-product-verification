import { FeedKey, FeedSnapshot } from "./feeds";

export function parseIds(raw: string): string[] {
  const seen = new Set<string>();
  const ids: string[] = [];
  // Split on any whitespace (incl. tabs/newlines from Excel paste), commas,
  // and semicolons. Strip surrounding quotes that spreadsheets sometimes add.
  for (const token of raw.split(/[\s,;]+/)) {
    const id = token.trim().replace(/^["']+|["']+$/g, "");
    if (!id || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  return ids;
}

export interface SearchRow {
  id: string;
  feed: FeedKey;
  status: "available" | "not_found";
  title?: string;
  price?: string;
  sale_price?: string;
  image_link?: string;
}

export interface MismatchRow {
  id: string;
  availableIn: FeedKey[];
  missingIn: FeedKey[];
}

export interface FeedSummary {
  feed: FeedKey;
  available: number;
  notFound: number;
  /** Total number of items present in the feed. */
  feedSize: number;
  fetchedAt: string;
}

export interface SearchResult {
  ids: string[];
  feeds: FeedKey[];
  rows: SearchRow[];
  summary: FeedSummary[];
  mismatches: MismatchRow[];
}

export function searchFeeds(ids: string[], snapshots: FeedSnapshot[]): SearchResult {
  const rows: SearchRow[] = [];
  const summary: FeedSummary[] = [];

  for (const snapshot of snapshots) {
    let available = 0;
    let notFound = 0;
    for (const id of ids) {
      const item = snapshot.items.get(id);
      if (item) {
        available++;
        rows.push({
          id,
          feed: snapshot.key,
          status: "available",
          title: item.title,
          price: item.price,
          sale_price: item.sale_price,
          image_link: item.image_link,
        });
      } else {
        notFound++;
        rows.push({ id, feed: snapshot.key, status: "not_found" });
      }
    }
    summary.push({
      feed: snapshot.key,
      available,
      notFound,
      feedSize: snapshot.size,
      fetchedAt: snapshot.fetchedAt,
    });
  }

  const mismatches: MismatchRow[] = [];
  if (snapshots.length > 1) {
    for (const id of ids) {
      const availableIn: FeedKey[] = [];
      const missingIn: FeedKey[] = [];
      for (const snapshot of snapshots) {
        if (snapshot.items.has(id)) availableIn.push(snapshot.key);
        else missingIn.push(snapshot.key);
      }
      if (availableIn.length > 0 && missingIn.length > 0) {
        mismatches.push({ id, availableIn, missingIn });
      }
    }
  }

  return {
    ids,
    feeds: snapshots.map((s) => s.key),
    rows,
    summary,
    mismatches,
  };
}
