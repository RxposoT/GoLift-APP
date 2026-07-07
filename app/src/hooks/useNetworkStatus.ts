import { useState, useEffect, useCallback } from "react";
import * as Network from "expo-network";

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  const check = useCallback(async () => {
    try {
      const state = await Network.getNetworkStateAsync();
      setIsOnline(state.isConnected ?? true);
    } catch {
      setIsOnline(true);
    }
  }, []);

  useEffect(() => {
    check();
    // Re-check on visibility change
    const interval = setInterval(check, 15_000); // a cada 15s
    return () => clearInterval(interval);
  }, [check]);

  return { isOnline, check };
}
