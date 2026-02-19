# 📊 MyTracker - Portfolio Management App

Ein professioneller Portfolio-Tracker zum Verwalten und Analysieren deiner Investments mit automatischer Datenspeicherung und Live-Kursen.

![Version](https://img.shields.io/badge/version-2.0-blue)
![Status](https://img.shields.io/badge/status-live-success)
![Platform](https://img.shields.io/badge/platform-web%20%7C%20mobile-orange)

🔗 **Live App:** [mytracker-u9vr.onrender.com](https://mytracker-u9vr.onrender.com)

---

## ✨ Features

### 📈 **Portfolio Management**
- Verwaltung mehrerer Assets (ETFs, Aktien, etc.)
- Automatische Kursabfrage via yfinance
- Multi-Currency Support (USD → CHF)
- Cash-Balance Tracking
- Kauf/Verkauf Historie

### 📊 **Visualisierung & Analyse**
- **Dashboard:** Portfolio-Übersicht mit Live-Werten
- **Performance-Chart:** Interaktiver Vermögensverlauf
- **Zeitfilter:** 1T, 1W, 1M, YTD, 1J, All
- **Heatmap:** Monatsrenditen-Analyse
- **Doughnut-Chart:** Asset-Verteilung

### 💾 **Historische Daten**
- **Daily Snapshots:** Automatische tägliche Speicherung
- **Unbegrenzte Historie:** Keine 2-Jahres-Limitierung mehr
- **GitHub Actions:** Auto-Snapshot jeden Abend 21:00 Uhr
- **Manuelle Snapshots:** Bei jedem Kauf/Verkauf/Cash-Update

### 📱 **Mobile-First Design**
- Responsive Layout für Handy, Tablet, Desktop
- Hamburger-Menü auf Mobile
- Touch-optimierte Buttons
- PWA-ready mit Custom-Favicon

---

## 🏗️ Tech Stack

**Backend:**
- Python 3.10+
- Flask (Web Framework)
- SQLite (Datenbank)
- yfinance (Live-Kursdaten)

**Frontend:**
- HTML5, CSS3, JavaScript
- Chart.js (Visualisierungen)
- Material Design (UI/UX)

**Deployment:**
- Render.com (Hosting)
- GitHub (Version Control)
- GitHub Actions (Automation)

---

## 📂 Projektstruktur

```
MyTracker/
├── app.py                          # Flask Backend
├── portfolio.db                    # SQLite Datenbank
├── requirements.txt                # Python Dependencies
├── static/                         # Frontend Assets
│   ├── index.html                  # Haupt-HTML
│   ├── style.css                   # Responsive Styles
│   ├── script.js                   # App Logik
│   ├── favicon.png                 # App Icon (512x512)
│   └── favicon.ico                 # Browser Icon
└── .github/
    └── workflows/
        └── daily-snapshot.yml      # Auto-Snapshot Cron Job
```

---

## 🗄️ Datenbank Schema

### **portfolio** Tabelle
```sql
id              INTEGER PRIMARY KEY
name            TEXT        -- Asset-Name (z.B. "MSCI World")
isin            TEXT        -- ISIN-Nummer
amount          REAL        -- Anzahl Stück
priceUSD        REAL        -- Kaufpreis in USD
rate            REAL        -- USD/CHF Wechselkurs beim Kauf
date            TEXT        -- Kaufdatum (YYYY-MM-DD)
totalCHF        REAL        -- Gesamtwert in CHF
ticker          TEXT        -- Yahoo Finance Ticker (z.B. "SWDA.SW")
```

### **daily_snapshots** Tabelle
```sql
id                      INTEGER PRIMARY KEY
date                    TEXT UNIQUE     -- Snapshot-Datum
total_value_chf         REAL           -- Gesamtvermögen
total_invested_chf      REAL           -- Investierter Betrag
cash_balance            REAL           -- Cash-Bestand
portfolio_value_chf     REAL           -- Marktwert Portfolio
timestamp               TEXT           -- Erstellungszeitpunkt
```

### **cash** Tabelle
```sql
id          INTEGER PRIMARY KEY
balance     REAL        -- Cash-Balance in CHF
```

---

## 🚀 Deployment

### Voraussetzungen
- GitHub Account
- Render.com Account (kostenlos)

### Setup

**1. Repository klonen**
```bash
git clone https://github.com/8XxDarioxX8/MyTracker.git
cd MyTracker
```

**2. Auf Render deployen**
- Render.com → "New Web Service"
- GitHub Repository verbinden
- Build Command: `pip install -r requirements.txt`
- Start Command: `gunicorn app:app`
- Deploy!

**3. GitHub Secret setzen (für Auto-Snapshots)**
- GitHub → Repository → Settings → Secrets → Actions
- New repository secret:
  - Name: `RENDER_APP_URL`
  - Value: `mytracker-u9vr.onrender.com` (ohne https://)

**4. Fertig!** 🎉

---

## 🔄 Automatische Snapshots

### Wie es funktioniert

**Jeden Abend um 21:00 Uhr (Schweizer Zeit):**

1. GitHub Actions startet automatisch
2. Sendet POST-Request an `/api/snapshot/save`
3. Render wacht auf (falls geschlafen)
4. Portfolio-Wert wird berechnet und gespeichert
5. Snapshot landet in `daily_snapshots` Tabelle

### Manuelle Snapshots

Snapshots werden auch automatisch erstellt bei:
- ✅ Kauf eines Assets
- ✅ Verkauf eines Assets
- ✅ Cash-Balance Update

---

## 🔧 API Endpoints

### Portfolio Management
```
GET    /api/portfolio              # Alle Positionen abrufen
POST   /api/portfolio              # Neue Position hinzufügen
PUT    /api/portfolio/<id>         # Position aktualisieren
DELETE /api/portfolio/<id>         # Position löschen
```

### Cash Management
```
GET    /api/cash                   # Cash-Balance abrufen
POST   /api/cash                   # Cash-Balance setzen
```

### Snapshots
```
GET    /api/snapshots              # Alle Snapshots abrufen
POST   /api/snapshot/save          # Manuellen Snapshot erstellen
```

### Kursdaten
```
GET    /get_history?symbol=SWDA.SW&period=1y
```

---

## 📱 Verwendung

### Dashboard
- **Vermögensübersicht:** Gesamtwert, Asset-Verteilung
- **Performance-Box:** Aktuelle Rendite, Kursgewinn, Währungseffekt
- **Chart:** Interaktiver Vermögensverlauf mit Zeitfiltern

### Investments
- **Positionen verwalten:** Käufe gruppiert nach Asset
- **Details anzeigen:** Ausklappbare Kaufhistorie
- **Bearbeiten/Löschen:** Direkter Zugriff auf jede Transaktion

### Analyse
- **Heatmap:** Monatsrenditen der letzten 2 Jahre
- **Farbcodierung:** Grün = Gewinn, Rot = Verlust

---

## 🎯 Roadmap

### ✅ Abgeschlossen (Version 2.0)
- [x] Daily Snapshots System
- [x] YTD Button
- [x] Mobile-responsive Design
- [x] Custom Favicon
- [x] GitHub Actions Integration
- [x] Löschen funktioniert dauerhaft

### 🔮 Zukünftige Features
- [ ] Multi-User Support mit Login
- [ ] Export als CSV/Excel/PDF
- [ ] Dividenden-Tracking
- [ ] Mehrere Portfolios
- [ ] Email-Benachrichtigungen bei Kursänderungen
- [ ] Sparplan-Simulation
- [ ] Steuer-Report Generator

---

## 📊 Datenhistorie

**Aktueller Stand:**
- ✅ Automatische Snapshots ab **18.02.2026**
- ✅ Tägliche Speicherung um 21:00 Uhr
- ✅ Unbegrenzte Speicherdauer

**Nach 1 Jahr:** 365 Datenpunkte  
**Nach 10 Jahren:** 3650 Datenpunkte  

Für Daten vor dem 18.02.2026 werden Live-Kurse von yfinance verwendet (bis 2 Jahre zurück verfügbar).

---

## 🐛 Troubleshooting

### App schläft nach 15 Minuten
**Normal im kostenlosen Render-Plan.** Erster Aufruf dauert ~30 Sekunden, danach läuft alles normal.

### Snapshot wird nicht erstellt
1. GitHub Actions prüfen: GitHub → Repository → Actions
2. Secret prüfen: Settings → Secrets → `RENDER_APP_URL`
3. Logs prüfen: Render Dashboard → Service → Logs

### Löschen funktioniert nicht
App-Cache leeren oder Hard-Reload: `Strg + Shift + R` (Chrome/Edge)

---

## 🤝 Contributing

Dies ist ein privates Projekt, aber Feedback und Vorschläge sind willkommen!

---

## 📝 Changelog

### Version 2.0 (18.02.2026)
- ✨ Daily Snapshots System implementiert
- ✨ YTD Button hinzugefügt
- ✨ Mobile-responsive Design
- ✨ GitHub Actions Auto-Snapshots
- 🐛 Fix: Löschen funktioniert jetzt dauerhaft
- 🎨 Custom Favicon integriert

### Version 1.0 (05.12.2025)
- 🎉 Initial Release
- ✨ Portfolio Management
- ✨ Live-Kursdaten via yfinance
- ✨ Performance-Charts
- ✨ Heatmap-Analyse

---

## 📄 Lizenz

Privates Projekt - Alle Rechte vorbehalten

---

## 👤 Autor

**Dario**  
Portfolio-Tracker entwickelt mit ❤️ und Python

---

**Letzte Aktualisierung:** 19.02.2026
