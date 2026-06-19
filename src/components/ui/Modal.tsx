import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showClose?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showClose = true,
}: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[95vw] max-h-[95vh]',
  };

  const stopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal content */}
      <div
        className={`
          relative bg-abi-bg-elevated border border-abi-border rounded-xl
          shadow-elevated w-full ${sizeStyles[size]}
          animate-slide-up max-h-[90vh] flex flex-col
        `}
        onClick={stopPropagation}
      >
        {/* Header */}
        {(title || showClose) && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-abi-border shrink-0">
            {title && (
              <h2 className="text-lg font-semibold text-abi-text">{title}</h2>
            )}
            {showClose && (
              <button
                onClick={onClose}
                className="
                  w-8 h-8 flex items-center justify-center rounded-lg
                  text-abi-text-muted hover:text-abi-text hover:bg-abi-bg-hover
                  transition-colors duration-200
                "
              >
                <X size={20} />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {children}
        </div>
      </div>
    </div>
  );
}

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary',
}: ConfirmModalProps) {
  const variantStyles = {
    danger: 'from-red-600 to-red-700 hover:from-red-500 hover:to-red-600',
    warning: 'from-yellow-600 to-yellow-700 hover:from-yellow-500 hover:to-yellow-600',
    primary: 'from-abi-orange to-abi-orange-dark hover:from-abi-orange-light hover:to-abi-orange',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="space-y-4">
        <p className="text-abi-text-muted">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="
              px-4 py-2 rounded-lg bg-abi-bg-card border border-abi-border
              text-abi-text hover:bg-abi-bg-hover transition-colors
            "
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`
              px-4 py-2 rounded-lg text-white font-semibold
              bg-gradient-to-r ${variantStyles[variant]}
              transition-all duration-200
            `}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
