require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const { handleSocketConnection } = require("./utils/socket")
const messageRoutes = require('./routes/messageRoutes');
const connectDB = require('./lib/mongoDb');

const app = express();

// Allowed front-end origins
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://chatty-navy.vercel.app'
];


app.use(cookieParser());
// CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));


app.use(express.json());


app.use('/api', authRoutes);
app.use("/chat", messageRoutes)

app.get('/welcome', (req, res) => {
  res.status(200).json({ message: 'Welcome to the Chat API!' });
});


connectDB()


const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
  },
});

handleSocketConnection(io);


const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server is running at http://localhost:${PORT}`);
});
