import { app, BrowserWindow, Notification, ipcMain } from 'electron';
import * as path from 'path';
import HID from 'node-hid';

// AppUserModelID für Windows‑Toasts
app.setAppUserModelId('com.ps4-akku-monitor');

// Schnittstelle für Batterie‑Info
interface BatteryInfo {
  level: number;      // Prozent
  charging: boolean;  // Ladevorgang
}

// Konstanten für Sony DS4 Controller
const VENDOR_ID = 0x054C;
const PID_BLUETOOTH = 0x09CC;
const PID_USB = 0x05C4;


// Interval und Schwellenwert (für Benachrichtigungen, falls genutzt)
const LOW_BATTERY_THRESHOLD = 10; // in Prozent

// Globale Variable für aktuellen Akkustand
let currentBattery: BatteryInfo = { level: 0, charging: false };
let warnedLow = false; // ob Low-Battery-Warnung schon gezeigt wurde

// Konstanten für XInput-Abfrage
const RECONNECT_DELAY = 2000;
const CHECK_INTERVAL    = 2000;

let mainWindow: BrowserWindow | null;

/** GUI‑Fenster erzeugen und IPC‑Listener für Updates einrichten */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 460,      // statt 400
    height: 430,     // statt 150
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true
    }
  });
  mainWindow.loadFile('renderer.html');
}

// Hilfsfunktion: Full-Mode aktivieren (nur für BT-Geräte sinnvoll)
function enableFullMode(device: HID.HID) {
  try {
    const result = device.getFeatureReport(0x02, 37);
    console.log("Full-Mode Feature-Report 0x02 abgefragt, Bytes empfangen:", result.length);
  } catch (err) {
    console.warn("Full-Mode Aktivierung fehlgeschlagen:", err);
  }
}

// Hilfsfunktion: Akkustand aus einem Input-Report-Buffer auslesen
function parseBattery(data: Buffer): BatteryInfo {
  const HID_OFFSET     = 32;
  const batteryByte    = data[HID_OFFSET];
  const levelNibble    = batteryByte & 0x0F;
  const levelPercent   = Math.round(levelNibble / 8.05 * 100);
  const usbConnected   = Boolean(batteryByte & 0x10);
  const charging       = usbConnected && levelPercent < 100;
  return { level: levelPercent, charging };
}

// Startet das Monitoring des Akkus
function startBatteryMonitor() {
  // 1. Suche das aktuelle Controller‑Info-Objekt (inkl. path)
  const devInfo = HID.devices().find(d =>
    d.vendorId === VENDOR_ID &&
    [PID_BLUETOOTH, PID_USB].includes(d.productId)
  );

  // 2. Kein Controller gefunden → Disconnect‑Event, Retry
  if (!devInfo) {
    console.warn(`Kein Controller naechster Versuch in ${RECONNECT_DELAY/1000}s`);
    mainWindow?.webContents.send('battery-disconnected');
    return setTimeout(startBatteryMonitor, RECONNECT_DELAY);
  }

  // 3. Öffne das HID‑Handle
  let device: HID.HID;
  try {
    device = new HID.HID(devInfo.path!);
  } catch (err) {
    console.error('HID open failed:', err);
    mainWindow?.webContents.send('battery-disconnected');
    return setTimeout(startBatteryMonitor, RECONNECT_DELAY);
  }

  // 4. Bluetooth Full‑Mode einschalten
  if (devInfo.productId === PID_BLUETOOTH) {
    enableFullMode(device);
  }

  // 5. Polling‑Checker, ob der Controller noch verbunden ist
  const checker = setInterval(() => {
    const paths = HID.devices().map(d => d.path);
    if (!paths.includes(devInfo.path)) {
      console.log('Controller path nicht mehr vorhanden Cleanup & Reconnect');
      cleanup();
    }
  }, CHECK_INTERVAL);

  // 6. Cleanup‑Routine
  const cleanup = () => {
    clearInterval(checker);
    device.removeListener('data', onData);
    device.removeListener('error', onError);
    try { device.close(); } catch {}
    mainWindow?.webContents.send('battery-disconnected');
    setTimeout(startBatteryMonitor, RECONNECT_DELAY);
  };

  // 7. Daten‑Callback
  const onData = (data: Buffer) => {
    const info = parseBattery(data);
    currentBattery = info;
    console.log(`[HID DATA] Akkustand: ${info.level}%  charging: ${info.charging}`);
    mainWindow?.webContents.send('battery-update', info);

    if (info.level < LOW_BATTERY_THRESHOLD && !warnedLow) {
      showToast(info.level);
      warnedLow = true;
    } else if (info.level >= LOW_BATTERY_THRESHOLD) {
      warnedLow = false;
    }
  };

  // 8. Error‑Callback
  const onError = (err: any) => {
    console.error('Controller-Verbindung verlorenen (error event):', err);
    cleanup();
  };

  // 9. Listener registrieren
  device.on('data', onData);
  device.on('error', onError);
}

// Hilfsfunktion: Toast-Notification bei niedrigem Akku
function showToast(level: number) {
  new Notification({
    title: 'PS4 Controller Akku niedrig',
    body: `Nur noch ${level}% übrig!`,
  }).show();
}

// ... Aufruf beim Start der App:
app.whenReady().then(() => {
  createWindow();
  startBatteryMonitor();
  // IPC-Handler einrichten für manuelle Abfrage
  ipcMain.handle('get-battery', async () => {
  });
});

