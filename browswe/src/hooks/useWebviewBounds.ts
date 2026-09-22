// hooks/useWebviewBounds.ts — Window dimension sync for child WebViews
//
// Fires on every resize event and whenever the drawer state changes, telling
// the Rust side to reposition all native child WebViews. This is what prevents
// the clipping issue where OS WebViews render above HTML elements.

import { useEffect, useCallback } from "react";
import { syncWebviewBounds } from "../lib/bridge";

export function useWebviewBounds(drawerOpen: boolean) {
  const sync = useCallback(async () => {
    try {
      await syncWebviewBounds(
        window.innerWidth,
        window.innerHeight,
        drawerOpen
      );
    } catch (err) {
      // Non-fatal — might fail during window initialization before Rust is ready
      console.warn("WebView bounds sync failed:", err);
    }
  }, [drawerOpen]);

  useEffect(() => {
    // Initial sync
    sync();

    // Debounced resize handler (16ms ≈ 60fps, prevents flooding IPC)
    let raf: number | null = null;
    const onResize = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(sync);
    };

    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [sync]);
}
