export interface Api {
  loadData(): Promise<import('../renderer/src/types/models').AppData>;
  saveData(data: import('../renderer/src/types/models').AppData): Promise<{ ok: true } | { ok: false; error: string }>;
  exportBackup(): Promise<{ ok: boolean; path?: string }>;
  exportCsv(): Promise<{ ok: boolean; path?: string }>;
  importBackup(): Promise<{ ok: boolean; data?: import('../renderer/src/types/models').AppData; error?: string }>;
  openDataFolder(): Promise<void>;
  getAppVersion(): Promise<string>;
  onWindowFocusChanged(callback: (focused: boolean) => void): () => void;
}

declare global {
  interface Window {
    api: Api;
  }
}
