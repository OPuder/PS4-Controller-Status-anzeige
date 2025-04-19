# PS4 Controller Akku Monitor

Eine kleine Electron-App, die den Akkustand deines per Bluetooth verbundenen PS4 DualShock 4 Controllers im Full-Mode (Input Report 0x11) ausliest und sowohl live in der GUI anzeigt als auch eine Benachrichtigung erzeugt, wenn der Akkustand unter einen definierten Schwellenwert fällt.

---

## Features

- **Bluetooth Full-Mode**: Automatische Aktivierung des Full-Mode per HID-Feature-Report 0x02
- **Live-Updates**: Kontinuierliches Auslesen der Input Reports (ID 0x11) und Anzeige in einer progressiven Leiste
- **Benachrichtigung**: Windows-Toast bei niedrigem Akkustand (konfigurierbarer Threshold)
- **Reconnect**: Erkennung von Controller-Disconnects und automatisches Wiederverbinden
- **Manueller Abruf**: Button in der GUI zum einmaligen Nachlesen

---

## Voraussetzungen

- **Windows 10+**
- **Node.js 18+**
- **Bluetooth-Controller-Pairing**: PS4 Controller muss per Bluetooth verbunden sein
- **Datenkabel** (für Offset-Find-Skript, optional)

---

## Installation

1. Repo klonen:
   ```bash
   git clone https://github.com/deinuser/ps4-akku-monitor.git
   cd ps4-akku-monitor
   ```
2. Abhängigkeiten installieren:
   ```bash
   npm install
   ```

---

## Entwicklung

### Debug-Skript zum Finden des Byte-Offsets

Um den korrekten Byte-Offset (Nibble für Akkustand) im HID-Report zu ermitteln, gibt es ein Hilfsskript:

```bash
npx ts-node scripts/find-offset.ts
```

Folge den Anweisungen im Terminal, um den Index (z.B. 32) in `main.ts` als `HID_OFFSET` zu setzen.

### App starten

```bash
npm start
```

- Die GUI öffnet sich und zeigt beim Start automatisch den aktuellen Akkustand (oder "Nicht verfügbar").
- Wenn der Controller verbunden ist, erhältst du live Updates.
- Ein Klick auf **"Akkustand prüfen"** löst einen manuellen Abruf aus.

---

## Konfiguration

- **Schwellenwert für Benachrichtigung**: In `main.ts` unter `const LOW_BATTERY_THRESHOLD` (Standard: 10 %) anpassen.
- **Polling-/Reconnect-Intervalle**:
  - `RECONNECT_DELAY` (ms bis zum nächsten Verbindungsversuch)
  - `CHECK_INTERVAL` (ms Polling, um Disconnect auch bei stillem Ausschalten zu erkennen)

---

## Build

### Mit electron-builder (.exe + Installer)

```bash
npm run build
```

- Erstellt in `release-builds/` einen NSIS-Installer für Windows x64.
- Der Installer packt die App und richtet eine AppID (`.ps4-akku-monitor`) ein.

### Mit electron-packager (nur .exe)

```bash
npx electron-packager . PS4Akkumonitor --platform=win32 --arch=x64 --out=dist
```

- Einfaches .exe-Paket ohne Installer.

---

## Benachrichtigung

- Wenn der Akkustand unter `LOW_BATTERY_THRESHOLD` fällt, zeigt die App eine Windows-Toast-Notification:
  > **PS4 Controller Akku niedrig**
  > Nur noch 10% übrig!
- Die Flag `warnedLow` verhindert Wiederholungen, solange der Wert unterhalb des Schwellenwerts bleibt.
- Beim Disconnect wird `warnedLow` zurückgesetzt, damit beim nächsten Unterschreiten wieder gewarnt wird.

---

## Lizenz

MIT © OPuder
