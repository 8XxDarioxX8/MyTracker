# Portfolio Tracker V2 - Update Notes

## ✅ Was wurde gefixt/hinzugefügt:

### 1. Problem: Löschen funktioniert jetzt dauerhaft
- **Vorher:** Test-Käufe kamen nach 15 Min wieder zurück
- **Jetzt:** Datenbank wurde bereinigt, Löschen funktioniert permanent
- Der Test-Eintrag (id=7, "msci", 10 Stück) wurde entfernt

### 2. YTD Button hinzugefügt
- **Neuer Button:** "YTD" (Year-to-Date)
- Zeigt Performance vom 1. Januar bis heute
- Zwischen "1M" und "1J" Button

### 3. Daily Snapshots System (Historische Daten für immer!)
- **Neue Datenbank-Tabelle:** `daily_snapshots`
- Speichert automatisch jeden Tag deinen Portfolio-Wert
- Funktioniert unabhängig von yfinance (keine 2-Jahres-Limit mehr!)

**Wie es funktioniert:**
- Bei jedem Kauf/Verkauf/Cash-Update → automatischer Snapshot
- Daten werden in der Datenbank gespeichert
- In 10 Jahren siehst du noch alle historischen Werte!

**API Endpoints (für später):**
- `GET /api/snapshots` → Alle gespeicherten Snapshots
- `POST /api/snapshot/save` → Manuell Snapshot erstellen

---

## 🚀 Deployment Schritte:

### 1. Dateien ersetzen
Kopiere aus dem entpackten ZIP in deinen `MyTracker` Ordner:
- `app.py` (NEU - mit Snapshot-System)
- `portfolio.db` (BEREINIGT - ohne Test-Eintrag)
- `static/index.html` (mit YTD Button)
- `static/script.js` (mit YTD Support)

### 2. Git Push
```bash
cd /c/Users/dario/Documents/Dario/VSC/Repos/MyTracker
git add .
git commit -m "v2: Fix delete, add YTD, daily snapshots"
git push
```

### 3. Render deployed automatisch
Warte 2-3 Minuten → fertig!

---

### 3. GitHub Actions aktivieren (für tägliche Snapshots)

**Wichtig:** Nach dem ersten Push musst du noch ein Secret setzen:

1. Geh auf GitHub → dein Repository → "Settings" → "Secrets and variables" → "Actions"
2. Klicke auf "New repository secret"
3. Name: `RENDER_APP_URL`
4. Value: Deine Render-URL **ohne https://**, z.B. `portfolio-tracker-xyz.onrender.com`
5. "Add secret" klicken

**Das war's!** Ab jetzt läuft jeden Tag um 20:00 Uhr UTC (21:00/22:00 Schweizer Zeit) automatisch ein Snapshot. 🎯

### Optional: Historische Daten nachträglich speichern

Wenn du auch die Vergangenheit (seit deinem ersten Kauf) als Snapshots haben willst:

**Auf deinem lokalen Computer:**
```bash
cd /c/Users/dario/Documents/Dario/VSC/Repos/MyTracker
python backfill_snapshots.py
```

Das Script:
- Holt historische Kurse von yfinance
- Berechnet für jeden Tag den Portfolio-Wert
- Speichert alles in der Datenbank
- Nur einmal ausführen!

---

## 📊 Daily Snapshots - Details

### Was wird gespeichert?
Jeden Tag (bei Änderungen):
- `date` - Datum (YYYY-MM-DD)
- `total_value_chf` - Gesamtvermögen
- `total_invested_chf` - Investiert (Kaufpreis)
- `cash_balance` - Cash-Bestand
- `portfolio_value_chf` - Marktwert Portfolio
- `timestamp` - Genauer Zeitpunkt

### Zukunft: Unbegrenzte Historie
- Nach 1 Jahr: 365 Datenpunkte
- Nach 10 Jahren: 3650 Datenpunkte
- yfinance Limit (2 Jahre) spielt keine Rolle mehr!
- Deine Daten bleiben für immer erhalten

### Optional: Chart mit Snapshots erweitern
Später kannst du den Chart so anpassen, dass er:
1. Zuerst Snapshots aus der Datenbank holt
2. Dann yfinance nur für fehlende Tage verwendet
3. = Perfekte Kombination für langfristige Historie

---

## 🎯 Nächste mögliche Features

- [ ] Chart mit Snapshot-Daten erweitern
- [ ] Export Funktion (CSV/Excel)
- [ ] Dividenden tracken
- [ ] Mehrere Portfolios
- [ ] Login-System
- [ ] Email-Benachrichtigungen

Viel Erfolg! 📈
