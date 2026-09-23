import { useCallback, useEffect, useSyncExternalStore } from "react";

import {
  DEFAULT_SETTINGS,
  applyTheme,
  getWorkspaceSettings,
  onWorkspaceSettingsChange,
  resetWorkspaceSettings,
  saveWorkspaceSettings,
  type WorkspaceSettings,
} from "../lib/workspace-settings";

/** Reactive access to the workspace configuration. */
export function useWorkspaceSettings() {
  const settings = useSyncExternalStore(
    onWorkspaceSettingsChange,
    getWorkspaceSettings,
    () => DEFAULT_SETTINGS,
  );

  const update = useCallback((patch: Partial<WorkspaceSettings>) => {
    saveWorkspaceSettings({ ...getWorkspaceSettings(), ...patch });
  }, []);

  return { settings, update, reset: resetWorkspaceSettings };
}

/** Keeps the document palette in sync with the configured theme. */
export function useThemeSync(settings: WorkspaceSettings): void {
  useEffect(() => {
    applyTheme(settings);
  }, [settings]);
}
