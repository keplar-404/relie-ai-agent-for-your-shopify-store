import sharp from "sharp";

/**
 * Converts an image buffer in non-native format (webp, gif, bmp, tiff, etc.) into PNG format.
 */
export async function convertImageToPng(inputBuffer: Buffer): Promise<Buffer> {
  return await sharp(inputBuffer)
    .png({ quality: 90 })
    .toBuffer();
}

