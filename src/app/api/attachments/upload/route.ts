import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  processAttachment,
  AttachmentError,
} from "@/services/attachmentProcessor";

export const maxDuration = 60; // 60s per file limit as per architecture doc

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const form = await req.formData();
    const file = form.get("file") as File | null;
    const projectId = String(form.get("projectId") ?? "").trim();
    const chatId = String(form.get("chatId") ?? "").trim();
    const orderIndex = Number(form.get("orderIndex") ?? "0");

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const effectiveProjectId = projectId || chatId || "default";

    // Verify or ensure the user owns the project
    const { data: project } = await supabase
      .from("projects")
      .select("id, user_id")
      .eq("id", effectiveProjectId)
      .maybeSingle();

    if (project) {
      if (project.user_id !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else {
      // If the project doesn't exist yet (e.g. ad-hoc chat session), auto-create it
      try {
        await supabase.from("projects").insert({
          id: effectiveProjectId,
          user_id: user.id,
          name: `Chat Session ${effectiveProjectId.slice(0, 8)}`,
        });
      } catch (insertErr) {
        // In case of non-UUID or existing ID race condition, proceed with effectiveProjectId
        console.warn("[ATTACHMENT UPLOAD] Project auto-create notice:", insertErr);
      }
    }

    const result = await processAttachment({
      file,
      projectId: effectiveProjectId,
      chatId,
      orderIndex,
      userId: user.id,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    if (error instanceof AttachmentError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    console.error("[ATTACHMENT UPLOAD ERROR]:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process attachment" },
      { status: 500 }
    );
  }
}

