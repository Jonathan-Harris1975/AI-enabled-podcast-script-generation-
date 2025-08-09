// utils/logger.js
import winston from 'winston';

const { createLogger, format, transports } = winston;
const { combine, timestamp, printf, colorize } = format;

const logFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level}]: ${message}`;
});

export function getLogger(moduleName) {
  return createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: combine(
      colorize(),
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      logFormat
    ),
    defaultMeta: { module: moduleName },
    transports: [new transports.Console
