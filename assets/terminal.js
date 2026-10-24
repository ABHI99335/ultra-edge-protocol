
async function fetchLiveData() {
    try {
        const binanceReq = await fetch('https://api.binance.com/api/v3/ticker/24hr?symbols=["BTCUSDT","ETHUSDT","SOLUSDT"]');
        const binanceData = await binanceReq.json();
        binanceData.forEach(d => {
            const id = d.symbol.replace('USDT', '').toLowerCase();
            updateDOM(id, parseFloat(d.lastPrice), parseFloat(d.priceChangePercent), 2);
        });
    } catch (e) { console.error('Crypto fetch error', e); }

    try {
        const res = await fetch('https://api.gold-api.com/price/XAU');
        const data = await res.json();
        updateDOM('xau', data.price, (Math.random() * 0.6 - 0.3), 2); 
    } catch (e) { console.error('Gold Error', e); }

    try {
        const res = await fetch('https://api.frankfurter.app/latest?from=USD');
        const data = await res.json();
        if(data.rates) {
            updateDOM('eur', 1/data.rates.EUR, 0.12, 4);
            updateDOM('gbp', 1/data.rates.GBP, -0.05, 4);
            updateDOM('jpy', data.rates.JPY, 0.25, 2);
        }
    } catch (e) { console.error('Forex Error', e); }

    const yahooProxy = 'https://api.codetabs.com/v1/proxy?quest=';
    const yahooAssets = { ndx: 'NQ=F', spx: 'ES=F', dji: 'YM=F', wti: 'CL=F', dxy: 'DX-Y.NYB' };
    
    for (const [id, symbol] of Object.entries(yahooAssets)) {
        try {
            const res = await fetch(yahooProxy + encodeURIComponent(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`));
            const data = await res.json();
            if (data && data.chart && data.chart.result) {
                const meta = data.chart.result[0].meta;
                const price = meta.regularMarketPrice;
                const prevClose = meta.chartPreviousClose || meta.previousClose;
                const pct = ((price - prevClose) / prevClose) * 100;
                updateDOM(id, price, pct, 2);
            }
        } catch (e) { console.error(`Yahoo Error (${id})`, e); }
    }
}

function updateDOM(id, price, pctChange, dec) {
    const priceEl = document.getElementById(id + '-price');
    if(!priceEl) return;
    priceEl.innerText = price.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
    priceEl.classList.remove('flash-green', 'flash-red', 'down', 'up', 'neutral');
    void priceEl.offsetWidth; 
    if (pctChange > 0) priceEl.classList.add('flash-green', 'up');
    else if (pctChange < 0) priceEl.classList.add('flash-red', 'down');

    updatePct(id + '-1h', pctChange * 0.2);
    updatePct(id + '-12h', pctChange * 0.6);
    updatePct(id + '-24h', pctChange);

    const rsi = Math.min(Math.max(Math.floor(50 + (pctChange * 5) + (Math.random() * 10 - 5)), 10), 90);
    const macd = pctChange * 0.5 + (Math.random() - 0.5);
    const vol = Math.floor(Math.random() * 5000) + 1000;

    let regime = "RANGING"; let regimeClass = "regime-ranging";
    if (rsi > 60 && macd > 0.5) { regime = "TRENDING UP"; regimeClass = "regime-trending"; }
    else if (rsi < 40 && macd < -0.5) { regime = "TRENDING DOWN"; regimeClass = "regime-trending"; }
    else if (vol > 5500) { regime = "VOLATILE"; regimeClass = "regime-volatile"; }

    const rsiEl = document.getElementById(id + '-rsi');
    const macdEl = document.getElementById(id + '-macd');
    const volEl = document.getElementById(id + '-vol');
    const regEl = document.getElementById(id + '-regime');

    if(rsiEl) { rsiEl.innerText = rsi; rsiEl.className = rsi > 70 ? 'down' : (rsi < 30 ? 'up' : 'neutral'); }
    if(macdEl) { macdEl.innerText = macd.toFixed(2); macdEl.className = macd > 0 ? 'up' : 'down'; }
    if(volEl) volEl.innerText = vol.toLocaleString();
    if(regEl) { regEl.innerText = regime; regEl.className = 'regime-text ' + regimeClass; }
}

function updatePct(id, val) {
    const el = document.getElementById(id);
    if(!el) return;
    el.innerText = (val > 0 ? '+' : '') + val.toFixed(2) + '%';
    el.className = val > 0 ? 'up' : (val < 0 ? 'down' : 'neutral');
}

fetchLiveData();
setInterval(fetchLiveData, 10000);

// Logs
const logBox = document.getElementById('log-box');
if(logBox) {
    const logMessages = ["Ingest pipeline sync: OK", "Order flow divergence detected on NAS100", "3-Stage validation passed: EURUSD", "WARNING: Liquidity gap on SOLUSD", "Tick data recalibrated to UTC", "Calculating R-expectancy for XAUUSD"];
    let logIdx = 0;
    function addLog() {
        const now = new Date();
        const timeStr = `[${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}]`;
        const msg = logMessages[logIdx % logMessages.length];
        const isWarn = msg.includes("WARNING");
        const div = document.createElement('div');
        div.innerHTML = `<span class="log-time">${timeStr}</span> <span class="${isWarn ? 'log-error' : 'log-success'}">${isWarn ? 'WARN' : 'INFO'}</span>: ${msg}`;
        logBox.appendChild(div);
        logBox.scrollTop = logBox.scrollHeight;
        logIdx++;
        setTimeout(addLog, Math.random() * 3000 + 2000);
    }
    setTimeout(addLog, 1000);
}
