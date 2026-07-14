import { useState, useEffect } from 'react';
import { offlineService } from '../services/offlineService';
import { SyncState } from '../types';

export function useSyncState(): SyncState {
  const [state, setState] = useState<SyncState>({
    isOnline: offlineService.getOnlineStatus(),
    pendingCount: 0,
    lastSyncedAt: null,
    isSyncing: false,
    syncVersion: 0,
  });

  useEffect(() => {
    const updateState = async () => {
      const outbox = await offlineService.getOutbox();
      const lastSynced = await offlineService.getMetadata('lastSyncedAt');
      
      setState(prev => ({
        isOnline: offlineService.getOnlineStatus(),
        pendingCount: outbox.length,
        lastSyncedAt: lastSynced,
        isSyncing: offlineService.getIsSyncing(),
        syncVersion: (prev.syncVersion || 0) + 1,
      }));
    };

    // Initial load
    updateState();

    // Subscribe to changes in offlineService
    const unsubscribe = offlineService.subscribe(() => {
      updateState();
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return state;
}
