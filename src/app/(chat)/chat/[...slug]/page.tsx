import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ChatPreviewPanel } from "@/features/userChat/components/chat-preview-panel";
import { ChatContent } from "@/features/userChat";

function ChatLoading() {
  return (
    <div className="flex items-center justify-center h-full w-full text-sm text-muted-foreground">
      Loading...
    </div>
  );
}

export default function ChatPage() {
  return (
    <ResizablePanelGroup orientation="horizontal" className="h-full w-full">
      {/* Left Panel: Chat Interface */}
      <ResizablePanel
        defaultSize={"20%"}
        minSize={"20%"}
        maxSize={"60%"}
        className="flex flex-col h-full bg-background border-r border-border"
      >
        <ChatContent />
      </ResizablePanel>

      <ResizableHandle withHandle className="after:w-4" />

      {/* Right Panel: Web Preview & Code View */}
      <ResizablePanel className="hidden md:flex flex-col h-full bg-background">
        <ChatPreviewPanel />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
