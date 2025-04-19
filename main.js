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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = __importStar(require("path"));
const node_hid_1 = __importDefault(require("node-hid"));
// AppUserModelID für Windows‑Toasts
electron_1.app.setAppUserModelId("ps4-akku-monitor");
// Konstanten für Sony DS4 Controller
const VENDOR_ID = 0x054c;
const PID_BLUETOOTH = 0x09cc;
const PID_USB = 0x05c4;
// Interval und Schwellenwert (für Benachrichtigungen, falls genutzt)
const LOW_BATTERY_THRESHOLD = 10; // in Prozent
// Globale Variable für aktuellen Akkustand
let currentBattery = { level: 0, charging: false };
let warnedLow = false; // ob Low-Battery-Warnung schon gezeigt wurde
// Konstanten für XInput-Abfrage
const RECONNECT_DELAY = 2000;
const CHECK_INTERVAL = 2000;
let mainWindow;
/** GUI‑Fenster erzeugen und IPC‑Listener für Updates einrichten */
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 460, // statt 400
        height: 430, // statt 150
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
        },
    });
    mainWindow.loadFile("renderer.html");
}
// Hilfsfunktion: Full-Mode aktivieren (nur für BT-Geräte sinnvoll)
function enableFullMode(device) {
    try {
        const result = device.getFeatureReport(0x02, 37);
    }
    catch (err) {
        console.warn("Full-Mode Aktivierung fehlgeschlagen:", err);
    }
}
// Hilfsfunktion: Akkustand aus einem Input-Report-Buffer auslesen
function parseBattery(data) {
    const HID_OFFSET = 32;
    const batteryByte = data[HID_OFFSET];
    const levelNibble = batteryByte & 0x0f;
    const levelPercent = Math.min(Math.max(Math.round((levelNibble / 8.05) * 100), 0), 100);
    const charging = Boolean(batteryByte & 0x10);
    return { level: levelPercent, charging };
}
// Startet das Monitoring des Akkus
function startBatteryMonitor() {
    // 1. Suche das aktuelle Controller‑Info-Objekt (inkl. path)
    const devInfo = node_hid_1.default.devices().find((d) => d.vendorId === VENDOR_ID && [PID_BLUETOOTH, PID_USB].includes(d.productId));
    // 2. Kein Controller gefunden → Disconnect‑Event, Retry
    if (!devInfo) {
        console.warn(`Kein Controller – nächster Versuch in ${RECONNECT_DELAY / 1000}s`);
        mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.webContents.send("battery-disconnected");
        return setTimeout(startBatteryMonitor, RECONNECT_DELAY);
    }
    // 3. Öffne das HID‑Handle
    let device;
    try {
        device = new node_hid_1.default.HID(devInfo.path);
    }
    catch (err) {
        console.error("HID open failed:", err);
        mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.webContents.send("battery-disconnected");
        return setTimeout(startBatteryMonitor, RECONNECT_DELAY);
    }
    // 4. Bluetooth Full‑Mode einschalten
    if (devInfo.productId === PID_BLUETOOTH) {
        enableFullMode(device);
    }
    // 5. Polling‑Checker, ob der Controller noch verbunden ist
    const checker = setInterval(() => {
        const paths = node_hid_1.default.devices().map((d) => d.path);
        if (!paths.includes(devInfo.path)) {
            console.log("Controller nicht mehr im HID-Device-List, cleanup…");
            cleanup();
        }
    }, CHECK_INTERVAL);
    // 6. Cleanup‑Routine
    const cleanup = () => {
        clearInterval(checker);
        device.removeListener("data", onData);
        device.removeListener("error", onError);
        try {
            device.close();
        }
        catch (_a) { }
        // Warn-Flag zurücksetzen
        warnedLow = false;
        // Wenn das Fenster schon weg ist: nur schließen und zurück
        if (!mainWindow || mainWindow.isDestroyed()) {
            return;
        }
        // Sonst Renderer benachrichtigen und reconnect starten
        mainWindow.webContents.send("battery-disconnected");
        setTimeout(startBatteryMonitor, RECONNECT_DELAY);
    };
    // 7. Daten‑Callback
    const onData = (data) => {
        const info = parseBattery(data);
        currentBattery = info;
        mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.webContents.send("battery-update", info);
        if (info.level < LOW_BATTERY_THRESHOLD && !warnedLow) {
            showToast(info.level);
            warnedLow = true;
        }
        else if (info.level >= LOW_BATTERY_THRESHOLD) {
            warnedLow = false;
        }
    };
    // 8. Error‑Callback
    const onError = (err) => {
        console.error("Controller‑Error:", err);
        cleanup();
    };
    // 9. Listener registrieren
    device.on("data", onData);
    device.on("error", onError);
}
// 7. Daten‑Callback
const onData = (data) => {
    const info = parseBattery(data);
    currentBattery = info;
    mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.webContents.send("battery-update", info);
    if (info.level < LOW_BATTERY_THRESHOLD && !warnedLow) {
        showToast(info.level);
        warnedLow = true;
    }
    else if (info.level >= LOW_BATTERY_THRESHOLD) {
        warnedLow = false;
    }
};
// Hilfsfunktion: Toast-Notification bei niedrigem Akku
function showToast(level) {
    new electron_1.Notification({
        title: "PS4 Controller Akku niedrig",
        body: `Nur noch ${level}% übrig!`,
    }).show();
}
// ... Aufruf beim Start der App:
electron_1.app.whenReady().then(() => {
    createWindow();
    startBatteryMonitor();
    // IPC-Handler einrichten für manuelle Abfrage
    electron_1.ipcMain.handle("get-battery", () => __awaiter(void 0, void 0, void 0, function* () { }));
});
