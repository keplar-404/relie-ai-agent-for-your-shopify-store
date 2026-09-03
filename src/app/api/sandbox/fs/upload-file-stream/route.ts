import { NextResponse } from "next/server";
import { uploadFileStream } from "@/services/codeSandbox/fsOperations";
import { setActiveSandboxId } from "@/services/codeSandbox/sandboxStore";
import { Readable } from "stream";

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";

    // 1. Support multipart/form-data for uploading real files (images, PDFs, videos, etc.)
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const path = (formData.get("path") as string) || (file ? `src/${file.name}` : undefined);
      const sandboxId = formData.get("sandboxId") as string | null;
      if (sandboxId) setActiveSandboxId(sandboxId);

      if (!file) {
        return NextResponse.json({ error: "'file' is required in form-data" }, { status: 400 });
      }

      // file.stream() provides a Web ReadableStream that streams chunks directly
      const result = await uploadFileStream(file.stream(), path);
      return NextResponse.json({ success: true, message: result });
    }

    // 2. Support application/json (text or base64 binary content)
    const body = await req.json().catch(() => ({}));
    const { content, path, sandboxId, encoding } = body;
    if (sandboxId) setActiveSandboxId(sandboxId);

    if (content === undefined) {
      return NextResponse.json(
        { error: "Either multipart/form-data 'file' or JSON 'content' is required" },
        { status: 400 },
      );
    }

    const buffer = encoding === "base64" ? Buffer.from(content, "base64") : Buffer.from(content);
    const stream = Readable.from(buffer);
    const result = await uploadFileStream(stream, path);
    return NextResponse.json({ success: true, message: result });
  } catch (error) {
    console.error("[API: fs/upload-file-stream] Error:", error);
    const message = error instanceof Error ? error.message : "Failed to upload file stream";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

