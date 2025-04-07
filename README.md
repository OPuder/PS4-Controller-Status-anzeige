# PS4-Controller-Status-Anzeige

Eine Desktop-App zur Anzeige des Akkustands eines PS4-Controllers – entwickelt mit **Electron**, **TypeScript** und **node-hid**.  
Zukünftig soll auch **Bluetooth-Unterstützung** via **DS4Windows** integriert werden.

## 🔋 Features

- Liest den Akkustand von PS4-Controllern aus (via USB-Verbindung)
- Plattformübergreifend (getestet unter Windows)
- Einfache Benutzeroberfläche
- Erweiterbar mit Bluetooth-Support über DS4Windows

## 🖥️ Vorschau

![Screenshot folgt bald](#)

## ⚙️ Installation

```bash
# Repository klonen
git clone https://github.com/OPuder/PS4-Controller-Status-anzeige.git
cd PS4-Controller-Status-anzeige

# Abhängigkeiten installieren
npm install
```

## ▶️ Starten der App

```bash
npm run dev
```

Für den Build:

```bash
npm run build
```

## 🔧 Technologien

- [Electron](https://www.electronjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [node-hid](https://github.com/node-hid/node-hid)
- [Vite](https://vitejs.dev/)

## 🧪 Entwicklungsstatus

- ✅ USB-Verbindung mit PS4-Controllern funktioniert
- ⏳ Bluetooth-Integration über DS4Windows in Arbeit
- ⏳ Verbesserte UI geplant

## 📝 Lizenz

MIT License

---

**Autor:** [OPuder](https://github.com/OPuder)  
Feedback & Pull Requests sind willkommen!
