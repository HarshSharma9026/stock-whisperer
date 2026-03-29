
# 📈 Stock Whisperer
### AI-Powered Chart Intelligence for Indian Investors
> ET AI Hackathon 2026 | Problem Statement 6: AI for the Indian Investor

---

## What It Does

Stock Whisperer detects chart patterns on NSE/BSE stocks, back-tests them against
3 years of Indian market data, and synthesizes technical signals, news sentiment,
and promoter activity into a single **Confluence Score** — delivered as a plain-language
analysis in English, Hindi, or Hinglish.

---

## Architecture

```
Frontend (React + Vite + TailwindCSS)  →  Vercel
Backend (FastAPI + Python 3.11)         →  Render / Railway
AI/ML Service (FastAPI + Gemini API)    →  Render / Railway
```

See `/docs/architecture.md` for the full agent diagram.

---

## Setup Instructions

### Prerequisites
- Node.js 20+
- Python 3.11+
- Gemini API key (get free at https://aistudio.google.com)

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_ORG/stock-whisperer.git
cd stock-whisperer
```

### 2. Backend setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

uvicorn main:app --reload
# API runs at http://localhost:8000
```

### 3. AI/ML service setup
```bash
cd backend
uvicorn agents.ml_service:app --port 8001 --reload
# ML service runs at http://localhost:8001
```

### 4. Frontend setup
```bash
cd frontend
npm install

cp .env.example .env.local
# Edit .env.local:
# VITE_API_URL=http://localhost:8000

npm run dev
# App runs at http://localhost:5173
```

---

## Environment Variables

### Backend `.env`
```
GEMINI_API_KEY=your_key_here
CORS_ORIGIN=http://localhost:5173
```

### Frontend `.env.local`
```
VITE_API_URL=http://localhost:8000
```

---

## Team
| Role | Owner | Phase Focus |
|------|-------|------------|
| Frontend Dev | [Name] | Chart UI, ticker search, language toggle, Q&A |
| Backend Dev | [Name] | FastAPI, yfinance, BSE scraper, backtester |
| AI/ML Dev | [Name] | Pattern engine, confluence score, Gemini agents |
| Docs + QA | [Name] | Architecture, impact model, README, pitch video |

---

## License
MIT
