import { ChevronLeft, ChevronRight, ClipboardCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { useReducedMotion } from '../motion';
import type { StepId } from './useMissionDebriefForm';

interface DebriefConsoleNavProps {
  step: StepId;
  canAdvance: boolean;
  onContinue: () => void;
  onBack: () => void;
  onReset: () => void;
  onConfirm: () => void;
}

export function DebriefConsoleNav({
  step,
  canAdvance,
  onContinue,
  onBack,
  onReset,
  onConfirm,
}: DebriefConsoleNavProps) {
  const reducedMotion = useReducedMotion();

  return (
    <div className="debrief-console-nav">
      {step < 4 ? (
        <motion.button
          type="button"
          onClick={onContinue}
          disabled={!canAdvance}
          whileTap={reducedMotion || !canAdvance ? undefined : { scale: 0.985 }}
          className={`btn-primary debrief-primary-action disabled:opacity-40 disabled:cursor-not-allowed ${
            canAdvance ? 'is-ready' : ''
          }`}
        >
          <span className="inline-flex items-center justify-center gap-1.5">
            Continue <ChevronRight size={14} className="debrief-action-arrow" />
          </span>
        </motion.button>
      ) : (
        <motion.button
          type="button"
          onClick={onConfirm}
          whileTap={reducedMotion ? undefined : { scale: 0.985 }}
          className="btn-primary debrief-primary-action is-ready"
        >
          <span className="inline-flex items-center justify-center gap-1.5">
            <ClipboardCheck size={14} /> Confirm Debrief
          </span>
        </motion.button>
      )}
      <div className="grid grid-cols-2 gap-2">
        <motion.button
          type="button"
          onClick={onBack}
          disabled={step === 1}
          whileTap={reducedMotion || step === 1 ? undefined : { scale: 0.98 }}
          className="btn-secondary disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span className="inline-flex items-center justify-center gap-1.5">
            <ChevronLeft size={14} /> Back
          </span>
        </motion.button>
        <motion.button
          type="button"
          onClick={onReset}
          whileTap={reducedMotion ? undefined : { scale: 0.98 }}
          className="btn-secondary"
        >
          Reset
        </motion.button>
      </div>
    </div>
  );
}
