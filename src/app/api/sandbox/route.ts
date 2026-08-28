import { NextResponse } from "next/server";
import createCodeSandBox from "@/features/codeSandbox/actions/createSandbox";

export async function POST() {
  try {
    const data = await createCodeSandBox();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Sandbox creation failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create sandbox" },
      { status: 500 }
    );
  }
}
