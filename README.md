# API-First Video App

A complete video streaming app with a **thin-client architecture** where all business logic resides on the Flask backend.

## Project Structure

```
├── backend/           # Flask API (Python)
│   ├── app/
│   │   ├── models/    # User, Video models
│   │   ├── routes/    # Auth, Video endpoints
│   │   └── utils/     # Decorators
│   └── docker-compose.yml
│
└── mobile/            # React Native (Expo)
    └── src/
        ├── screens/   # Login, Signup, Dashboard, VideoPlayer
        ├── services/  # API + Token management
        └── context/   # Auth state
```

## Quick Start

### Backend

```bash
cd backend
docker-compose up -d    # Start MongoDB
pip install -r requirements.txt
python run.py           # Runs on :5000
```

### Mobile

```bash
cd mobile
npm start              # Expo dev server
```

Update `mobile/src/config/api.js` with your backend IP.

## API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/auth/signup` | POST | - | Create account |
| `/auth/login` | POST | - | Get JWT token |
| `/auth/me` | GET | JWT | User profile |
| `/dashboard` | GET | JWT | 2 video tiles |
| `/video/<id>/stream` | GET | JWT+Token | Embed URL |
| `/video/<id>/embed` | GET | Token | WebView page |

## Security Features

- Password hashing (PBKDF2-SHA256)
- JWT authentication (24h expiry)
- Playback tokens (30min expiry)
- YouTube URLs hidden from client
