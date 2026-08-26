import { useEffect, useRef } from 'react'
import { Button } from './button.js'
import './modal.css'

interface ModalProps {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  onConfirm: () => void
}

/**
 * Modal de confirmação única: sem fecho por Esc/backdrop — a ação só avança
 * pelo botão, que recebe foco ao abrir (acessibilidade de teclado).
 */
export function Modal({ open, title, description, confirmLabel, onConfirm }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    dialogRef.current?.querySelector<HTMLButtonElement>('button')?.focus()
  }, [open])

  if (!open) return null

  return (
    <div className="modal__overlay">
      <div
        ref={dialogRef}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        <h2 id="modal-title" className="modal__title">
          {title}
        </h2>
        <p id="modal-description" className="modal__description">
          {description}
        </p>
        <div className="modal__actions">
          <Button onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  )
}
