import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import * as HID from 'node-hid';
import * as dgram from 'dgram';

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
function readBatteryLevel(): Promise<{ level: number, charging: boolean } | null> {
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
      const battery = msg[30];         // Akkustand 0–10
      const charging = msg[31] === 1;  // 1 = wird geladen

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
  const win = new BrowserWindow({
    width: 600,
    height: 400,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  win.loadFile('renderer.html');
}

app.whenReady().then(() => {
  createWindow();
});

ipcMain.handle('get-battery', async () => {
  return await readBatteryLevel();
});
