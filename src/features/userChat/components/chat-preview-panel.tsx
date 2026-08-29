"use client";

import {
  WebPreview,
  WebPreviewBody,
  WebPreviewNavigation,
  WebPreviewUrl,
} from "@/components/ai-elements/web-preview";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code2Icon, EyeIcon } from "lucide-react";
import { useState } from "react";

export interface ChatPreviewPanelProps {
  initialUrl?: string | null;
}

export function ChatPreviewPanel({
  initialUrl = "https://relie-ai.com",
}: ChatPreviewPanelProps) {
  const [activeTab, setActiveTab] = useState<"preview" | "code">("preview");

  return (
    <div className="flex h-full w-full flex-col bg-background">
      {/* Top Bar with Shadcn UI Tabs Toggle */}
      <div className="flex h-12 items-center justify-between border-b px-4 bg-muted/20">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Workspace View
        </span>
        <Tabs
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as "preview" | "code")}
          className="w-auto"
        >
          <TabsList variant="default" className="h-8">
            <TabsTrigger value="preview" className="px-3 text-xs gap-1.5">
              <EyeIcon size={14} />
              <span>Preview</span>
            </TabsTrigger>
            <TabsTrigger value="code" className="px-3 text-xs gap-1.5">
              <Code2Icon size={14} />
              <span>Code</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Main Content View */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} className="h-full w-full">
          <TabsContent value="preview" className="h-full m-0 p-0">
            {initialUrl === null ? (
              <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-muted/10 p-8 text-center animate-fade-in duration-300">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold tracking-tight text-foreground">
                    Provisioning Code Sandbox
                  </p>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                    Setting up your preview environment and installing dependencies...
                  </p>
                </div>
              </div>
            ) : (
              <WebPreview key={initialUrl} defaultUrl={initialUrl} className="h-full border-none rounded-none">
                <WebPreviewNavigation>
                  <WebPreviewUrl />
                </WebPreviewNavigation>
                <WebPreviewBody />
              </WebPreview>
            )}
          </TabsContent>
          <TabsContent value="code" className="h-full m-0 p-4 bg-muted/10 font-mono text-xs overflow-auto flex items-center justify-center">
            <p className="text-muted-foreground text-sm">No code output yet.</p>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
