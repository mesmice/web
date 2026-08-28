import { useEffect, useId, useRef } from 'react';
import { Button } from './button.js';
import './modal.css';

interface ModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
}

/**
 * Modal de confirmação única: sem fecho por Esc/backdrop — a ação só avança
 * pelo botão, que recebe foco ao abrir (acessibilidade de teclado).
 */
export function Modal({ open, title, description, confirmLabel, onConfirm }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    dialogRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
    return () => previouslyFocused?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div className="modal__overlay">
      <div
        ref={dialogRef}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        <h2 id={titleId} className="modal__title">
          {title}
        </h2>
        <p id={descriptionId} className="modal__description">
          {description}
        </p>
        <div className="modal__actions">
          <Button onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
}
