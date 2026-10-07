import app from './app.js';
import { connectDb } from './config/db.js';
import { env } from './config/env.js';
import { checkMail } from './services/mailService.js';

async function start() {
  if (env.dbEnabled) {
    await connectDb();
    console.log('Database connected.');
  } else {
    console.log('Database is off. The site is running in preview mode.');
  }
  await new Promise((resolve, reject) => {
    const server = app.listen(env.port, () => {
      console.log(`Zia Chitrali API listening on port ${env.port}`);
      checkMail();
      resolve();
    });
    server.on('error', reject);
  });
}

start().catch((error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${env.port} is already in use. Stop the other API, or run: npm run dev -- --port 8082`);
  } else {
    console.error('The API did not start.');
    console.error(error.message);
  }
  process.exit(1);
});
