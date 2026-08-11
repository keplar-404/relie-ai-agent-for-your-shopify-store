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
import { memo, useCallback } from "react";

interface AttachmentItemProps {
  attachment: AttachmentData;
  onRemove: (id: string) => void;
  className?: string;
}

export const AttachmentItem = memo(
  ({ attachment, onRemove, className }: AttachmentItemProps) => {
    const handleRemove = useCallback(
      () => onRemove(attachment.id),
      [onRemove, attachment.id]
    );
    return (
      <Attachment
        data={attachment}
        key={attachment.id}
        onRemove={handleRemove}
        className={className}
      >
        <AttachmentPreview />
        <AttachmentRemove className="" />
      </Attachment>
    );
  }
);

AttachmentItem.displayName = "AttachmentItem";



export function PromptInputAttachmentsDisplay() {
  const attachments = usePromptInputAttachments();

  const handleRemove = useCallback(
    (id: string) => attachments.remove(id),
    [attachments]
  );

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
          onRemove={handleRemove}
          className={"size-10"}
        />
      ))}
    </Attachments>
  );
}
