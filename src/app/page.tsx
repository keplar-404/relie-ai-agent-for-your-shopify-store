import { ChatInputWidget } from "@/components/widgets/chat-input";
import CreateSandbox from "@/features/codeSandbox/components/CreateSandbox";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full bg-background px-4">
      <div className="mb-8 text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Relie AI Agent</h1>
        <p className="text-muted-foreground text-sm max-w-md">
          Ask anything to start chatting with your Shopify AI Assistant
        </p>

        <CreateSandbox />
      </div>
    </div>
  );
}
