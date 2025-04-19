import { app, BrowserWindow, Notification, ipcMain } from 'electron';
import * as path from 'path';
import HID from 'node-hid';

app.setAppUserModelId('com.Puder.ps4-akku-monitor');
interface BatteryInfo {
  level: number;
  charging: boolean;
}

const VENDOR_ID  = 0x054C;
const PRODUCT_IDS = [0x05C4, 0x09CC];
const POLL_INTERVAL = 10_000;
const LOW_BATTERY_THRESHOLD = 10;

let warned = false;

function showToast(level: number) {
  const toast = new Notification({
    title: 'PS4 Controller Akku niedrig',
    body: `Nur noch ${level}% übrig!`
  });
  toast.show();
}

function openController(): HID.HID | null {
  const devs = HID.devices().filter(d =>
    d.vendorId === VENDOR_ID && PRODUCT_IDS.includes(d.productId)
  );
  if (!devs.length) return null;
  const info = devs.find(d => d.productId === 0x09CC) || devs[0];
  try { return new HID.HID(info.path!); }
  catch { return null; }
}

async function readBatteryLevel(): Promise<BatteryInfo | null> {
  const dev = openController();
  if (!dev) return null;

  return new Promise(resolve => {
    dev.read((err, data) => {
      dev.close();
      if (err || !data) return resolve(null);

      const OFFSET = 32;  
      const b = data[OFFSET];
      const rawNibble  = b & 0x0F;
      const cableState = (b >> 4) & 0x01;

      let batteryLevel = rawNibble;
      if (!cableState) batteryLevel++;
      if (batteryLevel > 10) batteryLevel = 10;
      const level = batteryLevel * 10;
      const charging = cableState === 1 && rawNibble <= 10;

      resolve({ level, charging });
    });
  });
}

function startBatteryMonitor() {
  setInterval(async () => {
    const info = await readBatteryLevel();
    if (!info) return;

    if (info.level < LOW_BATTERY_THRESHOLD && !warned) {
      const akkustand = info.level;
      const laden = info.charging;

      showToast(info.level);
      warned = true;
    } else if (info.level >= LOW_BATTERY_THRESHOLD) {
      warned = false;
    }
  }, POLL_INTERVAL);
}

function createWindow() {
  const win = new BrowserWindow({
    width: 600,
    height: 400,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  });
  win.loadFile('renderer.html');
}

app.whenReady().then(() => {
  createWindow();
  startBatteryMonitor();
});

ipcMain.handle('get-battery', async () => {
  return await readBatteryLevel();
});