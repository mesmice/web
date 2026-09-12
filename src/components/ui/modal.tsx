import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  const overlayRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousBodyOverflow = document.body.style.overflow;
    const isolatedElements = Array.from(document.body.children)
      .filter(
        (element): element is HTMLElement =>
          element instanceof HTMLElement && element !== overlayRef.current
      )
      .map((element) => ({ element, inert: element.inert }));

    isolatedElements.forEach(({ element }) => {
      element.inert = true;
    });
    document.body.style.overflow = 'hidden';
    dialogRef.current?.querySelector<HTMLButtonElement>('button')?.focus();

    return () => {
      isolatedElements.forEach(({ element, inert }) => {
        element.inert = inert;
      });
      document.body.style.overflow = previousBodyOverflow;
      previouslyFocused?.focus();
    };
  }, [open]);

  function containFocus(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'Tab') return;

    const focusableElements = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'
      ) ?? []
    );
    if (focusableElements.length === 0) {
      event.preventDefault();
      dialogRef.current?.focus();
      return;
    }

    const first = focusableElements[0];
    const last = focusableElements[focusableElements.length - 1];
    const movingBeforeFirst = event.shiftKey && document.activeElement === first;
    const movingAfterLast = !event.shiftKey && document.activeElement === last;

    if (movingBeforeFirst || movingAfterLast) {
      event.preventDefault();
      (event.shiftKey ? last : first)?.focus();
    }
  }

  if (!open) return null;

  return createPortal(
    <div ref={overlayRef} className="modal__overlay">
      <div
        ref={dialogRef}
        className="modal"
        role="dialog"
        tabIndex={-1}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onKeyDown={containFocus}
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
    </div>,
    document.body
  );
}
