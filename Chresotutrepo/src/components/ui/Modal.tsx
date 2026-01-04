import React, { useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    size?: ModalSize;
    showCloseButton?: boolean;
}

const sizeStyles: Record<ModalSize, string> = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[90vw]',
};

export function Modal({
    isOpen,
    onClose,
    title,
    children,
    size = 'md',
    showCloseButton = true,
}: ModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);
    const previousActiveElement = useRef<HTMLElement | null>(null);

    // Handle escape key
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        }
    }, [onClose]);

    // Focus trap
    useEffect(() => {
        if (!isOpen) return;

        // Store previously focused element
        previousActiveElement.current = document.activeElement as HTMLElement;

        // Add escape key listener
        document.addEventListener('keydown', handleKeyDown);

        // Focus the modal
        modalRef.current?.focus();

        // Prevent body scroll
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';

            // Restore focus to previous element
            previousActiveElement.current?.focus();
        };
    }, [isOpen, handleKeyDown]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'modal-title' : undefined}
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Modal content */}
            <div
                ref={modalRef}
                tabIndex={-1}
                className={`
          relative bg-white rounded-2xl shadow-2xl overflow-hidden
          animate-scaleIn w-full ${sizeStyles[size]}
        `}
            >
                {/* Header */}
                {(title || showCloseButton) && (
                    <div className="bg-slate-900 p-6 flex items-center justify-between">
                        {title && (
                            <h2
                                id="modal-title"
                                className="text-white font-black uppercase tracking-widest text-xs"
                            >
                                {title}
                            </h2>
                        )}
                        {showCloseButton && (
                            <button
                                onClick={onClose}
                                className="text-slate-400 hover:text-white transition-colors p-1 -m-1"
                                aria-label="Close modal"
                            >
                                <X size={24} />
                            </button>
                        )}
                    </div>
                )}

                {/* Body */}
                <div className="p-8">
                    {children}
                </div>
            </div>
        </div>
    );
}
