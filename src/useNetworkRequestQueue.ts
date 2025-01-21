import { useState, useEffect, useCallback, useMemo } from "react";

/**
 * Represents a network request function that returns a Promise.
 */
type NetworkRequest = () => Promise<any>;

/**
 * A custom React hook that queues network requests when offline and retries them when online.
 */
export function useNetworkRequestQueue() {
  const [queue, setQueue] = useState<NetworkRequest[]>([]);
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);

  // Adds a request to the queue if offline, or executes it immediately if online
  const addRequest = useCallback((request: NetworkRequest) => {
    if (!navigator.onLine) {
      setQueue((prevQueue: NetworkRequest[]) => [...prevQueue, request]);
    } else {
      request().catch(() => setQueue((prevQueue: NetworkRequest[]) => [...prevQueue, request]));
    }
  }, []);

  // Function to process the queue when back online
  const processQueue = useCallback(async () => {
    setQueue((currentQueue) => {
      if (currentQueue.length === 0) return currentQueue;

      // Process all requests
      const processRequests = async () => {
        const remainingRequests: NetworkRequest[] = [];
        for (const request of currentQueue) {
          try {
            await request();
          } catch (error) {
            remainingRequests.push(request); // Keep failed requests in queue
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
