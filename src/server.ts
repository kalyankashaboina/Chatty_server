import dotenv from 'dotenv';
dotenv.config();

import express, { Application, NextFunction, Request, Response } from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import cors from 'cors';

import authRoutes from './routes/authRoutes';
import messageRoutes from './routes/messageRoutes';
import { handleSocketConnection } from './utils/socket';
import connectDB from './lib/mongoDb';
import logger from './utils/logger';

const app: Application = express();

// Allowed front-end origins
const allowedOrigins: string[] = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://chatty-navy.vercel.app',
];

// Middleware
app.use(cookieParser());

app.use(
  cors({
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
  })
);

app.use(express.json());
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info(`➡️  Incoming Request --- Method: [${req.method}] - URL: [${req.originalUrl}]`);
  next(); // Pass the request to the next middleware/handler
});

// Routes
app.use('/api', authRoutes);
app.use('/api/chat', messageRoutes);

// Health check
app.get('/api/welcome', (req: Request, res: Response) => {
  res.status(200).json({ message: 'Welcome to the Chat API!' });
});

// Connect to MongoDB
connectDB();

// Create HTTP server
const server = http.createServer(app);

// Socket.IO server
const io = new SocketIOServer(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
  },
});

// Handle socket connections
handleSocketConnection(io);

// Start server
const PORT: string | number = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server is running at http://localhost:${PORT}`);
});
