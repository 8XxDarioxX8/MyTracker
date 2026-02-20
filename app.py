from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import yfinance as yf
import sqlite3
import os
from datetime import datetime, date

# Static folder zeigt auf 'static' Unterordner
app = Flask(__name__, static_folder='static')
CORS(app)

# Absolute Pfade (wichtig für Render)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "portfolio.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # Portfolio Tabelle
    c.execute('''CREATE TABLE IF NOT EXISTS portfolio
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  name TEXT, isin TEXT, amount REAL, priceUSD REAL,
                  rate REAL, date TEXT, totalCHF REAL, ticker TEXT)''')
    
    # Cash Tabelle
    c.execute('''CREATE TABLE IF NOT EXISTS cash
                 (id INTEGER PRIMARY KEY, balance REAL)''')
    c.execute('SELECT * FROM cash WHERE id = 1')
    if not c.fetchone():
        c.execute('INSERT INTO cash (id, balance) VALUES (1, 0)')
    
    # NEU: Daily Snapshots Tabelle für historische Daten
    c.execute('''CREATE TABLE IF NOT EXISTS daily_snapshots
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  date TEXT UNIQUE,
                  total_value_chf REAL,
                  total_invested_chf REAL,
                  cash_balance REAL,
                  portfolio_value_chf REAL,
                  timestamp TEXT)''')
    
    # NEU: Price Snapshots Tabelle für historische Kurse
    c.execute('''CREATE TABLE IF NOT EXISTS price_snapshots
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  date TEXT NOT NULL,
                  ticker TEXT NOT NULL,
                  close_price REAL NOT NULL,
                  timestamp TEXT,
                  UNIQUE(date, ticker))''')
    
    conn.commit()
    conn.close()

init_db()

# --- API ROUTEN ---

@app.route('/get_history')
def get_history():
    symbol = request.args.get('symbol')
    period = request.args.get('period', '2y')
    if not symbol:
        return jsonify({"error": "Kein Symbol"}), 400
    try:
        ticker = yf.Ticker(symbol)
        interval = '15m' if period in ['1d', '5d'] else '1d'
        data = ticker.history(period=period, interval=interval)
        if data.empty:
            return jsonify({"error": "Keine Daten"}), 404

        history = []
        for date, row in data.iterrows():
            if interval == '15m':
                date_local = date.tz_convert('Europe/Zurich')
                date_label = date_local.strftime('%d.%m %H:%M')
                full_date_str = date_local.strftime('%Y-%m-%d %H:%M:%S')
            else:
                date_label = date.strftime('%Y-%m-%d')
                full_date_str = date.strftime('%Y-%m-%d')
            history.append({
                "date": date_label,
                "full_date": full_date_str,
                "price": round(float(row['Close']), 2)
            })
        return jsonify(history)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/portfolio', methods=['GET'])
def get_portfolio():
    conn = get_db_connection()
    rows = conn.execute('SELECT * FROM portfolio').fetchall()
    conn.close()
    return jsonify([dict(ix) for ix in rows])

@app.route('/api/portfolio', methods=['POST'])
def add_portfolio():
    data = request.json
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''INSERT INTO portfolio (name, isin, amount, priceUSD, rate, date, totalCHF, ticker)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)''',
              (data['name'], data['isin'], data['amount'], data['priceUSD'],
               data['rate'], data['date'], data['totalCHF'], data['ticker']))
    conn.commit()
    new_id = c.lastrowid
    conn.close()
    
    # Nach jedem neuen Kauf: Snapshot speichern
    save_daily_snapshot()
    
    return jsonify({'id': new_id, 'success': True})

@app.route('/api/portfolio/<int:portfolio_id>', methods=['DELETE'])
def delete_portfolio(portfolio_id):
    conn = sqlite3.connect(DB_PATH)
    conn.execute('DELETE FROM portfolio WHERE id = ?', (portfolio_id,))
    conn.commit()
    conn.close()
    
    # Nach Löschen: Snapshot aktualisieren
    save_daily_snapshot()
    
    return jsonify({'success': True})

@app.route('/api/portfolio/<int:portfolio_id>', methods=['PUT'])
def update_portfolio(portfolio_id):
    data = request.json
    conn = sqlite3.connect(DB_PATH)
    conn.execute('''UPDATE portfolio
                    SET name=?, isin=?, amount=?, priceUSD=?, rate=?, date=?, totalCHF=?, ticker=?
                    WHERE id=?''',
                 (data['name'], data['isin'], data['amount'], data['priceUSD'],
                  data['rate'], data['date'], data['totalCHF'], data['ticker'], portfolio_id))
    conn.commit()
    conn.close()
    
    # Nach Update: Snapshot aktualisieren
    save_daily_snapshot()
    
    return jsonify({'success': True})

@app.route('/api/cash', methods=['GET'])
def get_cash():
    conn = get_db_connection()
    row = conn.execute('SELECT balance FROM cash WHERE id = 1').fetchone()
    conn.close()
    return jsonify({'balance': row['balance'] if row else 0})

@app.route('/api/cash', methods=['POST'])
def set_cash():
    data = request.json
    conn = sqlite3.connect(DB_PATH)
    conn.execute('UPDATE cash SET balance = ? WHERE id = 1', (data['balance'],))
    conn.commit()
    conn.close()
    
    # Nach Cash-Änderung: Snapshot speichern
    save_daily_snapshot()
    
    return jsonify({'success': True})

# NEU: Daily Snapshots API
@app.route('/api/snapshots', methods=['GET'])
def get_snapshots():
    """Gibt alle gespeicherten Daily Snapshots zurück"""
    conn = get_db_connection()
    rows = conn.execute('SELECT * FROM daily_snapshots ORDER BY date ASC').fetchall()
    conn.close()
    return jsonify([dict(row) for row in rows])

@app.route('/api/price_snapshots', methods=['GET'])
def get_price_snapshots():
    """Gibt alle gespeicherten Kurse zurück"""
    date_param = request.args.get('date')  # Optional: Filter nach Datum
    ticker_param = request.args.get('ticker')  # Optional: Filter nach Ticker
    
    conn = get_db_connection()
    
    if date_param and ticker_param:
        rows = conn.execute('SELECT * FROM price_snapshots WHERE date = ? AND ticker = ?', 
                           (date_param, ticker_param)).fetchall()
    elif date_param:
        rows = conn.execute('SELECT * FROM price_snapshots WHERE date = ? ORDER BY ticker', 
                           (date_param,)).fetchall()
    elif ticker_param:
        rows = conn.execute('SELECT * FROM price_snapshots WHERE ticker = ? ORDER BY date', 
                           (ticker_param,)).fetchall()
    else:
        rows = conn.execute('SELECT * FROM price_snapshots ORDER BY date DESC, ticker').fetchall()
    
    conn.close()
    return jsonify([dict(row) for row in rows])

@app.route('/api/snapshot/save', methods=['POST'])
def trigger_snapshot():
    """Manuell einen Snapshot speichern"""
    save_daily_snapshot()
    return jsonify({'success': True, 'message': 'Snapshot gespeichert'})

def save_daily_snapshot():
    """
    Speichert den aktuellen Portfolio-Wert UND die Kurse als Daily Snapshot.
    
    1. Lädt aktuelle Kurse von yfinance
    2. Speichert Kurse in price_snapshots Tabelle
    3. Berechnet Portfolio-Wert mit aktuellen Kursen
    4. Speichert Portfolio-Snapshot in daily_snapshots Tabelle
    """
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        
        # Portfolio-Items holen
        portfolio_rows = c.execute('SELECT * FROM portfolio').fetchall()
        
        if not portfolio_rows:
            conn.close()
            print("⚠️ Kein Portfolio vorhanden - Snapshot übersprungen")
            return
        
        # Alle benötigten Tickers sammeln
        tickers = set()
        for row in portfolio_rows:
            ticker = row[8]  # ticker ist an Index 8
            if ticker:
                tickers.add(ticker)
        tickers.add("USDCHF=X")  # FX immer dabei
        
        today = date.today().isoformat()
        timestamp = datetime.now().isoformat()
        
        print(f"📊 Erstelle Snapshot für {today}...")
        
        # Schritt 1: Aktuelle Kurse von yfinance holen und speichern
        prices = {}
        for ticker in tickers:
            try:
                stock = yf.Ticker(ticker)
                hist = stock.history(period='1d')
                
                if not hist.empty:
                    close_price = float(hist['Close'].iloc[-1])
                    prices[ticker] = close_price
                    
                    # Kurs in price_snapshots speichern
                    c.execute('''INSERT OR REPLACE INTO price_snapshots 
                                 (date, ticker, close_price, timestamp)
                                 VALUES (?, ?, ?, ?)''',
                              (today, ticker, close_price, timestamp))
                    
                    print(f"  ✓ {ticker}: {close_price:.4f}")
                else:
                    print(f"  ⚠️ {ticker}: Keine Daten (Wochenende/Feiertag?)")
            except Exception as e:
                print(f"  ✗ {ticker}: Fehler - {e}")
        
        # Schritt 2: Portfolio-Wert berechnen
        total_invested = 0
        portfolio_value = 0
        
        fx_rate = prices.get("USDCHF=X")
        
        for row in portfolio_rows:
            item_id, name, isin, amount, priceUSD, rate, purch_date, totalCHF, ticker = row
            total_invested += totalCHF
            
            # Aktuellen Marktwert berechnen
            if ticker in prices and fx_rate:
                current_price_usd = prices[ticker]
                portfolio_value += amount * current_price_usd * fx_rate
            else:
                # Fallback: Kaufpreis wenn kein aktueller Kurs
                portfolio_value += totalCHF
        
        # Cash holen
        cash_row = c.execute('SELECT balance FROM cash WHERE id = 1').fetchone()
        cash_balance = cash_row[0] if cash_row else 0
        
        total_value = portfolio_value + cash_balance
        
        # Schritt 3: Portfolio-Snapshot speichern
        c.execute('''INSERT OR REPLACE INTO daily_snapshots 
                     (date, total_value_chf, total_invested_chf, cash_balance, portfolio_value_chf, timestamp)
                     VALUES (?, ?, ?, ?, ?, ?)''',
                  (today, total_value, total_invested, cash_balance, portfolio_value, timestamp))
        
        conn.commit()
        conn.close()
        
        print(f"✅ Snapshot gespeichert: {total_value:.2f} CHF")
        
    except Exception as e:
        print(f"❌ Fehler beim Snapshot speichern: {e}")
        import traceback
        traceback.print_exc()

# --- STATISCHE DATEIEN ---

@app.route('/')
def index():
    return send_from_directory('static', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('static', path)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
