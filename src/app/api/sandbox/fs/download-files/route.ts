import { NextResponse } from "next/server";
import { readFilesText } from "@/services/codeSandbox/fsOperations";
import { setActiveSandboxId } from "@/services/codeSandbox/sandboxStore";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { files, sandboxId } = body;
    if (sandboxId) setActiveSandboxId(sandboxId);

    if (!Array.isArray(files)) {
      return NextResponse.json({ error: "'files' array is required" }, { status: 400 });
    }

    const content = await readFilesText(files);
    return NextResponse.json({ success: true, content });
  } catch (error) {
    console.error("[API: fs/download-files] Error:", error);
    const message = error instanceof Error ? error.message : "Failed to download files";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

