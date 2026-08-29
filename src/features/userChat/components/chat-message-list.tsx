"use client";

import type { UIMessage } from "ai";
import {
  Message as MessageComponent,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import { Reasoning, ReasoningTrigger, ReasoningContent } from "@/components/ai-elements/reasoning";
import { Tool, ToolHeader, ToolContent, ToolInput, ToolOutput } from "@/components/ai-elements/tool";
import { Conversation, ConversationContent, ConversationScrollButton } from "@/components/ai-elements/conversation";

interface ChatMessageListProps {
  messages: UIMessage[];
}

export function ChatMessageList({ messages }: ChatMessageListProps) {
  const displayableMessages = messages.filter(
    (msg) => msg.role === "user" || msg.role === "assistant"
  );

  return (
    <Conversation>
      <ConversationContent className="space-y-6">
        {displayableMessages.map((msg) => (
          <MessageComponent key={msg.id} from={msg.role}>
            <MessageContent>
              {msg.parts.map((part, index) => {
                if (part.type === "text") {
                  return (
                    <MessageResponse key={index}>
                      {part.text}
                    </MessageResponse>
                  );
                }
                if (part.type === "reasoning") {
                  return (
                    <Reasoning key={index} isStreaming={part.state === "streaming"}>
                      <ReasoningTrigger />
                      <ReasoningContent>{part.text}</ReasoningContent>
                    </Reasoning>
                  );
                }
                if (part.type === "dynamic-tool" || part.type.startsWith("tool-")) {
                  const toolPart = part as any;
                  const toolName = toolPart.toolName || toolPart.type.replace("tool-", "");
                  return (
                    <Tool key={index}>
                      <ToolHeader
                        type={toolPart.type}
                        state={toolPart.state}
                        toolName={toolName}
                      />
                      <ToolContent>
                        <ToolInput input={toolPart.input} />
                        <ToolOutput output={toolPart.output} errorText={toolPart.errorText} />
                      </ToolContent>
                    </Tool>
                  );
                }
                return null;
              })}
            </MessageContent>
          </MessageComponent>
        ))}
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  );
}





