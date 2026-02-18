"""
Backfill Historical Snapshots bis 05.12.2025

Erstellt Snapshots für jeden Tag von deinem ersten Kauf bis heute.
Benutzt yfinance um historische Kurse zu holen.

ACHTUNG: Nur einmal ausführen!
"""

import sqlite3
import yfinance as yf
from datetime import datetime, timedelta, date

DB_PATH = "portfolio.db"

def backfill_snapshots():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # Startdatum: 05.12.2025
    start_date = date(2025, 12, 5)
    today = date.today()
    
    print(f"📅 Erstelle Snapshots von {start_date} bis {today}")
    print(f"📊 Das sind {(today - start_date).days + 1} Tage")
    
    # Alle Portfolio-Items holen
    c.execute("SELECT * FROM portfolio")
    portfolio_items = c.fetchall()
    
    if not portfolio_items:
        print("❌ Keine Käufe in der Datenbank!")
        conn.close()
        return
    
    print(f"💼 {len(portfolio_items)} Portfolio-Einträge gefunden")
    
    # Alle einzigartigen Tickers sammeln
    tickers = list(set([item[8] for item in portfolio_items if item[8]]))
    tickers.append("USDCHF=X")
    
    print(f"\n🔄 Lade historische Kurse...")
    print(f"   Tickers: {', '.join(tickers)}")
    
    # Historische Kurse holen
    ticker_data = {}
    for ticker in tickers:
        try:
            print(f"   → {ticker}...", end=" ")
            stock = yf.Ticker(ticker)
            # Hole Daten von start_date bis heute
            hist = stock.history(start=start_date, end=today + timedelta(days=1))
            ticker_data[ticker] = hist
            print(f"✓ ({len(hist)} Tage)")
        except Exception as e:
            print(f"✗ Fehler: {e}")
            ticker_data[ticker] = None
    
    # Cash-Balance holen
    c.execute("SELECT balance FROM cash WHERE id = 1")
    cash_row = c.fetchone()
    cash_balance = cash_row[0] if cash_row else 0
    
    print(f"\n💰 Cash Balance: {cash_balance:.2f} CHF")
    print(f"\n📝 Erstelle Snapshots...\n")
    
    current_date = start_date
    snapshots_created = 0
    snapshots_skipped = 0
    
    # Letzte bekannte Kurse speichern (Forward-Fill bei fehlenden Daten)
    last_known_prices = {}
    
    while current_date <= today:
        # Check ob Snapshot schon existiert
        c.execute("SELECT id FROM daily_snapshots WHERE date = ?", (current_date.isoformat(),))
        if c.fetchone():
            snapshots_skipped += 1
            current_date += timedelta(days=1)
            continue
        
        total_invested = 0
        portfolio_value = 0
        
        # FX Rate für diesen Tag holen
        fx_rate = None
        if "USDCHF=X" in ticker_data and ticker_data["USDCHF=X"] is not None:
            try:
                fx_data = ticker_data["USDCHF=X"]
                matching_rows = fx_data[fx_data.index.date == current_date]
                if not matching_rows.empty:
                    fx_rate = float(matching_rows['Close'].iloc[0])
                    last_known_prices["USDCHF=X"] = fx_rate
                elif "USDCHF=X" in last_known_prices:
                    fx_rate = last_known_prices["USDCHF=X"]
            except Exception:
                pass
        
        # Für jedes Portfolio-Item
        for item in portfolio_items:
            item_id, name, isin, amount, priceUSD, rate, purchase_date_str, totalCHF, ticker = item
            purchase_date = datetime.strptime(purchase_date_str, '%Y-%m-%d').date()
            
            # Nur wenn Asset schon gekauft wurde
            if purchase_date <= current_date:
                total_invested += totalCHF
                
                # Aktuellen Marktpreis holen
                current_price_usd = None
                
                if ticker and ticker in ticker_data and ticker_data[ticker] is not None:
                    try:
                        ticker_hist = ticker_data[ticker]
                        matching_rows = ticker_hist[ticker_hist.index.date == current_date]
                        if not matching_rows.empty:
                            current_price_usd = float(matching_rows['Close'].iloc[0])
                            last_known_prices[ticker] = current_price_usd
                        elif ticker in last_known_prices:
                            current_price_usd = last_known_prices[ticker]
                    except Exception:
                        pass
                
                # Wenn kein aktueller Kurs: Kaufpreis verwenden
                if current_price_usd is None:
                    current_price_usd = priceUSD
                
                # FX Rate: aktuell oder original
                current_fx = fx_rate if fx_rate else rate
                
                # Marktwert berechnen
                portfolio_value += amount * current_price_usd * current_fx
        
        total_value = portfolio_value + cash_balance
        
        # Snapshot speichern
        try:
            c.execute('''INSERT INTO daily_snapshots 
                         (date, total_value_chf, total_invested_chf, cash_balance, portfolio_value_chf, timestamp)
                         VALUES (?, ?, ?, ?, ?, ?)''',
                      (current_date.isoformat(), total_value, total_invested, cash_balance, 
                       portfolio_value, datetime.now().isoformat()))
            snapshots_created += 1
            
            if snapshots_created % 10 == 0:
                print(f"   ✓ {current_date.strftime('%d.%m.%Y')}: {total_value:,.2f} CHF ({snapshots_created} Snapshots)")
        except sqlite3.IntegrityError:
            snapshots_skipped += 1
        
        current_date += timedelta(days=1)
    
    conn.commit()
    conn.close()
    
    print(f"\n✅ Fertig!")
    print(f"   📊 {snapshots_created} neue Snapshots erstellt")
    if snapshots_skipped > 0:
        print(f"   ⏭️  {snapshots_skipped} bereits vorhandene übersprungen")
    print(f"\n🎉 Du hast jetzt eine komplette Historie von {start_date} bis {today}!")
    print(f"   Das sind {(today - start_date).days + 1} Tage Portfolio-Daten!")

if __name__ == "__main__":
    print("=" * 60)
    print("🚀 Portfolio Snapshot Backfill Tool")
    print("=" * 60)
    print(f"\nDies erstellt Snapshots von 05.12.2025 bis heute.")
    print(f"Deine Portfolio-Daten werden mit historischen Kursen berechnet.")
    print(f"\n⚠️  WICHTIG: Nur einmal ausführen!\n")
    
    response = input("Fortfahren? (ja/nein): ")
    
    if response.lower() in ['ja', 'j', 'yes', 'y']:
        print("\n" + "=" * 60 + "\n")
        backfill_snapshots()
        print("\n" + "=" * 60)
    else:
        print("\n❌ Abgebrochen.")
