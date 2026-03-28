import requests

# First question
r1 = requests.post("http://localhost:8001/api/gemini-chat", json={
    "ticker": "RELIANCE",
    "language": "en",
    "message": "Is this a good setup for a 2-week trade?",
    "history": [],
    "context": {
        "pattern": "Double Bottom",
        "confluence_score": 53,
        "news_sentiment": "Positive"
    }
})
reply1 = r1.json()["reply"]
print("Q1:", "Is this a good setup for a 2-week trade?")
print("A1:", reply1)

# Follow-up question with history
r2 = requests.post("http://localhost:8001/api/gemini-chat", json={
    "ticker": "RELIANCE",
    "language": "en",
    "message": "What should I watch as a stop loss level?",
    "history": [
        {"role": "user", "content": "Is this a good setup for a 2-week trade?"},
        {"role": "assistant", "content": reply1}
    ],
    "context": {
        "pattern": "Double Bottom",
        "confluence_score": 53
    }
})
print("\nQ2:", "What should I watch as a stop loss level?")
print("A2:", r2.json()["reply"])

# Hindi question
r3 = requests.post("http://localhost:8001/api/gemini-chat", json={
    "ticker": "RELIANCE",
    "language": "hi",
    "message": "क्या यह खरीदने का सही समय है?",
    "history": [],
    "context": {"pattern": "Double Bottom", "confluence_score": 53}
})
print("\nQ3 (Hindi):", "क्या यह खरीदने का सही समय है?")
print("A3:", r3.json()["reply"])