import type { InlineImage } from '../services/gemini';

const MAX_SIDE = 1600;
const JPEG_QUALITY = 0.85;

// Phone photos are often 4000px+ and several MB — downscale to a size that's
// still readable for OCR but keeps the Gemini request small and fast.
export async function imageToBase64(file: File): Promise<InlineImage> {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
    return { mimeType: 'image/jpeg', data: dataUrl.slice(dataUrl.indexOf(',') + 1) };
}
