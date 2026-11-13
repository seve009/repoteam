# Vault & Packs

Gestionale collezionistico in una finestra. Si gioca in locale, senza rete.

```bash
python -m pip install pygame
python main.py
python -m pip install pyinstaller
pyinstaller --noconsole --onefile --add-data "assets;assets" main.py
```

L'ultimo comando, su Windows, produce `dist/main.exe`.

Su Linux lo stesso comando produce `dist/main`. Per il nome `vault-packs`:

```bash
pyinstaller --noconsole --onefile --name vault-packs --add-data "assets:assets" main.py
```

Il binario è `dist/vault-packs`. Il salvataggio è `save.json` nella cartella da cui si lancia il gioco.
