# PALPA Pantti Scanner — Expo App

Scan Finnish beverage barcodes and check deposit (pantillisuus) via PALPA.

## Setup — 4 steps

### 1. Install Node.js
Download from https://nodejs.org (LTS version)

### 2. Install Expo CLI
```bash
npm install -g expo-cli
```

### 3. Install dependencies
```bash
cd palpa-expo
npm install
```

### 4. Start the app
```bash
npx expo start
```

Then scan the QR code with the **Expo Go** app on your phone.

---

## Install Expo Go on your phone
- Android: https://play.google.com/store/apps/details?id=host.exp.exponent
- iOS:     https://apps.apple.com/app/expo-go/id982107779

---

## How the app works
1. Tap **Scan Barcode** — camera opens with a live barcode scanner
2. Point at the barcode on any Finnish bottle or can
3. When detected, barcode appears automatically (with vibration feedback)
4. Tap **Check deposit on PALPA** — opens PALPA website in browser
5. PALPA shows: product name, package type, deposit value

## Supported barcodes
EAN-13, EAN-8, UPC-A, UPC-E, Code 128

## Notes
- Works only for packages registered in Finland's deposit system
- Lidl's own bottles are NOT in PALPA's system
- You can also type the barcode number manually
- Recent scans are saved on your device

## Troubleshooting
- If camera permission is denied: go to phone Settings → Apps → PALPA Scanner → Permissions → Camera
- If barcode not detected: make sure barcode is well-lit and not crumpled
- Expo Go on iOS requires same WiFi network as your development computer
