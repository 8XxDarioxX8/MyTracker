const tickerMapping = {
    "IE00B4L5Y983": "SWDA.SW",
    "IE00BKM4GZ66": "SEMA.SW",
    "IE00B4L5YC18": "SEMA.SW"
};

let portfolio = [];
let cashBalance = 0;
let myChart = null; 
let myLineChart = null;
let currentPerformanceData = null;

// Beim Laden: Daten vom Server holen
document.addEventListener('DOMContentLoaded', async () => {
    await loadDataFromServer();
    renderPortfolio();
    showPage('page-dashboard');

    const greetingElement = document.querySelector('.dashboard-header h1');
    if (greetingElement) {
        const stunde = new Date().getHours();
        let b = stunde < 11 ? "Guten Morgen" : (stunde < 18 ? "Guten Tag" : "Guten Abend");
        greetingElement.innerText = `${b}, Dario`;
    }
});

// Daten vom Server laden
async function loadDataFromServer() {
    try {
        // Portfolio laden
        const portfolioResponse = await fetch('/api/portfolio');
        const portfolioData = await portfolioResponse.json();
        portfolio = portfolioData;
        
        // Cash laden
        const cashResponse = await fetch('/api/cash');
        const cashData = await cashResponse.json();
        cashBalance = cashData.balance || 0;
    } catch (e) {
        console.error("Fehler beim Laden der Daten:", e);
    }
}

// Seitenwechsel zwischen Dashboard, Investments und Analyse
function showPage(pageId) {
    const pages = ['page-dashboard', 'page-investments', 'page-analysis'];
    pages.forEach(p => {
        const el = document.getElementById(p);
        if (el) el.style.display = (p === pageId) ? 'block' : 'none';
    });

    const navItems = document.querySelectorAll('.sidebar li');
    navItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('onclick') && item.getAttribute('onclick').includes(pageId)) {
            item.classList.add('active');
        }
    });

    if (pageId === 'page-dashboard') {
        renderPortfolio();
        loadPerformanceChart('max');
    } else if (pageId === 'page-analysis') {
        loadPerformanceHeatmap();
    } else if (pageId === 'page-investments') {
        renderPortfolio();
    }
}

// Portfolio-Liste mit Käufen pro Asset anzeigen
function renderPortfolio() {
    const list = document.getElementById('positions-list');
    const invTotalAll = document.getElementById('inv-total-all');
    const invTotalStocks = document.getElementById('inv-total-stocks');
    const invTotalCash = document.getElementById('inv-total-cash');

    if (!list) return;
    list.innerHTML = '';
    let investmentTotal = 0;

    // Gruppiere alle Käufe nach ISIN
    const grouped = portfolio.reduce((acc, item, index) => {
        if (!acc[item.isin]) {
            acc[item.isin] = { name: item.name, totalValue: 0, totalAmount: 0, buys: [] };
        }
        acc[item.isin].buys.push({ ...item, originalIndex: index, dbId: item.id });
        acc[item.isin].totalValue += item.totalCHF;
        acc[item.isin].totalAmount += item.amount;
        return acc;
    }, {});

    // Erstelle für jedes Asset eine ausklappbare Gruppe
    for (let isin in grouped) {
        const asset = grouped[isin];
        investmentTotal += asset.totalValue;

        const assetDiv = document.createElement('div');
        assetDiv.className = 'asset-group';
        assetDiv.innerHTML = `
            <div class="asset-header" onclick="this.nextElementSibling.classList.toggle('show')">
                <div class="asset-info">
                    <strong>${asset.name}</strong> <span class="arrow">▼</span>
                </div>
                <div class="asset-summary">
                    ${asset.totalAmount.toFixed(2)} Stk. | <strong>${asset.totalValue.toFixed(2)} CHF</strong>
                </div>
            </div>
            <div class="asset-details">
                <table class="details-table">
                    <thead>
                        <tr><th>Datum</th><th>Stk.</th><th>Preis</th><th>Total</th><th>Aktion</th></tr>
                    </thead>
                    <tbody>
                        ${asset.buys.map(buy => `
                            <tr>
                                <td>${buy.date ? new Date(buy.date).toLocaleDateString('de-CH') : '---'}</td>
                                <td>${buy.amount}</td>
                                <td>${buy.priceUSD} $</td>
                                <td>${buy.totalCHF.toFixed(2)} CHF</td>
                                <td class="actions">
                                    <span onclick="editSpecificBuy(${buy.dbId})" style="cursor:pointer; margin-right:10px;">✏️</span>
                                    <span onclick="deleteSpecificBuy(${buy.dbId})" style="cursor:pointer">🗑️</span>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        list.appendChild(assetDiv);
    }

    // Aktualisiere Summen-Anzeigen
    const cashVal = parseFloat(cashBalance) || 0;
    if (invTotalStocks) invTotalStocks.innerText = investmentTotal.toLocaleString('de-CH', { minimumFractionDigits: 2 });
    if (invTotalCash) invTotalCash.innerText = cashVal.toLocaleString('de-CH', { minimumFractionDigits: 2 });
    
    const grandTotal = investmentTotal + cashVal;
    if (invTotalAll) invTotalAll.innerText = grandTotal.toLocaleString('de-CH', { minimumFractionDigits: 2 });
    
    updateChart(investmentTotal, cashVal);
    
    if (currentPerformanceData) {
        displayPerformance();
    }
}

// Doughnut-Chart (Kuchendiagramm) mit Portfolio-Verteilung
function updateChart(investmentTotal, cash) {
    const canvas = document.getElementById('portfolioChart');
    if (!canvas) return; 
    const ctx = canvas.getContext('2d');
    const grandTotalLabel = (investmentTotal + cash).toLocaleString('de-CH') + ' CHF';

    if (myChart) { myChart.destroy(); }

    const chartData = portfolio.reduce((acc, item) => {
        const key = item.isin || item.name; 
        if (!acc[key]) acc[key] = { value: 0, label: item.name };
        acc[key].value += item.totalCHF;
        return acc;
    }, {});

    let names = Object.values(chartData).map(obj => obj.label);
    let values = Object.values(chartData).map(obj => obj.value);
    if (cash > 0) { names.push("Cash"); values.push(cash); }

    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: names,
            datasets: [{
                data: values,
                backgroundColor: ['#2196f3', '#4caf50', '#ff4081', '#ffc107', '#00bcd4'],
                borderWidth: 2
            }]
        },
        options: {
            cutout: '70%',
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } }
        },
        plugins: [{
            id: 'centerText',
            afterDraw: (chart) => {
                const { ctx, chartArea: { width, height, top, left } } = chart;
                ctx.save();
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.font = 'bold 16px sans-serif';
                ctx.fillText(grandTotalLabel, left + width/2, top + height/2);
                ctx.restore();
            }
        }]
    });
}

// Performance-Chart lädt historische Kurse und berechnet Portfolio-Wert über Zeit
async function loadPerformanceChart(period = 'max') {
    const canvas = document.getElementById('lineChart');
    if (!canvas) return;
    
    if (myLineChart) {
        myLineChart.destroy();
        myLineChart = null;
    }
    
    const ctx = canvas.getContext('2d');

    const tickers = [...new Set(portfolio.map(item => item.ticker))].filter(t => t);
    if (tickers.length === 0) return;

    try {
        const earliestPurchase = portfolio.reduce((earliest, item) => {
            const itemDate = new Date(item.date);
            return !earliest || itemDate < earliest ? itemDate : earliest;
        }, null);

        const allTickers = [...tickers, "USDCHF=X"]; 
        const allData = await Promise.all(allTickers.map(async (t) => {
            const response = await fetch(`/get_history?symbol=${t}&period=${period}`);
            const data = await response.json();
            return { ticker: t, history: data };
        }));

        const fxDataObj = allData.find(d => d.ticker === "USDCHF=X");
        if (!fxDataObj || !Array.isArray(fxDataObj.history)) return;
        const fxHistory = fxDataObj.history;

        let filteredFxHistory = fxHistory.filter(h => {
            const chartDate = new Date(h.full_date);
            return chartDate >= earliestPurchase;
        });

        filteredFxHistory = filteredFxHistory.filter(h => {
            if (h.full_date.includes(':')) {
                const time = h.full_date.split(' ')[1];
                const [hour, minute] = time.split(':').map(Number);
                const totalMinutes = hour * 60 + minute;
                return totalMinutes >= 540 && totalMinutes <= 1050;
            }
            return true;
        });

        const timeLabels = filteredFxHistory.map(h => h.date);
        const portfolioValues = [];
        const investedValues = [];
        
        let lastKnownPrices = {};
        let lastKnownFX = 0.88;

        timeLabels.forEach((dateLabel) => {
            let marketValueToday = 0;
            let investedValueThen = 0;

            const fxEntry = filteredFxHistory.find(h => h.date === dateLabel);
            if (fxEntry && fxEntry.price) lastKnownFX = fxEntry.price;
            
            if (!fxEntry || !fxEntry.full_date) {
                portfolioValues.push(null);
                investedValues.push(null);
                return;
            }
            
            const currentDateTime = new Date(fxEntry.full_date).getTime();

            portfolio.forEach(asset => {
                const assetDateTime = new Date(asset.date + " 00:00:00").getTime();
                
                if (assetDateTime <= currentDateTime) {
                    investedValueThen += asset.totalCHF;
                    
                    const tickerData = allData.find(d => d.ticker === asset.ticker);
                    if (tickerData && Array.isArray(tickerData.history)) {
                        const priceEntry = tickerData.history.find(h => h.date === dateLabel);
                        if (priceEntry && priceEntry.price) {
                            lastKnownPrices[asset.ticker] = priceEntry.price;
                        }
                        
                        const currentPriceUSD = lastKnownPrices[asset.ticker] || 0;
                        const currentPriceCHF = currentPriceUSD * lastKnownFX;
                        marketValueToday += asset.amount * currentPriceCHF;
                    }
                }
            });
            
            portfolioValues.push(marketValueToday);
            investedValues.push(investedValueThen);
        });

        myLineChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: timeLabels,
                datasets: [
                    {
                        label: 'Marktwert (CHF)',
                        data: portfolioValues,
                        borderColor: '#2E7D32',
                        backgroundColor: 'rgba(46, 125, 50, 0.1)',
                        fill: true,
                        tension: 0.3,
                        pointRadius: 0
                    },
                    {
                        label: 'Investiert (CHF)',
                        data: investedValues,
                        borderColor: '#000000',
                        borderDash: [5, 5],
                        fill: false,
                        tension: 0,
                        pointRadius: 0
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { 
                        beginAtZero: false,
                        ticks: { 
                            callback: (value) => value.toLocaleString('de-CH') + ' CHF' 
                        } 
                    }
                }
            }
        });
        
        const currentValue = portfolioValues[portfolioValues.length - 1] || 0;
        const totalInvested = investedValues[investedValues.length - 1] || 0;
        const profitCHF = currentValue - totalInvested;
        const profitPercent = totalInvested > 0 ? ((profitCHF / totalInvested) * 100).toFixed(2) : 0;
        
        const initialAvgFX = portfolio.reduce((sum, p) => sum + p.rate, 0) / portfolio.length;
        const fxChange = ((lastKnownFX - initialAvgFX) / initialAvgFX * 100).toFixed(2);
        
        currentPerformanceData = {
            currentValue,
            invested: totalInvested,
            profitCHF,
            profitPercent,
            fxEffect: fxChange
        };
        
        displayPerformance();

    } catch (e) { 
        console.error("Fehler beim Laden der Chart-Daten:", e); 
    }
}

// Performance-Box anzeigen
function displayPerformance() {
    const perfBox = document.getElementById('performance-display');
    if (!perfBox || !currentPerformanceData) return;
    
    const perf = currentPerformanceData;
    const color = perf.profitCHF >= 0 ? '#4caf50' : '#f44336';
    const trendIcon = perf.profitCHF >= 0 ? '▲' : '▼';
    
    const stockGainPercent = parseFloat(perf.profitPercent) - parseFloat(perf.fxEffect);
    const stockGainCHF = (perf.invested * stockGainPercent / 100);
    const fxGainCHF = (perf.invested * parseFloat(perf.fxEffect) / 100);
    
    perfBox.innerHTML = `
        <div style="padding: 15px;">
            <h3 style="margin: 0 0 15px 0; font-size: 16px; color: #666;">Performance Übersicht</h3>
            
            <div style="text-align: right; margin-bottom: 20px;">
                <div style="font-size: 32px; font-weight: bold; color: ${color};">
                    ${perf.profitPercent >= 0 ? '+' : ''}${perf.profitPercent}% ${trendIcon}
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                <div>
                    <small style="color: #888; font-size: 12px; display: block; margin-bottom: 5px;">Holdings</small>
                    <div style="font-size: 18px; font-weight: bold; color: #333;">
                        ${(perf.currentValue - cashBalance).toLocaleString('de-CH', {minimumFractionDigits: 2})} CHF
                    </div>
                </div>
                
                <div>
                    <small style="color: #888; font-size: 12px; display: block; margin-bottom: 5px;">Cash</small>
                    <div style="font-size: 18px; font-weight: bold; color: #333;">
                        ${cashBalance.toLocaleString('de-CH', {minimumFractionDigits: 2})} CHF
                    </div>
                </div>
                
                <div>
                    <small style="color: #888; font-size: 12px; display: block; margin-bottom: 5px;">Kursgewinn</small>
                    <div style="font-size: 16px; font-weight: bold; color: ${stockGainCHF >= 0 ? '#4caf50' : '#f44336'};">
                        ${stockGainCHF >= 0 ? '+' : ''}${stockGainCHF.toLocaleString('de-CH', {minimumFractionDigits: 2})} CHF
                    </div>
                    <div style="font-size: 14px; color: ${stockGainCHF >= 0 ? '#4caf50' : '#f44336'};">
                        (${stockGainPercent >= 0 ? '+' : ''}${stockGainPercent.toFixed(2)}%)
                    </div>
                </div>
                
                <div>
                    <small style="color: #888; font-size: 12px; display: block; margin-bottom: 5px;">💱 Währungseffekt</small>
                    <div style="font-size: 16px; font-weight: bold; color: ${fxGainCHF >= 0 ? '#4caf50' : '#f44336'};">
                        ${fxGainCHF >= 0 ? '+' : ''}${fxGainCHF.toLocaleString('de-CH', {minimumFractionDigits: 2})} CHF
                    </div>
                    <div style="font-size: 14px; color: ${fxGainCHF >= 0 ? '#4caf50' : '#f44336'};">
                        (${perf.fxEffect >= 0 ? '+' : ''}${perf.fxEffect}%)
                    </div>
                </div>
            </div>
            
            <div style="padding-top: 15px; border-top: 2px solid #eee;">
                <small style="color: #888; font-size: 12px; display: block; margin-bottom: 5px;">Total Gain</small>
                <div style="font-size: 22px; font-weight: bold; color: ${color};">
                    ${perf.profitCHF >= 0 ? '+' : ''}${perf.profitCHF.toLocaleString('de-CH', {minimumFractionDigits: 2})} CHF
                </div>
            </div>
        </div>
    `;
}

// Heatmap für Monatsrenditen laden
async function loadPerformanceHeatmap() {
    const container = document.getElementById('heatmap-container');
    if (!container) return;
    
    container.innerHTML = '<p style="text-align:center; color: #999; padding: 40px;">Lade Daten...</p>';
    
    const tickers = [...new Set(portfolio.map(item => item.ticker))].filter(t => t);
    if (tickers.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding: 40px;">Keine Daten verfügbar</p>';
        return;
    }
    
    try {
        const allTickers = [...tickers, "USDCHF=X"];
        const allData = await Promise.all(allTickers.map(async (t) => {
            const response = await fetch(`/get_history?symbol=${t}&period=2y`);
            const data = await response.json();
            return { ticker: t, history: data };
        }));
        
        const fxDataObj = allData.find(d => d.ticker === "USDCHF=X");
        if (!fxDataObj) return;
        
        const dailyValues = {};
        
        fxDataObj.history.forEach(fxEntry => {
            const date = new Date(fxEntry.full_date);
            const dateKey = fxEntry.date;
            
            let portfolioValue = 0;
            const currentDateTime = date.getTime();
            
            portfolio.forEach(asset => {
                const assetDateTime = new Date(asset.date + " 00:00:00").getTime();
                if (assetDateTime <= currentDateTime) {
                    const tickerData = allData.find(d => d.ticker === asset.ticker);
                    if (tickerData) {
                        const priceEntry = tickerData.history.find(h => h.date === dateKey);
                        if (priceEntry) {
                            const currentPriceCHF = priceEntry.price * fxEntry.price;
                            portfolioValue += asset.amount * currentPriceCHF;
                        }
                    }
                }
            });
            
            if (portfolioValue > 0) {
                dailyValues[dateKey] = { date, value: portfolioValue };
            }
        });
        
        const monthlyReturns = {};
        const sortedDates = Object.keys(dailyValues).sort();
        
        sortedDates.forEach((dateKey) => {
            const date = dailyValues[dateKey].date;
            const year = date.getFullYear();
            const month = date.getMonth();
            const key = `${year}-${month}`;
            
            if (!monthlyReturns[key]) {
                monthlyReturns[key] = {
                    year,
                    month,
                    startValue: dailyValues[dateKey].value,
                    endValue: dailyValues[dateKey].value,
                    days: 1
                };
            } else {
                monthlyReturns[key].endValue = dailyValues[dateKey].value;
                monthlyReturns[key].days++;
            }
        });
        
        const returns = Object.values(monthlyReturns)
            .filter(m => m.days > 5)
            .map(m => {
                const returnPercent = m.startValue > 0 ? 
                    ((m.endValue - m.startValue) / m.startValue * 100) : 0;
                return {
                    year: m.year,
                    month: m.month,
                    return: returnPercent
                };
            });
        
        displayHeatmap(returns);
        
    } catch (e) {
        console.error("Fehler beim Laden der Heatmap:", e);
        container.innerHTML = '<p style="color: #f44336; text-align: center; padding: 40px;">Fehler beim Laden der Daten</p>';
    }
}

// Heatmap anzeigen
function displayHeatmap(returns) {
    const container = document.getElementById('heatmap-container');
    if (!container) return;
    
    const years = [...new Set(returns.map(r => r.year))].sort((a, b) => b - a);
    const months = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
    
    const allReturns = returns.map(r => r.return);
    const maxReturn = Math.max(...allReturns);
    const minReturn = Math.min(...allReturns);
    
    let html = `
        <div class="card" style="overflow-x: auto;">
            <h2 style="margin-bottom: 20px;">🔥 Monatsrenditen Heatmap</h2>
            <table class="heatmap-table">
                <thead>
                    <tr>
                        <th style="text-align: left; padding: 12px; background: #f5f7fa; font-weight: 600;">Jahr</th>
                        ${months.map(m => `<th style="padding: 12px; background: #f5f7fa; text-align: center; font-weight: 600;">${m}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
    `;
    
    years.forEach(year => {
        html += `<tr>`;
        html += `<td style="padding: 12px; font-weight: bold; background: #f5f7fa;">${year}</td>`;
        
        for (let month = 0; month < 12; month++) {
            const monthData = returns.find(r => r.year === year && r.month === month);
            
            if (monthData) {
                const returnVal = monthData.return;
                
                let bgColor;
                if (returnVal > 0) {
                    const intensity = Math.min(returnVal / (maxReturn || 1), 1);
                    const green = Math.floor(200 + (intensity * 55));
                    const red = Math.floor(200 - (intensity * 120));
                    bgColor = `rgb(${red}, ${green}, ${red})`;
                } else if (returnVal < 0) {
                    const intensity = Math.min(Math.abs(returnVal) / (Math.abs(minReturn) || 1), 1);
                    const red = Math.floor(200 + (intensity * 55));
                    const green = Math.floor(200 - (intensity * 120));
                    bgColor = `rgb(${red}, ${green}, ${green})`;
                } else {
                    bgColor = '#f0f0f0';
                }
                
                const textColor = Math.abs(returnVal) > 3 ? '#333' : '#666';
                
                html += `
                    <td style="
                        padding: 16px 8px;
                        text-align: center;
                        background: ${bgColor};
                        color: ${textColor};
                        font-weight: bold;
                        border: 1px solid white;
                        font-size: 13px;
                    ">
                        ${returnVal >= 0 ? '+' : ''}${returnVal.toFixed(1)}%
                    </td>
                `;
            } else {
                html += `<td style="padding: 16px 8px; text-align: center; background: #fafafa; color: #ccc;">—</td>`;
            }
        }
        
        html += `</tr>`;
    });
    
    html += `
                </tbody>
            </table>
            
            <div style="margin-top: 30px; padding: 20px; background: #f5f7fa; border-radius: 8px;">
                <h4 style="margin-bottom: 10px; color: #333;">Legende:</h4>
                <div style="display: flex; align-items: center; gap: 20px; flex-wrap: wrap;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <div style="width: 30px; height: 20px; background: #c8e6c9; border: 1px solid #ccc;"></div>
                        <span style="font-size: 13px;">Positive Rendite</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <div style="width: 30px; height: 20px; background: #ffcdd2; border: 1px solid #ccc;"></div>
                        <span style="font-size: 13px;">Negative Rendite</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <div style="width: 30px; height: 20px; background: #fafafa; border: 1px solid #ccc;"></div>
                        <span style="font-size: 13px;">Keine Daten</span>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

// Zeitfilter für Performance-Chart
function updateTimeFilter(type) {
    let period;
    switch(type) {
        case 1:      period = '1d';  break;
        case 7:      period = '5d';  break;
        case 30:     period = '1mo'; break;
        case 'ytd':  period = 'ytd'; break;
        case 365:    period = '1y';  break;
        case 'all':  period = 'max'; break;
        default:     period = 'max';
    }

    if (window.event && window.event.target) {
        const btns = window.event.target.parentElement.querySelectorAll('button');
        btns.forEach(b => b.classList.remove('active'));
        window.event.target.classList.add('active');
    }

    loadPerformanceChart(period);
}

// Modal-Fenster für Transaktionen öffnen/schliessen
function toggleModal(show) { 
    const m = document.getElementById('transaction-modal');
    if (m) m.style.display = show ? 'block' : 'none'; 
}

// Cash-Bestand manuell bearbeiten
async function editCash() {
    const n = prompt("Cashbestand:", cashBalance);
    if(n !== null) { 
        cashBalance = parseFloat(n) || 0;
        
        // An Server senden
        try {
            await fetch('/api/cash', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ balance: cashBalance })
            });
            renderPortfolio();
        } catch (e) {
            console.error("Fehler beim Speichern:", e);
            alert("Fehler beim Speichern!");
        }
    }
}

// Einzelnen Kauf aus Portfolio löschen
async function deleteSpecificBuy(dbId) { 
    if(confirm("Löschen?")) {
        try {
            await fetch(`/api/portfolio/${dbId}`, {
                method: 'DELETE'
            });
            
            // Daten neu laden
            await loadDataFromServer();
            renderPortfolio();
        } catch (e) {
            console.error("Fehler beim Löschen:", e);
            alert("Fehler beim Löschen!");
        }
    }
}

// Neue Transaktion zum Portfolio hinzufügen
async function calculate() {
    const name = document.getElementById('asset-name').value;
    const isin = document.getElementById('isin').value.toUpperCase();
    const amount = parseFloat(document.getElementById('amount').value);
    const price = parseFloat(document.getElementById('price').value);
    const rate = parseFloat(document.getElementById('exchange-rate').value);
    const date = document.getElementById('purchase-date').value;

    if (name && isin && !isNaN(amount)) {
        const investment = {
            name, 
            isin, 
            amount, 
            priceUSD: price, 
            rate, 
            date,
            totalCHF: (amount * price * rate),
            ticker: tickerMapping[isin] || ""
        };
        
        try {
            await fetch('/api/portfolio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(investment)
            });
            
            // Daten neu laden
            await loadDataFromServer();
            renderPortfolio();
            toggleModal(false);
        } catch (e) {
            console.error("Fehler beim Speichern:", e);
            alert("Fehler beim Speichern!");
        }
    }
}

// Bestehenden Kauf bearbeiten
async function editSpecificBuy(dbId) {
    const item = portfolio.find(p => p.id === dbId);
    if (!item) return;
    
    const newDate = prompt("Neues Datum (YYYY-MM-DD):", item.date || "");
    if (newDate === null) return;
    const newAmount = prompt("Neue Anzahl Stück:", item.amount);
    if (newAmount === null) return;
    const newPriceUSD = prompt("Neuer Preis (USD):", item.priceUSD);
    const newRate = prompt("Wechselkurs:", item.rate);

    const updatedItem = {
        ...item,
        date: newDate,
        amount: parseFloat(newAmount) || 0,
        priceUSD: parseFloat(newPriceUSD) || 0,
        rate: parseFloat(newRate) || 1
    };
    updatedItem.totalCHF = updatedItem.amount * updatedItem.priceUSD * updatedItem.rate;

    try {
        await fetch(`/api/portfolio/${dbId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedItem)
        });
        
        // Daten neu laden
        await loadDataFromServer();
        renderPortfolio();
        loadPerformanceChart('max');
    } catch (e) {
        console.error("Fehler beim Aktualisieren:", e);
        alert("Fehler beim Aktualisieren!");
    }
}
// Mobile Menu Toggle
function toggleMobileMenu() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('mobile-open');
    }
}

// Sidebar schließen wenn man auf einen Link klickt (Mobile)
document.querySelectorAll('.sidebar li').forEach(item => {
    item.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
            const sidebar = document.getElementById('sidebar');
            if (sidebar) {
                sidebar.classList.remove('mobile-open');
            }
        }
    });
});

// Sidebar schließen wenn man außerhalb klickt (Mobile)
document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768) {
        const sidebar = document.getElementById('sidebar');
        const menuToggle = document.querySelector('.menu-toggle');
        
        if (sidebar && !sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
            sidebar.classList.remove('mobile-open');
        }
    }
});
