import { useMemo, useState, useCallback } from 'react';
import { MAPS, GAME_MODES } from '../../data/constants';
import { addRaid, addHighlight, generateId, getSessionId } from '../../utils/storage';
import {
  calculateROI,
  calculateRaidEconomy,
  calculateGearRescue,
  detectRaidHighlights,
} from '../../utils/economy';
import type { Raid, RaidMode, AmmoEntry, ConsumableEntry, GearRescueData } from '../../types';
import { useSettings } from '../../hooks/useStorageQuery';

export const DEBRIEF_STEPS = [
  { id: 1, label: 'Deployment' },
  { id: 2, label: 'Combat report' },
  { id: 3, label: 'Extraction' },
  { id: 4, label: 'Debrief' },
] as const;

export type StepId = (typeof DEBRIEF_STEPS)[number]['id'];
export type PipelineStepState = 'completed' | 'active' | 'standby';

export function useMissionDebriefForm(onRaidLogged?: (raidId: string) => void) {
  const settings = useSettings();

  const [step, setStep] = useState<StepId>(1);
  const [maxReachable, setMaxReachable] = useState<StepId>(1);

  const [map, setMap] = useState('tv_station');
  const [mode, setMode] = useState('forbidden');
  const [status, setStatus] = useState<'EXTRACTED' | 'DIED' | ''>('');
  const [kills, setKills] = useState<number | undefined>(undefined);
  const [gearValue, setGearValue] = useState<number | undefined>(undefined);
  const [rescuePercentage, setRescuePercentage] = useState<number | undefined>(undefined);
  const [isRed, setIsRed] = useState(false);
  const [ammo, setAmmo] = useState<AmmoEntry[]>([]);
  const [consumables, setConsumables] = useState<ConsumableEntry[]>([]);
  const [lootValue, setLootValue] = useState<number | undefined>(undefined);

  const [showAmmoModal, setShowAmmoModal] = useState(false);
  const [showConsumablesModal, setShowConsumablesModal] = useState(false);

  const gearRescue: GearRescueData | undefined =
    status === 'DIED' && (rescuePercentage ?? 0) > 0 && (gearValue ?? 0) > 0
      ? calculateGearRescue(gearValue ?? 0, rescuePercentage ?? 0)
      : undefined;

  const realizedEconomy = useMemo(() => {
    return calculateRaidEconomy(
      {
        ammo,
        consumables,
        gearValue: gearValue ?? 0,
        gearRescue,
        status: status || 'EXTRACTED',
        loot: [],
        lootValue: lootValue ?? 0,
      },
      settings.globalTaxRate
    );
  }, [ammo, consumables, gearValue, gearRescue, status, lootValue, settings.globalTaxRate]);

  const economyPreview = useMemo(() => {
    const runCost =
      ammo.reduce((sum, entry) => sum + entry.totalCost, 0) +
      consumables.reduce((sum, entry) => sum + entry.totalCost, 0);
    const roiInvestment =
      runCost + (settings.roiMode === 'economic' ? gearValue ?? 0 : 0);

    return {
      investment: realizedEconomy.investment,
      netProfit: realizedEconomy.netProfit,
      roi: calculateROI((lootValue ?? 0) - roiInvestment, roiInvestment),
    };
  }, [ammo, consumables, gearValue, lootValue, realizedEconomy, settings.roiMode]);

  const buildRaid = useCallback(
    (id: string, timestamp: number): Raid => ({
      id,
      timestamp,
      map: MAPS.find(m => m.id === map)?.name || map,
      mode: (GAME_MODES.find(m => m.id === mode)?.name || mode) as RaidMode,
      status: status || 'EXTRACTED',
      duration: 0,
      ammo,
      consumables,
      gearValue: gearValue ?? 0,
      gearRescue,
      loot: [],
      lootValue: lootValue ?? 0,
      kills: kills ?? 0,
      deaths: 0,
      redItemFound: isRed,
      investment: realizedEconomy.investment,
      netProfit: realizedEconomy.netProfit,
      roi: realizedEconomy.roi,
      isHighlight: false,
      sessionId: getSessionId(timestamp, settings.sessionDuration),
    }),
    [
      map,
      mode,
      status,
      ammo,
      consumables,
      gearValue,
      gearRescue,
      lootValue,
      kills,
      isRed,
      realizedEconomy,
      settings.sessionDuration,
    ]
  );

  const detectedHighlights = useMemo(() => {
    if (step !== 4) return [];
    return detectRaidHighlights(buildRaid('preview', 0), settings, { redItemFound: isRed });
  }, [
    step,
    buildRaid,
    settings,
    isRed,
  ]);

  const handleReset = useCallback(() => {
    setStep(1);
    setMaxReachable(1);
    setMap('tv_station');
    setMode('forbidden');
    setStatus('');
    setKills(undefined);
    setGearValue(undefined);
    setRescuePercentage(undefined);
    setIsRed(false);
    setAmmo([]);
    setConsumables([]);
    setLootValue(undefined);
  }, []);

  const handleConfirm = useCallback(() => {
    const now = Date.now();
    const raid = buildRaid(generateId(), now);
    const highlights = detectRaidHighlights(raid, settings, { redItemFound: isRed });

    if (highlights.length > 0) {
      raid.isHighlight = true;
      raid.highlightReason = highlights[0].reason;
      raid.highlightCategory = highlights[0].category;
    }

    addRaid(raid);
    highlights.forEach(addHighlight);
    onRaidLogged?.(raid.id);
    handleReset();
  }, [buildRaid, settings, isRed, onRaidLogged, handleReset]);

  const goToStep = useCallback((next: StepId) => {
    if (next > maxReachable) return;
    setStep(next);
  }, [maxReachable]);

  const canAdvance = step !== 2 || status !== '';

  const advance = useCallback(() => {
    if (!canAdvance || step >= 4) return;
    const next = (step + 1) as StepId;
    setMaxReachable(prev => (next > prev ? next : prev));
    setStep(next);
  }, [canAdvance, step]);

  const goBack = useCallback(() => {
    if (step <= 1) return;
    setStep((step - 1) as StepId);
  }, [step]);

  const getStepState = useCallback(
    (id: StepId): PipelineStepState => {
      if (id === step) return 'active';
      if (id < maxReachable || id < step) return 'completed';
      return 'standby';
    },
    [step, maxReachable]
  );

  const ammoTotalCost = ammo.reduce((sum, a) => sum + a.totalCost, 0);
  const consumablesTotalCost = consumables.reduce((sum, c) => sum + c.totalCost, 0);
  const mapName = MAPS.find(m => m.id === map)?.name || map;
  const modeName = GAME_MODES.find(m => m.id === mode)?.name || mode;

  const getCollapsedSummary = useCallback(
    (id: StepId): string => {
      switch (id) {
        case 1:
          return `${mapName} · ${modeName}`;
        case 2:
          return status
            ? `${status === 'EXTRACTED' ? 'Extracted' : 'Died'} · ${kills ?? 0} kills`
            : 'Outcome pending';
        case 3:
          return `Loot $${(lootValue ?? 0).toLocaleString()}`;
        case 4:
          return `${economyPreview.netProfit >= 0 ? '+' : ''}$${economyPreview.netProfit.toLocaleString()} · ${economyPreview.roi.toFixed(1)}% ROI`;
        default:
          return '';
      }
    },
    [mapName, modeName, status, kills, lootValue, economyPreview]
  );

  return {
    step,
    maxReachable,
    map,
    setMap,
    mode,
    setMode,
    status,
    setStatus,
    kills,
    setKills,
    gearValue,
    setGearValue,
    rescuePercentage,
    setRescuePercentage,
    isRed,
    setIsRed,
    ammo,
    setAmmo,
    consumables,
    setConsumables,
    lootValue,
    setLootValue,
    showAmmoModal,
    setShowAmmoModal,
    showConsumablesModal,
    setShowConsumablesModal,
    gearRescue,
    economyPreview,
    detectedHighlights,
    handleConfirm,
    handleReset,
    goToStep,
    advance,
    goBack,
    canAdvance,
    getStepState,
    getCollapsedSummary,
    ammoTotalCost,
    consumablesTotalCost,
    mapName,
    modeName,
  };
}

export type MissionDebriefForm = ReturnType<typeof useMissionDebriefForm>;
