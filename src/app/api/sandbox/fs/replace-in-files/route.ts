import { NextResponse } from "next/server";
import { replaceInFiles } from "@/services/codeSandbox/fsOperations";
import { setActiveSandboxId } from "@/services/codeSandbox/sandboxStore";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { files, pattern, newValue, sandboxId } = body;
    if (sandboxId) setActiveSandboxId(sandboxId);

    if (!Array.isArray(files) || pattern === undefined || newValue === undefined) {
      return NextResponse.json(
        { error: "'files' array, 'pattern', and 'newValue' are required" },
        { status: 400 }
      );
    }

    const result = await replaceInFiles(files, pattern, newValue);
    return NextResponse.json({ success: true, message: result });
  } catch (error) {
    console.error("[API: fs/replace-in-files] Error:", error);
    const message = error instanceof Error ? error.message : "Failed to replace in files";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

