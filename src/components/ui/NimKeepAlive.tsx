'use client';

import { useEffect } from 'react';

export function NimKeepAlive() {
  useEffect(() => {
    // Ping immediately on mount (when user enters the UI)
    fetch('/api/ai/ping').catch(() => {});

    // Ping every 2 minutes (120,000 ms) to keep the NIM models warm
    const interval = setInterval(() => {
      fetch('/api/ai/ping').catch(() => {});
    }, 120000);

    return () => clearInterval(interval);
  }, []);

  // Renders nothing, just runs in the background
  return null;
}
