// Health check endpoint for Vercel
export default function handler(req, res) {
  res.status(200).json({ 
    status: 'ok', 
    message: 'League Lens API is running on Vercel',
    timestamp: new Date().toISOString()
  });
} 