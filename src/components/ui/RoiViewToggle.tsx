import { useSettings } from '../../hooks/useStorageQuery';
import { updateSettings } from '../../utils/storage';
import type { RoiMode } from '../../types';

const ROI_OPTIONS: { id: RoiMode; label: string; description: string }[] = [
  {
    id: 'operational',
    label: 'Run Cost',
    description: 'ROI against ammo and consumables. Measures combat efficiency. Click to switch to Loadout.',
  },
  {
    id: 'economic',
    label: 'Loadout',
    description: 'ROI against gear brought plus ammo and consumables. Measures capital efficiency. Click to switch to Run Cost.',
  },
];

interface RoiViewToggleProps {
  showLabel?: boolean;
  className?: string;
}

export function RoiViewToggle({ showLabel = true, className = '' }: RoiViewToggleProps) {
  const { roiMode } = useSettings();
  const active = ROI_OPTIONS.find((option) => option.id === roiMode) ?? ROI_OPTIONS[0];
  const nextMode: RoiMode = active.id === 'operational' ? 'economic' : 'operational';

  return (
    <div className={`roi-view-control ${className}`.trim()}>
      {showLabel && <span className="roi-view-label">ROI type</span>}
      <div className="filter-tabs" role="group" aria-label="ROI calculation type">
        <button
          type="button"
          className="filter-tab active"
          aria-pressed="true"
          aria-label={`ROI type ${active.label}. Activate to switch.`}
          title={active.description}
          onClick={() => updateSettings({ roiMode: nextMode })}
        >
          {active.label}
        </button>
      </div>
    </div>
  );
}
