const winston = require('winston');
require('winston-mongodb');

// MongoDB connection string (use environment variable in production)
const MONGO_URI = process.env.MONGO_URI || 'your-mongodb-atlas-uri';
const isProduction = process.env.NODE_ENV === 'production';

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message }) => {
    return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
  })
);

// Create the logger
const logger = winston.createLogger({
  level: 'info',
  format: logFormat,
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), logFormat),
    }),

    ...(isProduction
      ? []
      : [
          new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            format: logFormat,
          }),
          new winston.transports.File({
            filename: 'logs/combined.log',
            format: logFormat,
          }),
        ]),

    new winston.transports.MongoDB({
      level: 'info',
      db: MONGO_URI,
      collection: 'chatty-logs',
      format: winston.format.metadata(),
      options: {
        useUnifiedTopology: true,
      },
    }),
  ],
});

module.exports = logger;
