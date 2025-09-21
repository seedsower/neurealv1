import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server as SocketIOServer } from 'socket.io';

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: 'http://localhost:3001',
  credentials: true,
}));
app.use(express.json());

// WebSocket setup
const io = new SocketIOServer(server, {
  cors: {
    origin: "http://localhost:3001",
    methods: ["GET", "POST"]
  }
});

// Mock price data
let currentPrice = 1.0;

// Generate mock price history
const generatePriceHistory = () => {
  const history = [];
  const now = Date.now();
  for (let i = 100; i >= 0; i--) {
    const timestamp = now - (i * 60000); // Every minute
    const randomChange = (Math.random() - 0.5) * 0.02;
    currentPrice = Math.max(0.1, currentPrice * (1 + randomChange));
    history.push({
      timestamp,
      price: parseFloat(currentPrice.toFixed(4)),
      volume24h: Math.random() * 1000000,
      change24h: (Math.random() - 0.5) * 20,
    });
  }
  return history;
};

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/price/current', (req, res) => {
  res.json({
    success: true,
    data: {
      price: currentPrice,
      timestamp: Date.now()
    }
  });
});

app.get('/api/price/history', (req, res) => {
  const history = generatePriceHistory();
  res.json({
    success: true,
    data: history
  });
});

app.get('/api/leaderboard', (req, res) => {
  const mockLeaderboard = [
    {
      walletAddress: '0x1234567890123456789012345678901234567890',
      totalWinnings: 15000,
      winStreak: 8,
      totalPredictions: 50,
      winRate: 64,
      rank: 1
    },
    {
      walletAddress: '0x2345678901234567890123456789012345678901',
      totalWinnings: 12000,
      winStreak: 5,
      totalPredictions: 45,
      winRate: 58,
      rank: 2
    }
  ];

  res.json({
    success: true,
    data: mockLeaderboard
  });
});

// WebSocket handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Send initial data
  socket.emit('initial_data', {
    currentPrice,
    priceHistory: generatePriceHistory(),
    timestamp: Date.now()
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Update price every 5 seconds
setInterval(() => {
  const randomChange = (Math.random() - 0.5) * 0.01;
  currentPrice = Math.max(0.1, currentPrice * (1 + randomChange));
  currentPrice = parseFloat(currentPrice.toFixed(4));

  io.emit('price_update', {
    price: currentPrice,
    timestamp: Date.now()
  });
}, 5000);

// Start server
server.listen(port, () => {
  console.log(`🚀 Neureal server running on port ${port}`);
  console.log(`📡 WebSocket server ready`);
});

export default app;