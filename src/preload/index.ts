import { contextBridge, ipcRenderer } from 'electron';
import { AppData } from '../renderer/src/types/models';
import { Api } from './api';

const api: Api = {
  loadData: (): Promise<AppData> => ipcRenderer.invoke('storage:load'),
  saveData: (data: AppData): Promise<{ ok: true } | { ok: false; error: string }> =>
    ipcRenderer.invoke('storage:save', data),
  exportBackup: (): Promise<{ ok: boolean; path?: string }> =>
    ipcRenderer.invoke('backup:export'),
  exportCsv: (): Promise<{ ok: boolean; path?: string }> =>
    ipcRenderer.invoke('backup:exportCsv'),
  importBackup: (): Promise<{ ok: boolean; data?: AppData; error?: string }> =>
    ipcRenderer.invoke('backup:import'),
  openDataFolder: (): Promise<void> => ipcRenderer.invoke('storage:openFolder'),
  getAppVersion: (): Promise<string> => ipcRenderer.invoke('app:getVersion'),
  onWindowFocusChanged: (callback: (focused: boolean) => void) => {
    const subscription = (_event: Electron.IpcRendererEvent, focused: boolean): void => {
      callback(focused);
    };
    ipcRenderer.on('window:focus-change', subscription);
    return (): void => {
      ipcRenderer.removeListener('window:focus-change', subscription);
    };
  }
};

contextBridge.exposeInMainWorld('api', api);
