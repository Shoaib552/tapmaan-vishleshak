# Tapmaan Vishleshak Backend

This is a production-ready backend built with FastAPI and MongoDB for the Tapmaan Vishleshak weather dashboard.

## Features
- **User Authentication**: JWT-based login and registration.
- **Environmental Alert System**: Monitors Earthquake, Heavy Rain, and Air Quality (AQI).
- **Email Notifications**: Automatically sends email alerts to users using `fastapi-mail`.
- **Background Scheduler**: Periodically checks environmental conditions using `APScheduler`.
- **Database**: Asynchronous MongoDB interaction using `Motor`.

## Tech Stack
- **Framework**: FastAPI (Python)
- **Database**: MongoDB
- **Security**: JWT, Passlib (bcrypt)
- **Scheduler**: APScheduler
- **Email**: FastAPI-Mail

## Setup Instructions

### 1. Install Prerequisites
- Python 3.9+
- MongoDB (running locally on port 27017 or a cloud instance)

### 2. Install Dependencies
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Environment Variables
Edit the `.env` file in the `backend` directory:
- Update `MONGODB_URL` with your connection string.
- Update `MAIL_USERNAME` and `MAIL_PASSWORD` (use a Gmail App Password).
- Update `SECRET_KEY` for JWT security.

### 4. Run the Backend
```bash
python -m app.main
```
The API will be available at `http://localhost:8000`.
You can access the interactive API documentation at `http://localhost:8000/docs`.

## API Endpoints

- **POST /register**: Register a new user.
- **POST /login**: Authenticate and receive a JWT token.
- **GET /alerts**: Retrieve recent environmental alerts.
- **POST /send-alert**: Manually trigger an alert (requires Auth token).

## Connecting with React Frontend

To connect your React frontend:
1. Use `axios` or `fetch` to make requests to `http://localhost:8000`.
2. For authenticated requests, include the JWT token in the headers:
   `Authorization: Bearer <your_token>`
3. Update your frontend API calls to point to these endpoints.

Example Login Request:
```javascript
const response = await axios.post('http://localhost:8000/login', new URLSearchParams({
  username: 'email@example.com',
  password: 'yourpassword'
}));
const token = response.data.access_token;
```
