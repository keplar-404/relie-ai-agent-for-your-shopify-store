import { NextResponse } from "next/server";
import createCodeSandBox from "@/services/codeSandbox/createSandbox";

export async function POST() {
  try {
    const data = await createCodeSandBox();
    console.log("==========================================");
    console.log("[SANDBOX CREATED] sandboxId:", data.sandboxId);
    console.log("[SANDBOX CREATED] previewUrl:", data.previewUrl);
    console.log("==========================================");
    return NextResponse.json(data);
  } catch (error) {
    console.error("Sandbox creation failed:", error);
    const message = error instanceof Error ? error.message : "Failed to create sandbox";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
