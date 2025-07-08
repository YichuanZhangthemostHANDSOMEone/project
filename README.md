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

### LEGO segmentation pipeline

This project implements an advanced image processing pipeline in
`src/modules/legoPipeline.ts`. It captures a frame from the camera,
segments LEGO regions using MediaPipe and a Roboflow model, performs
color quantization and Lab-based filtering, applies morphological
operations and contour analysis, and finally classifies each detected
LEGO block using the closest match from the built-in color palette.

The pipeline depends on OpenCV.js, MediaPipe Tasks Vision, `quantize`,
`colorjs.io` and `color.js`. Ensure these packages are installed with
`npm install`.

These values are loaded using `dotenv` and injected during the webpack build.
