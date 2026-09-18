export interface PdfAttachmentPage {
  pageNumber: number;
  url: string;
}

export interface PdfProcessedAttachment {
  kind: "pdf";
  schemaName: string;
  originalFilename: string;
  totalPages: number;
  pages: PdfAttachmentPage[];
}

export interface ImageProcessedAttachment {
  kind: "image";
  subKind: "native" | "converted-to-png";
  schemaName: string;
  originalFilename: string;
  url: string;
}

export interface TextProcessedAttachment {
  kind: "text";
  schemaName: string;
  originalFilename: string;
  url: string;
}

export type ProcessedAttachment =
  | PdfProcessedAttachment
  | ImageProcessedAttachment
  | TextProcessedAttachment;

export interface AttachmentMap {
  attachments: ProcessedAttachment[];
}

/**
 * Builds the structured JSON attachment map from processed file records.
 */
export function buildAttachmentMap(results: ProcessedAttachment[]): AttachmentMap {
  return {
    attachments: results,
  };
}

/**
 * Combines the user prompt text with the formatted --- ATTACHMENTS --- block.
 */
export function formatAttachmentMapMessage(userPrompt: string, attachmentMap: AttachmentMap): string {
  if (!attachmentMap.attachments || attachmentMap.attachments.length === 0) {
    return userPrompt;
  }

  const promptText = userPrompt?.trim() || "";
  const attachmentsJson = JSON.stringify(attachmentMap, null, 2);

  return promptText
    ? `${promptText}\n\n--- ATTACHMENTS ---\n${attachmentsJson}`
    : `--- ATTACHMENTS ---\n${attachmentsJson}`;
}

