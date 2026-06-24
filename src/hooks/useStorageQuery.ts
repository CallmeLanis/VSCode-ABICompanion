import { useState, useEffect, useCallback } from 'react';
import { subscribeToQuery, type QueryKey } from '../utils/dataStore';
import {
  getRaids,
  getHighlights,
  getSessions,
  getLootDBItems,
} from '../utils/storage';
import { calculateDashboardAnalytics, aggregateSessions } from '../utils/analytics';
import type { Raid, Highlight, Session, LootDBItem } from '../types';
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

export function useHighlights(): Highlight[] {
  return useStorageQuery('highlights', getHighlights);
}

export function useStoredSessions(): Session[] {
  return useStorageQuery('sessions', getSessions);
}

export function useDashboardAnalytics(): AnalyticsCache {
  return useStorageQuery(['raids', 'highlights', 'sessions', 'analytics'], calculateDashboardAnalytics);
}

export function useAggregatedSessions(): Session[] {
  return useStorageQuery(['raids', 'sessions', 'analytics'], aggregateSessions);
}

export function useLootDBItems(): LootDBItem[] {
  return useStorageQuery('lootdb', getLootDBItems);
}
