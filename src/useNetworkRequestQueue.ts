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
    } else {
      request().catch(() =>
        setQueue((prevQueue) => [...prevQueue, { request, retryCount: 0 }])
      );
    }
  }, []);

  // Function to process the queue when back online
  const processQueue = useCallback(async () => {
    setQueue((currentQueue) => {
      if (currentQueue.length === 0) return currentQueue;

      // Process all requests
      const processRequests = async () => {
        const remainingRequests: QueuedRequest[] = [];
        for (const queuedRequest of currentQueue) {
          try {
            await queuedRequest.request();
          } catch (error) {
            // Only keep failed requests that haven't exceeded max retries
            if (queuedRequest.retryCount < MAX_RETRIES) {
              remainingRequests.push({
                ...queuedRequest,
                retryCount: queuedRequest.retryCount + 1
              });
            } else {
              console.warn(`Request dropped after ${MAX_RETRIES} failed attempts`);
            }
          }
        }
        setQueue(remainingRequests);
      };

      // Start processing in the background
      processRequests();

      // Return empty queue immediately
      return [];
    });
  }, []); // No dependencies needed

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
