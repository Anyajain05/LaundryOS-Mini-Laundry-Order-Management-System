#!/bin/bash
echo "🧺 Starting LaundryOS..."
echo ""

# Start backend
cd backend
npm install --silent
node server.js &
BACKEND_PID=$!
echo "✅ Backend running at http://localhost:3001 (PID: $BACKEND_PID)"

# Start frontend
cd ../frontend
npm install --silent
npm start &
echo "✅ Frontend running at http://localhost:3000"

echo ""
echo "Press Ctrl+C to stop both servers"
wait
