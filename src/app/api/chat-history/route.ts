import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET /api/chat-history — list all chat sessions for the authenticated user
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("chat_history")
      .select("id, thread_id, title, created_at, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(50);

    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/chat-history — upsert a chat session (create or update messages + title)
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { thread_id, title, messages } = await req.json();
    if (!thread_id) {
      return NextResponse.json({ error: "thread_id is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("chat_history")
      .upsert(
        {
          user_id: user.id,
          thread_id,
          title: title ?? "New Chat",
          messages: messages ?? [],
        },
        { onConflict: "user_id,thread_id" }
      )
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/chat-history?thread_id=... — delete a specific chat session
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const thread_id = req.nextUrl.searchParams.get("thread_id");
    if (!thread_id) {
      return NextResponse.json({ error: "thread_id query param is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("chat_history")
      .delete()
      .eq("user_id", user.id)
      .eq("thread_id", thread_id);

    if (error) throw error;
    return NextResponse.json({ deleted: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
