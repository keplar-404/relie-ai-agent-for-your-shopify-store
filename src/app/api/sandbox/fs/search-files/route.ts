import { NextResponse } from "next/server";
import { searchFiles } from "@/services/codeSandbox/fsOperations";
import { setActiveSandboxId } from "@/services/codeSandbox/sandboxStore";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { pattern, path, sandboxId } = body;
    if (sandboxId) setActiveSandboxId(sandboxId);

    const result = await searchFiles(pattern, path);
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("[API: fs/search-files] Error:", error);
    const message = error instanceof Error ? error.message : "Failed to search files";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

