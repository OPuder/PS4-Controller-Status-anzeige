import HID from 'node-hid';

// Sony DS4 über Bluetooth
const VID = 0x054C;
const PID_BT = 0x09CC;

const info = HID.devices().find(d => d.vendorId === VID && d.productId === PID_BT);
if (!info) {
  console.error('Kein Bluetooth‑DS4 gefunden.');
  process.exit(1);
}
const dev = new HID.HID(info.path!);

// Full‑Mode aktivieren
try { dev.getFeatureReport(0x02, 37); } catch {}

// Einmalig ersten Report dumpen
dev.once('data', data => {
  console.log(
    data
      .slice(0, 50)
      .map((b: { toString: (arg0: number) => string; }, i: any) => `${i}:${b.toString(16).padStart(2,'0')}`)
      .join('  ')
  );
  dev.close();
  process.exit(0);
});
