import { useState, useEffect, useRef } from 'react';
import { Card, Button, NumberInput, ConfirmModal, PageHeader } from '../components/ui';
import { MergeDataBlock } from '../components/MergeDataBlock';
import { getStoredSettings, saveSettings, clearAllStorage, getLootDBItems, loadBasicLootDB, generateId } from '../utils/storage';
import { formatPercentage } from '../utils/economy';
import { mergeImportedData } from '../utils/dataMerge';
import { buildBasicLootDBSeedItems, BASIC_LOOTDB_SEED_COUNT } from '../data/basicLootDBSeed';
import { Trash2, Info, Download, Database, Upload, Package } from 'lucide-react';
import type { AppSettings } from '../types';
import { RevealSection, StaggerContainer, StaggerItem } from '../components/motion';
import { loadDemoData } from '../utils/mockData';

function downloadLootDBExport() {
  const lootdb = getLootDBItems();
  const payload = {
    lootdb,
    exportedAt: new Date().toISOString(),
    source: 'abi-companion-lootdb',
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const stamp = new Date().toISOString().slice(0, 10);
  anchor.href = url;
  anchor.download = `abi-lootdb-${stamp}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function normalizeLootDBImportPayload(data: unknown): unknown {
  if (Array.isArray(data)) return { lootdb: data };
  return data;
}

export function SettingsPage() {
  const [settings, setSettings] = useState<Partial<AppSettings>>(getStoredSettings);
  const [hasChanges, setHasChanges] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showDemoConfirm, setShowDemoConfirm] = useState(false);
  const [showBasicLootConfirm, setShowBasicLootConfirm] = useState(false);
  const [lootImportStatus, setLootImportStatus] = useState<string | null>(null);
  const [lootImportBusy, setLootImportBusy] = useState(false);
  const lootFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const original = getStoredSettings();
    const changed = JSON.stringify(settings) !== JSON.stringify(original);
    setHasChanges(changed);
  }, [settings]);

  const handleSave = () => {
    saveSettings(settings);
    setHasChanges(false);
  };

  const handleReset = () => {
    // Clear stored settings (do not re-insert defaults)
    setSettings({});
    saveSettings({});
    setHasChanges(false);
  };

  const handleExportLootDB = () => {
    const count = getLootDBItems().length;
    downloadLootDBExport();
    setLootImportStatus(
      count > 0
        ? `Extracted ${count} LootDB catalog ${count === 1 ? 'item' : 'items'} to JSON.`
        : 'Exported empty LootDB catalog (0 items).'
    );
  };

  const handleLootFileSelected = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.json')) {
      setLootImportStatus('Select a .json LootDB export file.');
      return;
    }

    setLootImportBusy(true);
    setLootImportStatus(null);

    try {
      const parsed = JSON.parse(await file.text());
      const result = mergeImportedData(normalizeLootDBImportPayload(parsed));

      if (!result.success) {
        const firstError = result.errors[0]?.message ?? 'Invalid LootDB JSON';
        setLootImportStatus(`Load failed: ${firstError}`);
        return;
      }

      const { added, updated, skipped } = result.summary.lootdb;
      if (added + updated === 0 && skipped === 0) {
        setLootImportStatus('No LootDB items found in that file.');
        return;
      }

      setLootImportStatus(
        `LootDB loaded · ${added} added · ${updated} updated${skipped > 0 ? ` · ${skipped} skipped` : ''}. Reloading…`
      );
      window.setTimeout(() => window.location.reload(), 700);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown parse error';
      setLootImportStatus(`Load failed: ${message}`);
    } finally {
      setLootImportBusy(false);
      if (lootFileInputRef.current) lootFileInputRef.current.value = '';
    }
  };

  const handleLoadBasicLootDB = () => {
    const result = loadBasicLootDB(buildBasicLootDBSeedItems(generateId));
    setLootImportStatus(
      `Basic LootDB loaded · ${result.added} added · ${result.updated} updated · ${result.total} catalog items. Reloading…`,
    );
    window.setTimeout(() => window.location.reload(), 700);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        eyebrow="Configuration"
        title="Settings"
        meta="Local preferences and data controls"
      />

      <StaggerContainer className="space-y-6">
      <StaggerItem>
      <RevealSection>
      {/* Economy Settings */}
      <Card className="p-4">
        <h3 className="font-mono text-[10px] font-semibold text-abi-text-muted uppercase tracking-[0.14em] mb-4">
          Economy
        </h3>
        <div className="space-y-4">
          <div>
            <p className="type-label text-secondary mb-2">Default ROI view</p>
            <div className="filter-tabs" role="group" aria-label="Default ROI calculation view">
              <button
                type="button"
                className={`filter-tab ${(settings.roiMode ?? 'operational') === 'operational' ? 'active' : ''}`}
                aria-pressed={(settings.roiMode ?? 'operational') === 'operational'}
                onClick={() => setSettings({ ...settings, roiMode: 'operational' })}
              >
                Run Cost
              </button>
              <button
                type="button"
                className={`filter-tab ${settings.roiMode === 'economic' ? 'active' : ''}`}
                aria-pressed={settings.roiMode === 'economic'}
                onClick={() => setSettings({ ...settings, roiMode: 'economic' })}
              >
                Loadout
              </button>
            </div>
            <p className="text-xs text-abi-text-dim mt-1.5">
              Run Cost measures ROI against ammo and consumables. Loadout also counts the gear
              brought into the operation. Profit figures always stay on realized cash flow.
            </p>
          </div>
          <div>
            <NumberInput
              label="Global Market Tax Rate (%)"
              value={settings.globalTaxRate !== undefined ? settings.globalTaxRate * 100 : undefined}
              onChange={(val) => setSettings({ ...settings, globalTaxRate: val !== undefined ? val / 100 : undefined })}
              min={0}
              max={100}
              step={1}
              placeholder="e.g. 10"
            />
            <p className="text-xs text-abi-text-dim mt-1">
              Current: {settings.globalTaxRate !== undefined ? formatPercentage(settings.globalTaxRate * 100) : 'Not set'} tax on market sales
            </p>
          </div>
        </div>
      </Card>
      </RevealSection>
      </StaggerItem>

      <StaggerItem><RevealSection delay={0.04}>
      {/* Session Settings */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold text-abi-text-muted uppercase tracking-wider mb-4">
          Sessions
        </h3>
        <div className="space-y-4">
          <NumberInput
            label="Session Duration (minutes)"
            value={settings.sessionDuration}
            onChange={(val) => setSettings({ ...settings, sessionDuration: val })}
            min={10}
            max={480}
            placeholder="e.g. 60"
          />
          <p className="text-xs text-abi-text-dim">
            Raids within this time window are grouped into the same session
          </p>
        </div>
      </Card>
      </RevealSection></StaggerItem>

      <StaggerItem><RevealSection delay={0.06}>
      {/* Highlight Settings */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold text-abi-text-muted uppercase tracking-wider mb-4">
          Auto-Highlights
        </h3>
        <div className="space-y-4">
          <NumberInput
            label="Profit Threshold ($)"
            value={settings.highlightProfitThreshold}
            onChange={(val) => setSettings({ ...settings, highlightProfitThreshold: val })}
            min={0}
            step={1000}
            placeholder="e.g. 50000"
          />
          <p className="text-xs text-abi-text-dim">
            Raids with profit at or above this amount are automatically highlighted
          </p>

          <NumberInput
            label="Kill Threshold"
            value={settings.highlightKillThreshold}
            onChange={(val) => setSettings({ ...settings, highlightKillThreshold: val })}
            min={0}
            placeholder="e.g. 5"
          />
          <p className="text-xs text-abi-text-dim">
            Raids with kills at or above this amount are automatically highlighted
          </p>
        </div>
      </Card>
      </RevealSection></StaggerItem>

      <StaggerItem><RevealSection delay={0.08}>
      {/* Data Import & Merge */}
      <Card className="p-4">
        <MergeDataBlock onMergeComplete={() => window.location.reload()} />
      </Card>
      </RevealSection></StaggerItem>

      <StaggerItem><RevealSection delay={0.1}>
      {/* Data Management */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold text-abi-text-muted uppercase tracking-wider mb-4 flex items-center gap-2">
          <Trash2 size={16} className="text-red-400" />
          Data Management
        </h3>
        <div className="space-y-4">
          <div className="p-3 bg-abi-bg border border-abi-border rounded-lg">
            <p className="text-sm text-secondary mb-3">
              Load 48 tactical demo raids with mixed maps, modes, extract/KIA outcomes, loot names for search, and derived sessions/highlights.
            </p>
            <Button variant="secondary" onClick={() => setShowDemoConfirm(true)}>
              <Database size={16} className="mr-1" /> Load Demo Data
            </Button>
          </div>

          <div className="p-3 bg-abi-bg border border-abi-border rounded-lg">
            <p className="text-sm text-secondary mb-3">
              Load the built-in consumables catalog ({BASIC_LOOTDB_SEED_COUNT} items: medic + grenade)
              for Mission Debrief pickers. Matches by name — existing prices update in place; raids untouched.
            </p>
            <Button variant="secondary" onClick={() => setShowBasicLootConfirm(true)}>
              <Package size={16} className="mr-1" /> Load Basic LootDB
            </Button>
          </div>

          <div className="p-3 bg-abi-bg border border-abi-border rounded-lg">
            <p className="text-sm text-secondary mb-3">
              Extract your Loot Database catalog to JSON, or load a LootDB export to merge items
              (match by id / name; prices and metadata update in place). Does not touch raids.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={handleExportLootDB}>
                <Download size={16} className="mr-1" /> Extract LootDB
              </Button>
              <Button
                variant="secondary"
                disabled={lootImportBusy}
                onClick={() => lootFileInputRef.current?.click()}
              >
                <Upload size={16} className="mr-1" /> {lootImportBusy ? 'Loading…' : 'Load LootDB'}
              </Button>
              <input
                ref={lootFileInputRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(e) => {
                  const file = e.currentTarget.files?.[0];
                  if (file) void handleLootFileSelected(file);
                }}
              />
            </div>
            {lootImportStatus && (
              <p className="text-xs text-abi-text-dim mt-3 flex items-start gap-2">
                <Package size={14} className="mt-0.5 shrink-0 text-abi-orange" />
                <span>{lootImportStatus}</span>
              </p>
            )}
          </div>

          <div className="p-3 bg-yellow-900/20 border border-yellow-700/30 rounded-lg">
            <p className="text-sm text-yellow-400 flex items-start gap-2">
              <Info size={16} className="mt-0.5 shrink-0" />
              <span>
                Clearing data will permanently delete all your raids, sessions, highlights, and LootDB items.
                This action cannot be undone.
              </span>
            </p>
          </div>
          <Button
            variant="danger"
            onClick={() => setShowClearConfirm(true)}
          >
            <Trash2 size={16} className="mr-1" /> Clear All Data
          </Button>
        </div>
      </Card>
      </RevealSection></StaggerItem>
      </StaggerContainer>

      {/* Save Bar */}
      {hasChanges && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 bg-abi-bg-elevated border border-abi-border rounded-xl shadow-elevated">
          <span className="text-sm text-abi-text-muted">Unsaved changes</span>
          <Button size="sm" variant="secondary" onClick={handleReset}>
            Reset
          </Button>
          <Button size="sm" variant="primary" onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={showBasicLootConfirm}
        onClose={() => setShowBasicLootConfirm(false)}
        onConfirm={() => {
          handleLoadBasicLootDB();
          setShowBasicLootConfirm(false);
        }}
        title="Load Basic LootDB"
        message={`This upserts ${BASIC_LOOTDB_SEED_COUNT} built-in medic and grenade catalog items (match by name). Your raids and custom LootDB entries are kept.`}
        confirmText="Load Basic LootDB"
        variant="primary"
      />

      <ConfirmModal
        isOpen={showDemoConfirm}
        onClose={() => setShowDemoConfirm(false)}
        onConfirm={() => {
          loadDemoData();
          setShowDemoConfirm(false);
          window.location.reload();
        }}
        title="Load Demo Data"
        message="This replaces your current raids, sessions, and highlights with 48 demo operations for testing. Your LootDB and settings are kept."
        confirmText="Load Demo Data"
        variant="primary"
      />

      <ConfirmModal
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={() => {
          clearAllStorage();
          window.location.reload();
        }}
        title="Clear All Data"
        message="Are you sure you want to delete all your data? This action cannot be undone."
        confirmText="Delete Everything"
        variant="danger"
        shake
      />
    </div>
  );
}
