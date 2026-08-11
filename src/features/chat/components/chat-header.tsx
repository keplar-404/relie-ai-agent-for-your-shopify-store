"use client";

import { Sparkles, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ChatHeader() {
  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/50">
      <div className="flex items-center gap-2.5">
        <div className="flex items-center justify-center size-8 rounded-lg bg-primary text-primary-foreground shadow-xs">
          <Sparkles className="size-4" />
        </div>
        <span className="font-semibold text-sm tracking-tight">Relie AI Agent</span>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground hover:text-foreground"
        >
          <Settings className="size-4" />
          <span className="sr-only">Settings</span>
        </Button>
      </div>
    </header>
  );
}
