export const PROFILE_MEDIA_ACCEPT = 'image/png,image/jpeg,image/webp';
export const PROFILE_MEDIA_MAX_BYTES = 4 * 1024 * 1024;

export const PROFILE_MEDIA_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;

export type ProfileMediaMimeType = (typeof PROFILE_MEDIA_MIME_TYPES)[number];

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface CropPosition {
  /** Horizontal position from the leftmost (-1) to the rightmost (1) valid crop. */
  x: number;
  /** Vertical position from the topmost (-1) to the bottommost (1) valid crop. */
  y: number;
}

export interface SourceCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type QuarterTurn = 0 | 90 | 180 | 270;

export interface ProcessImageOptions {
  sourceUrl: string;
  sourceDimensions: ImageDimensions;
  aspectRatio: number;
  zoom: number;
  position: CropPosition;
  rotation?: QuarterTurn;
  flipHorizontal?: boolean;
  outputWidth?: number;
  outputHeight?: number;
  mimeType?: ProfileMediaMimeType;
  quality?: number;
}

export interface ProcessedProfileMedia {
  blob: Blob;
  width: number;
  height: number;
  mimeType: ProfileMediaMimeType;
}

export type ImageDecoder = (sourceUrl: string) => Promise<CanvasImageSource>;

export function validateProfileMediaFile(file: File | null | undefined): string | null {
  if (!file) return 'Selecione uma imagem para continuar.';
  if (!PROFILE_MEDIA_MIME_TYPES.includes(file.type as ProfileMediaMimeType)) {
    return 'Formato não suportado. Selecione uma imagem PNG, JPEG ou WebP.';
  }
  if (file.size > PROFILE_MEDIA_MAX_BYTES) {
    return 'A imagem deve ter no máximo 4 MiB.';
  }
  return null;
}

export function calculateSourceCrop(
  source: ImageDimensions,
  aspectRatio: number,
  zoom: number,
  position: CropPosition
): SourceCrop {
  if (source.width <= 0 || source.height <= 0 || aspectRatio <= 0 || zoom < 1) {
    throw new Error('Configuração de recorte inválida.');
  }

  const sourceAspectRatio = source.width / source.height;
  const baseWidth = sourceAspectRatio > aspectRatio ? source.height * aspectRatio : source.width;
  const baseHeight = sourceAspectRatio > aspectRatio ? source.height : source.width / aspectRatio;
  const width = baseWidth / zoom;
  const height = baseHeight / zoom;
  const normalizedX = (Math.max(-1, Math.min(1, position.x)) + 1) / 2;
  const normalizedY = (Math.max(-1, Math.min(1, position.y)) + 1) / 2;

  return {
    x: (source.width - width) * normalizedX,
    y: (source.height - height) * normalizedY,
    width,
    height
  };
}

export function getTransformedDimensions(
  source: ImageDimensions,
  rotation: QuarterTurn
): ImageDimensions {
  return rotation === 90 || rotation === 270
    ? { width: source.height, height: source.width }
    : source;
}

export function normalizeQuarterTurn(rotation: number): QuarterTurn {
  const normalized = ((rotation % 360) + 360) % 360;
  if (normalized !== 0 && normalized !== 90 && normalized !== 180 && normalized !== 270) {
    throw new Error('A rotação deve usar incrementos de 90 graus.');
  }
  return normalized;
}

function applySourceTransform(
  context: CanvasRenderingContext2D,
  source: ImageDimensions,
  rotation: QuarterTurn,
  flipHorizontal: boolean
) {
  const transformed = getTransformedDimensions(source, rotation);

  // Flip acontece no espaço já rotacionado, mantendo crop e pan previsíveis.
  if (flipHorizontal) {
    context.translate(transformed.width, 0);
    context.scale(-1, 1);
  }

  if (rotation === 90) {
    context.translate(source.height, 0);
    context.rotate(Math.PI / 2);
  } else if (rotation === 180) {
    context.translate(source.width, source.height);
    context.rotate(Math.PI);
  } else if (rotation === 270) {
    context.translate(0, source.width);
    context.rotate((3 * Math.PI) / 2);
  }
}

async function decodeImage(sourceUrl: string): Promise<CanvasImageSource> {
  if ('createImageBitmap' in window) {
    const response = await fetch(sourceUrl);
    return createImageBitmap(await response.blob(), { imageOrientation: 'from-image' });
  }

  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Não foi possível decodificar a imagem.'));
    image.src = sourceUrl;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: ProfileMediaMimeType,
  quality?: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Não foi possível gerar a imagem.'))),
      mimeType,
      quality
    );
  });
}

export async function processProfileMedia(
  options: ProcessImageOptions,
  decoder: ImageDecoder = decodeImage
): Promise<ProcessedProfileMedia> {
  const rotation = normalizeQuarterTurn(options.rotation ?? 0);
  const transformedDimensions = getTransformedDimensions(options.sourceDimensions, rotation);
  const crop = calculateSourceCrop(
    transformedDimensions,
    options.aspectRatio,
    options.zoom,
    options.position
  );
  const width =
    options.outputWidth ??
    (options.outputHeight
      ? Math.max(1, Math.round(options.outputHeight * options.aspectRatio))
      : Math.max(1, Math.round(crop.width)));
  const height = options.outputHeight ?? Math.max(1, Math.round(width / options.aspectRatio));
  const mimeType = options.mimeType ?? 'image/png';
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('O navegador não conseguiu preparar o recorte.');

  const image = await decoder(options.sourceUrl);
  try {
    // Um único passe reproduz no output a mesma ordem usada pelo preview:
    // source normalizado → rotação → flip → zoom/pan/crop → output.
    context.scale(width / crop.width, height / crop.height);
    context.translate(-crop.x, -crop.y);
    applySourceTransform(
      context,
      options.sourceDimensions,
      rotation,
      options.flipHorizontal ?? false
    );
    context.drawImage(image, 0, 0, options.sourceDimensions.width, options.sourceDimensions.height);
    const blob = await canvasToBlob(canvas, mimeType, options.quality);
    return { blob, width, height, mimeType };
  } finally {
    if ('close' in image && typeof image.close === 'function') image.close();
  }
}
