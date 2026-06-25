import { GetRevenueTrend } from '../../src/application/GetRevenueTrend';
import { ITrendRepository, TrendFilters } from '../../src/domain/ports/ITrendRepository';
import { TrendPoint } from '../../src/domain/entities/TrendPoint';
import { ValidationError } from '../../src/domain/errors/AppError';

const mockPoints: TrendPoint[] = [
  { period: '2017-01-01', revenue: 1000, orders: 10 },
  { period: '2017-01-02', revenue: 1200, orders: 12 },
];

const mockRepo: ITrendRepository = {
  getRevenueTrend: jest.fn().mockResolvedValue(mockPoints),
};

describe('GetRevenueTrend', () => {
  const useCase = new GetRevenueTrend(mockRepo);

  beforeEach(() => jest.clearAllMocks());

  it('returns trend points for a valid day grain request', async () => {
    const filters: TrendFilters = { from: '2017-01-01', to: '2017-12-31', grain: 'day' };
    const result = await useCase.execute(filters);
    expect(result).toHaveLength(2);
    expect(result[0].period).toBe('2017-01-01');
  });

  it('accepts week grain for wider ranges (up to 730 days)', async () => {
    const filters: TrendFilters = { from: '2017-01-01', to: '2018-12-31', grain: 'week' };
    await useCase.execute(filters);
    expect(mockRepo.getRevenueTrend).toHaveBeenCalledWith(filters);
  });

  it('throws ValidationError when from is missing', async () => {
    await expect(
      useCase.execute({ from: '', to: '2017-12-31', grain: 'day' }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('throws ValidationError for invalid grain value', async () => {
    await expect(
      useCase.execute({ from: '2017-01-01', to: '2017-12-31', grain: 'month' as 'day' }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('throws ValidationError when day grain exceeds 365-day limit', async () => {
    await expect(
      useCase.execute({ from: '2016-01-01', to: '2018-12-31', grain: 'day' }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('throws ValidationError when from is after to', async () => {
    await expect(
      useCase.execute({ from: '2018-01-01', to: '2017-01-01', grain: 'day' }),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});
