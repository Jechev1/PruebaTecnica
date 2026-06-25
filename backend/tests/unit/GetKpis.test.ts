import { GetKpis } from '../../src/application/GetKpis';
import { IKpiRepository, KpiFilters } from '../../src/domain/ports/IKpiRepository';
import { KpiResult } from '../../src/domain/entities/KpiResult';
import { ValidationError } from '../../src/domain/errors/AppError';

const mockResult: KpiResult = {
  gmv: 10000,
  totalShipping: 500,
  revenue: 9500,
  orders: 100,
  totalItems: 150,
  canceledOrders: 5,
  deliveredOrders: 80,
  onTimeCount: 70,
  aov: 95,
  itemsPerOrder: 1.5,
  cancellationRate: 0.05,
  onTimeDeliveryRate: 0.875,
};

const mockRepo: IKpiRepository = {
  getKpis: jest.fn().mockResolvedValue(mockResult),
};

describe('GetKpis', () => {
  const useCase = new GetKpis(mockRepo);

  beforeEach(() => jest.clearAllMocks());

  it('returns aggregated KPIs for a valid range', async () => {
    const filters: KpiFilters = { from: '2017-01-01', to: '2017-12-31' };
    const result = await useCase.execute(filters);
    expect(result.gmv).toBe(10000);
    expect(result.aov).toBe(95);
    expect(mockRepo.getKpis).toHaveBeenCalledWith(filters);
  });

  it('passes optional filters down to the repository unchanged', async () => {
    const filters: KpiFilters = {
      from: '2017-01-01',
      to: '2017-12-31',
      orderStatus: 'delivered',
      customerState: 'SP',
    };
    await useCase.execute(filters);
    expect(mockRepo.getKpis).toHaveBeenCalledWith(filters);
  });

  it('throws ValidationError when from is missing', async () => {
    await expect(useCase.execute({ from: '', to: '2017-12-31' })).rejects.toBeInstanceOf(
      ValidationError,
    );
  });

  it('throws ValidationError when from is after to', async () => {
    await expect(
      useCase.execute({ from: '2018-01-01', to: '2017-01-01' }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('throws ValidationError when range exceeds 730 days', async () => {
    await expect(
      useCase.execute({ from: '2015-01-01', to: '2018-12-31' }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('throws ValidationError for invalid date format', async () => {
    await expect(
      useCase.execute({ from: 'not-a-date', to: '2017-12-31' }),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});
