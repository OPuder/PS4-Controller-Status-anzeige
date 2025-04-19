import HID from 'node-hid';

const VENDOR_ID = 0x054C;   // Sony
const USB_PID   = 0x05C4;   // DS4 USB‑Interface
const OFFSET    = 32;       // Byte‑Index deines Battery‑Nibble

/**
 * Öffnet den per USB verbundenen PS4‑Controller
 * und aktiviert optional den Full‑Mode fürs Charging‑Bit.
 */
function openUsbController(): HID.HID | null {
  const info = HID.devices().find(d =>
    d.vendorId === VENDOR_ID && d.productId === USB_PID
  );
  if (!info) {
    console.error('Kein USB‑Controller gefunden.');
    return null;
  }

  try {
    const dev = new HID.HID(info.path!);
    // Full‑Mode aktivieren, damit Reports ID=0x11 kommen:
    try {
      dev.sendFeatureReport([0xf4, 0x42, 0x03, 0x00, 0x00]);
    } catch {
      // Ignorieren, falls das Interface das nicht unterstützt
    }
    return dev;
  } catch (e) {
    console.error('Fehler beim Öffnen des Controllers:', e);
    return null;
  }
}

/**
 * Liest einmalig den Akku‑Status aus und beendet dann das Programm.
 */
async function readUsbBattery() {
  const dev = openUsbController();
  if (!dev) process.exit(1);

  dev.read((err, data) => {
    dev.close();
    if (err || !data) {
      console.error('Fehler beim Lesen des Reports:', err);
      process.exit(1);
    }

    // rawNibble 0–15 → level 0–100%
    const b        = data[OFFSET];
    const rawNib   = b & 0x0F;
    const level    = Math.min(rawNib, 10) * 10;
    // Bit 4 = Charging‑Flag
    const charging = Boolean(b & 0x10);

    console.log(`Akkustand: ${level}%`);
    console.log(`Ladevorgang: ${charging ? 'Ja' : 'Nein'}`);
    process.exit(0);
  });
}

readUsbBattery();