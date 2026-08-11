"use client";

import dynamic from "next/dynamic";

const ChatContent = dynamic(
  () => import("./components/chat-content").then((mod) => mod.ChatContent),
  {
    ssr: false,
    loading: () => <ChatLoading />,
  }
);

function ChatLoading() {
  return (
    <div className="flex items-center justify-center h-full w-full text-sm text-muted-foreground">
      Loading...
    </div>
  );
}

export default function ChatPage() {
  return <ChatContent />;
}
