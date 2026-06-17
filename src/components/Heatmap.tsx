"use client";

type FeedKey = "ar" | "en" | "uae";

interface SearchRow {
  id: string;
  feed: FeedKey;
  status: "available" | "not_found";
}

const SHORT: Record<FeedKey, string> = {
  ar: "KSA AR",
  en: "KSA EN",
  uae: "UAE EN",
};

/**
 * Availability matrix: one row per item ID, one column per selected feed.
 * Green = available, red = not found. Reads at a glance as a heatmap and makes
 * cross-feed gaps obvious.
 */
export default function Heatmap({
  ids,
  feeds,
  rows,
}: {
  ids: string[];
  feeds: FeedKey[];
  rows: SearchRow[];
}) {
  const status = new Map<string, "available" | "not_found">();
  for (const r of rows) status.set(`${r.feed}:${r.id}`, r.status);

  return (
    <div>
      <div className="mb-3 flex items-center gap-4 text-[11px] text-[var(--mid-gray)]">
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-3 w-3 rounded-sm"
            style={{ background: "var(--growth)" }}
          />
          Available
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-3 w-3 rounded-sm"
            style={{ background: "var(--risk)" }}
          />
          Not found
        </span>
      </div>

      <div className="sw" style={{ maxHeight: 420 }}>
        <div
          className="grid text-[10px]"
          style={{
            gridTemplateColumns: `minmax(90px, 1fr) repeat(${feeds.length}, 52px)`,
          }}
        >
          {/* header */}
          <div className="sticky top-0 z-10 bg-white px-2 py-1.5 font-semibold uppercase tracking-wider text-[var(--mid-gray)]">
            Item ID
          </div>
          {feeds.map((f) => (
            <div
              key={f}
              className="sticky top-0 z-10 bg-white px-1 py-1.5 text-center font-semibold uppercase tracking-wider text-[var(--mid-gray)]"
            >
              {SHORT[f]}
            </div>
          ))}

          {/* rows */}
          {ids.map((id) => (
            <div key={id} className="contents">
              <div
                className="mc truncate border-t border-[var(--soft-gray)] px-2 py-1 text-[11px]"
                title={id}
              >
                {id}
              </div>
              {feeds.map((f) => {
                const ok = status.get(`${f}:${id}`) === "available";
                return (
                  <div
                    key={f}
                    className="flex items-center justify-center border-t border-white"
                    title={`${id} · ${SHORT[f]}: ${ok ? "Available" : "Not found"}`}
                  >
                    <span
                      className="block h-full w-full"
                      style={{
                        minHeight: 22,
                        background: ok ? "var(--growth)" : "var(--risk)",
                        opacity: 0.92,
                      }}
                    />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
