import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('batteryAPI', {
  getBattery: (): Promise<{ level: number, charging: boolean } | null> =>
    ipcRenderer.invoke('get-battery')
});
