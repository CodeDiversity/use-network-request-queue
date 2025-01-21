import { renderHook, act, waitFor } from "@testing-library/react";
import { useNetworkRequestQueue } from "../useNetworkRequestQueue";
import { describe, expect, test, vi, beforeEach } from 'vitest';

describe("useNetworkRequestQueue", () => {
  beforeEach(() => {
    global._isOnline = true;
    vi.clearAllMocks();
  });

  test("should start with an empty queue", () => {
    const { result } = renderHook(() => useNetworkRequestQueue());
    expect(result.current.pendingRequests).toEqual([]);
    expect(result.current.isOffline).toBe(false);
  });

  test("should add a request to the queue when offline", () => {
    global._isOnline = false;
    const { result } = renderHook(() => useNetworkRequestQueue());
    const request = () => Promise.resolve("test");

    act(() => {
      result.current.addRequest(request);
    });

    expect(result.current.pendingRequests.length).toBe(1);
    expect(result.current.isOffline).toBe(true);
  });

  test("should execute request immediately when online", async () => {
    const { result } = renderHook(() => useNetworkRequestQueue());
    const mockRequest = vi.fn().mockResolvedValue("success");

    act(() => {
      result.current.addRequest(mockRequest);
    });

    expect(result.current.pendingRequests.length).toBe(0);
    expect(mockRequest).toHaveBeenCalledTimes(1);
  });

  test("should process queued requests when back online", async () => {
    global._isOnline = false;
    const { result } = renderHook(() => useNetworkRequestQueue());
    const mockRequest = vi.fn().mockResolvedValue("success");

    act(() => {
      result.current.addRequest(mockRequest);
    });

    expect(result.current.pendingRequests.length).toBe(1);

    await act(async () => {
      global._isOnline = true;
      window.dispatchEvent(new Event("online"));
    });

    await waitFor(() => {
      expect(mockRequest).toHaveBeenCalled();
      expect(result.current.pendingRequests.length).toBe(0);
    });
  });

  test("should handle multiple queued requests in order", async () => {
    global._isOnline = false;
    const { result } = renderHook(() => useNetworkRequestQueue());
    const mockRequest1 = vi.fn().mockResolvedValue("first");
    const mockRequest2 = vi.fn().mockResolvedValue("second");

    act(() => {
      result.current.addRequest(mockRequest1);
      result.current.addRequest(mockRequest2);
    });

    expect(result.current.pendingRequests.length).toBe(2);

    await act(async () => {
      global._isOnline = true;
      window.dispatchEvent(new Event("online"));
    });

    await waitFor(() => {
      expect(mockRequest1).toHaveBeenCalled();
      expect(mockRequest2).toHaveBeenCalled();
      expect(result.current.pendingRequests.length).toBe(0);
    });

    expect(mockRequest1.mock.invocationCallOrder[0])
      .toBeLessThan(mockRequest2.mock.invocationCallOrder[0]);
  });

  test("should retry failed requests up to MAX_RETRIES times", async () => {
    global._isOnline = false;
    const { result } = renderHook(() => useNetworkRequestQueue());
    const mockFailingRequest = vi.fn().mockRejectedValue(new Error("Network error"));
    const consoleSpy = vi.spyOn(console, 'warn');

    act(() => {
      result.current.addRequest(mockFailingRequest);
    });

    expect(result.current.pendingRequests.length).toBe(1);

    // Trigger retries by going online
    await act(async () => {
      global._isOnline = true;
      window.dispatchEvent(new Event("online"));
    });

    // Wait for initial attempt and 3 retries
    await waitFor(() => {
      expect(mockFailingRequest).toHaveBeenCalledTimes(4); // Initial + 3 retries
      expect(consoleSpy).toHaveBeenCalledWith("Request dropped after 3 failed attempts");
      expect(result.current.pendingRequests.length).toBe(0);
    });

    consoleSpy.mockRestore();
  });
});
