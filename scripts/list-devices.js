"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_hid_1 = __importDefault(require("node-hid"));
// Gib alle aktuell sichtbaren HID‑Devices aus
console.log(JSON.stringify(node_hid_1.default.devices(), null, 2));
process.exit(0);
