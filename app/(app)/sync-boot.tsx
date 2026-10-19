"use client";

import { useEffect } from "react";
import { sincronizar } from "@/lib/offline/sync";

export function SyncBoot() {
  useEffect(() => {
    void sincronizar();
    const handler = () => void sincronizar();
    window.addEventListener("online", handler);
    return () => window.removeEventListener("online", handler);
  }, []);

  return null;
}
