import { NextResponse } from "next/server";
import createCodeSandBox from "@/services/codeSandbox/creatSandbox";

export async function POST() {
  try {
    const data = await createCodeSandBox();
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
