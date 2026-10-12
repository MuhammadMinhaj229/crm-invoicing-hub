import { useCallback, useEffect, useSyncExternalStore } from "react";

import {
  DEFAULT_SETTINGS,
  applyTheme,
  getWorkspaceSettings,
  loadSharedWorkspaceSettings,
  onWorkspaceSettingsChange,
  resetWorkspaceSettings,
  saveWorkspaceSettings,
  saveSharedWorkspaceSettings,
  type WorkspaceSettings,
} from "../lib/workspace-settings";

/** Reactive access to the workspace configuration. */
export function useWorkspaceSettings(options: { loadShared?: boolean } = {}) {
  const loadShared = options.loadShared ?? true;
  const settings = useSyncExternalStore(
    onWorkspaceSettingsChange,
    getWorkspaceSettings,
    () => DEFAULT_SETTINGS,
  );

  useEffect(() => {
    if (loadShared) void loadSharedWorkspaceSettings();
  }, [loadShared]);

  const update = useCallback((patch: Partial<WorkspaceSettings>) => {
    const next = { ...getWorkspaceSettings(), ...patch };
    saveWorkspaceSettings(next);
    void saveSharedWorkspaceSettings(next).catch(() => undefined);
  }, []);

  return { settings, update, reset: resetWorkspaceSettings };
}

/** Keeps the document palette in sync with the configured theme. */
export function useThemeSync(settings: WorkspaceSettings, enabled = true): void {
  useEffect(() => {
    if (enabled) applyTheme(settings);
  }, [settings, enabled]);
}
