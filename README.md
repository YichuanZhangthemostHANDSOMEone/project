# Project

## Setup

1. Copy `.env.example` to `.env` and fill in your Firebase and Roboflow credentials.
   ```bash
   cp .env.example .env
   # edit .env and add your keys
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm start
   ```

The application relies on the following environment variables:

- `FIREBASE_API_KEY`
- `FIREBASE_AUTH_DOMAIN`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_STORAGE_BUCKET`
- `FIREBASE_MESSAGING_SENDER_ID`
- `FIREBASE_APP_ID`
- `FIREBASE_MEASUREMENT_ID`
- `ROBOFLOW_API_KEY`

These values are loaded using `dotenv` and injected during the webpack build.
