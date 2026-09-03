import { NextResponse } from "next/server";
import { moveFiles } from "@/services/codeSandbox/fsOperations";
import { setActiveSandboxId } from "@/services/codeSandbox/sandboxStore";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { source, destination, sandboxId } = body;
    if (sandboxId) setActiveSandboxId(sandboxId);

    if (!source || !destination) {
      return NextResponse.json(
        { error: "'source' and 'destination' paths are required" },
        { status: 400 }
      );
    }

    const result = await moveFiles(source, destination);
    return NextResponse.json({ success: true, message: result });
  } catch (error) {
    console.error("[API: fs/move-files] Error:", error);
    const message = error instanceof Error ? error.message : "Failed to move files";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

