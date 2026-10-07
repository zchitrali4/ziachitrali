import dns from 'node:dns';
import tls from 'node:tls';
import mongoose from 'mongoose';
import { env } from './env.js';

dns.setDefaultResultOrder('ipv4first');
tls.DEFAULT_MAX_VERSION = 'TLSv1.2';

export async function connectDb() {
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.mongoUri, {
    family: 4,
    autoSelectFamily: false,
    secureProtocol: 'TLSv1_2_method',
    maxPoolSize: 5,
    minPoolSize: 0,
    maxConnecting: 1,
    serverSelectionTimeoutMS: 15000,
    socketTimeoutMS: 45000,
    heartbeatFrequencyMS: 30000,
  });
  mongoose.connection.getClient().on('error', (error) => {
    const reason = String(error?.message || 'Database connection failed.').split('\n')[0];
    console.error(`[db] ${reason}`);
  });
  return mongoose.connection;
}
