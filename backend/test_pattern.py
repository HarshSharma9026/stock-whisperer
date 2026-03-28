import requests
import yfinance as yf

df = yf.download("RELIANCE.NS", period="3mo", interval="1d", progress=False)
df.columns = df.columns.get_level_values(0)
df = df.dropna()

candles = [
    {
        "time": str(idx)[:10],
        "open": round(float(row["Open"]), 2),
        "high": round(float(row["High"]), 2),
        "low": round(float(row["Low"]), 2),
        "close": round(float(row["Close"]), 2),
        "volume": int(row["Volume"]),
    }
    for idx, row in df.iterrows()
]

response = requests.post(
    "http://localhost:8001/api/pattern",
    json={"ticker": "RELIANCE", "candles": candles}
)

print("Status code:", response.status_code)
print("Raw response:", response.text[:500])