"use client"

import {
  Attachment,
  AttachmentPreview,
  AttachmentRemove,
  Attachments,
} from "@/components/ai-elements/attachments"
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message"
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionAddScreenshot,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputBody,
  PromptInputFooter,
  PromptInputHeader,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  usePromptInputAttachments,
} from "@/components/ai-elements/prompt-input"
import { Button } from "@/components/ui/button"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { Sparkles, Settings } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { Suspense, useCallback, useState } from "react"

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  text: string
}

const PromptInputAttachmentsDisplay = () => {
  const attachments = usePromptInputAttachments()

  if (attachments.files.length === 0) {
    return null
  }

  return (
    <Attachments variant="inline">
      {attachments.files.map((attachment) => (
        <Attachment
          data={attachment}
          key={attachment.id}
          onRemove={() => attachments.remove(attachment.id)}
        >
          <AttachmentPreview />
          <AttachmentRemove />
        </Attachment>
      ))}
    </Attachments>
  )
}

function ChatContent() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get("q") || "How can I optimize my Shopify store conversions?"

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      role: "user",
      text: initialQuery,
    },
    {
      id: "2",
      role: "assistant",
      text: "I've analyzed your Shopify store setup. Here are 3 key recommendations to boost your conversions:\n\n1. **Optimize Product Page Load Times** - Reduce image bundle sizes and defer non-critical scripts.\n2. **Streamline Checkout** - Enable 1-click checkout options like Shop Pay and Apple Pay.\n3. **Smart Product Recommendations** - Display personalized cross-sells on product and cart pages.",
    },
  ])

  const [status, setStatus] = useState<"submitted" | "streaming" | "ready" | "error">("ready")

  const handleSubmit = useCallback((message: PromptInputMessage) => {
    const text = message.text?.trim()
    const hasAttachments = Boolean(message.files?.length)

    if (!text && !hasAttachments) return

    const userMsgId = Date.now().toString()
    const newMsgText = text || (hasAttachments ? "[Attachments uploaded]" : "")
    const newMsg: ChatMessage = { id: userMsgId, role: "user", text: newMsgText }

    setMessages((prev) => [...prev, newMsg])
    setStatus("submitted")

    setTimeout(() => {
      setStatus("streaming")
    }, 300)

    setTimeout(() => {
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        text: `Thanks for asking! I am processing your request and generating detailed insights for your Shopify store.`,
      }
      setMessages((prev) => [...prev, aiMsg])
      setStatus("ready")
    }, 1500)
  }, [])

  return (
    <ResizablePanelGroup orientation="horizontal" className="h-full w-full">
      {/* Left Panel: Chat Interface */}
      <ResizablePanel defaultSize={"20%"} minSize={"20%"} maxSize={"60%"} className="flex flex-col h-full bg-background border-r border-border">
        {/* Top Header Bar */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/50">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center size-8 rounded-lg bg-primary text-primary-foreground shadow-xs">
              <Sparkles className="size-4" />
            </div>
            <span className="font-semibold text-sm tracking-tight">Relie AI Agent</span>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground">
              <Settings className="size-4" />
              <span className="sr-only">Settings</span>
            </Button>
          </div>
        </header>

        {/* Chat Messages */}
        <main className="flex-1 overflow-y-auto p-4 space-y-6">
          {messages.map((msg) => (
            <Message key={msg.id} from={msg.role}>
              <MessageContent>
                <MessageResponse>{msg.text}</MessageResponse>
              </MessageContent>
            </Message>
          ))}
        </main>

        {/* Bottom Chat Box */}
        <footer className="p-4 border-t border-border bg-background">
          <PromptInput
            onSubmit={handleSubmit}
            className="w-full "
            globalDrop
            multiple
          >
            <PromptInputHeader>
              <PromptInputAttachmentsDisplay />
            </PromptInputHeader>
            <PromptInputBody>
              <PromptInputTextarea
                placeholder="Ask follow-up questions..."
                className=""
              />
            </PromptInputBody>
            <PromptInputFooter className="">
              <PromptInputTools>
                <PromptInputActionMenu>
                  <PromptInputActionMenuTrigger />
                  <PromptInputActionMenuContent>
                    <PromptInputActionAddAttachments />
                    <PromptInputActionAddScreenshot />
                  </PromptInputActionMenuContent>
                </PromptInputActionMenu>
              </PromptInputTools>
              <PromptInputSubmit status={status} />
            </PromptInputFooter>
          </PromptInput>
        </footer>
      </ResizablePanel>

      <ResizableHandle withHandle />

      {/* Right Panel: Empty Section */}
      <ResizablePanel className="hidden md:flex flex-col h-full bg-muted/10">
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
          {/* Empty right panel section */}
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full w-full text-sm text-muted-foreground">Loading...</div>}>
      <ChatContent />
    </Suspense>
  )
}
