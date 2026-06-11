import express from 'express';
import request from 'supertest';
import { create, list, getById, update, remove } from '../goals.controller';
import { query, queryOne } from '../../../config/database';
import * as carbonRepo from '../../carbon/carbon.repository';
import { errorHandler } from '../../../middleware/error-handler.middleware';

jest.mock('../../../config/database', () => ({
  query: jest.fn(),
  queryOne: jest.fn(),
}));

jest.mock('../../carbon/carbon.repository', () => ({
  getTotalEmissions: jest.fn(),
}));

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
app.post('/goals', create);
app.get('/goals', list);
app.get('/goals/:id', getById);
app.put('/goals/:id', update);
app.delete('/goals/:id', remove);
app.use(errorHandler);

describe('Goals Controller', () => {
  const mockGoalRow = {
    id: 'g-1',
    user_id: 'user-123',
    title: 'Cut Commute',
    target_reduction_pct: 10,
    baseline_kg: 100,
    start_date: new Date('2024-01-01'),
    end_date: new Date('2024-02-01'),
    status: 'active',
    created_at: new Date('2024-01-01T00:00:00Z'),
    updated_at: new Date('2024-01-01T00:00:00Z'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should calculate baseline and create new goal', async () => {
      jest.spyOn(carbonRepo, 'getTotalEmissions').mockResolvedValue(100);
      (query as jest.Mock).mockResolvedValue([mockGoalRow]);

      const res = await request(app)
        .post('/goals')
        .send({
          title: 'Cut Commute',
          targetReductionPct: 10,
          startDate: '2024-01-01',
          endDate: '2024-02-01',
        })
        .expect(201);

      expect(carbonRepo.getTotalEmissions).toHaveBeenCalledWith('user-123', '2024-01-01', '2024-02-01');
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO goals'),
        ['user-123', 'Cut Commute', 10, 100, '2024-01-01', '2024-02-01']
      );
      expect(res.body.success).toBe(true);
      expect(res.body.data.goal.title).toBe('Cut Commute');
      expect(res.body.data.goal.baselineKg).toBe(100);
    });
  });

  describe('list', () => {
    it('should list all goals for the user with calculated progress', async () => {
      (query as jest.Mock).mockResolvedValue([mockGoalRow]);
      jest.spyOn(carbonRepo, 'getTotalEmissions').mockResolvedValue(95); // 5% reduction, target 10%, progress is 50%

      const res = await request(app).get('/goals').expect(200);

      expect(query).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM goals'), ['user-123']);
      expect(res.body.success).toBe(true);
      expect(res.body.data.goals.length).toBe(1);
      expect(res.body.data.goals[0].progressPct).toBe(50);
    });

    it('should list goals filtered by status', async () => {
      (query as jest.Mock).mockResolvedValue([mockGoalRow]);
      jest.spyOn(carbonRepo, 'getTotalEmissions').mockResolvedValue(95);

      await request(app).get('/goals?status=active').expect(200);

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE user_id = $1 AND status = $2'),
        ['user-123', 'active']
      );
    });
  });

  describe('getById', () => {
    it('should return 404 if goal is not found', async () => {
      (queryOne as jest.Mock).mockResolvedValue(null);

      await request(app).get('/goals/g-999').expect(404);
    });

    it('should return a single goal with progress details', async () => {
      (queryOne as jest.Mock).mockResolvedValue(mockGoalRow);
      jest.spyOn(carbonRepo, 'getTotalEmissions').mockResolvedValue(90); // 10% reduction, target 10%, progress is 100%

      const res = await request(app).get('/goals/g-1').expect(200);

      expect(queryOne).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM goals'), ['g-1', 'user-123']);
      expect(res.body.data.goal.progressPct).toBe(100);
    });
  });

  describe('update', () => {
    it('should return 400 if no fields to update are provided', async () => {
      await request(app).put('/goals/g-1').send({}).expect(400);
    });

    it('should return 404 if goal to update is not found', async () => {
      (queryOne as jest.Mock).mockResolvedValue(null);

      await request(app).put('/goals/g-1').send({ title: 'New title' }).expect(404);
    });

    it('should update and return the goal', async () => {
      (queryOne as jest.Mock).mockResolvedValue({
        ...mockGoalRow,
        title: 'New title',
      });

      const res = await request(app)
        .put('/goals/g-1')
        .send({ title: 'New title' })
        .expect(200);

      expect(queryOne).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE goals SET title = $1'),
        ['New title', 'g-1', 'user-123']
      );
      expect(res.body.data.goal.title).toBe('New title');
    });
  });

  describe('remove', () => {
    it('should delete and return 200 on success', async () => {
      (query as jest.Mock).mockResolvedValue([{ id: 'g-1' }]);

      await request(app).delete('/goals/g-1').expect(200);

      expect(query).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM goals'), ['g-1', 'user-123']);
    });

    it('should return 404 if goal to delete is not found', async () => {
      (query as jest.Mock).mockResolvedValue([]);

      await request(app).delete('/goals/g-999').expect(404);
    });
  });
});
