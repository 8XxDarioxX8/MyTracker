# Portfolio Tracker – Render.com Deployment

## Projektstruktur
```
portfolio-tracker/
├── app.py               ← Flask Backend
├── requirements.txt     ← Python Pakete
├── portfolio.db         ← Datenbank (deine Daten)
└── static/
    ├── index.html
    ├── style.css
    └── script.js
```

## Schritt-für-Schritt: Auf Render.com deployen

### 1. GitHub Konto (falls noch nicht vorhanden)
→ https://github.com → "Sign up" → kostenloses Konto

### 2. Neues Repository erstellen
- Oben rechts auf "+" klicken → "New repository"
- Name: `portfolio-tracker`
- Public oder Private (beides funktioniert)
- "Create repository" klicken

### 3. Dateien hochladen
- Im neuen Repo auf "uploading an existing file" klicken
- ALLE Dateien aus diesem Ordner hochladen:
  - app.py
  - requirements.txt
  - portfolio.db
  - Den ganzen `static/` Ordner (index.html, style.css, script.js)
- "Commit changes" klicken

### 4. Render.com einrichten
→ https://render.com → "Get Started for Free"
- Mit GitHub-Konto einloggen (empfohlen)
- "New +" → "Web Service"
- GitHub verbinden → dein `portfolio-tracker` Repo auswählen
- Einstellungen:
  - **Name:** portfolio-tracker (oder was du willst)
  - **Runtime:** Python 3
  - **Build Command:** `pip install -r requirements.txt`
  - **Start Command:** `gunicorn app:app`
  - **Instance Type:** Free
- "Create Web Service" klicken

### 5. Fertig! 🎉
Nach 2-3 Minuten bekommst du eine URL wie:
`https://portfolio-tracker-xxxx.onrender.com`

Diese URL funktioniert auf jedem Gerät – auch vom Handy!

## Wichtig zu wissen
- Die App "schläft" nach 15 Min Inaktivität (kostenloser Plan)
- Beim ersten Aufruf nach dem Schlafen: ~30 Sekunden warten
- Danach läuft alles normal
- yfinance-Daten funktionieren ohne Einschränkungen ✓
