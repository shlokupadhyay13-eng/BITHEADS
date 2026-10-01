const mongoose = require('mongoose');

let listenersAttached = false;
let shuttingDown = false;
let reconnectTimer = null;

/**
 * Maps Mongoose readyState numbers to human-readable strings.
 * 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
 */
function getDBState() {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  return states[mongoose.connection.readyState] || 'unknown';
}

/**
 * Connect to MongoDB with exponential backoff retry and event listener registration.
 * @param {string} uri - MongoDB Connection String
 */
async function connectDB(uri) {
  if (!uri) {
    throw new Error('[db] Connection failed: MONGODB_URI is required.');
  }

  mongoose.set('strictQuery', true);

  const maxRetries = process.env.DB_MAX_RETRIES !== undefined
    ? parseInt(process.env.DB_MAX_RETRIES, 10)
    : 5;

  let attempt = 0;
  const baseDelay = 1000;
  const maxDelay = 30000;

  attachEventListeners(uri);

  while (true) {
    attempt++;
    try {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
        maxPoolSize: 10
      });
      console.log(`[db] Successfully connected to MongoDB (${getDBState()})`);
      return;
    } catch (err) {
      console.error(`[db] Connection attempt ${attempt} failed: ${err.message}`);

      if (maxRetries > 0 && attempt >= maxRetries) {
        console.error(`[db] Exhausted all ${maxRetries} retry attempts. Throwing connection error.`);
        throw err;
      }

      const exponentialDelay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
      const jitter = Math.random() * 200;
      const delay = exponentialDelay + jitter;

      console.log(`[db] Retrying connection in ${Math.round(delay)} ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

/**
 * Attaches Mongoose connection event listeners once.
 */
function attachEventListeners(uri) {
  if (listenersAttached) return;
  listenersAttached = true;

  mongoose.connection.on('connected', () => {
    console.log('[db] Mongoose connection event: connected');
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[db] Mongoose connection event: disconnected');
    if (!shuttingDown && process.env.NODE_ENV !== 'test') {
      console.log('[db] Unintended disconnection detected. Scheduling reconnect attempt...');
      if (!reconnectTimer) {
        reconnectTimer = setTimeout(() => {
          reconnectTimer = null;
          connectDB(uri).catch(err => {
            console.error('[db] Auto-reconnect failed:', err.message);
          });
        }, 5000);
      }
    }
  });

  mongoose.connection.on('error', (err) => {
    console.error('[db] Mongoose connection event error:', err.message);
  });

  mongoose.connection.on('reconnected', () => {
    console.log('[db] Mongoose connection event: reconnected');
  });

  // Graceful shutdown handling (skip in test environment to prevent listener leaks)
  if (process.env.NODE_ENV !== 'test') {
    const handleShutdown = async (signal) => {
      if (shuttingDown) return;
      shuttingDown = true;
      console.log(`[db] Received ${signal}. Closing MongoDB connection gracefully...`);
      try {
        await mongoose.connection.close();
        console.log('[db] Mongoose connection closed cleanly.');
        process.exit(0);
      } catch (err) {
        console.error('[db] Error closing Mongoose connection:', err);
        process.exit(1);
      }
    };

    process.once('SIGINT', () => handleShutdown('SIGINT'));
    process.once('SIGTERM', () => handleShutdown('SIGTERM'));
  }
}

/**
 * Disconnect from MongoDB gracefully.
 */
async function disconnectDB() {
  shuttingDown = true;
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
  listenersAttached = false;
  shuttingDown = false;
}

module.exports = {
  connectDB,
  disconnectDB,
  getDBState
};
