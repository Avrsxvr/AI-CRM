'use client';

import { useEffect, useState } from 'react';
import { OfflineStorage, syncOfflineLead } from '@/lib/services/offline';

export default function ServiceWorkerRegister() {
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js').then(
          function(registration) {
            console.log('Service Worker registration successful with scope: ', registration.scope);
          },
          function(err) {
            console.log('Service Worker registration failed: ', err);
          }
        );
      });
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const processSyncQueue = async () => {
      if (isSyncing || !navigator.onLine) return;
      
      const queue = OfflineStorage.getQueue();
      if (queue.length === 0) return;

      setIsSyncing(true);
      console.log(`[Offline Sync] Found ${queue.length} leads in queue. Starting sync...`);

      for (const lead of queue) {
        const success = await syncOfflineLead(lead);
        if (success) {
          OfflineStorage.dequeue(lead.id);
          console.log(`[Offline Sync] Successfully synced lead: ${lead.contactFields.name || lead.id}`);
        } else {
          // If a sync fails, we stop processing the rest of the queue to prevent loop crashes
          console.warn(`[Offline Sync] Sync failed for lead ${lead.id}. Will retry later.`);
          break;
        }
      }

      setIsSyncing(false);
      
      // Dispatch event to trigger lists refresh
      window.dispatchEvent(new Event('offline-sync-complete'));
    };

    // Listen for online events
    window.addEventListener('online', processSyncQueue);
    
    // Also listen for enqueues to try syncing immediately if online
    window.addEventListener('offline-queue-updated', processSyncQueue);
    
    // Run sync check on mount
    processSyncQueue();

    return () => {
      window.removeEventListener('online', processSyncQueue);
      window.removeEventListener('offline-queue-updated', processSyncQueue);
    };
  }, [isSyncing]);

  return null;
}
