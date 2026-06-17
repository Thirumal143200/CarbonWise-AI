import express from 'express';
import request from 'supertest';
import { generateRecommendation, listRecommendations, chat } from '../ai.controller';
import { query } from '../../../config/database';
import { generateContent } from '../gemini.client';
import * as carbonRepo from '../../carbon/carbon.repository';
import { errorHandler } from '../../../middleware/error-handler.middleware';

// Mock database query method
jest.mock('../../../config/database', () => ({
  query: jest.fn(),
  queryOne: jest.fn(),
}));

// Mock Gemini client generateContent
jest.mock('../gemini.client', () => ({
  generateContent: jest.fn(),
}));

// Mock carbon repository methods
jest.mock('../../carbon/carbon.repository', () => ({
  getRecentEntries: jest.fn(),
  getCategorySummary: jest.fn(),
}));

// Mock logger
jest.mock('../../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Setup test router
const app = express();
app.use(express.json());
// Inject mock userId middleware
app.use((req, _res, next) => {
  req.userId = 'user-123';
  next();
});

app.post('/ai/recommendations', generateRecommendation);
app.get('/ai/recommendations', listRecommendations);
app.post('/ai/chat', chat);
app.use(errorHandler);

describe('AI Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /ai/recommendations', () => {
    it('should return cached recommendation if it exists and is fresh', async () => {
      const mockCachedRow = {
        id: 'rec-1',
        user_id: 'user-123',
        prompt: 'test-prompt',
        response: JSON.stringify({ advice: 'ride a bike' }),
        recommendation_type: 'reduction_advice',
        created_at: new Date(), // fresh
      };

      (query as jest.Mock).mockResolvedValue([mockCachedRow]);

      const res = await request(app)
        .post('/ai/recommendations')
        .send({ type: 'reduction_advice' })
        .expect(200);

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM ai_recommendations'),
        ['user-123', 'reduction_advice', 1]
      );
      expect(res.body.success).toBe(true);
      expect(res.body.data.recommendation).toEqual({ advice: 'ride a bike' });
      expect(res.body.data.cached).toBe(true);
    });

    it('should generate new recommendation and cache it if no fresh cache exists', async () => {
      // Return empty database cache
      (query as jest.Mock).mockResolvedValue([]);
      
      // Mock carbon repository calls
      (carbonRepo.getRecentEntries as jest.Mock).mockResolvedValue([]);
      (carbonRepo.getCategorySummary as jest.Mock).mockResolvedValue([]);

      // Mock Gemini completion response
      (generateContent as jest.Mock).mockResolvedValue({
        text: JSON.stringify({ recommendations: [{ title: 'Eat veggies', impact: 'medium', description: 'desc' }] }),
      });

      const res = await request(app)
        .post('/ai/recommendations')
        .send({ type: 'reduction_advice' })
        .expect(200);

      expect(generateContent).toHaveBeenCalled();
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO ai_recommendations'),
        expect.any(Array)
      );
      expect(res.body.success).toBe(true);
      expect(res.body.data.cached).toBe(false);
      expect(res.body.data.recommendation.recommendations[0].title).toBe('Eat veggies');
    });
  });

  describe('GET /ai/recommendations', () => {
    it('should list historical recommendations', async () => {
      const mockHistoryRow = {
        id: 'rec-1',
        recommendation_type: 'weekly_plan',
        response: JSON.stringify({ title: 'Weekly Plan' }),
        created_at: new Date('2026-06-01T00:00:00Z'),
      };

      (query as jest.Mock).mockResolvedValue([mockHistoryRow]);

      const res = await request(app)
        .get('/ai/recommendations?type=weekly_plan&limit=5')
        .expect(200);

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM ai_recommendations'),
        ['user-123', 'weekly_plan', 5]
      );
      expect(res.body.success).toBe(true);
      expect(res.body.data.recommendations.length).toBe(1);
      expect(res.body.data.recommendations[0].id).toBe('rec-1');
      expect(res.body.data.recommendations[0].content).toEqual({ title: 'Weekly Plan' });
    });
  });

  describe('POST /ai/chat', () => {
    it('should trigger Gemini coach chat and save conversation history', async () => {
      (carbonRepo.getRecentEntries as jest.Mock).mockResolvedValue([]);
      (generateContent as jest.Mock).mockResolvedValue({
        text: 'Save electricity!',
      });

      const res = await request(app)
        .post('/ai/chat')
        .send({ message: 'Hello' })
        .expect(200);

      expect(generateContent).toHaveBeenCalledWith(expect.stringContaining('Hello'));
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO ai_recommendations'),
        ['user-123', 'Hello', 'Save electricity!', 'chat']
      );
      expect(res.body.success).toBe(true);
      expect(res.body.data.response).toBe('Save electricity!');
    });
  });
});
