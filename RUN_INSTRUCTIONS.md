# League Lens - Run Instructions

## Quick Start

To run the project correctly, you need to start both the backend server and the frontend:

```bash
npm run dev:all
```

This command will:
- Start the Express backend server on port 3001
- Start the Vite development server on port 8080
- Set up proper proxying between frontend and backend

## Alternative: Run Separately

If you prefer to run them in separate terminals:

### Terminal 1 - Backend Server:
```bash
npm run server
```

### Terminal 2 - Frontend:
```bash
npm run dev
```

## Troubleshooting

### "JSON.parse: unexpected character" errors
This happens when the backend server is not running. Make sure to run `npm run dev:all` or start the server separately.

### YouTube videos not playing
- The app now uses `youtube-nocookie.com` for better privacy and fewer restrictions
- If videos still don't play, check if:
  - The highlight has a valid video URL in the database
  - Your browser allows third-party iframe content

### Images not loading (CORS errors)
Some external image sources may block requests. The app will fall back to placeholder images when this happens.

## Environment Variables

Make sure you have a `.env` file with the required variables. Check `.env.example` for the required variables (if available).

## Access the App

Once both servers are running, open your browser to:
```
http://localhost:8080
```