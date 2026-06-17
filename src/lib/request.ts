import { NextResponse } from "next/server";
import { isEmailAllowed } from "@/auth";
import { devBypassEnabled, getSession } from "@/lib/session";
import { ALL_FEED_KEYS, FeedKey, getFeeds, isFeedKey } from "@/lib/feeds";
import { parseIds, searchFeeds, SearchResult } from "@/lib/match";

export type StatusFilter = "all" | "available" | "not_found";

function parseStatusFilter(value: unknown): StatusFilter {
  return value === "available" || value === "not_found" ? value : "all";
}

interface ResolvedRequest {
  feeds: FeedKey[];
  ids: string[];
  statusFilter: StatusFilter;
}

type Resolution =
  | { ok: true; data: ResolvedRequest }
  | { ok: false; response: NextResponse };

/**
 * Shared guard + body parser for the search/export API routes:
 * verifies the session, validates the requested feeds, and parses the IDs.
 */
export async function resolveRequest(req: Request): Promise<Resolution> {
  const session = await getSession();
  if (!session) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  // Re-check the allowlist on every API call so a since-removed user (whose
  // JWT session is still valid) is blocked immediately, not at session expiry.
  if (!devBypassEnabled() && !isEmailAllowed(session.user?.email)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }),
    };
  }

  const rawFeeds = (body as { feeds?: unknown })?.feeds;
  const feeds: FeedKey[] = Array.isArray(rawFeeds)
    ? rawFeeds.filter(isFeedKey)
    : [];
  const selectedFeeds = feeds.length > 0 ? feeds : ALL_FEED_KEYS;

  const ids = parseIds(String((body as { idsRaw?: unknown })?.idsRaw ?? ""));
  if (ids.length === 0) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "No item IDs provided." },
        { status: 400 }
      ),
    };
  }

  const statusFilter = parseStatusFilter(
    (body as { statusFilter?: unknown })?.statusFilter
  );

  return { ok: true, data: { feeds: selectedFeeds, ids, statusFilter } };
}

/** Resolve the request and run the feed comparison, sharing fetch caching. */
export async function runSearch(
  req: Request
): Promise<
  | { ok: true; result: SearchResult; feeds: FeedKey[]; statusFilter: StatusFilter }
  | { ok: false; response: NextResponse }
> {
  const resolved = await resolveRequest(req);
  if (!resolved.ok) return resolved;

  try {
    const snapshots = await getFeeds(resolved.data.feeds);
    return {
      ok: true,
      result: searchFeeds(resolved.data.ids, snapshots),
      feeds: resolved.data.feeds,
      statusFilter: resolved.data.statusFilter,
    };
  } catch (err) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: err instanceof Error ? err.message : "Failed to fetch feeds." },
        { status: 502 }
      ),
    };
  }
}
