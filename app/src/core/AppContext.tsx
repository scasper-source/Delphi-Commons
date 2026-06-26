/*
 * Copyright 2026 Stephen T. Casper
 * SPDX-License-Identifier: Apache-2.0
 */

import { createContext, useContext, type ReactNode } from "react";
import type { RoundConfig } from "./api";
import type { ConductorWorkflow, RuntimeStudyData } from "./appTypes";
import type { ModuleId, StudyRecord, UserRole } from "./types";
import type { StudyWizardState } from "./studyWizard";

export type AppContextValue = {
  role: UserRole;
  setRole: (role: UserRole) => void;
  activeModule: ModuleId;
  setActiveModule: (module: ModuleId) => void;
  study: StudyRecord;
  workflow: ConductorWorkflow;
  wizard: StudyWizardState;
  runtimeData: RuntimeStudyData;
  roundConfigs: RoundConfig[];
  consensusLocked: boolean;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ value, children }: { value: AppContextValue; children: ReactNode }) {
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAppContext(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
}
