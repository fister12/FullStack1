# Video App Backend

Flask API backend for the API-First Video App.

## Quick Start

### 1. Start MongoDB

```bash
docker-compose up -d
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment

Copy `.env.example` to `.env` and update values as needed:

```bash
cp .env.example .env
```

### 4. Run the Server

```bash
python run.py
```

The server will start at `http://localhost:5000`

## API Endpoints

### Health Check
- `GET /health` - Check if API is running

### Authentication
- `POST /auth/signup` - Create new user account
- `POST /auth/login` - Authenticate and get JWT token
- `GET /auth/me` - Get current user profile (requires JWT)

## Testing with cURL

```bash
# Signup
curl -X POST http://localhost:5000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123"}'

# Login
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123"}'

# Get profile (replace <TOKEN> with actual token from login)
curl http://localhost:5000/auth/me \
  -H "Authorization: Bearer <TOKEN>"
```

## Project Structure

```
backend/
├── app/
│   ├── __init__.py      # Flask app factory
│   ├── config.py        # Configuration
│   ├── models/
│   │   └── user.py      # User model
│   ├── routes/
│   │   └── auth.py      # Auth endpoints
│   └── utils/
│       └── decorators.py
├── requirements.txt
├── run.py
├── docker-compose.yml
└── .env.example
```
