import { createCanvas } from "@napi-rs/canvas";

export interface RenderedPdfPage {
  pageNumber: number;
  buffer: Buffer;
}

/**
 * Splits a PDF buffer into individual pages and renders each page as a PNG buffer.
 * Uses pdfjs-dist legacy Node build and @napi-rs/canvas.
 */
export async function splitPdfToPngPages(
  pdfBuffer: Buffer,
  scale: number = 2.0
): Promise<RenderedPdfPage[]> {
  // Dynamically import legacy pdfjs build for Node/server compatibility
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");

  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(pdfBuffer),
    useSystemFonts: true,
    disableFontFace: false,
    verbosity: 0,
  });

  const doc = await loadingTask.promise;
  const numPages = doc.numPages;
  const pages: RenderedPdfPage[] = [];

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const viewport = page.getViewport({ scale });
    const canvas = createCanvas(Math.floor(viewport.width), Math.floor(viewport.height));
    const canvasContext = canvas.getContext("2d");

    await page.render({
      canvasContext: canvasContext as any,
      canvas: canvas as any,
      viewport,
    }).promise;

    const pngBuffer = canvas.toBuffer("image/png");
    pages.push({
      pageNumber: pageNum,
      buffer: pngBuffer,
    });
  }

  return pages;
}
