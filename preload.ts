import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('batteryAPI', {
  // manueller Abruf bleibt unverändert…
  getBattery: () => ipcRenderer.invoke('get-battery'),
  onBatteryUpdate: (cb: (info: { level: number; charging: boolean }) => void) => {
    ipcRenderer.on('battery-update', (_e, info) => cb(info));
  },
  onBatteryDisconnect: (cb: () => void) => {
    ipcRenderer.on('battery-disconnected', () => cb());
  }
});