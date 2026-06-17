import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { FEED_CONFIG } from "@/lib/feeds";
import { runSearch } from "@/lib/request";

const HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF0F172A" },
};

export async function POST(req: NextRequest) {
  const outcome = await runSearch(req);
  if (!outcome.ok) return outcome.response;

  const { result, feeds, statusFilter } = outcome;
  const scopeLabel =
    statusFilter === "not_found"
      ? "Not found only"
      : statusFilter === "available"
        ? "Available only"
        : "All items";

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Nahdi Product Verification";
  workbook.created = new Date();

  const styleHeader = (sheet: ExcelJS.Worksheet) => {
    const header = sheet.getRow(1);
    header.font = { bold: true, color: { argb: "FFFFFFFF" } };
    header.eachCell((cell) => (cell.fill = HEADER_FILL));
    sheet.views = [{ state: "frozen", ySplit: 1 }];
  };

  // --- Summary sheet ---
  const summarySheet = workbook.addWorksheet("Summary");
  summarySheet.columns = [
    { header: "Feed", key: "feed", width: 30 },
    { header: "Searched IDs", key: "searched", width: 14 },
    { header: "Available", key: "available", width: 12 },
    { header: "Not Found", key: "notFound", width: 12 },
    { header: "Feed Size", key: "feedSize", width: 12 },
    { header: "Fetched At", key: "fetchedAt", width: 24 },
  ];
  for (const s of result.summary) {
    summarySheet.addRow({
      feed: FEED_CONFIG[s.feed].label,
      searched: result.ids.length,
      available: s.available,
      notFound: s.notFound,
      feedSize: s.feedSize,
      fetchedAt: new Date(s.fetchedAt).toLocaleString(),
    });
  }
  styleHeader(summarySheet);
  // Note the export scope so a filtered file is self-documenting.
  summarySheet.addRow({});
  const scopeRow = summarySheet.addRow({ feed: `Export scope: ${scopeLabel}` });
  scopeRow.getCell("feed").font = { italic: true, color: { argb: "FF777777" } };

  // --- One sheet per feed ---
  for (const feedKey of feeds) {
    const sheet = workbook.addWorksheet(FEED_CONFIG[feedKey].label.slice(0, 31));
    sheet.columns = [
      { header: "Item ID", key: "id", width: 16 },
      { header: "Status", key: "status", width: 14 },
      { header: "Title", key: "title", width: 50 },
      { header: "Price", key: "price", width: 14 },
      { header: "Sale Price", key: "sale_price", width: 14 },
      { header: "Image Link", key: "image_link", width: 60 },
    ];
    const feedRows = result.rows.filter(
      (r) =>
        r.feed === feedKey &&
        (statusFilter === "all" || r.status === statusFilter)
    );
    for (const row of feedRows) {
      const sheetRow = sheet.addRow({
        id: row.id,
        status: row.status === "available" ? "Available" : "Not Found",
        title: row.title ?? "",
        price: row.price ?? "",
        sale_price: row.sale_price ?? "",
        image_link: row.image_link ?? "",
      });
      sheetRow.getCell("status").font = {
        bold: true,
        color: { argb: row.status === "available" ? "FF1A7F37" : "FFCC0000" },
      };
    }
    styleHeader(sheet);
    sheet.autoFilter = { from: "A1", to: "F1" };
  }

  // --- Cross-feed mismatches (only meaningful with 2+ feeds) ---
  if (feeds.length > 1) {
    const mismatchSheet = workbook.addWorksheet("Cross-Feed Mismatches");
    mismatchSheet.columns = [
      { header: "Item ID", key: "id", width: 16 },
      { header: "Available In", key: "availableIn", width: 45 },
      { header: "Missing In", key: "missingIn", width: 45 },
    ];
    for (const m of result.mismatches) {
      mismatchSheet.addRow({
        id: m.id,
        availableIn: m.availableIn.map((k) => FEED_CONFIG[k].label).join(", "),
        missingIn: m.missingIn.map((k) => FEED_CONFIG[k].label).join(", "),
      });
    }
    styleHeader(mismatchSheet);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const scopeSuffix =
    statusFilter === "not_found"
      ? "-not-found"
      : statusFilter === "available"
        ? "-available"
        : "";
  const filename = `nahdi-product-verification${scopeSuffix}-${new Date()
    .toISOString()
    .slice(0, 10)}.xlsx`;

  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
