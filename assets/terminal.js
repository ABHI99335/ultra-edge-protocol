
    // Terminal v2 Engine
    const state = {
        logCount: 0,
        macroAssets: [
            { id: 'us500', sym: 'US500', name: 'S&P 500 INDEX', yf: 'ES=F' },
            { id: 'nas100', sym: 'NAS100', name: 'NASDAQ 100', yf: 'NQ=F' },
            { id: 'dxy', sym: 'DXY', name: 'US DOLLAR INDEX', yf: 'DX-Y.NYB' },
            { id: 'wti', sym: 'WTI', name: 'CRUDE OIL', yf: 'CL=F' },
            { id: 'xau', sym: 'XAU', name: 'GOLD FUTURES', yf: 'GC=F' },
            { id: 'eur', sym: 'EURUSD', name: 'EURO / DOLLAR', fx: 'EUR' },
            { id: 'gbp', sym: 'GBPUSD', name: 'STERLING / DOLLAR', fx: 'GBP' },
            { id: 'jpy', sym: 'USDJPY', name: 'DOLLAR / YEN', fx: 'JPY' },
            { id: 'chf', sym: 'USDCHF', name: 'DOLLAR / FRANC', fx: 'CHF' }
        ],
        cryptoAssets: [
            { id: 'btc', sym: 'BTCUSD', name: 'BITCOIN', pair: 'BTCUSDT' },
            { id: 'eth', sym: 'ETHUSD', name: 'ETHEREUM', pair: 'ETHUSDT' },
            { id: 'sol', sym: 'SOLUSD', name: 'SOLANA', pair: 'SOLUSDT' }
        ]
    };

    // Clock
    setInterval(() => {
        const now = new Date();
        document.getElementById('utc-time').innerText = now.toISOString().split('T')[1].split('.')[0];
        document.getElementById('local-time').innerText = now.toLocaleTimeString('en-GB');
    }, 1000);

    // Logging function
    function log(msg, type = 'info') {
        const box = document.getElementById('sys-log');
        const now = new Date();
        const timeStr = now.toISOString().split('T')[1].split('.')[0] + 'Z';
        
        let colorClass = 'log-info';
        if (type === 'ok') colorClass = 'log-ok';
        if (type === 'err') colorClass = 'log-err';

        const row = document.createElement('div');
        row.className = 'log-row';
        row.innerHTML = `<span class="log-time">${timeStr}</span><span class="${colorClass}">${msg}</span>`;
        
        box.appendChild(row);
        box.scrollTop = box.scrollHeight;
        
        state.logCount++;
        document.getElementById('log-count').innerText = `${state.logCount} EVENTS`;
    }

    // Sparkline Generator
    function getSparklinePath(data, width = 80, height = 20) {
        if (!data || data.length === 0) return '';
        const min = Math.min(...data);
        const max = Math.max(...data);
        const range = max - min || 1;
        
        return data.map((val, i) => {
            const x = (i / (data.length - 1)) * width;
            const y = height - ((val - min) / range) * height;
            return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
        }).join(' ');
    }

    // Fetch Binance (Crypto)
    async function fetchCrypto() {
        const start = Date.now();
        try {
            const pairs = state.cryptoAssets.map(a => `"${a.pair}"`).join(',');
            const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbols=[${pairs}]`);
            const data = await res.json();
            
            let tbody = '';
            for (let asset of state.cryptoAssets) {
                const d = data.find(x => x.symbol === asset.pair);
                if (!d) continue;
                
                // Fetch klines for sparkline
                const klRes = await fetch(`https://api.binance.com/api/v3/klines?symbol=${asset.pair}&interval=1h&limit=24`);
                const klData = await klRes.json();
                const closes = klData.map(k => parseFloat(k[4]));
                
                const price = parseFloat(d.lastPrice);
                const chg24 = parseFloat(d.priceChangePercent);
                const high = parseFloat(d.highPrice);
                const low = parseFloat(d.lowPrice);
                const open = parseFloat(d.openPrice);
                
                // 1H approx (derived from last 1h kline)
                const chg1h = ((price - closes[closes.length-2]) / closes[closes.length-2]) * 100;
                
                const trendClass = price > open ? 'trend-up' : 'trend-down';
                const trendText = price > open ? 'TREND UP' : 'TREND DN';
                const sparkClass = price > open ? 'sparkline-path' : 'sparkline-path down';
                const path = getSparklinePath(closes);
                
                tbody += `
                <tr>
                    <td><div class="asset-cell"><span class="asset-sym">${asset.sym}</span><span class="asset-name">${asset.name}</span></div></td>
                    <td class="text-amber">${price.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                    <td class="${chg1h >= 0 ? 'text-up' : 'text-down'}">${chg1h >= 0 ? '+' : ''}${chg1h.toFixed(2)}%</td>
                    <td class="${chg24 >= 0 ? 'text-up' : 'text-down'}">${chg24 >= 0 ? '+' : ''}${chg24.toFixed(2)}%</td>
                    <td>
                        <div style="display:flex; align-items:center; gap:8px;">
                            <svg class="sparkline-container"><path class="${sparkClass}" d="${path}"></path></svg>
                            <span class="text-dim" style="font-size:10px;">${low.toFixed(0)} - ${high.toFixed(0)}</span>
                        </div>
                    </td>
                    <td><span class="badge ${trendClass}">${trendText}</span></td>
                    <td><span class="badge badge-live">LIVE</span></td>
                </tr>`;
            }
            document.getElementById('crypto-body').innerHTML = tbody;
            document.getElementById('crypto-time').innerText = new Date().toISOString().split('T')[1].split('.')[0] + 'Z';
            document.getElementById('crypto-status').innerText = "3/3 OK";
            document.getElementById('crypto-status').className = "text-up";
            log("CRYPTO feed OK (real-time spot)", "ok");
            
        } catch (e) {
            log("CRYPTO feed unavailable (network)", "err");
            document.getElementById('crypto-status').innerText = "0/3 ERR";
            document.getElementById('crypto-status').className = "text-down";
        }
        document.getElementById('latency').innerText = `${Date.now() - start} MS`;
    }

    // Fetch FX & Yahoo (Macro)
    async function fetchMacro() {
        let tbody = '';
        let successCount = 0;
        
        // 1. Frankfurter for FX
        try {
            const fxRes = await fetch('https://api.frankfurter.app/latest?from=USD');
            const fxData = await fxRes.json();
            
            for (let asset of state.macroAssets.filter(a => a.fx)) {
                const rate = fxData.rates[asset.fx];
                if (!rate) continue;
                
                const price = 1 / rate;
                tbody += renderMacroRow(asset, price, 0, 'FX', true);
                successCount++;
            }
            log("FX feed OK (Frankfurter reference)", "ok");
        } catch (e) {
            log("FX feed unavailable (CORS/network)", "err");
            for (let asset of state.macroAssets.filter(a => a.fx)) {
                tbody += renderMacroErrorRow(asset, 'DELAY');
            }
        }

        // 2. Yahoo Finance via Codetabs Proxy
        const proxy = 'https://api.codetabs.com/v1/proxy?quest=';
        for (let asset of state.macroAssets.filter(a => a.yf)) {
            try {
                const res = await fetch(proxy + encodeURIComponent(`https://query1.finance.yahoo.com/v8/finance/chart/${asset.yf}`));
                const data = await res.json();
                if (data && data.chart && data.chart.result) {
                    const meta = data.chart.result[0].meta;
                    const price = meta.regularMarketPrice;
                    const prev = meta.chartPreviousClose || meta.previousClose;
                    const chg = ((price - prev) / prev) * 100;
                    tbody += renderMacroRow(asset, price, chg, 'YF', false);
                    successCount++;
                } else throw new Error();
            } catch (e) {
                tbody += renderMacroErrorRow(asset, 'N/A');
                log(`MACRO feed failed: ${asset.sym}`, "err");
            }
        }
        
        log(`MACRO feed OK (${successCount}/9) via proxy`, "ok");
        document.getElementById('macro-body').innerHTML = tbody;
        document.getElementById('macro-time').innerText = new Date().toISOString().split('T')[1].split('.')[0] + 'Z';
        document.getElementById('last-update').innerText = new Date().toISOString().split('T')[1].split('.')[0] + 'Z';
    }

    function renderMacroRow(asset, price, chg, src, isFx) {
        const isUp = chg >= 0;
        const trendText = isUp ? 'TREND UP' : 'TREND DN';
        const trendClass = isUp ? 'trend-up' : 'trend-down';
        const chgDisplay = isFx ? '--' : `${isUp ? '+' : ''}${chg.toFixed(2)}%`;
        const chgClass = isFx ? 'text-dim' : (isUp ? 'text-up' : 'text-down');
        
        return `
        <tr>
            <td><div class="asset-cell"><span class="asset-sym">${asset.sym}</span><span class="asset-name">${asset.name}</span></div></td>
            <td class="text-amber">${price.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 4})}</td>
            <td class="${chgClass}">${chgDisplay}</td>
            <td>${isFx ? '<span class="text-dim">--</span>' : `<span class="badge ${trendClass}">${trendText}</span>`}</td>
            <td><span class="badge badge-delay">${src}</span></td>
        </tr>`;
    }

    function renderMacroErrorRow(asset, src) {
        return `
        <tr>
            <td><div class="asset-cell"><span class="asset-sym">${asset.sym}</span><span class="asset-name">${asset.name}</span></div></td>
            <td class="text-dim">N/A</td>
            <td class="text-dim">--</td>
            <td><span class="badge trend-down">--</span></td>
            <td><span class="badge badge-na">${src}</span></td>
        </tr>`;
    }

    // Fetch News Sentiment
    async function fetchNews() {
        try {
            // Fetch a public finance RSS via a CORS proxy
            const proxy = 'https://api.allorigins.win/raw?url=';
            const rssUrl = encodeURIComponent('https://feeds.a.dj.com/rss/RSSMarketsMain.xml');
            const res = await fetch(proxy + rssUrl);
            const text = await res.text();
            
            // Parse XML
            const parser = new DOMParser();
            const xml = parser.parseFromString(text, "text/xml");
            const items = xml.querySelectorAll("item");
            
            let html = '';
            let bullCount = 0;
            let bearCount = 0;
            
            // Simple lexicon
            const bulls = ['up', 'gain', 'rise', 'surge', 'beat', 'strong', 'rally', 'growth', 'record'];
            const bears = ['down', 'drop', 'fall', 'miss', 'weak', 'plunge', 'loss', 'crash', 'fear'];
            
            // Take top 5 items
            for (let i = 0; i < Math.min(5, items.length); i++) {
                const title = items[i].querySelector("title").textContent;
                const lower = title.toLowerCase();
                
                let score = 0;
                bulls.forEach(w => { if(lower.includes(w)) score++; });
                bears.forEach(w => { if(lower.includes(w)) score--; });
                
                let badgeClass = 'score-neut';
                let badgeText = 'NEUT';
                if (score > 0) { badgeClass = 'score-bull'; badgeText = 'BULL'; bullCount++; }
                if (score < 0) { badgeClass = 'score-bear'; badgeText = 'BEAR'; bearCount++; }
                
                html += `
                <div class="news-item">
                    <div style="margin-bottom: 4px;">
                        <span class="news-score ${badgeClass}">${badgeText}</span>
                        <span class="text-dim" style="font-size:10px;">WSJ Markets</span>
                    </div>
                    <div class="news-title">${title}</div>
                </div>`;
            }
            
            if (html === '') html = '<div class="text-dim">No headlines available.</div>';
            
            document.getElementById('news-feed').innerHTML = html;
            document.getElementById('news-meta').innerText = `AGG +${bullCount - bearCount} · ${items.length} ITEMS`;
            document.getElementById('news-meta').className = "panel-meta text-amber";
            log("NEWS feed OK (RSS parsed)", "ok");
            
        } catch (e) {
            document.getElementById('news-feed').innerHTML = '<div class="text-down">News feeds unavailable (CORS/network). Open in a browser with internet, or add a proxy.</div>';
            document.getElementById('news-meta').innerText = "NO FEED";
            log("NEWS unavailable - no headlines returned", "err");
        }
    }

    // Boot Sequence
    document.addEventListener("DOMContentLoaded", () => {
        log("ULTRA EDGE TERMINAL v2 · booting", "info");
        log("Universe: global, USD-denominated (no INR)", "info");
        log("Sources: Binance · Frankfurter · Yahoo(proxy) · RSS", "info");
        
        fetchCrypto();
        fetchMacro();
        fetchNews();
        
        // Refresh loop
        setInterval(() => {
            log("Refreshing all feeds...", "info");
            fetchCrypto();
            fetchMacro();
        }, 15000); // 15 seconds
    });
    