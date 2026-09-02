import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  PROFILE_MEDIA_MAX_BYTES,
  calculateSourceCrop,
  getTransformedDimensions,
  processProfileMedia,
  validateProfileMediaFile
} from './image-processing.js';

describe('profile media validation', () => {
  it.each(['image/png', 'image/jpeg', 'image/webp'])('aceita %s', (type) => {
    expect(validateProfileMediaFile(new File(['image'], 'image', { type }))).toBeNull();
  });

  it('rejeita tipo inválido, arquivo ausente e mais de 4 MiB', () => {
    expect(validateProfileMediaFile(null)).toMatch('Selecione');
    expect(validateProfileMediaFile(new File(['x'], 'x.gif', { type: 'image/gif' }))).toMatch(
      'Formato'
    );
    const large = new File([new Uint8Array(PROFILE_MEDIA_MAX_BYTES + 1)], 'large.png', {
      type: 'image/png'
    });
    expect(validateProfileMediaFile(large)).toMatch('4 MiB');
  });
});

describe('image processing', () => {
  const context = {
    drawImage: vi.fn(),
    rotate: vi.fn(),
    scale: vi.fn(),
    translate: vi.fn()
  };

  beforeEach(() => {
    Object.values(context).forEach((mock) => mock.mockClear());
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
      context as unknown as CanvasRenderingContext2D
    );
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback, type) =>
      callback(new Blob(['crop'], { type: String(type) }))
    );
  });

  it('troca dimensões transformadas em 90° e 270°', () => {
    expect(getTransformedDimensions({ width: 1200, height: 800 }, 90)).toEqual({
      width: 800,
      height: 1200
    });
    expect(getTransformedDimensions({ width: 1200, height: 800 }, 180)).toEqual({
      width: 1200,
      height: 800
    });
    expect(getTransformedDimensions({ width: 1200, height: 800 }, 270)).toEqual({
      width: 800,
      height: 1200
    });
  });

  it('calcula bounds reais conforme aspect ratio, zoom e posição', () => {
    expect(calculateSourceCrop({ width: 1200, height: 800 }, 1, 2, { x: 1, y: -1 })).toEqual({
      x: 800,
      y: 0,
      width: 400,
      height: 400
    });
  });

  it('gera Blob com dimensões e MIME configurados', async () => {
    const close = vi.fn();
    const result = await processProfileMedia(
      {
        sourceUrl: 'blob:preview',
        sourceDimensions: { width: 1200, height: 800 },
        aspectRatio: 2,
        zoom: 1,
        position: { x: 0, y: 0 },
        outputWidth: 600,
        outputHeight: 300,
        mimeType: 'image/webp',
        quality: 0.9
      },
      async () => ({ close }) as unknown as ImageBitmap
    );

    expect(result).toMatchObject({ width: 600, height: 300, mimeType: 'image/webp' });
    expect(result.blob.type).toBe('image/webp');
    expect(close).toHaveBeenCalledOnce();
  });

  it.each([
    [90, Math.PI / 2],
    [180, Math.PI],
    [270, (3 * Math.PI) / 2]
  ] as const)('aplica rotação de %i° no output', async (rotation, radians) => {
    await processProfileMedia(
      {
        sourceUrl: 'blob:preview',
        sourceDimensions: { width: 1200, height: 800 },
        aspectRatio: 1,
        zoom: 1,
        position: { x: 0, y: 0 },
        rotation
      },
      async () => ({ close: vi.fn() }) as unknown as ImageBitmap
    );

    expect(context.rotate).toHaveBeenCalledWith(radians);
  });

  it('combina rotation, flip, zoom, pan e crop em um único desenho', async () => {
    await processProfileMedia(
      {
        sourceUrl: 'blob:preview',
        sourceDimensions: { width: 1200, height: 800 },
        aspectRatio: 1,
        zoom: 2,
        position: { x: 0.5, y: -0.5 },
        rotation: 90,
        flipHorizontal: true,
        outputWidth: 256,
        outputHeight: 256
      },
      async () => ({ close: vi.fn() }) as unknown as ImageBitmap
    );

    expect(context.scale).toHaveBeenCalledWith(-1, 1);
    expect(context.rotate).toHaveBeenCalledWith(Math.PI / 2);
    expect(context.drawImage).toHaveBeenCalledOnce();
    expect(context.drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 1200, 800);
  });
});
