"use client"

import type { PromptInputMessage } from "@/components/ai-elements/prompt-input"
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputProvider,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input"
import { useCallback, useState } from "react"

const SUBMITTING_TIMEOUT = 200
const STREAMING_TIMEOUT = 2000

export default function Home() {
  const [status, setStatus] = useState<
    "submitted" | "streaming" | "ready" | "error"
  >("ready")

  const handleSubmit = useCallback((message: PromptInputMessage) => {
    const hasText = Boolean(message.text)
    console.log(message)

    if (!hasText) {
      return
    }

    setStatus("submitted")


    setTimeout(() => {
      setStatus("streaming")
    }, SUBMITTING_TIMEOUT)

    setTimeout(() => {
      setStatus("ready")
    }, STREAMING_TIMEOUT)
  }, [])

  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-black px-4">
      <PromptInputProvider>
        <PromptInput
          onSubmit={handleSubmit}
          className="w-full max-w-[750px] bg-white border border-zinc-200/80 rounded-xl shadow-xs p-3 focus-within:border-zinc-300 focus-within:ring-2 focus-within:ring-zinc-100 transition-all flex flex-col gap-2"
        >
          <PromptInputBody className="w-full">
            <PromptInputTextarea
              placeholder="Type a message..."
              className="w-full min-h-[60px] bg-transparent border-0 outline-none focus:ring-0 resize-none font-sans text-sm text-[#1D1D1F] placeholder-zinc-400"

            />
          </PromptInputBody>
          <PromptInputFooter className="flex items-center justify-end border-t border-zinc-100/50 pt-2 mt-1">
            <PromptInputSubmit
              status={status}
              className="h-7 px-4 bg-black text-white hover:bg-black/90 font-alexandria text-xs font-normal rounded-md flex items-center justify-center cursor-pointer shadow-xs transition-all"
            />
          </PromptInputFooter>
        </PromptInput>
      </PromptInputProvider>
    </div>
  )
}
