"use client";

import { useCallback, useEffect, useState } from "react";
import type { UrlVerdict, Verdict } from "@/lib/types";

const STORAGE_KEY = "sentra:history:v1";
const MAX_ENTRIES = 25;

export type HistoryEntry = {
  id: string;
  kind: "email" | "url";
  label: string;
  verdict: Verdict | UrlVerdict;
  riskScore: number;
  timestamp: number;
  payload: string;
};

export type NewHistoryEntry = Omit<HistoryEntry, "id">;

function readStorage(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is HistoryEntry =>
        typeof e === "object" &&
        e !== null &&
        typeof e.id === "string" &&
        (e.kind === "email" || e.kind === "url") &&
        typeof e.label === "string" &&
        typeof e.verdict === "string" &&
        typeof e.riskScore === "number" &&
        typeof e.timestamp === "number" &&
        typeof e.payload === "string",
    );
  } catch {
    return [];
  }
}

export function useHistory() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEntries(readStorage());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch {
      /* quota or privacy mode — silently ignore */
    }
  }, [entries, hydrated]);

  const record = useCallback((entry: NewHistoryEntry) => {
    setEntries((prev) => {
      const next: HistoryEntry = {
        ...entry,
        id: `${entry.timestamp}-${Math.random().toString(36).slice(2, 8)}`,
      };
      const dedup = prev.filter(
        (e) => !(e.kind === entry.kind && e.payload === entry.payload),
      );
      return [next, ...dedup].slice(0, MAX_ENTRIES);
    });
  }, []);

  const clear = useCallback(() => setEntries([]), []);
  const remove = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  return { entries, record, clear, remove, hydrated };
}
