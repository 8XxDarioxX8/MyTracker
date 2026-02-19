# 📋 Update Notes - Version 2.0

**Release Datum:** 18. Februar 2026  
**Status:** ✅ Live auf Render.com

---

## 🎉 Was ist neu?

### 1️⃣ Daily Snapshots System

**Das Wichtigste Update!** Ab jetzt werden deine Portfolio-Werte dauerhaft gespeichert.

**Vorher:**
- Kursdaten nur von yfinance (max. 2 Jahre zurück)
- Keine eigene historische Datenbank
- Nach 2 Jahren keine alten Daten mehr

**Jetzt:**
- ✅ **Automatische Snapshots** jeden Abend 21:00 Uhr
- ✅ **Unbegrenzte Speicherdauer** - deine Daten bleiben für immer
- ✅ **Unabhängig von yfinance** - auch in 10 Jahren noch verfügbar
- ✅ **Snapshots bei Transaktionen** - jeder Kauf/Verkauf wird dokumentiert

**Technische Details:**
- Neue Datenbank-Tabelle: `daily_snapshots`
- API Endpoint: `POST /api/snapshot/save`
- GitHub Actions: Automatisierung via Cron Job
- Speichert: Datum, Gesamtwert, Investiert, Cash, Timestamp

**Nutzen:**
- Nach 1 Jahr: 365 Datenpunkte
- Nach 10 Jahren: 3650 Datenpunkte
- Perfekte Performance-Analyse über Jahre hinweg

---

### 2️⃣ YTD Button (Year-to-Date)

**Neuer Zeitfilter im Performance-Chart!**

**Was ist YTD?**
- Zeigt Performance vom 1. Januar bis heute
- Perfekt für Jahresvergleiche
- Standardmäßig in der Finanzwelt verwendet

**Wo zu finden?**
Dashboard → Vermögensverlauf → Buttons: `1T | 1W | 1M | YTD | 1J | All`

**Beispiel:**
- Am 18.02.2026 zeigt YTD die Performance seit 01.01.2026
- Im Dezember siehst du das ganze Jahr auf einen Blick

---

### 3️⃣ Fix: Löschen funktioniert dauerhaft

**Problem behoben:**
- ❌ Vorher: Gelöschte Einträge kamen nach App-Neustart zurück
- ✅ Jetzt: Löschen ist permanent

**Was wurde gefixt?**
- Test-Eintrag aus Datenbank entfernt
- Löschen-Button korrekt mit API verbunden
- Datenbank-Commits werden richtig durchgeführt

**Technisch:**
```python
@app.route('/api/portfolio/<int:portfolio_id>', methods=['DELETE'])
def delete_portfolio(portfolio_id):
    conn.execute('DELETE FROM portfolio WHERE id = ?', (portfolio_id,))
    conn.commit()  # ✅ Jetzt korrekt
    save_daily_snapshot()  # Bonus: Snapshot wird aktualisiert
```

---

### 4️⃣ Mobile-Responsive Design

**Die App funktioniert jetzt perfekt auf allen Geräten!**

**Desktop (>768px):**
- Sidebar links permanent sichtbar
- Breite Charts nebeneinander
- Hover-Effekte

**Mobile (<768px):**
- ☰ Hamburger-Menü oben links
- Sidebar ausklappbar
- Charts gestapelt (untereinander)
- Touch-optimierte Buttons (min. 44x44px)
- Auto-Zoom verhindert auf iOS

**Tablet (768-1024px):**
- Kompaktere Sidebar
- Optimierte Layouts

**Besonderheiten:**
- Sidebar schließt automatisch nach Klick (Mobile)
- Sidebar schließt bei Klick außerhalb (Mobile)
- Inputs größer (verhindert Zoom auf iOS)

---

### 5️⃣ Custom Favicon & Branding

**Professioneller Look mit eigenem Logo!**

**Was wurde hinzugefügt?**
- ✅ `favicon.png` (512x512) - High-Res für moderne Browser
- ✅ `favicon.ico` (32x32) - Kompatibilität für alte Browser
- ✅ Apple Touch Icon Support
- ✅ Browser-Tab zeigt Logo
- ✅ Lesezeichen zeigen Logo
- ✅ PWA-ready (falls später aktiviert)

**Dein Logo:**
- Blaues Rauten-Design
- Professionell und einzigartig
- Überall erkennbar

---

### 6️⃣ GitHub Actions Integration

**Vollautomatische Snapshots ohne manuelles Zutun!**

**Workflow:**
```yaml
name: Daily Portfolio Snapshot
on:
  schedule:
    - cron: '0 20 * * *'  # 20:00 UTC = 21:00 CH
  workflow_dispatch:       # Manuell triggerbar
```

**Was passiert?**
1. GitHub Actions startet täglich um 20:00 UTC
2. Sendet POST-Request an Render-App
3. App erstellt Snapshot automatisch
4. Daten werden in Datenbank gespeichert

**Vorteile:**
- ✅ Kostenlos (GitHub Actions Free Tier)
- ✅ Zuverlässig (läuft auch wenn App schläft)
- ✅ Logs einsehbar (GitHub → Actions Tab)
- ✅ Manuell triggerbar bei Bedarf

**Setup:**
GitHub Secret `RENDER_APP_URL` erforderlich - siehe README.md

---

## 🔄 Migration & Datenhistorie

### Alte Daten
- ❌ Snapshots vor 18.02.2026 sind NICHT verfügbar
- ✅ Live-Kurse via yfinance für historische Ansicht (bis 2 Jahre zurück)

### Neue Daten
- ✅ Ab 18.02.2026: Täglich gespeichert
- ✅ Für immer verfügbar
- ✅ Unabhängig von yfinance-Limits

### Entscheidung
Die ersten ~75 Tage (05.12.2025 - 17.02.2026) wurden bewusst übersprungen:
- Backfill zu komplex für Endbenutzer
- yfinance zeigt diese Daten weiterhin an
- Fokus auf saubere Zukunftsdaten

---

## 🚀 Performance-Verbesserungen

### Ladezeiten
- Snapshots aus lokaler DB statt API-Call
- Weniger Requests an yfinance
- Schnellere Chart-Darstellung

### Datenbank
- Optimierte Indizes
- `date` als UNIQUE constraint
- INSERT OR REPLACE für Updates

### Frontend
- Lazy Loading von Charts
- Efficient DOM-Updates
- Minimiertes CSS/JS (in Zukunft)

---

## 🐛 Bug Fixes

### Kritische Fixes
- ✅ Löschen funktioniert dauerhaft
- ✅ Test-Eintrag aus DB entfernt
- ✅ Windows-Encoding Fehler behoben

### Kleinere Fixes
- ✅ YTD funktioniert auch bei Börsen-Feiertagen
- ✅ Mobile Sidebar schließt korrekt
- ✅ Chart lädt nicht mehrfach
- ✅ Snapshot-Fehler werden geloggt

---

## 📝 Breaking Changes

**Keine!** Version 2.0 ist vollständig kompatibel mit bestehenden Daten.

---

## 🔜 Nächste Schritte

### Für Dich als User
1. ✅ GitHub Secret ist gesetzt
2. ✅ App ist deployed
3. ⏰ Warte auf ersten Auto-Snapshot (heute 21:00)
4. 📊 Checke morgen GitHub Actions (grüner Haken?)
5. 🎉 Entspannen - läuft jetzt automatisch!

### Für zukünftige Entwicklung
- [ ] Backfill-Option für Power-User (optional)
- [ ] Chart mit Snapshot-Daten statt yfinance
- [ ] Export-Funktion für historische Daten
- [ ] Notifications bei Snapshot-Fehlern

---

## 💡 Tipps & Tricks

### Snapshot manuell triggern
```bash
curl -X POST https://mytracker-u9vr.onrender.com/api/snapshot/save
```

### Alle Snapshots anzeigen
Browser: `https://mytracker-u9vr.onrender.com/api/snapshots`

### GitHub Actions manuell starten
GitHub → Actions → "Daily Portfolio Snapshot" → "Run workflow"

---

## 📞 Support

Bei Fragen oder Problemen:
1. GitHub Actions Logs checken
2. Render Logs prüfen
3. Browser Console öffnen (F12)

---

## 🎯 Zusammenfassung

**Version 2.0 bringt:**
- ✅ Unbegrenzte Datenhistorie
- ✅ Automatisierung (GitHub Actions)
- ✅ Mobile-First Design
- ✅ Professionelles Branding
- ✅ Zuverlässiges Löschen
- ✅ YTD-Analyse

**Aufwand für dich:** 0 (läuft vollautomatisch)  
**Nutzen:** Unbezahlbar (perfekte Langzeit-Dokumentation)

---

**Happy Tracking! 📈💰**

*Letzte Aktualisierung: 19.02.2026*
