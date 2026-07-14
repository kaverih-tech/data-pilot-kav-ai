import { create } from "zustand";
import type { DatasetProfile } from "./eda";

export interface DatasetState {
  fileName: string | null;
  rows: Record<string, unknown>[];
  profile: DatasetProfile | null;
  target: string | null;
  dateCol: string | null;
  categoryCol: string | null;
  setDataset: (
    fileName: string,
    rows: Record<string, unknown>[],
    profile: DatasetProfile,
  ) => void;
  setTarget: (t: string | null) => void;
  setDateCol: (d: string | null) => void;
  setCategoryCol: (c: string | null) => void;
  reset: () => void;
}

export const useDataset = create<DatasetState>((set) => ({
  fileName: null,
  rows: [],
  profile: null,
  target: null,
  dateCol: null,
  categoryCol: null,
  setDataset: (fileName, rows, profile) =>
    set({
      fileName,
      rows,
      profile,
      target: profile.suggestedTarget ?? null,
      dateCol: profile.suggestedDate ?? null,
      categoryCol: profile.suggestedCategory ?? null,
    }),
  setTarget: (target) => set({ target }),
  setDateCol: (dateCol) => set({ dateCol }),
  setCategoryCol: (categoryCol) => set({ categoryCol }),
  reset: () =>
    set({ fileName: null, rows: [], profile: null, target: null, dateCol: null, categoryCol: null }),
}));
