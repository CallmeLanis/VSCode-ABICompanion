/**
 * [feature:settings] / [settingsPage] / [mergeDataBlock]
 * Data Import & Merge Component
 *
 * Allows users to upload and merge JSON data files while maintaining
 * data integrity and avoiding duplicates based on Web schema validation
 */

import React, { useRef, useState } from 'react';
import { Upload, AlertCircle, CheckCircle, X, FileJson } from 'lucide-react';
import { Card, Button, Badge } from './ui';
import { mergeImportedData, MergeResult, ValidationError } from '../utils/dataMerge';

interface MergeDataBlockProps {
  onMergeComplete?: () => void;
}

export function MergeDataBlock({ onMergeComplete }: MergeDataBlockProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<MergeResult | null>(null);
  const [fileValidation, setFileValidation] = useState<{ valid: boolean; message: string } | null>(null);

  const handleFileSelect = async (file: File) => {
    if (!file.name.endsWith('.json')) {
      setFileValidation({ valid: false, message: 'Please select a valid JSON file' });
      return;
    }

    setIsProcessing(true);
    setFileValidation(null);
    setResult(null);

    try {
      const fileContent = await file.text();
      const data = JSON.parse(fileContent);

      setFileValidation({ valid: true, message: `Loaded: ${file.name}` });

      // Process merge
      const mergeResult = mergeImportedData(data);
      setResult(mergeResult);

      if (mergeResult.success && onMergeComplete) {
        onMergeComplete();
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setFileValidation({ valid: false, message: `Failed to parse JSON: ${errorMsg}` });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleClickUpload = () => {
    fileInputRef.current?.click();
  };

  const handleReset = () => {
    setResult(null);
    setFileValidation(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-sm font-semibold text-abi-text-muted uppercase tracking-wider mb-2">
          Data Import & Merge
        </h3>
        <p className="text-xs text-abi-text-dim">
          Import JSON data files to merge with existing records. Duplicates are automatically detected and handled.
        </p>
      </div>

      {/* File Input (Hidden) */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleInputChange}
        style={{ display: 'none' }}
      />

      {/* Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          p-6 rounded-lg border-2 border-dashed transition-all duration-200
          ${isDragging ? 'border-abi-orange bg-abi-orange/5' : 'border-abi-border bg-abi-bg-hover'}
          ${isProcessing ? 'opacity-50 pointer-events-none' : 'cursor-pointer hover:border-abi-orange/50'}
        `}
      >
        <div className="flex flex-col items-center justify-center gap-3 py-4">
          <div className={`${isDragging ? 'text-abi-orange scale-110' : 'text-abi-text-muted'} transition-all`}>
            <Upload size={32} />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-abi-text">
              {isDragging ? 'Drop JSON file here' : 'Drag JSON file here or'}
            </p>
            <button
              onClick={handleClickUpload}
              disabled={isProcessing}
              className="text-sm text-abi-orange hover:text-abi-orange-light font-semibold mt-1 disabled:opacity-50"
            >
              click to select
            </button>
          </div>
          <p className="text-xs text-abi-text-dim">Supports: raids, sessions, highlights, lootdb</p>
        </div>
      </div>

      {/* File Validation Status */}
      {fileValidation && (
        <div
          className={`
            p-3 rounded-lg border flex items-start gap-3
            ${fileValidation.valid
              ? 'bg-green-900/20 border-green-700/30'
              : 'bg-red-900/20 border-red-700/30'
            }
          `}
        >
          {fileValidation.valid ? (
            <CheckCircle size={16} className="text-green-400 mt-0.5 shrink-0" />
          ) : (
            <AlertCircle size={16} className="text-red-400 mt-0.5 shrink-0" />
          )}
          <p className={`text-sm ${fileValidation.valid ? 'text-green-400' : 'text-red-400'}`}>
            {fileValidation.message}
          </p>
        </div>
      )}

      {/* Merge Result */}
      {result && (
        <div className="space-y-4">
          {/* Result Status */}
          <div
            className={`
              p-4 rounded-lg border flex items-start gap-3
              ${result.success
                ? 'bg-green-900/20 border-green-700/30'
                : 'bg-red-900/20 border-red-700/30'
              }
            `}
          >
            {result.success ? (
              <CheckCircle size={20} className="text-green-400 mt-0.5 shrink-0" />
            ) : (
              <AlertCircle size={20} className="text-red-400 mt-0.5 shrink-0" />
            )}
            <div className="flex-1">
              <p className={`font-semibold ${result.success ? 'text-green-400' : 'text-red-400'}`}>
                {result.success ? 'Merge Successful' : 'Merge Failed'}
              </p>
              {result.success && (
                <p className="text-sm text-green-300 mt-1">
                  Successfully processed {result.summary.totalProcessed} records
                </p>
              )}
            </div>
          </div>

          {/* Detailed Summary */}
          {result.success && (
            <div className="grid grid-cols-2 gap-3">
              {/* Raids Summary */}
              {(result.summary.raids.added > 0 || result.summary.raids.updated > 0) && (
                <SummaryCard
                  icon={<FileJson size={16} className="text-blue-400" />}
                  title="Raids"
                  items={[
                    ...(result.summary.raids.added > 0 ? [`✓ ${result.summary.raids.added} added`] : []),
                    ...(result.summary.raids.updated > 0 ? [`↻ ${result.summary.raids.updated} updated`] : []),
                    ...(result.summary.raids.skipped > 0 ? [`⊘ ${result.summary.raids.skipped} skipped`] : []),
                  ]}
                />
              )}

              {/* LootDB Summary */}
              {(result.summary.lootdb.added > 0 || result.summary.lootdb.updated > 0) && (
                <SummaryCard
                  icon={<FileJson size={16} className="text-orange-400" />}
                  title="LootDB"
                  items={[
                    ...(result.summary.lootdb.added > 0 ? [`✓ ${result.summary.lootdb.added} added`] : []),
                    ...(result.summary.lootdb.updated > 0 ? [`↻ ${result.summary.lootdb.updated} updated`] : []),
                    ...(result.summary.lootdb.skipped > 0 ? [`⊘ ${result.summary.lootdb.skipped} skipped`] : []),
                  ]}
                />
              )}

              {/* Highlights Summary */}
              {result.summary.highlights.added > 0 && (
                <SummaryCard
                  icon={<FileJson size={16} className="text-yellow-400" />}
                  title="Highlights"
                  items={[
                    ...(result.summary.highlights.added > 0 ? [`✓ ${result.summary.highlights.added} added`] : []),
                    ...(result.summary.highlights.skipped > 0 ? [`⊘ ${result.summary.highlights.skipped} skipped`] : []),
                  ]}
                />
              )}

              {/* Sessions Summary */}
              {result.summary.sessions.added > 0 && (
                <SummaryCard
                  icon={<FileJson size={16} className="text-purple-400" />}
                  title="Sessions"
                  items={[
                    ...(result.summary.sessions.added > 0 ? [`✓ ${result.summary.sessions.added} added`] : []),
                    ...(result.summary.sessions.skipped > 0 ? [`⊘ ${result.summary.sessions.skipped} skipped`] : []),
                  ]}
                />
              )}
            </div>
          )}

          {/* Validation Errors */}
          {result.errors.length > 0 && (
            <div className="p-3 bg-yellow-900/20 border border-yellow-700/30 rounded-lg">
              <p className="text-xs font-semibold text-yellow-400 mb-2">
                ⚠ {result.errors.length} validation error{result.errors.length > 1 ? 's' : ''}
              </p>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {result.errors.slice(0, 5).map((error, i) => (
                  <p key={i} className="text-xs text-yellow-300">
                    {error.type} [#{error.index}]: {error.message}
                  </p>
                ))}
                {result.errors.length > 5 && (
                  <p className="text-xs text-yellow-300 pt-1">... and {result.errors.length - 5} more</p>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={handleReset} className="flex-1">
              <X size={16} className="mr-1" /> Reset
            </Button>
            <Button size="sm" variant="primary" onClick={handleClickUpload} className="flex-1">
              <Upload size={16} className="mr-1" /> Import Another File
            </Button>
          </div>
        </div>
      )}

      {/* Initial Info */}
      {!result && !fileValidation && (
        <div className="p-3 bg-abi-bg border border-abi-border rounded-lg">
          <div className="flex gap-2">
            <div className="text-abi-text-dim mt-0.5">ℹ</div>
            <div className="text-xs text-abi-text-dim">
              <p className="font-semibold mb-1">Expected JSON format:</p>
              <p className="font-mono text-xs opacity-75">
                {`{
  "raids": [...],
  "lootdb": [...],
  "highlights": [...],
  "sessions": [...]
}`}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Summary Card Component
 */
function SummaryCard({
  icon,
  title,
  items,
}: {
  icon: React.ReactNode;
  title: string;
  items: string[];
}) {
  return (
    <div className="p-3 rounded-lg bg-abi-bg-card border border-abi-border">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-sm font-semibold text-abi-text">{title}</span>
      </div>
      <div className="space-y-1">
        {items.map((item, i) => (
          <p key={i} className="text-xs text-abi-text-dim">
            {item}
          </p>
        ))}
      </div>
    </div>
  );
}
