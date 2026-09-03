import { NextResponse } from "next/server";
import { readFileText } from "@/services/codeSandbox/fsOperations";
import { setActiveSandboxId } from "@/services/codeSandbox/sandboxStore";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { path, startLine = 1, endLine = 200, sandboxId } = body;
    if (sandboxId) setActiveSandboxId(sandboxId);

    const sLine = Number(startLine);
    const eLine = Number(endLine);

    const content = await readFileText(path, sLine, eLine);
    return NextResponse.json({
      success: true,
      startLine: sLine,
      endLine: eLine,
      content,
    });
  } catch (error) {
    console.error("[API: fs/download-file] Error:", error);
    const message = error instanceof Error ? error.message : "Failed to download file";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

