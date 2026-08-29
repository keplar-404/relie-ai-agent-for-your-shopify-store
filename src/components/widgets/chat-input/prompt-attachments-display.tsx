"use client";

import {
  Attachment,
  AttachmentPreview,
  AttachmentRemove,
  Attachments,
  type AttachmentData,
} from "@/components/ai-elements/attachments";
import { usePromptInputAttachments } from "@/components/ai-elements/prompt-input";
import { cn } from "@/lib/utils";
import { memo } from "react";

interface AttachmentItemProps {
  attachment: AttachmentData;
  onRemove: (id: string) => void;
  className?: string;
}

export const AttachmentItem = memo(
  ({ attachment, onRemove, className }: AttachmentItemProps) => (
    <Attachment
      data={attachment}
      key={attachment.id}
      onRemove={() => onRemove(attachment.id)}
      className={className}
    >
      <AttachmentPreview />
      <AttachmentRemove className="" />
    </Attachment>
  )
);

AttachmentItem.displayName = "AttachmentItem";



export function PromptInputAttachmentsDisplay() {
  const attachments = usePromptInputAttachments();

  if (attachments.files.length === 0) {
    return null;
  }

  return (
    <Attachments
      variant={"grid"}
      className={cn("ml-0 mr-auto justify-start pt-4 px-4")}
    >
      {attachments.files.map((attachment) => (
        <AttachmentItem
          attachment={attachment}
          key={attachment.id}
          onRemove={attachments.remove}
          className={"size-10"}
        />
      ))}
    </Attachments>
  );
}
