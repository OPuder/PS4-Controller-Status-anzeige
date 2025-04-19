import HID from 'node-hid';

// Gib alle aktuell sichtbaren HID‑Devices aus
console.log(JSON.stringify(HID.devices(), null, 2));
process.exit(0);