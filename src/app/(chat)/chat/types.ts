export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
}

export type ChatStatus = "ready" | "submitted" | "streaming" | "error";
