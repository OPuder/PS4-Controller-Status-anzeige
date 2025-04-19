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
electron_1.app.setAppUserModelId('com.Puder.ps4-akku-monitor');
const VENDOR_ID = 0x054C;
const PRODUCT_IDS = [0x05C4, 0x09CC];
const POLL_INTERVAL = 10000;
const LOW_BATTERY_THRESHOLD = 10;
let warned = false;
function showToast(level) {
    const toast = new electron_1.Notification({
        title: 'PS4 Controller Akku niedrig',
        body: `Nur noch ${level}% übrig!`
    });
    toast.show();
}
function openController() {
    const devs = node_hid_1.default.devices().filter(d => d.vendorId === VENDOR_ID && PRODUCT_IDS.includes(d.productId));
    if (!devs.length)
        return null;
    const info = devs.find(d => d.productId === 0x09CC) || devs[0];
    try {
        return new node_hid_1.default.HID(info.path);
    }
    catch (_a) {
        return null;
    }
}
function readBatteryLevel() {
    return __awaiter(this, void 0, void 0, function* () {
        const dev = openController();
        if (!dev)
            return null;
        return new Promise(resolve => {
            dev.read((err, data) => {
                dev.close();
                if (err || !data)
                    return resolve(null);
                const OFFSET = 32;
                const b = data[OFFSET];
                const rawNibble = b & 0x0F;
                const cableState = (b >> 4) & 0x01;
                let batteryLevel = rawNibble;
                if (!cableState)
                    batteryLevel++;
                if (batteryLevel > 10)
                    batteryLevel = 10;
                const level = batteryLevel * 10;
                const charging = cableState === 1 && rawNibble <= 10;
                resolve({ level, charging });
            });
        });
    });
}
function startBatteryMonitor() {
    setInterval(() => __awaiter(this, void 0, void 0, function* () {
        const info = yield readBatteryLevel();
        if (!info)
            return;
        if (info.level < LOW_BATTERY_THRESHOLD && !warned) {
            const akkustand = info.level;
            const laden = info.charging;
            showToast(info.level);
            warned = true;
        }
        else if (info.level >= LOW_BATTERY_THRESHOLD) {
            warned = false;
        }
    }), POLL_INTERVAL);
}
function createWindow() {
    const win = new electron_1.BrowserWindow({
        width: 600,
        height: 400,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
        },
    });
    win.loadFile('renderer.html');
}
electron_1.app.whenReady().then(() => {
    createWindow();
    startBatteryMonitor();
});
electron_1.ipcMain.handle('get-battery', () => __awaiter(void 0, void 0, void 0, function* () {
    return yield readBatteryLevel();
}));
