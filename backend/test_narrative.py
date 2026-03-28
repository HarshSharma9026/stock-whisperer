import requests

payload = {
    "ticker": "RELIANCE",
    "pattern": {
        "type": "Double Bottom",
        "confidence": 62,
        "direction": "bullish"
    },
    "backtest": {
        "success_rate": 67,
        "avg_return": 8.1,
        "avg_duration_days": 35
    },
    "confluence_score": 53,
    "scores": {
        "pattern": 18,
        "volume": 0,
        "rsi": 15,
        "macd": 8,
        "news": 7,
        "promoter": 5
    },
    "news_sentiment": "Positive",
    "news_summary": "Reliance posts record profit, beats estimates",
    "promoter_action": "No recent activity",
    "language": "en"
}

response = requests.post(
    "http://localhost:8001/api/narrative",
    json=payload
)

data = response.json()
print("Narrative:")
print(data["narrative"])

# Test Hindi
payload["language"] = "hi"
response = requests.post("http://localhost:8001/api/narrative", json=payload)
print("\nHindi Narrative:")
print(response.json()["narrative"])

# Test Hinglish
payload["language"] = "hinglish"
response = requests.post("http://localhost:8001/api/narrative", json=payload)
print("\nHinglish Narrative:")
print(response.json()["narrative"])