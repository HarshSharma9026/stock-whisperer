import requests

headlines = [
    {"title": "Reliance Industries posts record quarterly profit, beats estimates"},
    {"title": "RIL expands green energy push with new solar plant in Gujarat"},
    {"title": "Reliance Jio adds 8 million subscribers in October"},
    {"title": "Mukesh Ambani signals aggressive retail expansion in FY26"},
    {"title": "Reliance shares hit 52-week low amid broader market selloff"},
]

response = requests.post(
    "http://localhost:8001/api/sentiment",
    json={"ticker": "RELIANCE", "headlines": headlines}
)

data = response.json()
print("Sentiment:", data["sentiment"])
print("Summary:", data["summary"])
print("Score points:", data["score_points"])