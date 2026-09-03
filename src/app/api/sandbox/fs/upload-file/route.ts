import { NextResponse } from "next/server";
import { uploadFile } from "@/services/codeSandbox/fsOperations";
import { setActiveSandboxId } from "@/services/codeSandbox/sandboxStore";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { content, path, sandboxId } = body;
    if (sandboxId) setActiveSandboxId(sandboxId);

    if (content === undefined) {
      return NextResponse.json({ error: "'content' is required" }, { status: 400 });
    }

    const result = await uploadFile(content, path);
    return NextResponse.json({ success: true, message: result });
  } catch (error) {
    console.error("[API: fs/upload-file] Error:", error);
    const message = error instanceof Error ? error.message : "Failed to upload file";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

