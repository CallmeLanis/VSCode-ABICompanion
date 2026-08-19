import { Star } from 'lucide-react';
import { motion } from 'motion/react';
import { MAPS, GAME_MODES } from '../../data/constants';
import { Badge, Caption, DataValue, MapName, MetaLabel, StatusBadge } from '../ui';
import { ExpandPanel, useReducedMotion } from '../motion';
import type { MissionDebriefForm } from './useMissionDebriefForm';

interface DebriefStepContentProps {
  form: MissionDebriefForm;
  stepId: 1 | 2 | 3 | 4;
}

export function DebriefStepContent({ form, stepId }: DebriefStepContentProps) {
  const reducedMotion = useReducedMotion();
  const {
    map,
    setMap,
    mode,
    setMode,
    gearValue,
    setGearValue,
    ammo,
    ammoTotalCost,
    setShowAmmoModal,
    consumables,
    consumablesTotalCost,
    setShowConsumablesModal,
    status,
    setStatus,
    kills,
    setKills,
    isRed,
    setIsRed,
    rescuePercentage,
    setRescuePercentage,
    gearRescue,
    lootValue,
    setLootValue,
    economyPreview,
    detectedHighlights,
    mapName,
    modeName,
  } = form;

  if (stepId === 1) {
    return (
      <div className="space-y-3 debrief-step-fields">
        <div className="grid grid-cols-2 gap-2">
          <div className="form-group">
            <label>MAP</label>
            <select
              value={map}
              onChange={(e) => setMap(e.target.value)}
              className="w-full px-3 py-2 bg-abi-bg border border-abi-border rounded-lg text-abi-text text-sm"
            >
              {MAPS.map(m => (
                <option key={m.id} value={m.id}>{m.name.toUpperCase()}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>MODE</label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="w-full px-3 py-2 bg-abi-bg border border-abi-border rounded-lg text-abi-text text-sm"
            >
              {GAME_MODES.map(m => (
                <option key={m.id} value={m.id}>{m.name.toUpperCase()}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>GEAR VALUE BROUGHT</label>
          <input
            type="number"
            min={0}
            value={gearValue ?? ''}
            onChange={(e) => setGearValue(e.target.value ? parseInt(e.target.value) : undefined)}
            className="w-full px-3 py-2 bg-abi-bg border border-abi-border rounded-lg text-abi-text text-sm"
            placeholder="0"
          />
        </div>

        <div className="form-group">
          <label>CONSUMABLES</label>
          <div className="log-mini-item">
            <span>Total Consumables Value</span>
            <span>${consumablesTotalCost.toLocaleString()}</span>
          </div>
          <motion.button
            type="button"
            onClick={() => setShowConsumablesModal(true)}
            whileTap={reducedMotion ? undefined : { scale: 0.985 }}
            className="debrief-subaction w-full mt-2 px-3 py-2 border border-abi-border rounded-lg text-xs font-semibold text-abi-text-muted"
          >
            {consumables.length > 0 ? 'Edit Consumables' : '+ Add Consumables'}
          </motion.button>
        </div>
      </div>
    );
  }

  if (stepId === 2) {
    return (
      <div className="space-y-3 debrief-step-fields">
        <div className="form-group">
          <label>STATUS</label>
          <div className="status-toggle-group">
            <motion.button
              type="button"
              onClick={() => setStatus('EXTRACTED')}
              className={`status-toggle-btn ${status === 'EXTRACTED' ? 'active-extracted' : ''}`}
              animate={{ y: status === 'EXTRACTED' ? -1 : 0 }}
              whileTap={reducedMotion ? undefined : { scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            >
              ✓ Extracted
            </motion.button>
            <motion.button
              type="button"
              onClick={() => setStatus('DIED')}
              className={`status-toggle-btn ${status === 'DIED' ? 'active-died' : ''}`}
              animate={{ y: status === 'DIED' ? -1 : 0 }}
              whileTap={reducedMotion ? undefined : { scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            >
              ✗ Died
            </motion.button>
          </div>
          {status === '' && (
            <Caption tone="warning" className="mt-2 block">
              Select an outcome to continue the debrief.
            </Caption>
          )}
        </div>

        <div className="kills-red-row">
          <div className="form-group kills-block">
            <label>KILLS</label>
            <input
              type="number"
              min={0}
              value={kills ?? ''}
              onChange={(e) => setKills(e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full px-3 py-2 bg-abi-bg border border-abi-border rounded-lg text-abi-text text-sm"
              placeholder="0"
            />
          </div>
          <div className="form-group red-toggle-block">
            <label>RED</label>
            <motion.button
              type="button"
              onClick={() => setIsRed(!isRed)}
              whileTap={reducedMotion ? undefined : { scale: 0.98 }}
              className={`w-full px-3 py-2 rounded-lg border text-sm font-semibold uppercase tracking-wider transition-all h-full ${
                isRed
                  ? 'bg-red-600/20 border-red-500 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.4)]'
                  : 'bg-abi-bg border-abi-border text-abi-text-dim hover:border-abi-text-dim'
              }`}
            >
              {isRed ? '● RED ITEM FOUND' : '○ NO RED ITEM'}
            </motion.button>
          </div>
        </div>

        <ExpandPanel open={status === 'DIED' && (gearValue ?? 0) > 0}>
          <div className="rescue-slider-container">
            <div className="rescue-slider-label">
              <span>Rescue Percentage</span>
              <span className="rescue-slider-value">{rescuePercentage ?? 0}%</span>
            </div>
            <div className="rescue-slider-track">
              <div
                className="rescue-slider-fill"
                style={{ width: `${rescuePercentage ?? 0}%` }}
              />
              <input
                type="range"
                min={0}
                max={100}
                value={rescuePercentage ?? 0}
                onChange={(e) => setRescuePercentage(parseInt(e.target.value))}
                className="rescue-slider-input"
              />
            </div>
            <div className="rescue-slider-ticks">
              <span className="rescue-slider-tick">0</span>
              <span className="rescue-slider-tick">25</span>
              <span className="rescue-slider-tick">50</span>
              <span className="rescue-slider-tick">75</span>
              <span className="rescue-slider-tick">100</span>
            </div>
            {gearRescue && (
              <div className="mt-3 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-abi-text-muted">Rescued Value:</span>
                  <span className="text-positive">${gearRescue.rescuedValue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-abi-text-muted">Gear Loss:</span>
                  <span className="text-negative">${gearRescue.gearLoss.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>
        </ExpandPanel>
      </div>
    );
  }

  if (stepId === 3) {
    return (
      <div className="space-y-3 debrief-step-fields">
        <div className="form-group">
          <label>AMMUNITION</label>
          <div className="log-mini-item">
            <span>Total Ammo Value</span>
            <span>${ammoTotalCost.toLocaleString()}</span>
          </div>
          <motion.button
            type="button"
            onClick={() => setShowAmmoModal(true)}
            whileTap={reducedMotion ? undefined : { scale: 0.985 }}
            className="debrief-subaction w-full mt-2 px-3 py-2 border border-abi-border rounded-lg text-xs font-semibold text-abi-text-muted"
          >
            {ammo.length > 0 ? 'Edit Ammo' : '+ Add Ammo'}
          </motion.button>
        </div>

        <div className="form-group">
          <label>LOOT VALUE</label>
          <input
            type="number"
            min={0}
            value={lootValue ?? ''}
            onChange={(e) => setLootValue(e.target.value ? parseInt(e.target.value) : undefined)}
            className="w-full px-3 py-2 bg-abi-bg border border-abi-border rounded-lg text-abi-text text-sm"
            placeholder="0"
          />
        </div>
        <Caption tone="secondary" className="block">
          Log rounds expended after the raid, then the loot secured. Net profit and ROI update live in the KPI dock.
        </Caption>
      </div>
    );
  }

  return (
    <div className="space-y-4 debrief-step-fields">
      <div className="border border-abi-border bg-abi-bg rounded-lg p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <MapName className="block truncate">{mapName}</MapName>
            <Caption tone="muted" className="block mt-[var(--space-value-meta)]">
              {modeName} · {kills ?? 0} kills
            </Caption>
          </div>
          <StatusBadge status={status || 'EXTRACTED'} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-px border border-abi-border bg-abi-border rounded-lg overflow-hidden">
        <div className="bg-abi-bg p-3">
          <MetaLabel className="block mb-[var(--space-label-value)]">Investment</MetaLabel>
          <DataValue>${economyPreview.investment.toLocaleString()}</DataValue>
        </div>
        <div className="bg-abi-bg p-3">
          <MetaLabel className="block mb-[var(--space-label-value)]">Loot value</MetaLabel>
          <DataValue tone="positive">${(lootValue ?? 0).toLocaleString()}</DataValue>
        </div>
        <div className="bg-abi-bg p-3">
          <MetaLabel className="block mb-[var(--space-label-value)]">Net profit</MetaLabel>
          <DataValue tone={economyPreview.netProfit >= 0 ? 'positive' : 'negative'}>
            {economyPreview.netProfit >= 0 ? '+' : ''}${economyPreview.netProfit.toLocaleString()}
          </DataValue>
        </div>
        <div className="bg-abi-bg p-3">
          <MetaLabel className="block mb-[var(--space-label-value)]">ROI</MetaLabel>
          <DataValue tone={economyPreview.roi >= 0 ? 'positive' : 'negative'}>
            {economyPreview.roi.toFixed(1)}%
          </DataValue>
        </div>
      </div>

      <div className="border border-abi-border bg-abi-bg rounded-lg p-3">
        <MetaLabel className="block mb-2">Highlight detection</MetaLabel>
        {detectedHighlights.length > 0 ? (
          <div className="space-y-2">
            {detectedHighlights.map(h => (
              <motion.div
                key={h.category}
                className="flex items-center gap-2"
                initial={reducedMotion ? false : { opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25 }}
              >
                <Badge variant="orange" className="inline-flex items-center gap-1 shrink-0">
                  <Star size={10} />
                  {h.category}
                </Badge>
                <Caption tone="secondary" className="truncate">{h.reason}</Caption>
              </motion.div>
            ))}
          </div>
        ) : (
          <Caption tone="muted">No highlight thresholds met.</Caption>
        )}
      </div>
    </div>
  );
}
