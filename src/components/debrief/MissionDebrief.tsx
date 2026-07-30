import { Crosshair } from 'lucide-react';
import { motion } from 'motion/react';
import { useReducedMotion } from '../motion';
import { Caption } from '../ui';
import { MissionDebriefOverlay } from './MissionDebriefOverlay';

interface EnterRaidTriggerProps {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onRaidLogged?: (raidId: string) => void;
}

/** Compact CTA that replaces the old sidebar debrief; opens the fullscreen overlay. */
export function EnterRaidTrigger({
  isOpen,
  onOpen,
  onClose,
  onRaidLogged,
}: EnterRaidTriggerProps) {
  const reducedMotion = useReducedMotion();

  return (
    <>
      <div className="enter-raid-panel">
        <div className="enter-raid-panel-copy">
          <p className="enter-raid-eyebrow">Field ops</p>
          <h2 className="enter-raid-title">Enter Raid</h2>
          <Caption tone="muted" className="block mt-1">
            Open the mission debrief console to log the next operation.
          </Caption>
        </div>
        <motion.button
          type="button"
          onClick={onOpen}
          whileTap={reducedMotion ? undefined : { scale: 0.985 }}
          className="btn-primary enter-raid-cta"
        >
          <span className="inline-flex items-center justify-center gap-2">
            <Crosshair size={14} />
            Enter Raid
          </span>
        </motion.button>
      </div>

      <MissionDebriefOverlay
        isOpen={isOpen}
        onClose={onClose}
        onRaidLogged={onRaidLogged}
      />
    </>
  );
}

/** @deprecated Prefer EnterRaidTrigger + MissionDebriefOverlay */
export function MissionDebrief({ onRaidLogged }: { onRaidLogged?: (raidId: string) => void }) {
  return (
    <EnterRaidTrigger
      isOpen={false}
      onOpen={() => undefined}
      onClose={() => undefined}
      onRaidLogged={onRaidLogged}
    />
  );
}
