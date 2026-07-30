import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { MOTION_DURATION, MOTION_EASE } from '../motion/motionTokens';
import { useReducedMotion } from '../motion/useReducedMotion';
import { StaggerContainer, StaggerItem } from '../motion/RevealSection';

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
  const reduced = useReducedMotion();

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
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0.01 : MOTION_DURATION.fast }}
          onClick={onClose}
        >
          <motion.div
            className="absolute inset-0 bg-abi-bg/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            className={`
              relative bg-abi-bg-elevated border border-abi-border rounded-xl
              shadow-elevated w-full ${sizeStyles[size]}
              max-h-[90vh] flex flex-col
            `}
            onClick={stopPropagation}
            initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.98, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.98, y: 8 }}
            transition={{ duration: reduced ? 0.01 : MOTION_DURATION.base, ease: MOTION_EASE }}
          >
            {(title || showClose) && (
              <div className="flex items-center justify-between px-4 py-3 border-b border-abi-border shrink-0">
                {title && (
                  <h2 className="type-heading text-primary">
                    {title}
                  </h2>
                )}
                {showClose && (
                  <button
                    onClick={onClose}
                    className="
                      w-8 h-8 flex items-center justify-center rounded-md
                      text-abi-text-muted hover:text-abi-text hover:bg-abi-bg-hover
                      border border-transparent hover:border-abi-border
                      transition-colors duration-200
                    "
                    aria-label="Close"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            )}

            <StaggerContainer className="flex-1 overflow-y-auto p-4" immediate>
              <StaggerItem>{children}</StaggerItem>
            </StaggerContainer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
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
  shake?: boolean;
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
  shake = false,
}: ConfirmModalProps) {
  const reduced = useReducedMotion();
  const variantStyles = {
    danger: 'bg-abi-danger text-abi-bg hover:brightness-110',
    warning: 'bg-abi-warning text-abi-bg hover:brightness-110',
    primary: 'bg-abi-orange text-abi-bg hover:bg-abi-orange-light',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <motion.div
        className="space-y-4"
        animate={
          shake && !reduced
            ? { x: [0, -4, 4, -3, 3, 0] }
            : undefined
        }
        transition={{ duration: 0.4 }}
      >
        <p className="text-abi-text-muted text-sm leading-relaxed">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="
              px-4 py-2 rounded-md border border-abi-border font-mono text-[0.7rem]
              uppercase tracking-wider text-abi-text hover:bg-abi-bg-hover transition-colors
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
              px-4 py-2 rounded-md font-mono text-[0.7rem] uppercase tracking-wider font-semibold
              transition-all duration-200 ${variantStyles[variant]}
            `}
          >
            {confirmText}
          </button>
        </div>
      </motion.div>
    </Modal>
  );
}
