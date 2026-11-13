# Vault & Packs

Gestionale collezionistico in locale. Si guadagna con tre lavori rischiosi, si spendono le monete in bustine, si espongono i cimeli in casa per la rendita e il prestigio.

React, Vite e Tailwind per l’interfaccia. Tauri per la finestra desktop. Il salvataggio sta in `localStorage`.

## Avvio

```bash
npm install
npm test
npm run dev
```

L’interfaccia è su `http://127.0.0.1:1420`.

La finestra desktop:

```bash
npm run tauri dev
```

Su Linux servono le librerie di Tauri (GTK e WebKit). La compilazione dell’eseguibile:

```bash
npm run tauri build
```

## Come è stato inizializzato

```bash
npm create vite@latest vault-packs -- --template react
cd vault-packs
npm install
npm install tailwindcss @tailwindcss/vite @fontsource/fraunces @fontsource/outfit @tauri-apps/api@2.11
npm install -D @tauri-apps/cli@2.11
npx tauri init --ci \
  --app-name "Vault & Packs" \
  --window-title "Vault & Packs" \
  --frontend-dist ../dist \
  --dev-url http://localhost:1420 \
  --before-dev-command "npm run dev" \
  --before-build-command "npm run build"
```

La finestra desktop chiede Rust 1.90, indicato in `rust-toolchain.toml`. L’interfaccia, da sola, parte con Node.

## Dove sta il gioco

- `src/utils/gameData.js` — 28 cimeli, rarità, set, bustine, case
- `src/utils/gameLogic.js` — scavo, scasso, asta, affitto, sinergie, fusione, salvataggio
- `src/components/Header.jsx` — monete, prestigio, affitto, sezioni, reset
- `src/components/JobsTab.jsx` — i tre lavori
- `src/components/ShopTab.jsx` — banco e apertura del sigillo
- `src/components/HouseTab.jsx` — immobili e teche
- `src/components/CollectionTab.jsx` — codex, vendita, fusione
