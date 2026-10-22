import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { XIcon } from './Icons';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  label: string;
}

export function Modal({ open, onClose, children, className = '', label }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/55 px-4 py-6 backdrop-blur-sm sm:items-center sm:py-10"
      role="dialog"
      aria-modal="true"
      aria-label={label}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className={`glass-strong relative w-full rounded-2xl ${className}`}>
        <button
          type="button"
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-black/20 text-[var(--muted)] transition-colors hover:text-[var(--text)]"
          onClick={onClose}
          aria-label="Close"
        >
          <XIcon className="h-4 w-4" />
        </button>
        {children}
      </div>
    </div>,
    document.body,
  );
}
