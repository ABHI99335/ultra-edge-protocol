import yfinance as yf
import json
from datetime import datetime

tickers = {
    "SPY": "S&P 500",
    "QQQ": "Nasdaq 100",
    "BTC-USD": "Bitcoin",
    "GLD": "Gold",
    "DX-Y.NYB": "Dollar Index",
    "CL=F": "Crude Oil"
}

results = {}
for symbol, name in tickers.items():
    try:
        ticker = yf.Ticker(symbol)
        hist = ticker.history(period="1y")
        current = hist['Close'].iloc[-1]
        prev = hist['Close'].iloc[-2]
        change_pct = ((current - prev) / prev) * 100
        sma200 = hist['Close'].rolling(window=200).mean().iloc[-1]
        
        results[symbol] = {
            "name": name,
            "price": round(current, 2),
            "change_pct": round(change_pct, 2),
            "above_sma200": bool(current > sma200)
        }
    except Exception as e:
        results[symbol] = {"name": name, "error": str(e)}

with open("radar.json", "w") as f:
    json.dump(results, f, indent=2)

print("radar.json generated successfully.")
