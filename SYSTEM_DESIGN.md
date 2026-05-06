# Tapmaan Vishleshak - System Design Document

This document outlines the architecture, data flow, and security implementation of the Tapmaan Vishleshak weather platform.

## 🏗️ High-Level Architecture
The system follows a modern decoupled architecture:
- **Frontend**: React (Vite) + Tailwind CSS (Deployed on Netlify)
- **Backend**: FastAPI (Python) (Deployed on Render)
- **Database**: MongoDB Atlas (Cloud NoSQL)
- **AI Engine**: Ollama (Local Llama 3.2) for RAG-based weather analysis

---

## 🔄 Data Flow
1. **User Request**: User searches for a city in the React frontend.
2. **Backend Proxy**: The frontend calls our FastAPI `/weather` endpoint.
3. **External Fetch**: The backend securely appends the `OPENWEATHER_API_KEY` and fetches data from OpenWeatherMap.
4. **Data Enrichment**: The backend fetches AQI and Forecast data in parallel.
5. **Response**: The cleaned data is sent back to the frontend to update the UI.

---

## 🤖 RAG (Retrieval-Augmented Generation) Logic
The "Tapmaan Assistant" uses a RAG-lite approach:
1. **Context Injection**: When a user chats, the frontend sends the **Current Weather + AQI + Forecast** as a "Context Packet".
2. **Local Processing**: The backend sends this packet + the User Question to **Ollama**.
3. **Grounded Answer**: The LLM (Llama 3.2) generates an answer based strictly on the live weather context provided.

---

## 🛡️ Security Implementation
- **API Key Masking**: OpenWeather keys never reach the client-side; they are managed strictly by the backend.
- **Rate Limiting**: `SlowAPI` is implemented on Auth and Weather routes to prevent brute-force and API abuse.
- **CORS Policy**: Restricted to authorized origins (`netlify.app` and `localhost`).
- **JWT Authentication**: Secure token-based access for protected routes (Alerts, Settings).
- **Password Hashing**: Bcrypt is used for one-way secure storage of user credentials.

---

## 📡 Background Workers
- **Alert Scheduler**: An `APScheduler` worker runs every 30 minutes to check conditions for all registered users and send automated email alerts if thresholds (Temp/AQI) are crossed.

---

## 🗄️ Database Schema (MongoDB)
- **Users**: `{email, hashed_password, full_name, location, created_at}`
- **Alerts**: `{user_id, city, temp_threshold, aqi_threshold, is_active}`
