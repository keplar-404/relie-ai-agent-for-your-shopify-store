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
  initialUrl?: string;
  codeSnippet?: string;
}

const SAMPLE_CODE = `// Store Optimization Agent Response
import { ChatOpenRouter } from "@/services/aiProvider/openRouter/client";

export async function generateProductSuggestions(storeId: string) {
  const model = new ChatOpenRouter({
    model: "openai/gpt-4o",
  });

  return await model.invoke([
    { role: "user", content: "Analyze store conversion rate..." }
  ]);
}`;

export function ChatPreviewPanel({
  initialUrl = "https://relie-ai.com",
  codeSnippet = SAMPLE_CODE,
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
            <WebPreview defaultUrl={initialUrl} className="h-full border-none rounded-none">
              <WebPreviewNavigation>
                <WebPreviewUrl />
              </WebPreviewNavigation>
              <WebPreviewBody src={initialUrl} />
            </WebPreview>
          </TabsContent>
          <TabsContent value="code" className="h-full m-0 p-4 bg-muted/10 font-mono text-xs overflow-auto">
            <pre className="p-4 rounded-lg bg-muted border text-foreground overflow-x-auto">
              <code>{codeSnippet}</code>
            </pre>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
