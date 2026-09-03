import { NextResponse } from "next/server";
import { uploadFiles } from "@/services/codeSandbox/fsOperations";
import { setActiveSandboxId } from "@/services/codeSandbox/sandboxStore";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { files, sandboxId } = body;
    if (sandboxId) setActiveSandboxId(sandboxId);

    if (!Array.isArray(files)) {
      return NextResponse.json({ error: "'files' array is required" }, { status: 400 });
    }

    const result = await uploadFiles(files);
    return NextResponse.json({ success: true, message: result });
  } catch (error) {
    console.error("[API: fs/upload-files] Error:", error);
    const message = error instanceof Error ? error.message : "Failed to upload files";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

