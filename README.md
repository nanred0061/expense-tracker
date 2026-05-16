# 💰 Expense Tracker PWA

A full-stack personal finance app built with FastAPI + Vue 3 + AI.

🌐 **Live:** [expense-tracker-lilac-theta-70.vercel.app](https://expense-tracker-lilac-theta-70.vercel.app)

---

## Features
- 🔐 Multi-user authentication (JWT + bcrypt)
- 💸 Expense tracking with categories
- 📊 Budget management with salary-based limits
- 🎯 Savings goals with auto month-end rollover
- 👥 Split expenses with friends
- 📋 Bills tracker with due date alerts
- 🤖 AI financial assistant (Groq + Ollama)
- 📱 Installable PWA on iOS and Android

---

## Tech Stack
| | |
|---|---|
| **Backend** | Python, FastAPI, SQLAlchemy, PostgreSQL |
| **Frontend** | Vue 3, TypeScript, Tailwind CSS, Vite |
| **Auth** | JWT tokens, bcrypt |
| **AI** | Groq API (prod) / Ollama (local) |
| **Deploy** | Railway + Vercel |

---

## Local Setup

```bash
# Backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

---

## Built by Nandini 🚀
