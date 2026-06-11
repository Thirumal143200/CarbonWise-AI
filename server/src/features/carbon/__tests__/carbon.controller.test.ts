import express from 'express';
import request from 'supertest';
import { create, getById, list, update, remove, summary } from '../carbon.controller';
import * as carbonRepo from '../carbon.repository';
import { errorHandler } from '../../../middleware/error-handler.middleware';

jest.mock('../carbon.repository', () => ({
  createEntry: jest.fn(),
  findEntryById: jest.fn(),
  listEntries: jest.fn(),
  updateEntry: jest.fn(),
  deleteEntry: jest.fn(),
  getCategorySummary: jest.fn(),
  getDailyTotals: jest.fn(),
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
app.post('/carbon', create);
app.get('/carbon', list);
app.get('/carbon/summary', summary);
app.get('/carbon/:id', getById);
app.put('/carbon/:id', update);
app.delete('/carbon/:id', remove);
app.use(errorHandler);

describe('Carbon Controller & Service Integration', () => {
  const mockEntryRow = {
    id: 'entry-1',
    user_id: 'user-123',
    category: 'transportation',
    subcategory: 'car',
    amount: 100,
    unit: 'km',
    emissions_kg: 20, // 100 * 0.2 factor
    entry_date: new Date('2024-01-01'),
    metadata: { note: 'commute' },
    created_at: new Date('2024-01-01T00:00:00Z'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /carbon', () => {
    it('should calculate emissions and return 201 on success', async () => {
      jest.spyOn(carbonRepo, 'createEntry').mockResolvedValue(mockEntryRow);

      const res = await request(app)
        .post('/carbon')
        .send({
          category: 'transportation',
          subcategory: 'car',
          amount: 100,
          unit: 'km',
          entryDate: '2024-01-01',
        })
        .expect(201);

      expect(carbonRepo.createEntry).toHaveBeenCalledWith(
        'user-123',
        'transportation',
        'car',
        100,
        'km',
        expect.any(Number), // emissions calculated
        '2024-01-01',
        {}
      );
      expect(res.body.success).toBe(true);
      expect(res.body.data.entry.id).toBe('entry-1');
      expect(res.body.data.entry.emissionsKg).toBe(20);
    });

    it('should return 400 validation error if subcategory is unknown', async () => {
      await request(app)
        .post('/carbon')
        .send({
          category: 'transportation',
          subcategory: 'rocket-ship',
          amount: 100,
          unit: 'km',
          entryDate: '2024-01-01',
        })
        .expect(400);
    });
  });

  describe('GET /carbon/:id', () => {
    it('should return the entry on success', async () => {
      jest.spyOn(carbonRepo, 'findEntryById').mockResolvedValue(mockEntryRow);

      const res = await request(app).get('/carbon/entry-1').expect(200);

      expect(carbonRepo.findEntryById).toHaveBeenCalledWith('entry-1', 'user-123');
      expect(res.body.data.entry.id).toBe('entry-1');
    });

    it('should return 404 if not found', async () => {
      jest.spyOn(carbonRepo, 'findEntryById').mockResolvedValue(null);

      await request(app).get('/carbon/entry-999').expect(404);
    });
  });

  describe('GET /carbon', () => {
    it('should list all entries with pagination metadata', async () => {
      jest.spyOn(carbonRepo, 'listEntries').mockResolvedValue({
        entries: [mockEntryRow],
        total: 1,
      });

      const res = await request(app).get('/carbon?page=1&limit=10').expect(200);

      expect(carbonRepo.listEntries).toHaveBeenCalledWith('user-123', expect.objectContaining({
        page: 1,
        limit: 10,
      }));
      expect(res.body.data.entries.length).toBe(1);
      expect(res.body.meta).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      });
    });
  });

  describe('PUT /carbon/:id', () => {
    it('should return 404 if entry to update does not exist', async () => {
      jest.spyOn(carbonRepo, 'findEntryById').mockResolvedValue(null);

      await request(app).put('/carbon/entry-1').send({ amount: 50 }).expect(404);
    });

    it('should update amount, recalculate emissions, and return the entry', async () => {
      jest.spyOn(carbonRepo, 'findEntryById').mockResolvedValue(mockEntryRow);
      jest.spyOn(carbonRepo, 'updateEntry').mockResolvedValue({
        ...mockEntryRow,
        amount: 50,
        emissions_kg: 10, // recalculated: 50 * 0.2
      });

      const res = await request(app).put('/carbon/entry-1').send({ amount: 50 }).expect(200);

      expect(carbonRepo.updateEntry).toHaveBeenCalledWith(
        'entry-1',
        'user-123',
        expect.objectContaining({
          amount: 50,
          emissions_kg: expect.any(Number),
        })
      );
      expect(res.body.data.entry.emissionsKg).toBe(10);
    });
  });

  describe('DELETE /carbon/:id', () => {
    it('should delete successfully and return 200', async () => {
      jest.spyOn(carbonRepo, 'deleteEntry').mockResolvedValue(true);

      await request(app).delete('/carbon/entry-1').expect(200);

      expect(carbonRepo.deleteEntry).toHaveBeenCalledWith('entry-1', 'user-123');
    });

    it('should return 404 if delete target is not found', async () => {
      jest.spyOn(carbonRepo, 'deleteEntry').mockResolvedValue(false);

      await request(app).delete('/carbon/entry-999').expect(404);
    });
  });

  describe('GET /carbon/summary', () => {
    it('should compute and return category breakdown and trend', async () => {
      jest.spyOn(carbonRepo, 'getCategorySummary').mockResolvedValue([
        { category: 'transportation', total_kg: 20 },
      ]);
      jest.spyOn(carbonRepo, 'getDailyTotals').mockResolvedValue([
        { entry_date: '2024-01-01', total_kg: 20 },
      ]);
      jest.spyOn(carbonRepo, 'getTotalEmissions').mockResolvedValue(20);

      const res = await request(app).get('/carbon/summary?period=weekly').expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.totalKg).toBe(20);
      expect(res.body.data.breakdown).toEqual([{ category: 'transportation', totalKg: 20, percentage: 100 }]);
      expect(res.body.data.trend).toEqual([{ date: '2024-01-01', totalKg: 20 }]);
    });
  });
});
