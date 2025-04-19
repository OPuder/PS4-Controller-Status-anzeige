"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_hid_1 = __importDefault(require("node-hid"));
// Sony DS4 über Bluetooth
const VID = 0x054C;
const PID_BT = 0x09CC;
const info = node_hid_1.default.devices().find(d => d.vendorId === VID && d.productId === PID_BT);
if (!info) {
    console.error('Kein Bluetooth‑DS4 gefunden.');
    process.exit(1);
}
const dev = new node_hid_1.default.HID(info.path);
// Full‑Mode aktivieren
try {
    dev.getFeatureReport(0x02, 37);
}
catch (_a) { }
// Einmalig ersten Report dumpen
dev.once('data', data => {
    console.log(data
        .slice(0, 50)
        .map((b, i) => `${i}:${b.toString(16).padStart(2, '0')}`)
        .join('  '));
    dev.close();
    process.exit(0);
});
