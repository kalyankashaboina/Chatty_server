import winston from 'winston';
import 'winston-mongodb';

const MONGO_URI = process.env.MONGO_URI || 'your-mongodb-atlas-uri';
const isProduction = process.env.NODE_ENV === 'production';

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaString = Object.keys(meta).length ? ` | ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaString}`;
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

    // File transports for non-production
    ...(!isProduction
      ? [
          new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            format: logFormat,
          }),
          new winston.transports.File({
            filename: 'logs/combined.log',
            format: logFormat,
          }),
        ]
      : []),

    // MongoDB transport
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

export default logger;
