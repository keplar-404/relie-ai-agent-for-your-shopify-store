import { NextResponse } from "next/server";
import { downloadFileStream } from "@/services/codeSandbox/fsOperations";
import { setActiveSandboxId } from "@/services/codeSandbox/sandboxStore";
import pathPosix from "node:path";

async function handleDownload(filePath?: string, sandboxId?: string) {
  if (sandboxId) setActiveSandboxId(sandboxId);

  if (!filePath) {
    return NextResponse.json({ error: "'path' parameter is required" }, { status: 400 });
  }

  const filename = pathPosix.basename(filePath) || "downloaded-file";
  const stream = await downloadFileStream(filePath);

  return new Response(stream as unknown as ReadableStream, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const filePath = searchParams.get("path") || undefined;
    const sandboxId = searchParams.get("sandboxId") || undefined;

    return await handleDownload(filePath, sandboxId);
  } catch (error) {
    console.error("[API: fs/download-file-stream GET] Error:", error);
    const message = error instanceof Error ? error.message : "Failed to download file stream";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { path: filePath, sandboxId } = body;

    return await handleDownload(filePath, sandboxId);
  } catch (error) {
    console.error("[API: fs/download-file-stream POST] Error:", error);
    const message = error instanceof Error ? error.message : "Failed to download file stream";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
