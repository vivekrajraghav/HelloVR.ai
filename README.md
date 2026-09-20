# HelloVR.ai 🚀
**An Interactive AI Recruiting Assistant & Personal Portfolio**

[![Next.js](https://img.shields.io/badge/Next.js-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Groq](https://img.shields.io/badge/Groq_API-F55036?style=for-the-badge&logo=groq&logoColor=white)](https://groq.com/)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)
[![Render](https://img.shields.io/badge/Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://render.com/)

**[View Live Project]** <!-- Add your Vercel URL here, e.g., (https://hello-vr-frontend.vercel.app) -->
**[View Backend API]** <!-- Add your Render URL here, e.g., (https://hellovr-backend.onrender.com) -->

---

## 📖 Overview

**HelloVR.ai** is a full-stack, AI-powered conversational agent designed to serve as an interactive resume and recruiting assistant. Built with a decoupled architecture, it allows recruiters and engineering managers to "chat" directly with an AI representative trained specifically on my professional background in **Data Science, AI Engineering, and Bioinformatics**.

The project features a custom command-line/terminal-inspired UI, real-time streaming LLM responses, and a highly resilient backend.

## ✨ Key Features

- **Conversational UI:** A sleek, terminal-style interface built with Next.js and Tailwind CSS, fully responsive for both desktop and mobile viewing.
- **Real-Time Streaming:** Utilizes the Groq API for ultra-low latency, streaming text generation, providing a snappy user experience.
- **Smart Context Management:** Implements a sliding-window token memory system in the backend to maintain conversation history without exceeding token limits.
- **High Availability Architecture:** Features a robust dual-key API fallback system. If the primary API key is rate-limited, the system seamlessly fails over to a secondary key without interrupting the user.
- **Cross-Origin Security:** Fully configured CORS and local dev environment bindings (`0.0.0.0`) for seamless mobile-to-desktop local testing and secure production access.

---

## 🏗️ Architecture & Tech Stack

This project is built as a **Monorepo** containing two distinct environments:

### Frontend (`frontend/recruit-bot`)
- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS
- **Deployment:** Vercel

### Backend (`backend`)
- **Framework:** FastAPI (Python)
- **AI Inference:** Groq API (Llama 3 / Mixtral)
- **Server:** Uvicorn
- **Deployment:** Render (Containerized Web Service)

---

## 📂 Repository Structure

```text
HelloVR.ai/
│
├── frontend/
│   └── recruit-bot/          # Next.js Application
│       ├── app/              # App Router (page.tsx, layout.tsx, globals.css)
│       ├── public/           # Static assets
│       ├── package.json      # Frontend dependencies
│       └── next.config.ts    # Next.js configuration
│
└── backend/                  # FastAPI Application
    ├── main.py               # Core API logic, CORS, and Groq streaming integration
    └── requirements.txt      # Python dependencies
```

---

## 🚀 Getting Started (Local Development)

To run this project locally, you will need Node.js and Python 3.10+ installed.

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/HelloVR.ai.git
cd HelloVR.ai
```

### 2. Backend Setup
Navigate to the backend directory, install dependencies, and run the server.

```bash
cd backend
pip install -r requirements.txt

# Set your local environment variables (Linux/macOS)
export GROQ_API_KEY="your_primary_key_here"
export BACKUP_GROQ_API_KEY="your_backup_key_here" # Optional

# Run the FastAPI server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
*The backend will be available at `http://localhost:8000` or your local network IP (e.g., `http://10.x.x.x:8000`).*

### 3. Frontend Setup
Open a new terminal window, navigate to the frontend directory, and start the Next.js development server.

```bash
cd frontend/recruit-bot
npm install

# Run the frontend server
npm run dev
```
*The frontend will be available at `http://localhost:3000`.*

---

## 🌐 Production Deployment Setup

- **Backend (Render):** Set the Root Directory to `backend`. Use the build command `pip install -r requirements.txt` and start command `uvicorn main:app --host 0.0.0.0 --port $PORT`. Add `GROQ_API_KEY` to environment variables.
- **Frontend (Vercel):** Set the Root Directory to `frontend/recruit-bot`. Add the environment variable `NEXT_PUBLIC_API_URL` pointing to your Render backend URL (e.g., `https://hellovr-backend.onrender.com`).

---