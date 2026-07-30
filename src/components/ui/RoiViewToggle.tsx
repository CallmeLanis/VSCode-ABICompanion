import { useSettings } from '../../hooks/useStorageQuery';
import { updateSettings } from '../../utils/storage';
import type { RoiMode } from '../../types';

const ROI_OPTIONS: { id: RoiMode; label: string; description: string }[] = [
  {
    id: 'operational',
    label: 'Run Cost',
    description: 'ROI against ammo and consumables. Measures combat efficiency.',
  },
  {
    id: 'economic',
    label: 'Loadout',
    description: 'ROI against gear brought plus ammo and consumables. Measures capital efficiency.',
  },
];

interface RoiViewToggleProps {
  showLabel?: boolean;
  className?: string;
}

export function RoiViewToggle({ showLabel = true, className = '' }: RoiViewToggleProps) {
  const { roiMode } = useSettings();

  return (
    <div className={`roi-view-control ${className}`.trim()}>
      {showLabel && <span className="roi-view-label">ROI view</span>}
      <div className="filter-tabs" role="group" aria-label="ROI calculation view">
        {ROI_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            className={`filter-tab ${roiMode === option.id ? 'active' : ''}`}
            aria-pressed={roiMode === option.id}
            title={option.description}
            onClick={() => updateSettings({ roiMode: option.id })}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
