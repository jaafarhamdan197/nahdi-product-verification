"use client";

import { Doughnut, Bar } from "react-chartjs-2";
import { COLORS, doughnutOptions, barOptions } from "./charts";

type FeedKey = "ar" | "en" | "uae";

interface FeedSummary {
  feed: FeedKey;
  available: number;
  notFound: number;
  feedSize: number;
  fetchedAt: string;
}

const SHORT: Record<FeedKey, string> = {
  ar: "KSA AR",
  en: "KSA EN",
  uae: "UAE EN",
};

export function AvailabilityDonut({
  available,
  notFound,
}: {
  available: number;
  notFound: number;
}) {
  const total = available + notFound;
  const data = {
    labels: ["Available", "Not Found"],
    datasets: [
      {
        data: [available, notFound],
        backgroundColor: [COLORS.growth, COLORS.risk],
        borderWidth: 0,
      },
    ],
  };
  const pct = total > 0 ? Math.round((available / total) * 100) : 0;
  return (
    <div className="relative">
      <div className="cw" style={{ height: 180 }}>
        <Doughnut data={data} options={doughnutOptions} />
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-[64px] text-center">
        <div className="mc text-2xl font-bold text-[var(--growth)]">{pct}%</div>
        <div className="text-[10px] uppercase tracking-wider text-[var(--mid-gray)]">
          available
        </div>
      </div>
    </div>
  );
}

export function PerFeedBar({ summary }: { summary: FeedSummary[] }) {
  const data = {
    labels: summary.map((s) => SHORT[s.feed]),
    datasets: [
      {
        label: "Available",
        data: summary.map((s) => s.available),
        backgroundColor: COLORS.growth,
        borderRadius: 4,
      },
      {
        label: "Not Found",
        data: summary.map((s) => s.notFound),
        backgroundColor: COLORS.risk,
        borderRadius: 4,
      },
    ],
  };
  return (
    <div className="cw" style={{ height: 200 }}>
      <Bar data={data} options={barOptions} />
    </div>
  );
}
