import { NextRequest, NextResponse } from "next/server";
import { runSearch } from "@/lib/request";

export async function POST(req: NextRequest) {
  const outcome = await runSearch(req);
  if (!outcome.ok) return outcome.response;
  return NextResponse.json(outcome.result);
}
