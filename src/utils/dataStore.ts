export type QueryKey = 'raids' | 'highlights' | 'sessions' | 'analytics' | 'lootdb' | 'settings';

const listeners = new Map<QueryKey, Set<() => void>>();

export function invalidateQueries(keys: QueryKey | QueryKey[]): void {
  const keyList = Array.isArray(keys) ? keys : [keys];
  keyList.forEach((key) => {
    listeners.get(key)?.forEach((callback) => callback());
  });
}

export function subscribeToQuery(key: QueryKey, callback: () => void): () => void {
  if (!listeners.has(key)) {
    listeners.set(key, new Set());
  }
  listeners.get(key)!.add(callback);
  return () => {
    listeners.get(key)?.delete(callback);
  };
}
