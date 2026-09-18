import { env } from "@/lib/env";
import { classifyAttachment } from "./classify";
import { splitPdfToPngPages } from "./pdf";
import { convertImageToPng } from "./convertImage";
import {
  getNextPdfIndex,
  getNextAttachmentIndex,
  uploadPdfPage,
  uploadAttachmentFile,
  deleteProjectStorage,
} from "./upload";
import type { ProcessedAttachment } from "./attachmentMap";

export * from "./classify";
export * from "./pdf";
export * from "./convertImage";
export * from "./upload";
export * from "./attachmentMap";

export interface ProcessAttachmentParams {
  file: File | Blob;
  filename?: string;
  projectId: string;
  chatId?: string;
  orderIndex?: number;
  userId?: string;
}

export class AttachmentError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.name = "AttachmentError";
    this.statusCode = statusCode;
  }
}

/**
 * Orchestrates file validation, classification, conversion/rendering, and Supabase Storage upload.
 */
export async function processAttachment(
  params: ProcessAttachmentParams
): Promise<ProcessedAttachment> {
  const { file, projectId } = params;

  if (!file) {
    throw new AttachmentError("No file provided", 400);
  }

  const maxBytes = env.ATTACHMENT_MAX_BYTES ?? 26214400; // 25 MB default
  if (file.size > maxBytes) {
    throw new AttachmentError(
      `File exceeds maximum allowed size of ${Math.round(maxBytes / 1024 / 1024)}MB`,
      413
    );
  }

  const filename =
    (file as File).name ||
    params.filename ||
    `attachment_${Date.now()}`;
  const mimeType = file.type || "";

  const classification = classifyAttachment(filename, mimeType);
  if (!classification) {
    throw new AttachmentError(
      `Unsupported attachment file format for '${filename}'. Allowed formats: PDF, images, or text/code files.`,
      415
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  switch (classification.kind) {
    case "pdf": {
      const pdfIndex = await getNextPdfIndex(projectId);
      const schemaName = `user_pdf_${pdfIndex}`;

      const pages = await splitPdfToPngPages(buffer);
      if (pages.length === 0) {
        throw new AttachmentError("PDF has no readable pages", 400);
      }

      const uploadedPages = await Promise.all(
        pages.map(async (p) => {
          const url = await uploadPdfPage({
            projectId,
            pdfIndex,
            pageNumber: p.pageNumber,
            buffer: p.buffer,
          });
          return {
            pageNumber: p.pageNumber,
            url,
          };
        })
      );

      return {
        kind: "pdf",
        schemaName,
        originalFilename: filename,
        totalPages: pages.length,
        pages: uploadedPages,
      };
    }

    case "image-native": {
      const imageIndex = await getNextAttachmentIndex(projectId, "image");
      const schemaName = `user_image_${imageIndex}`;

      const url = await uploadAttachmentFile({
        projectId,
        schemaName,
        ext: classification.ext,
        buffer,
        contentType: classification.mimeType,
      });

      return {
        kind: "image",
        subKind: "native",
        schemaName,
        originalFilename: filename,
        url,
      };
    }

    case "image-other": {
      const imageIndex = await getNextAttachmentIndex(projectId, "image");
      const schemaName = `user_image_${imageIndex}`;

      const pngBuffer = await convertImageToPng(buffer);
      const url = await uploadAttachmentFile({
        projectId,
        schemaName,
        ext: ".png",
        buffer: pngBuffer,
        contentType: "image/png",
      });

      return {
        kind: "image",
        subKind: "converted-to-png",
        schemaName,
        originalFilename: filename,
        url,
      };
    }

    case "text": {
      const textIndex = await getNextAttachmentIndex(projectId, "text");
      const schemaName = `user_text_${textIndex}`;

      const url = await uploadAttachmentFile({
        projectId,
        schemaName,
        ext: classification.ext,
        buffer,
        contentType: classification.mimeType,
      });

      return {
        kind: "text",
        schemaName,
        originalFilename: filename,
        url,
      };
    }
  }
}

