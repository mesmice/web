import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ImagePlus, RotateCcw, X } from 'lucide-react';
import { Button } from '../../../components/ui/button.js';
import {
  PROFILE_MEDIA_ACCEPT,
  PROFILE_MEDIA_MAX_BYTES,
  getTransformedDimensions,
  processProfileMedia,
  validateProfileMediaFile,
  type CropPosition,
  type ImageDimensions,
  type ProcessedProfileMedia,
  type ProfileMediaMimeType,
  type QuarterTurn
} from './image-processing.js';
import {
  getProfileMediaErrorMessage
} from '../api/profile-media-endpoints.js';
import { ApiRequestError } from '../../../lib/api/client.js';
import './profile-media-editor.css';

interface ProfileMediaEditorLabels {
  title?: string;
  description?: string;
  select?: string;
  replace?: string;
  cancel?: string;
  confirm?: string;
  zoom?: string;
  previewAlt?: string;
  rotate?: string;
  flip?: string;
  reset?: string;
}

export interface ProfileMediaEditorProps {
  file?: File | null;
  aspectRatio: number;
  outputWidth?: number;
  outputHeight?: number;
  outputMimeType?: ProfileMediaMimeType;
  quality?: number;
  viewportShape?: 'rectangle' | 'circle';
  labels?: ProfileMediaEditorLabels;
  onCancel: () => void;
  onConfirm: (result: ProcessedProfileMedia) => void | Promise<void>;
}

const DEFAULT_LABELS = {
  title: 'Editar imagem',
  description: 'Reposicione e ajuste o zoom antes de confirmar.',
  select: 'Enviar imagem',
  replace: 'Substituir imagem',
  cancel: 'Cancelar',
  confirm: 'Confirmar recorte',
  zoom: 'Zoom',
  previewAlt: 'Prévia da imagem selecionada',
  rotate: 'Girar imagem 90 graus',
  flip: 'Espelhar imagem horizontalmente',
  reset: 'Redefinir ajustes'
};

function clamp(value: number, minimum: number, maximum: number) {
  return Math.max(minimum, Math.min(maximum, value));
}

function getSourceRotationStyle(rotation: QuarterTurn, width: number, height: number) {
  if (rotation === 90) return `translateX(${height}px) rotate(90deg)`;
  if (rotation === 180) return `translate(${width}px, ${height}px) rotate(180deg)`;
  if (rotation === 270) return `translateY(${width}px) rotate(270deg)`;
  return undefined;
}

export function ProfileMediaEditor({
  file = null,
  aspectRatio,
  outputWidth,
  outputHeight,
  outputMimeType,
  quality,
  viewportShape = 'rectangle',
  labels: labelOverrides,
  onCancel,
  onConfirm
}: ProfileMediaEditorProps) {
  const labels = { ...DEFAULT_LABELS, ...labelOverrides };
  const initialValidationError = file ? validateProfileMediaFile(file) : null;
  const [previewUrl, setPreviewUrl] = useState(() =>
    file && !initialValidationError ? URL.createObjectURL(file) : ''
  );
  const [dimensions, setDimensions] = useState<ImageDimensions | null>(null);
  const [viewportSize, setViewportSize] = useState<ImageDimensions | null>(null);
  const [position, setPosition] = useState<CropPosition>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState<QuarterTurn>(0);
  const [flipHorizontal, setFlipHorizontal] = useState(false);
  const [error, setError] = useState<string | null>(initialValidationError);
  const [processing, setProcessing] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const cropViewportRef = useRef<HTMLDivElement>(null);
  const previewUrlRef = useRef(previewUrl);
  const dragRef = useRef<{ pointerId: number; x: number; y: number } | null>(null);
  const titleId = useId();
  const descriptionId = useId();
  const errorId = useId();

  useEffect(() => {
    const handleResize = () => {
      const viewport = cropViewportRef.current?.getBoundingClientRect();
      if (viewport?.width && viewport.height) {
        setViewportSize({ width: viewport.width, height: viewport.height });
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(
    () => () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    },
    []
  );

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    const isolated = Array.from(document.body.children)
      .filter(
        (element): element is HTMLElement =>
          element instanceof HTMLElement && element !== overlayRef.current
      )
      .map((element) => ({ element, inert: element.inert }));
    isolated.forEach(({ element }) => (element.inert = true));
    document.body.style.overflow = 'hidden';
    dialogRef.current?.querySelector<HTMLElement>('input, button')?.focus();

    return () => {
      isolated.forEach(({ element, inert }) => (element.inert = inert));
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, []);

  const transformedDimensions = useMemo(
    () => (dimensions ? getTransformedDimensions(dimensions, rotation) : null),
    [dimensions, rotation]
  );

  const previewLayout = useMemo(() => {
    if (!dimensions || !transformedDimensions || !viewportSize) return undefined;
    const scale =
      Math.max(
        viewportSize.width / transformedDimensions.width,
        viewportSize.height / transformedDimensions.height
      ) * zoom;
    const width = transformedDimensions.width * scale;
    const height = transformedDimensions.height * scale;
    const overflowX = Math.max(0, width - viewportSize.width);
    const overflowY = Math.max(0, height - viewportSize.height);
    return {
      stage: {
        width,
        height,
        left: (-(position.x + 1) * overflowX) / 2,
        top: (-(position.y + 1) * overflowY) / 2,
        transform: flipHorizontal ? `translateX(${width}px) scaleX(-1)` : undefined
      },
      image: {
        width: dimensions.width * scale,
        height: dimensions.height * scale,
        transform: getSourceRotationStyle(
          rotation,
          dimensions.width * scale,
          dimensions.height * scale
        )
      }
    };
  }, [dimensions, flipHorizontal, position, rotation, transformedDimensions, viewportSize, zoom]);

  function handleFile(fileToValidate: File | null) {
    const validationError = validateProfileMediaFile(fileToValidate);
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    const nextUrl = fileToValidate && !validationError ? URL.createObjectURL(fileToValidate) : '';
    previewUrlRef.current = nextUrl;
    setPreviewUrl(nextUrl);
    setError(validationError);
    setDimensions(null);
    setViewportSize(null);
    setPosition({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setFlipHorizontal(false);
  }

  function cancel() {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = '';
    setPreviewUrl('');
    setDimensions(null);
    setError(null);
    onCancel();
  }

  function handleDialogKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape' && !processing) {
      event.preventDefault();
      cancel();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not(:disabled), input:not(:disabled), [tabindex]:not([tabindex="-1"])'
      ) ?? []
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (
      (event.shiftKey && document.activeElement === first) ||
      (!event.shiftKey && document.activeElement === last)
    ) {
      event.preventDefault();
      (event.shiftKey ? last : first)?.focus();
    }
  }

  function movePosition(deltaX: number, deltaY: number) {
    const viewport = cropViewportRef.current?.getBoundingClientRect();
    if (!viewport || !transformedDimensions) return;
    const scale =
      Math.max(
        viewport.width / transformedDimensions.width,
        viewport.height / transformedDimensions.height
      ) * zoom;
    const overflowX = Math.max(0, transformedDimensions.width * scale - viewport.width);
    const overflowY = Math.max(0, transformedDimensions.height * scale - viewport.height);
    setPosition((current) => ({
      x: overflowX ? clamp(current.x - (2 * deltaX) / overflowX, -1, 1) : 0,
      y: overflowY ? clamp(current.y - (2 * deltaY) / overflowY, -1, 1) : 0
    }));
  }

  function rotate() {
    setRotation((current) => ((current + 90) % 360) as QuarterTurn);
  }

  function resetTransforms() {
    setRotation(0);
    setFlipHorizontal(false);
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  }

  function handleViewportKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const step = event.shiftKey ? 0.1 : 0.025;
    const changes: Record<string, CropPosition> = {
      ArrowLeft: { x: -step, y: 0 },
      ArrowRight: { x: step, y: 0 },
      ArrowUp: { x: 0, y: -step },
      ArrowDown: { x: 0, y: step }
    };
    const change = changes[event.key];
    if (!change) return;
    event.preventDefault();
    setPosition((current) => ({
      x: clamp(current.x + change.x, -1, 1),
      y: clamp(current.y + change.y, -1, 1)
    }));
  }

  async function confirm() {
    if (!previewUrl || !dimensions || processing) return;
    setProcessing(true);
    setError(null);
    try {
      const result = await processProfileMedia({
        sourceUrl: previewUrl,
        sourceDimensions: dimensions,
        aspectRatio,
        zoom,
        position,
        rotation,
        flipHorizontal,
        outputWidth,
        outputHeight,
        mimeType: outputMimeType,
        quality
      });
      if (result.blob.size > PROFILE_MEDIA_MAX_BYTES) {
        throw new Error('A imagem processada excede o limite de 4 MiB.');
      }
      await onConfirm(result);
    } catch (cause) {
      setError(
        cause instanceof ApiRequestError ||
          (cause instanceof Error && cause.message === 'A imagem processada excede o limite de 4 MiB.')
          ? getProfileMediaErrorMessage(cause)
          : 'Não foi possível processar a imagem. Tente selecionar outro arquivo.'
      );
    } finally {
      setProcessing(false);
    }
  }

  return createPortal(
    <div ref={overlayRef} className="profile-media-editor__overlay">
      <div
        ref={dialogRef}
        className="profile-media-editor"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onKeyDown={handleDialogKeyDown}
      >
        <header className="profile-media-editor__header">
          <div>
          <h2 id={titleId} className="profile-media-editor__title">
            {labels.title}
          </h2>
          <p id={descriptionId} className="profile-media-editor__description">
            {labels.description}
          </p>
          </div>
          <Button type="button" variant="ghost" aria-label="Fechar editor" onClick={cancel} disabled={processing}>
            <X size={18} aria-hidden="true" />
          </Button>
        </header>

        {previewUrl ? (
          <label className="profile-media-editor__file-control">
            <span>{labels.replace}</span>
            <input
              type="file"
              accept={PROFILE_MEDIA_ACCEPT}
              aria-describedby={error ? errorId : undefined}
              onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
            />
          </label>
        ) : (
          <section className="profile-media-editor__selector" aria-label="Selecione uma mídia">
            <h3>Selecione uma mídia</h3>
            <div className="profile-media-editor__media-options">
              <label className="profile-media-editor__media-option profile-media-editor__media-option--primary">
                <ImagePlus size={20} aria-hidden="true" />
                <span>{labels.select}</span>
                <small>PNG, JPEG ou WebP</small>
                <input
                  type="file"
                  accept={PROFILE_MEDIA_ACCEPT}
                  aria-describedby={error ? errorId : undefined}
                  onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
                />
              </label>
            </div>
            <p className="profile-media-editor__selector-hint">
              Escolha uma imagem para ajustar o recorte antes do envio.
            </p>
          </section>
        )}

        {previewUrl && (
          <>
            <div
              ref={viewportRef}
              className="profile-media-editor__canvas"
              style={{ aspectRatio: viewportShape === 'circle' ? '4 / 3' : '16 / 10' }}
            >
              <div
                ref={cropViewportRef}
                className={`profile-media-editor__crop-window profile-media-editor__crop-window--${viewportShape}`}
                style={{ aspectRatio, width: viewportShape === 'circle' ? '66%' : '92%' }}
                tabIndex={0}
                role="group"
                aria-label="Área de recorte. Use as setas para reposicionar a imagem."
              onKeyDown={handleViewportKeyDown}
              onPointerDown={(event) => {
                event.currentTarget.setPointerCapture(event.pointerId);
                dragRef.current = {
                  pointerId: event.pointerId,
                  x: event.clientX,
                  y: event.clientY
                };
              }}
              onPointerMove={(event) => {
                const drag = dragRef.current;
                if (!drag || drag.pointerId !== event.pointerId) return;
                movePosition(event.clientX - drag.x, event.clientY - drag.y);
                dragRef.current = {
                  pointerId: event.pointerId,
                  x: event.clientX,
                  y: event.clientY
                };
              }}
              onPointerUp={(event) => {
                if (dragRef.current?.pointerId === event.pointerId) dragRef.current = null;
              }}
              onPointerCancel={() => (dragRef.current = null)}
            >
              <div className="profile-media-editor__stage profile-media-editor__stage--background" style={previewLayout?.stage} aria-hidden="true">
                <img
                  src={previewUrl}
                  alt=""
                  draggable={false}
                  style={previewLayout?.image}
                />
              </div>
              <div className="profile-media-editor__active-clip">
                <div className="profile-media-editor__stage" style={previewLayout?.stage}>
                  <img
                  src={previewUrl}
                  alt={labels.previewAlt}
                  draggable={false}
                  style={previewLayout?.image}
                  onLoad={(event) => {
                    const image = event.currentTarget;
                    if (!image.naturalWidth || !image.naturalHeight) {
                      setError('Não foi possível ler as dimensões da imagem.');
                      return;
                    }
                    setDimensions({ width: image.naturalWidth, height: image.naturalHeight });
                    const viewport = cropViewportRef.current?.getBoundingClientRect();
                    if (viewport?.width && viewport.height) {
                      setViewportSize({ width: viewport.width, height: viewport.height });
                    }
                  }}
                  onError={() => setError('Não foi possível decodificar a imagem selecionada.')}
                  />
                </div>
              </div>
            </div>
            </div>

            <div className="profile-media-editor__toolbar" aria-label="Ferramentas da imagem">
              <label className="profile-media-editor__zoom">
                <span>
                  {labels.zoom}: {zoom.toFixed(2)}×
                </span>
                <div className="profile-media-editor__zoom-control">
                  <span aria-hidden="true">−</span>
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.05"
                    value={zoom}
                    onChange={(event) => setZoom(Number(event.target.value))}
                  />
                  <span aria-hidden="true">+</span>
                </div>
              </label>
              <div className="profile-media-editor__transform-actions">
                <Button
                  type="button"
                  variant="secondary"
                  aria-label={labels.rotate}
                  onClick={rotate}
                >
                  <RotateCcw size={15} aria-hidden="true" />
                  Girar
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  aria-label={labels.flip}
                  aria-pressed={flipHorizontal}
                  onClick={() => setFlipHorizontal((current) => !current)}
                >
                  Espelhar
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  aria-label={labels.reset}
                  disabled={
                    rotation === 0 &&
                    !flipHorizontal &&
                    zoom === 1 &&
                    position.x === 0 &&
                    position.y === 0
                  }
                  onClick={resetTransforms}
                >
                  Redefinir
                </Button>
              </div>
            </div>
          </>
        )}

        {error && (
          <p id={errorId} className="profile-media-editor__error" role="alert">
            {error}
          </p>
        )}

        <div className="profile-media-editor__actions">
          <Button type="button" variant="secondary" disabled={processing} onClick={cancel}>
            {labels.cancel}
          </Button>
          <Button type="button" disabled={!dimensions || processing} onClick={() => void confirm()}>
            {processing ? 'Processando…' : labels.confirm}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
