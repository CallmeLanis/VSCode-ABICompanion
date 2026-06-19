import { useState, useEffect } from 'react';
import { Card, Button, NumberInput, ConfirmModal } from '../components/ui';
import { getSettings, saveSettings, clearAllStorage } from '../utils/storage';
import { formatPercentage } from '../utils/economy';
import { Settings, Trash2, Info } from 'lucide-react';
import type { AppSettings } from '../types';

export function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(getSettings);
  const [hasChanges, setHasChanges] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    const original = getSettings();
    const changed = JSON.stringify(settings) !== JSON.stringify(original);
    setHasChanges(changed);
  }, [settings]);

  const handleSave = () => {
    saveSettings(settings);
    setHasChanges(false);
  };

  const handleReset = () => {
    const defaults: AppSettings = {
      globalTaxRate: 0.10,
      sessionDuration: 60,
      highlightProfitThreshold: 50000,
      highlightKillThreshold: 5,
    };
    setSettings(defaults);
    saveSettings(defaults);
    setHasChanges(false);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-abi-text flex items-center gap-2">
          <Settings className="text-abi-orange" size={28} />
          Settings
        </h1>
        <p className="text-abi-text-muted text-sm mt-1">
          Configure your experience
        </p>
      </div>

      {/* Economy Settings */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold text-abi-text-muted uppercase tracking-wider mb-4">
          Economy
        </h3>
        <div className="space-y-4">
          <div>
            <NumberInput
              label="Global Market Tax Rate (%)"
              value={settings.globalTaxRate * 100}
              onChange={(val) => setSettings({ ...settings, globalTaxRate: val / 100 })}
              min={0}
              max={100}
              step={1}
            />
            <p className="text-xs text-abi-text-dim mt-1">
              Current: {formatPercentage(settings.globalTaxRate * 100)} tax on market sales
            </p>
          </div>
        </div>
      </Card>

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
          />
          <p className="text-xs text-abi-text-dim">
            Raids within this time window are grouped into the same session
          </p>
        </div>
      </Card>

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
          />
          <p className="text-xs text-abi-text-dim">
            Raids with profit at or above this amount are automatically highlighted
          </p>

          <NumberInput
            label="Kill Threshold"
            value={settings.highlightKillThreshold}
            onChange={(val) => setSettings({ ...settings, highlightKillThreshold: val })}
            min={0}
          />
          <p className="text-xs text-abi-text-dim">
            Raids with kills at or above this amount are automatically highlighted
          </p>
        </div>
      </Card>

      {/* Data Management */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold text-abi-text-muted uppercase tracking-wider mb-4 flex items-center gap-2">
          <Trash2 size={16} className="text-red-400" />
          Data Management
        </h3>
        <div className="space-y-4">
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
      />
    </div>
  );
}
