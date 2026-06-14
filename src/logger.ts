import * as winston from 'winston';
import { Logtail } from '@logtail/node';
import { LogtailTransport } from '@logtail/winston';

const { combine, timestamp, colorize, printf, json } = winston.format;

const devFormat = combine(
  colorize(),
  timestamp({ format: 'HH:mm:ss' }),
  printf((info) => {
    const level = info.level;
    const message = info.message as string;
    const ts = info.timestamp as string;
    const context = (info.context as string) ?? 'App';
    return `${ts} [${context}] ${level}: ${message}`;
  }),
);

const prodFormat = combine(timestamp(), json());

const isProd = process.env.ENV === 'prod';

const transports: winston.transport[] = [new winston.transports.Console()];

if (isProd) {
  const logtail = new Logtail(process.env.LOGTAIL_TOKEN!);
  transports.push(new LogtailTransport(logtail));
}

export const winstonConfig: winston.LoggerOptions = {
  level: isProd ? 'info' : 'debug',
  format: isProd ? prodFormat : devFormat,
  transports,
};
