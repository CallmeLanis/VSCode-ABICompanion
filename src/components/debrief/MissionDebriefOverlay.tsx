import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Shield, X } from 'lucide-react';
import { MOTION_DURATION, MOTION_EASE, useReducedMotion } from '../motion';
import { Caption, MetaLabel } from '../ui';
import { AmmoPickerModal, ConsumablesPickerModal } from './pickers';
import { DebriefAccordionPipeline } from './DebriefAccordionPipeline';
import { DebriefConsoleNav } from './DebriefConsoleNav';
import { DebriefKpiDock } from './DebriefKpiDock';
import { DEBRIEF_STEPS, useMissionDebriefForm } from './useMissionDebriefForm';

interface MissionDebriefOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onRaidLogged?: (raidId: string) => void;
}

export function MissionDebriefOverlay({
  isOpen,
  onClose,
  onRaidLogged,
}: MissionDebriefOverlayProps) {
  const reduced = useReducedMotion();
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const form = useMissionDebriefForm((raidId) => {
    onRaidLogged?.(raidId);
    onClose();
  });

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  // Reset form when overlay closes so next open starts clean
  useEffect(() => {
    if (!isOpen) form.handleReset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const content = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="debrief-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0.01 : MOTION_DURATION.fast }}
        >
          <motion.div
            className="debrief-overlay-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="debrief-console"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.992 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.995 }}
            transition={{ duration: reduced ? 0.01 : MOTION_DURATION.base, ease: MOTION_EASE }}
          >
            <header className="debrief-console-header">
              <div className="debrief-console-header-main">
                <span className="debrief-header-icon" aria-hidden="true">
                  <Shield size={18} />
                </span>
                <div>
                  <h2 id={titleId} className="debrief-console-title">
                    Mission Debrief
                  </h2>
                  <Caption tone="secondary" className="block mt-0.5">
                    Operation pipeline · {DEBRIEF_STEPS[form.step - 1].label}
                  </Caption>
                </div>
              </div>
              <div className="debrief-console-header-meta">
                <MetaLabel tone="accent">
                  Step {form.step}/{DEBRIEF_STEPS.length}
                </MetaLabel>
                <button
                  ref={closeRef}
                  type="button"
                  onClick={onClose}
                  className="debrief-console-close"
                  aria-label="Close mission debrief"
                >
                  <X size={16} />
                </button>
              </div>
            </header>

            <div className="debrief-console-body">
              <div className="debrief-console-pipeline-scroll">
                <DebriefAccordionPipeline form={form} />
              </div>

              <DebriefKpiDock
                investment={form.economyPreview.investment}
                netProfit={form.economyPreview.netProfit}
                roi={form.economyPreview.roi}
              />
            </div>

            <DebriefConsoleNav
              step={form.step}
              canAdvance={form.canAdvance}
              onContinue={form.advance}
              onBack={form.goBack}
              onReset={form.handleReset}
              onConfirm={form.handleConfirm}
            />
          </motion.div>

          <AmmoPickerModal
            isOpen={form.showAmmoModal}
            onClose={() => form.setShowAmmoModal(false)}
            onSave={form.setAmmo}
            initialAmmo={form.ammo}
          />
          <ConsumablesPickerModal
            isOpen={form.showConsumablesModal}
            onClose={() => form.setShowConsumablesModal(false)}
            onSave={form.setConsumables}
            initialConsumables={form.consumables}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(content, document.body);
}
