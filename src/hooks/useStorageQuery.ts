import { useState, useEffect, useCallback, useMemo } from 'react';
import { subscribeToQuery, type QueryKey } from '../utils/dataStore';
import {
  getRaids,
  getHighlights,
  getSessions,
  getLootDBItems,
  getSettings,
} from '../utils/storage';
import { calculateDashboardAnalytics, aggregateSessions, calculateSessionSummary } from '../utils/analytics';
import { applyRoiMode } from '../utils/economy';
import type { Raid, Highlight, Session, LootDBItem, SessionSummary, AppSettings } from '../types';
import type { AnalyticsCache } from '../types';

export function useStorageQuery<T>(keys: QueryKey | QueryKey[], fetcher: () => T): T {
  const keyList = Array.isArray(keys) ? keys : [keys];
  const keySignature = keyList.join(',');

  const [data, setData] = useState(fetcher);

  const refresh = useCallback(() => {
    setData(fetcher());
  }, [fetcher]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const unsubscribers = keyList.map((key) => subscribeToQuery(key, refresh));
    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [keySignature, refresh]);

  return data;
}

export function useRaids(): Raid[] {
  return useStorageQuery('raids', getRaids);
}

export function useSettings(): AppSettings {
  return useStorageQuery('settings', getSettings);
}

export function useRoiRaids(): Raid[] {
  const raids = useRaids();
  const { roiMode } = useSettings();

  return useMemo(
    () => raids.map((raid) => applyRoiMode(raid, roiMode)),
    [raids, roiMode]
  );
}

export function useHighlights(): Highlight[] {
  return useStorageQuery('highlights', getHighlights);
}

export function useStoredSessions(): Session[] {
  return useStorageQuery('sessions', getSessions);
}

export function useDashboardAnalytics(): AnalyticsCache {
  const raids = useRoiRaids();
  return useMemo(() => calculateDashboardAnalytics(raids), [raids]);
}

export function useAggregatedSessions(): Session[] {
  const raids = useRoiRaids();
  return useMemo(() => aggregateSessions(raids), [raids]);
}

export function useSessionSummary(): SessionSummary {
  const raids = useRoiRaids();
  return useMemo(() => calculateSessionSummary(raids), [raids]);
}

export function useLootDBItems(): LootDBItem[] {
  return useStorageQuery('lootdb', getLootDBItems);
}
