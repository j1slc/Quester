import { NextResponse } from "next/server";
import { getSiteState } from "@/lib/site-state";

// Public: current maintenance / announcement state. POST so it is never statically cached.
export async function POST() {
  const state = await getSiteState();
  return NextResponse.json(state, { headers: { "Cache-Control": "no-store" } });
}
