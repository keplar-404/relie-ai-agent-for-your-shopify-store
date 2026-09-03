import { NextResponse } from "next/server";
import { findFiles } from "@/services/codeSandbox/fsOperations";
import { setActiveSandboxId } from "@/services/codeSandbox/sandboxStore";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { pattern, path, sandboxId } = body;
    if (sandboxId) setActiveSandboxId(sandboxId);

    if (!pattern) {
      return NextResponse.json({ error: "'pattern' is required" }, { status: 400 });
    }

    const result = await findFiles(pattern, path);
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("[API: fs/find-files] Error:", error);
    const message = error instanceof Error ? error.message : "Failed to find files";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

