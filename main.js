"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = __importStar(require("path"));
const dgram = __importStar(require("dgram"));
// function readBatteryLevel(): { level: number, charging: boolean } | null {
//   const devices = HID.devices().filter(d => d.vendorId === 0x054C && d.path);
//   for (const d of devices) {
//     try {
//       const device = new HID.HID(d.path!);
//       const data = device.readSync();
//       device.close();
//       // Debug: Zeige ersten 40 Bytes
//       console.log(`_____________________________________________________________`);
//       console.log(`device.interface=${d.interface}, rawData:`, data.slice(0, 40));
//       if (data.length > 35) {
//         const rawByte = data[30];
//         const level = Math.min(Math.round((rawByte / 32) * 100), 100);
//         const charging = data[35] > 0;
//         console.log(`Raw battery byte: ${rawByte} → interpreted: ${level}%`);
//         console.log(``);
//         console.log(`Akkustand gefunden in device with interface=${d.interface}`);
//         console.log(`_____________________________________________________________`);
//         return { level, charging };
//       }
//     } catch (err) {
//       console.log(`Gerät (interface=${d.interface}) konnte nicht gelesen werden.`);
//     }
//   }
//   console.log("Kein Gerät mit Akkustand gefunden.");
//   return null;
// }
function readBatteryLevel() {
    return new Promise((resolve) => {
        const client = dgram.createSocket('udp4');
        const message = Buffer.from([0x01]); // Abfrage für DS4Windows UDP-Server
        client.send(message, 0, message.length, 26760, '127.0.0.1', (err) => {
            if (err) {
                console.error("Fehler beim Senden an DS4Windows:", err);
                client.close();
                return resolve(null);
            }
        });
        client.once('message', (msg) => {
            const battery = msg[30]; // Akkustand 0–10
            const charging = msg[31] === 1; // 1 = wird geladen
            const level = Math.min(battery, 10) * 10;
            console.log(`DS4Windows: Akku=${level}%, Laden=${charging}`);
            client.close();
            resolve({ level, charging });
        });
        setTimeout(() => {
            console.warn("DS4Windows antwortet nicht.");
            client.close();
            resolve(null);
        }, 1000);
    });
}
function createWindow() {
    const win = new electron_1.BrowserWindow({
        width: 600,
        height: 400,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
    });
    win.loadFile('renderer.html');
}
electron_1.app.whenReady().then(() => {
    createWindow();
});
electron_1.ipcMain.handle('get-battery', () => __awaiter(void 0, void 0, void 0, function* () {
    return yield readBatteryLevel();
}));
