"use client";

import { useMemo, useState } from "react";

type FeedKey = "ar" | "en" | "uae";

const FEED_OPTIONS: { key: FeedKey; label: string }[] = [
  { key: "ar", label: "Nahdi Online KSA - Arabic" },
  { key: "en", label: "Nahdi Online KSA - English" },
  { key: "uae", label: "Nahdi Online UAE - English" },
];
const ALL_KEYS: FeedKey[] = FEED_OPTIONS.map((f) => f.key);

type StatusFilter = "all" | "available" | "not_found";

interface SearchRow {
  id: string;
  feed: FeedKey;
  status: "available" | "not_found";
  title?: string;
  price?: string;
  sale_price?: string;
  image_link?: string;
}

interface FeedSummary {
  feed: FeedKey;
  available: number;
  notFound: number;
  feedSize: number;
  fetchedAt: string;
}

interface MismatchRow {
  id: string;
  availableIn: FeedKey[];
  missingIn: FeedKey[];
}

interface SearchResult {
  ids: string[];
  feeds: FeedKey[];
  rows: SearchRow[];
  summary: FeedSummary[];
  mismatches: MismatchRow[];
}

interface Query {
  feeds: FeedKey[];
  idsRaw: string;
}

const feedLabel = (key: FeedKey) =>
  FEED_OPTIONS.find((f) => f.key === key)?.label ?? key;

// Mirror of the server-side parser, used only for the live ID counter.
function countIds(raw: string): number {
  const seen = new Set<string>();
  for (const token of raw.split(/[\s,;]+/)) {
    const id = token.trim().replace(/^["']+|["']+$/g, "");
    if (id) seen.add(id);
  }
  return seen.size;
}

export default function SearchTool() {
  const [selectedFeeds, setSelectedFeeds] = useState<FeedKey[]>([...ALL_KEYS]);
  const [idsRaw, setIdsRaw] = useState("");
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SearchResult | null>(null);
  // The exact inputs behind the rendered result, so export always matches
  // what's on screen even if the user tweaks the form afterwards.
  const [lastQuery, setLastQuery] = useState<Query | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const idCount = useMemo(() => countIds(idsRaw), [idsRaw]);

  const toggleFeed = (key: FeedKey) =>
    setSelectedFeeds((prev) =>
      prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]
    );

  async function handleSearch() {
    setError(null);
    if (selectedFeeds.length === 0) {
      setError("Select at least one feed.");
      return;
    }
    if (idCount === 0) {
      setError("Paste at least one item ID.");
      return;
    }
    const query: Query = {
      // Preserve the canonical feed order regardless of click order.
      feeds: ALL_KEYS.filter((k) => selectedFeeds.includes(k)),
      idsRaw,
    };
    setLoading(true);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(query),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Search failed");
      setResult(data);
      setLastQuery(query);
      setStatusFilter("all");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleExport() {
    if (!lastQuery) return;
    setError(null);
    setExporting(true);
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lastQuery),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Export failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `nahdi-product-verification-${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  }

  const totals = useMemo(() => {
    if (!result) return null;
    return result.summary.reduce(
      (acc, s) => {
        acc.available += s.available;
        acc.notFound += s.notFound;
        return acc;
      },
      { available: 0, notFound: 0 }
    );
  }, [result]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Feeds</h2>
          <div className="flex gap-2 text-xs">
            <button
              type="button"
              onClick={() => setSelectedFeeds([...ALL_KEYS])}
              className="text-slate-500 hover:text-slate-900"
            >
              Select all
            </button>
            <span className="text-slate-300">|</span>
            <button
              type="button"
              onClick={() => setSelectedFeeds([])}
              className="text-slate-500 hover:text-slate-900"
            >
              Clear
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          {FEED_OPTIONS.map((opt) => (
            <label
              key={opt.key}
              className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm ${
                selectedFeeds.includes(opt.key)
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-300 text-slate-700"
              }`}
            >
              <input
                type="checkbox"
                className="hidden"
                checked={selectedFeeds.includes(opt.key)}
                onChange={() => toggleFeed(opt.key)}
              />
              {opt.label}
            </label>
          ))}
        </div>

        <div className="mt-6 mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Item IDs</h2>
          <span className="text-xs text-slate-500">
            {idCount} unique ID{idCount === 1 ? "" : "s"}
          </span>
        </div>
        <textarea
          className="h-32 w-full rounded-md border border-slate-300 p-3 font-mono text-sm"
          placeholder="Paste item IDs from Excel (space, comma, or newline separated)..."
          value={idsRaw}
          onChange={(e) => setIdsRaw(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleSearch();
          }}
        />

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-4 flex gap-3">
          <button
            onClick={handleSearch}
            disabled={loading}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {loading ? "Checking..." : "Check Availability"}
          </button>
          {result && (
            <button
              onClick={handleExport}
              disabled={exporting}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
            >
              {exporting ? "Generating..." : "Download Excel"}
            </button>
          )}
        </div>
      </section>

      {result && (
        <>
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">
              Summary — {result.ids.length} item
              {result.ids.length === 1 ? "" : "s"} across {result.feeds.length}{" "}
              feed{result.feeds.length === 1 ? "" : "s"}
              {totals && (
                <span className="ml-2 font-normal text-slate-500">
                  ({totals.available} available / {totals.notFound} not found
                  total)
                </span>
              )}
            </h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {result.summary.map((s) => (
                <div
                  key={s.feed}
                  className="rounded-md border border-slate-200 p-4"
                >
                  <p className="text-xs text-slate-500">{feedLabel(s.feed)}</p>
                  <p className="mt-1 text-sm">
                    <span className="font-semibold text-green-700">
                      {s.available} available
                    </span>
                    {" / "}
                    <span className="font-semibold text-red-600">
                      {s.notFound} not found
                    </span>
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    {s.feedSize.toLocaleString()} items · fetched{" "}
                    {new Date(s.fetchedAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {result.mismatches.length > 0 && (
            <section className="rounded-xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold text-amber-900">
                Cross-Feed Mismatches ({result.mismatches.length})
              </h2>
              <p className="mb-3 text-xs text-amber-700">
                Items available in some selected feeds but missing in others.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-amber-800">
                      <th className="py-1 pr-4">Item ID</th>
                      <th className="py-1 pr-4">Available In</th>
                      <th className="py-1 pr-4">Missing In</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.mismatches.map((m) => (
                      <tr key={m.id} className="border-t border-amber-200">
                        <td className="py-1.5 pr-4 font-mono">{m.id}</td>
                        <td className="py-1.5 pr-4">
                          {m.availableIn.map(feedLabel).join(", ")}
                        </td>
                        <td className="py-1.5 pr-4">
                          {m.missingIn.map(feedLabel).join(", ")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">Show:</span>
            {(["all", "available", "not_found"] as StatusFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`rounded-full px-3 py-1 ${
                  statusFilter === f
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {f === "all" ? "All" : f === "available" ? "Available" : "Not found"}
              </button>
            ))}
          </div>

          {result.feeds.map((feedKey) => {
            const rows = result.rows.filter(
              (r) =>
                r.feed === feedKey &&
                (statusFilter === "all" || r.status === statusFilter)
            );
            return (
              <section
                key={feedKey}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <h2 className="mb-3 text-sm font-semibold text-slate-900">
                  {feedLabel(feedKey)}{" "}
                  <span className="font-normal text-slate-400">
                    ({rows.length} shown)
                  </span>
                </h2>
                {rows.length === 0 ? (
                  <p className="text-sm text-slate-400">
                    No items match this filter.
                  </p>
                ) : (
                  <div className="max-h-96 overflow-y-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="sticky top-0 bg-white">
                        <tr className="text-slate-500">
                          <th className="py-1 pr-4">Item ID</th>
                          <th className="py-1 pr-4">Status</th>
                          <th className="py-1 pr-4">Title</th>
                          <th className="py-1 pr-4">Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row) => (
                          <tr
                            key={row.id}
                            className="border-t border-slate-100 align-top"
                          >
                            <td className="py-1.5 pr-4 font-mono">{row.id}</td>
                            <td className="py-1.5 pr-4">
                              {row.status === "available" ? (
                                <span className="font-medium text-green-700">
                                  Available
                                </span>
                              ) : (
                                <span className="font-medium text-red-600">
                                  Not Found
                                </span>
                              )}
                            </td>
                            <td className="py-1.5 pr-4">
                              <div className="flex items-center gap-2">
                                {row.image_link && (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={row.image_link}
                                    alt=""
                                    loading="lazy"
                                    className="h-8 w-8 flex-none rounded border border-slate-200 object-cover"
                                  />
                                )}
                                <span>{row.title ?? "-"}</span>
                              </div>
                            </td>
                            <td className="py-1.5 pr-4 whitespace-nowrap">
                              {row.sale_price && row.sale_price !== row.price ? (
                                <span>
                                  <span className="text-slate-400 line-through">
                                    {row.price}
                                  </span>{" "}
                                  <span className="font-medium">
                                    {row.sale_price}
                                  </span>
                                </span>
                              ) : (
                                row.price ?? "-"
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            );
          })}
        </>
      )}
    </div>
  );
}
