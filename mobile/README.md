# Video App - React Native Client

A thin-client mobile app built with Expo. All business logic resides on the backend.

## Quick Start

### 1. Configure API URL

Edit `src/config/api.js` and update `BASE_URL`:

```javascript
// For Android Emulator: 10.0.2.2
// For iOS Simulator: localhost  
// For physical device: your computer's IP
BASE_URL: 'http://YOUR_IP:5000',
```

### 2. Run the App

```bash
cd mobile
npm start
```

Then press:
- `a` for Android
- `i` for iOS
- `w` for Web

## Architecture: Thin Client

This app contains **zero business logic**. It's a rendering engine for the Flask API.

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Mobile    │ --> │   Flask     │ --> │   MongoDB   │
│   (Render)  │ <-- │   (Logic)   │ <-- │   (Data)    │
└─────────────┘     └─────────────┘     └─────────────┘
```

### What the app does:
- Renders UI from API responses
- Stores JWT securely (SecureStore)
- Plays videos via WebView (never sees YouTube URLs)

### What the app does NOT do:
- Validate data (backend does this)
- Filter or transform data
- Make business decisions
- Access raw video URLs

## Project Structure

```
mobile/
├── App.js                     # Entry point
├── src/
│   ├── config/
│   │   └── api.js             # API configuration
│   ├── context/
│   │   └── AuthContext.js     # Auth state management
│   ├── navigation/
│   │   └── Navigation.js      # React Navigation config
│   ├── screens/
│   │   ├── LoginScreen.js
│   │   ├── SignupScreen.js
│   │   ├── DashboardScreen.js
│   │   └── VideoPlayerScreen.js
│   └── services/
│       └── api.js             # Axios + Token service
└── package.json
```

## Security

- JWT stored in SecureStore (encrypted)
- Videos accessed via playback tokens (30min expiry)
- YouTube URLs never exposed to client
