"use client";

import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  type ChartOptions,
} from "chart.js";

// Register the pieces we use, once.
ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);

// design.md chart defaults: Poppins labels, light-gray gridlines, bottom legend
const FONT = "Poppins, system-ui, sans-serif";
ChartJS.defaults.font.family = FONT;
ChartJS.defaults.color = "#777777";

export const COLORS = {
  growth: "#00a676",
  risk: "#e53935",
  attention: "#ffb000",
  inkBlue: "#5ec7eb",
  lightGray: "#e6e6e2",
};

export const legendBottom = {
  position: "bottom" as const,
  labels: { font: { size: 10, family: FONT }, boxWidth: 10, padding: 12 },
};

export const barOptions: ChartOptions<"bar"> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: legendBottom },
  scales: {
    x: {
      stacked: true,
      grid: { display: false },
      ticks: { font: { size: 9, family: FONT } },
    },
    y: {
      stacked: true,
      beginAtZero: true,
      grid: { color: COLORS.lightGray },
      ticks: { precision: 0, font: { size: 9, family: FONT } },
    },
  },
};

export const doughnutOptions: ChartOptions<"doughnut"> = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: "62%",
  plugins: { legend: legendBottom },
};
