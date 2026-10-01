require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');

const { connectDB, getDBState } = require('./db/connect');
const { notFound, errorHandler } = require('./middleware/errorHandler');

// Register all Mongoose models into memory on server import/start
const User = require('./models/User');
const Document = require('./models/Document');
const Analysis = require('./models/Analysis');
const ChatSession = require('./models/ChatSession');
const Comparison = require('./models/Comparison');

/**
 * Express Application Factory
 * Allows Person 3 and Person 1 to inject their custom routes cleanly.
 *
 * @param {Object} options
 * @param {Array<{ path: string, router: express.Router }>} [options.routers=[]]
 * @returns {express.Application}
 */
function createApp({ routers = [] } = {}) {
  const app = express();

  // 1. Security HTTP Headers
  app.use(helmet());

  // 2. Cross-Origin Resource Sharing
  const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
    : ['http://localhost:5173'];

  app.use(cors({
    origin: allowedOrigins,
    credentials: true
  }));

  // 3. Body Parsing Middleware
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  // 4. Data Sanitization against NoSQL Query Injection
  app.use(mongoSanitize());

  // 5. System Health Check Endpoint
  app.get('/api/health', (req, res) => {
    res.status(200).json({
      success: true,
      status: 'ok',
      db: getDBState(),
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  });

  /*
   * INTEGRATION EXTENSION POINT FOR TEAM MEMBERS:
   * ----------------------------------------------------
   * Person 3 (Auth & Core Routes): Pass routers array to createApp, e.g.:
   *   routers: [
   *     { path: '/api/auth', router: authRouter },
   *     { path: '/api/documents', router: documentRouter }
   *   ]
   *
   * Person 1 (AI & Gemini Integration): Pass AI routes, e.g.:
   *   routers: [
   *     { path: '/api/analysis', router: analysisRouter },
   *     { path: '/api/chat', router: chatRouter }
   *   ]
   * ----------------------------------------------------
   */
  routers.forEach(({ path, router }) => {
    if (path && router) {
      app.use(path, router);
    }
  });

  // 6. 404 Not Found Handler
  app.use(notFound);

  // 7. Global Centralized Error Handler
  app.use(errorHandler);

  return app;
}

const app = createApp();

// Start standalone HTTP server only when run directly (not required by Jest tests)
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  const mongoURI = process.env.MONGODB_URI;

  if (!mongoURI) {
    console.error('[server] FATAL: MONGODB_URI is not set in environment variables.');
    process.exit(1);
  }

  (async () => {
    try {
      await connectDB(mongoURI);
      app.listen(PORT, () => {
        console.log(`[server] Server listening on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
      });
    } catch (err) {
      console.error('[server] Server startup failed:', err);
      process.exit(1);
    }
  })();
}

module.exports = {
  createApp,
  app,
  models: {
    User,
    Document,
    Analysis,
    ChatSession,
    Comparison
  }
};
