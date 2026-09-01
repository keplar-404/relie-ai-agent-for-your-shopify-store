import { NextResponse } from "next/server";
import { setActiveSandboxId } from "@/services/codeSandbox/sandboxStore";
import { searchFiles } from "@/services/codeSandbox/fsOperations";

export async function POST(req: Request) {
  try {
    const { sandboxId, pattern } = await req.json().catch(() => ({}));
    if (sandboxId) setActiveSandboxId(sandboxId);
    const result = await searchFiles(pattern);
    return NextResponse.json(JSON.parse(result));
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

