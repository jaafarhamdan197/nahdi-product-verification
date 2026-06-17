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
    <div className="mx-auto max-w-6xl space-y-7">
      {/* ---- Query panel ---- */}
      <section className="panel">
        <div className="ph">
          <h2>Feeds</h2>
          <div className="flex gap-3 text-xs">
            <button
              type="button"
              onClick={() => setSelectedFeeds([...ALL_KEYS])}
              className="text-[var(--mid-gray)] hover:text-black"
            >
              Select all
            </button>
            <span className="text-[var(--light-gray)]">|</span>
            <button
              type="button"
              onClick={() => setSelectedFeeds([])}
              className="text-[var(--mid-gray)] hover:text-black"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {FEED_OPTIONS.map((opt) => {
            const on = selectedFeeds.includes(opt.key);
            return (
              <label key={opt.key} className="toggle" data-on={on}>
                <input
                  type="checkbox"
                  className="hidden"
                  checked={on}
                  onChange={() => toggleFeed(opt.key)}
                />
                <span className="dot" />
                {opt.label}
              </label>
            );
          })}
        </div>

        <div className="ph mt-6">
          <h2>Item IDs</h2>
          <span className="badge">
            {idCount} unique ID{idCount === 1 ? "" : "s"}
          </span>
        </div>
        <textarea
          className="idbox"
          placeholder="Paste item IDs from Excel (space, comma, or newline separated)..."
          value={idsRaw}
          onChange={(e) => setIdsRaw(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleSearch();
          }}
        />

        {error && (
          <p className="mt-3 text-sm font-medium text-[var(--risk)]">{error}</p>
        )}

        <div className="mt-5 flex gap-3">
          <button
            onClick={handleSearch}
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? "Checking…" : "Check Availability"}
          </button>
          {result && (
            <button onClick={handleExport} disabled={exporting} className="btn">
              {exporting ? "Generating…" : "Download Excel"}
            </button>
          )}
        </div>
      </section>

      {result && (
        <>
          {/* ---- Summary ---- */}
          <div>
            <div className="ph">
              <h2 className="sec-hdr !text-base">Summary</h2>
              <span className="badge">
                {result.ids.length} item{result.ids.length === 1 ? "" : "s"} ·{" "}
                {result.feeds.length} feed
                {result.feeds.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {totals && (
                <div className="kpi" style={{ ["--kc" as string]: "var(--ink-blue)" }}>
                  <div className="kl">Total Checked</div>
                  <div className="kv mc">{result.ids.length}</div>
                  <div className="ks">
                    <span className="s-ok">{totals.available} available</span>
                    {" · "}
                    <span className="s-no">{totals.notFound} not found</span>
                  </div>
                </div>
              )}
              {result.summary.map((s) => (
                <div
                  key={s.feed}
                  className="kpi"
                  style={{
                    ["--kc" as string]:
                      s.notFound === 0 ? "var(--growth)" : "var(--attention)",
                  }}
                >
                  <div className="kl">{feedLabel(s.feed)}</div>
                  <div className="kv mc">
                    <span className="s-ok">{s.available}</span>
                    <span className="text-[var(--light-gray)]"> / </span>
                    <span className="s-no">{s.notFound}</span>
                  </div>
                  <div className="ks">
                    {s.feedSize.toLocaleString()} items · fetched{" "}
                    {new Date(s.fetchedAt).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ---- Cross-feed mismatches ---- */}
          {result.mismatches.length > 0 && (
            <section
              className="panel"
              style={{
                borderColor: "var(--attention)",
                background: "#fffaf0",
              }}
            >
              <div className="ph">
                <h2>Cross-Feed Mismatches</h2>
                <span
                  className="badge"
                  style={{
                    color: "var(--attention)",
                    borderColor: "var(--attention)",
                  }}
                >
                  {result.mismatches.length}
                </span>
              </div>
              <p className="mb-3 text-xs text-[var(--mid-gray)]">
                Items available in some selected feeds but missing in others.
              </p>
              <div className="sw">
                <table className="dt">
                  <thead>
                    <tr>
                      <th>Item ID</th>
                      <th>Available In</th>
                      <th>Missing In</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.mismatches.map((m) => (
                      <tr key={m.id}>
                        <td className="mc">{m.id}</td>
                        <td className="s-ok">
                          {m.availableIn.map(feedLabel).join(", ")}
                        </td>
                        <td className="s-no">
                          {m.missingIn.map(feedLabel).join(", ")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* ---- Filter ---- */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--mid-gray)]">
              Show
            </span>
            {(["all", "available", "not_found"] as StatusFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className="pill"
                data-on={statusFilter === f}
              >
                {f === "all" ? "All" : f === "available" ? "Available" : "Not found"}
              </button>
            ))}
          </div>

          {/* ---- Per-feed tables ---- */}
          {result.feeds.map((feedKey) => {
            const rows = result.rows.filter(
              (r) =>
                r.feed === feedKey &&
                (statusFilter === "all" || r.status === statusFilter)
            );
            return (
              <section key={feedKey} className="panel">
                <div className="ph">
                  <h2>{feedLabel(feedKey)}</h2>
                  <span className="badge">{rows.length} shown</span>
                </div>
                {rows.length === 0 ? (
                  <p className="text-sm text-[var(--mid-gray)]">
                    No items match this filter.
                  </p>
                ) : (
                  <div className="sw">
                    <table className="dt">
                      <thead>
                        <tr>
                          <th>Item ID</th>
                          <th>Status</th>
                          <th>Title</th>
                          <th>Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row) => (
                          <tr key={row.id}>
                            <td className="mc">{row.id}</td>
                            <td>
                              <span
                                className={
                                  row.status === "available" ? "s-ok" : "s-no"
                                }
                              >
                                {row.status === "available"
                                  ? "Available"
                                  : "Not Found"}
                              </span>
                            </td>
                            <td>
                              <div className="flex items-center gap-2">
                                {row.image_link && (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={row.image_link}
                                    alt=""
                                    loading="lazy"
                                    className="h-8 w-8 flex-none rounded border border-[var(--light-gray)] object-cover"
                                  />
                                )}
                                <span>{row.title ?? "—"}</span>
                              </div>
                            </td>
                            <td className="mc whitespace-nowrap">
                              {row.sale_price && row.sale_price !== row.price ? (
                                <span>
                                  <span className="text-[var(--mid-gray)] line-through">
                                    {row.price}
                                  </span>{" "}
                                  <span className="font-medium">
                                    {row.sale_price}
                                  </span>
                                </span>
                              ) : (
                                row.price ?? "—"
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
