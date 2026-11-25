'use client';

import { useEffect, useRef, type ReactNode } from 'react';

/**
 * Orden #64 · ANEXO-64-F (F-2.6, M8) — diálogo modal del panel de skills.
 *
 * Superpuesto a la página (no al final del flujo), con `aria-modal="true"`, el foco dentro
 * al abrir y cierre con Escape. Mientras se publica (`closeDisabled`) NO se cierra.
 */
export default function Modal({
  label,
  title,
  onClose,
  closeDisabled = false,
  children,
}: {
  label: string;
  title: ReactNode;
  onClose: () => void;
  closeDisabled?: boolean;
  children: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  // El foco entra en el diálogo al abrir (M8).
  useEffect(() => {
    panelRef.current?.focus();
  }, []);

  // Escape cierra, salvo mientras se publica (M8).
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !closeDisabled) {
        event.preventDefault();
        onClose();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [closeDisabled, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        className="w-full max-w-2xl mt-16 bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5 focus:outline-none"
      >
        <h2 className="text-xl font-semibold text-white">{title}</h2>
        {children}
      </div>
    </div>
  );
}
