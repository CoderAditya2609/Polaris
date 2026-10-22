export const MAX_PHOTO_EDGE = 1200;

export interface ProcessedPhoto {
  blob: Blob;
  mime: string;
  width: number;
  height: number;
}

function loadImage(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('That file could not be read as an image.'));
    };
    img.src = url;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}

export async function processPhotoInput(input: Blob): Promise<ProcessedPhoto> {
  let source: ImageBitmap | HTMLImageElement;
  let sourceWidth: number;
  let sourceHeight: number;

  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(input);
      source = bitmap;
      sourceWidth = bitmap.width;
      sourceHeight = bitmap.height;
    } catch {
      const image = await loadImage(input);
      source = image;
      sourceWidth = image.naturalWidth;
      sourceHeight = image.naturalHeight;
    }
  } else {
    const image = await loadImage(input);
    source = image;
    sourceWidth = image.naturalWidth;
    sourceHeight = image.naturalHeight;
  }

  if (!sourceWidth || !sourceHeight) {
    throw new Error('That image appears to be empty.');
  }

  const scale = Math.min(1, MAX_PHOTO_EDGE / Math.max(sourceWidth, sourceHeight));
  const width = Math.max(1, Math.round(sourceWidth * scale));
  const height = Math.max(1, Math.round(sourceHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Photo processing is not available in this browser.');

  ctx.fillStyle = '#0b0912';
  ctx.fillRect(0, 0, width, height);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, 0, 0, width, height);

  if ('close' in source && typeof source.close === 'function') {
    source.close();
  }

  const webp = await canvasToBlob(canvas, 'image/webp', 0.86);
  if (webp && webp.type === 'image/webp') {
    return { blob: webp, mime: 'image/webp', width, height };
  }

  const jpeg = await canvasToBlob(canvas, 'image/jpeg', 0.88);
  if (!jpeg) throw new Error('That photo could not be processed.');
  return { blob: jpeg, mime: 'image/jpeg', width, height };
}
