process.env.NODE_ENV = 'test';

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');

const { createApp } = require('../server');
const { AppError } = require('../middleware/errorHandler');

const User = require('../models/User');
const Document = require('../models/Document');
const Analysis = require('../models/Analysis');
const ChatSession = require('../models/ChatSession');
const Comparison = require('../models/Comparison');

let mongoServer;
let app;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  // Sync model indexes explicitly so text search and unique constraints exist
  await User.syncIndexes();
  await Document.syncIndexes();
  await Analysis.syncIndexes();
  await ChatSession.syncIndexes();
  await Comparison.syncIndexes();

  app = createApp();
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

describe('1. Health Check Endpoint', () => {
  test('GET /api/health returns 200, success: true, status: ok, and db: connected', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.status).toBe('ok');
    expect(res.body.db).toBe('connected');
    expect(typeof res.body.uptime).toBe('number');
    expect(typeof res.body.timestamp).toBe('string');
  });
});

describe('2. Unknown Route 404 Handling', () => {
  test('Unknown route returns 404 with standard error envelope', async () => {
    const res = await request(app).get('/api/non-existent-route-path');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('HTTP_404');
    expect(res.body.error.message).toContain('Route not found: GET /api/non-existent-route-path');
  });
});

describe('3. User Model - Hashing, Selection, comparePassword & toJSON', () => {
  test('Password is hashed, excluded on find, accessible with +password, comparePassword works, toJSON strips password', async () => {
    const plainPassword = 'SecretPassword123!';
    const user = await User.create({
      name: 'Test User',
      email: 'user@example.com',
      password: plainPassword
    });

    expect(user.password).not.toBe(plainPassword);
    expect(user.password.startsWith('$2')).toBe(true);

    // Normal query excludes password
    const foundUser = await User.findById(user._id);
    expect(foundUser.password).toBeUndefined();

    // +password explicit selection exposes password
    const userWithPassword = await User.findById(user._id).select('+password');
    expect(userWithPassword.password).toBeDefined();

    // comparePassword verification
    const isMatch = await userWithPassword.comparePassword(plainPassword);
    const isWrong = await userWithPassword.comparePassword('WrongPassword123');
    expect(isMatch).toBe(true);
    expect(isWrong).toBe(false);

    // toJSON transform
    const userJson = foundUser.toJSON();
    expect(userJson.password).toBeUndefined();
    expect(userJson.__v).toBeUndefined();
  });
});

describe('4. User Model - Email Normalization & Duplicate Prevention', () => {
  test('Duplicate email rejected with code 11000 and email normalized to lowercase', async () => {
    await User.create({
      name: 'First User',
      email: 'TEST.USER@Domain.com',
      password: 'password123'
    });

    const found = await User.findOne({ email: 'test.user@domain.com' });
    expect(found).not.toBeNull();
    expect(found.email).toBe('test.user@domain.com');

    // Attempting to create duplicate email in different casing
    let error;
    try {
      await User.create({
        name: 'Duplicate User',
        email: 'test.user@domain.com',
        password: 'password456'
      });
    } catch (err) {
      error = err;
    }
    expect(error).toBeDefined();
    expect(error.code).toBe(11000);
  });
});

describe('5. User Model - Validation (Invalid Email & Short Password)', () => {
  test('Invalid email format and short password fail validation', async () => {
    let error;
    try {
      await User.create({
        name: 'Invalid User',
        email: 'not-an-email',
        password: 'short'
      });
    } catch (err) {
      error = err;
    }
    expect(error).toBeDefined();
    expect(error.name).toBe('ValidationError');
    expect(error.errors.email).toBeDefined();
    expect(error.errors.password).toBeDefined();
  });
});

describe('6. Document Model - Defaults, Enum, Indexing & Text Search', () => {
  test('Defaults status to pending, rejects invalid status, verifies indexes & text search', async () => {
    const user = await User.create({
      name: 'Doc Owner',
      email: 'owner@example.com',
      password: 'password123'
    });

    const doc = await Document.create({
      uploadedBy: user._id,
      title: 'National Infrastructure Policy 2026',
      rawText: 'This document contains strategic recommendations for renewable energy growth.'
    });

    expect(doc.status).toBe('pending');

    // Invalid status validation
    let invalidStatusErr;
    try {
      await Document.create({
        uploadedBy: user._id,
        title: 'Bad Status Doc',
        status: 'invalid_status'
      });
    } catch (err) {
      invalidStatusErr = err;
    }
    expect(invalidStatusErr).toBeDefined();
    expect(invalidStatusErr.name).toBe('ValidationError');

    // Verify indexes exist on collection
    const indexes = await Document.collection.indexes();
    const indexNames = indexes.map(idx => idx.name);
    expect(indexNames).toContain('uploadedBy_1_createdAt_-1');
    expect(indexNames).toContain('document_text_search');

    // Test text search ($text) query
    const searchResults = await Document.find({ $text: { $search: 'renewable energy' } });
    expect(searchResults.length).toBeGreaterThan(0);
    expect(searchResults[0]._id.toString()).toBe(doc._id.toString());
  });
});

describe('7. Analysis Model - Score Constraints, Unique Constraint & Mixed JSON', () => {
  test('policyImpactScore rejects out-of-range, accepts 0 and 100, enforces unique documentId, stores nested JSON', async () => {
    const user = await User.create({ name: 'Analyst', email: 'analyst@example.com', password: 'password123' });
    const doc = await Document.create({ uploadedBy: user._id, title: 'Policy Doc 1' });

    // Score < 0 rejected
    await expect(Analysis.create({ documentId: doc._id, policyImpactScore: -1 })).rejects.toThrow();

    // Score > 100 rejected
    await expect(Analysis.create({ documentId: doc._id, policyImpactScore: 101 })).rejects.toThrow();

    // Score 0 and 100 accepted
    const analysis0 = await Analysis.create({ documentId: doc._id, policyImpactScore: 0 });
    expect(analysis0.policyImpactScore).toBe(0);

    await Analysis.deleteMany({});

    const nestedData = { keyMetrics: { gdpGrowth: '2.5%', jobCreation: 150000 }, tags: ['economic', 'green'] };
    const analysis100 = await Analysis.create({
      documentId: doc._id,
      policyImpactScore: 100,
      summary: 'High impact report',
      structuredJSON: nestedData
    });

    expect(analysis100.policyImpactScore).toBe(100);
    expect(analysis100.structuredJSON).toEqual(nestedData);

    // Enforce unique documentId constraint
    let dupErr;
    try {
      await Analysis.create({ documentId: doc._id, policyImpactScore: 50 });
    } catch (err) {
      dupErr = err;
    }
    expect(dupErr).toBeDefined();
    expect(dupErr.code).toBe(11000);
  });
});

describe('8. ChatSession Model - addMessage & Role Enum Validation', () => {
  test('addMessage appends in order; invalid role is rejected', async () => {
    const user = await User.create({ name: 'Chatter', email: 'chatter@example.com', password: 'password123' });
    const doc = await Document.create({ uploadedBy: user._id, title: 'Chat Doc' });

    const session = await ChatSession.create({
      userId: user._id,
      documentId: doc._id
    });

    expect(session.messages.length).toBe(0);

    await session.addMessage('user', 'What is the budget allocation?');
    await session.addMessage('assistant', 'The budget allocation is $5 billion.');

    const updatedSession = await ChatSession.findById(session._id);
    expect(updatedSession.messages.length).toBe(2);
    expect(updatedSession.messages[0].role).toBe('user');
    expect(updatedSession.messages[0].content).toBe('What is the budget allocation?');
    expect(updatedSession.messages[1].role).toBe('assistant');
    expect(updatedSession.messages[1].content).toBe('The budget allocation is $5 billion.');

    // Invalid role rejected
    let invalidRoleErr;
    try {
      await session.addMessage('invalid_role', 'Hello');
    } catch (err) {
      invalidRoleErr = err;
    }
    expect(invalidRoleErr).toBeDefined();
  });
});

describe('9. Comparison Model - Document Array Custom Validator', () => {
  test('Rejects fewer than 2 documentIds, rejects duplicate IDs, accepts 2+ distinct IDs', async () => {
    const user = await User.create({ name: 'Comparer', email: 'compare@example.com', password: 'password123' });
    const doc1 = await Document.create({ uploadedBy: user._id, title: 'Doc A' });
    const doc2 = await Document.create({ uploadedBy: user._id, title: 'Doc B' });

    // Reject < 2 documentIds
    let err1;
    try {
      await Comparison.create({ createdBy: user._id, documentIds: [doc1._id] });
    } catch (err) {
      err1 = err;
    }
    expect(err1).toBeDefined();
    expect(err1.name).toBe('ValidationError');

    // Reject duplicate documentIds
    let errDup;
    try {
      await Comparison.create({ createdBy: user._id, documentIds: [doc1._id, doc1._id] });
    } catch (err) {
      errDup = err;
    }
    expect(errDup).toBeDefined();
    expect(errDup.name).toBe('ValidationError');

    // Accept 2 distinct IDs
    const validComp = await Comparison.create({
      createdBy: user._id,
      documentIds: [doc1._id, doc2._id],
      title: 'Policy Comparison 2026'
    });

    expect(validComp.documentIds.length).toBe(2);
    expect(validComp.title).toBe('Policy Comparison 2026');
  });
});

describe('10. Error Handler Middleware Integration Unit Tests', () => {
  test('Maps CastError, ValidationError, DuplicateKeyError, and AppError to correct 400/409/418 statuses and envelope', async () => {
    const mockRouter = express.Router();

    // Trigger CastError
    mockRouter.get('/cast-error', async (req, res, next) => {
      try {
        await Document.findById('invalid-mongo-id');
      } catch (err) {
        next(err);
      }
    });

    // Trigger ValidationError
    mockRouter.get('/validation-error', async (req, res, next) => {
      try {
        await User.create({ name: '', email: 'bad-email' });
      } catch (err) {
        next(err);
      }
    });

    // Trigger Duplicate Key Error
    mockRouter.get('/duplicate-error', async (req, res, next) => {
      try {
        const err = new Error('E11000 duplicate key error');
        err.code = 11000;
        err.keyValue = { email: 'duplicate@example.com' };
        throw err;
      } catch (err) {
        next(err);
      }
    });

    // Trigger Custom AppError 418
    mockRouter.get('/custom-app-error', (req, res, next) => {
      next(new AppError('I am a teapot', 418));
    });

    const testApp = createApp({
      routers: [{ path: '/api/_test', router: mockRouter }]
    });

    // 1. Assert CastError (400)
    const resCast = await request(testApp).get('/api/_test/cast-error');
    expect(resCast.status).toBe(400);
    expect(resCast.body.success).toBe(false);
    expect(resCast.body.error.code).toBe('CAST_ERROR');
    expect(resCast.body.error.message).toContain('Invalid _id: invalid-mongo-id');

    // 2. Assert ValidationError (400)
    const resVal = await request(testApp).get('/api/_test/validation-error');
    expect(resVal.status).toBe(400);
    expect(resVal.body.success).toBe(false);
    expect(resVal.body.error.code).toBe('VALIDATION_ERROR');
    expect(Array.isArray(resVal.body.error.details)).toBe(true);

    // 3. Assert Duplicate Key Error (409)
    const resDup = await request(testApp).get('/api/_test/duplicate-error');
    expect(resDup.status).toBe(409);
    expect(resDup.body.success).toBe(false);
    expect(resDup.body.error.code).toBe('DUPLICATE_KEY_ERROR');
    expect(resDup.body.error.message).toContain('Duplicate value \'duplicate@example.com\'');

    // 4. Assert AppError 418
    const resAppErr = await request(testApp).get('/api/_test/custom-app-error');
    expect(resAppErr.status).toBe(418);
    expect(resAppErr.body.success).toBe(false);
    expect(resAppErr.body.error.code).toBe('HTTP_418');
    expect(resAppErr.body.error.message).toBe('I am a teapot');
  });
});
