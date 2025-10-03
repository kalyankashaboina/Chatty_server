import mongoose from 'mongoose';
import logger from '../utils/logger'; // assuming you have a logger utility

const connectDB = async (): Promise<void> => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    logger.error('❌ MONGO_URI is not defined in environment variables');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri, {
      autoIndex: true,
      maxPoolSize: 10, // connection pool
      serverSelectionTimeoutMS: 5000, // fail if not connected within 5s
    });
    logger.info('✅ Connected to MongoDB');
  } catch (error: any) {
    logger.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }

  mongoose.connection.on('disconnected', () => {
    logger.warn('⚠️ MongoDB disconnected!');
  });

  mongoose.connection.on('reconnected', () => {
    logger.info('🔄 MongoDB reconnected!');
  });
};

export default connectDB;
