import { useState, useEffect, useCallback, useMemo } from "react";

/**
 * Maximum number of retry attempts for failed requests
 */
const MAX_RETRIES = 3;

/**
 * Represents a network request with retry tracking
 */
interface QueuedRequest {
  request: () => Promise<any>;
  retryCount: number;
}

/**
 * A custom React hook that queues network requests when offline and retries them when online.
 */
export function useNetworkRequestQueue() {
  const [queue, setQueue] = useState<QueuedRequest[]>([]);
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);

  // Adds a request to the queue if offline, or executes it immediately if online
  const addRequest = useCallback((request: () => Promise<any>) => {
    if (!navigator.onLine) {
      setQueue((prevQueue) => [...prevQueue, { request, retryCount: 0 }]);
      return Promise.resolve(); // Resolve immediately when offline as request is queued
    } else {
      return request(); // Return the promise when online for error handling
    }
  }, []);

  // Function to process the queue when back online
  const processQueue = useCallback(async () => {
    let currentQueue = queue;
    if (currentQueue.length === 0) return;

    // Execute all queued requests once when back online
    for (const queuedRequest of currentQueue) {
      try {
        await queuedRequest.request();
      } catch (error) {
        console.warn('Request failed when retrying after coming back online');
      }
    }
    setQueue([]); // Clear the queue regardless of success/failure
  }, [queue]);

  // Effect to track online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      processQueue(); // Retry queued requests
    };

    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [processQueue]);

  return useMemo(() => ({
    addRequest,
    isOffline,
    pendingRequests: queue
  }), [addRequest, isOffline, queue]);
}
