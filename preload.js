"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('batteryAPI', {
    // manueller Abruf bleibt unverändert…
    getBattery: () => electron_1.ipcRenderer.invoke('get-battery'),
    onBatteryUpdate: (cb) => {
        electron_1.ipcRenderer.on('battery-update', (_e, info) => cb(info));
    },
    onBatteryDisconnect: (cb) => {
        electron_1.ipcRenderer.on('battery-disconnected', () => cb());
    }
});
