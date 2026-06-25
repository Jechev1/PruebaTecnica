import { GetTopProducts } from '../../src/application/GetTopProducts';
import { IProductRepository, ProductFilters } from '../../src/domain/ports/IProductRepository';
import { TopProduct } from '../../src/domain/entities/TopProduct';
import { ValidationError } from '../../src/domain/errors/AppError';

const mockProducts: TopProduct[] = [
  {
    productId: 'p-001',
    categoryName: 'esportes_lazer',
    categoryNameEnglish: 'sports_leisure',
    gmv: 5000,
    revenue: 4800,
  },
  {
    productId: 'p-002',
    categoryName: 'informatica_acessorios',
    categoryNameEnglish: 'computers_accessories',
    gmv: 3000,
    revenue: 2900,
  },
];

const mockRepo: IProductRepository = {
  getTopProducts: jest.fn().mockResolvedValue(mockProducts),
};

describe('GetTopProducts', () => {
  const useCase = new GetTopProducts(mockRepo);

  beforeEach(() => jest.clearAllMocks());

  it('returns ranked products for a valid request', async () => {
    const filters: ProductFilters = { from: '2017-01-01', to: '2017-12-31', metric: 'gmv', limit: 10 };
    const result = await useCase.execute(filters);
    expect(result).toHaveLength(2);
    expect(result[0].gmv).toBe(5000);
  });

  it('passes the metric and limit to the repository unchanged', async () => {
    const filters: ProductFilters = { from: '2017-01-01', to: '2017-12-31', metric: 'revenue', limit: 5 };
    await useCase.execute(filters);
    expect(mockRepo.getTopProducts).toHaveBeenCalledWith(filters);
  });

  it('throws ValidationError for an unknown metric', async () => {
    await expect(
      useCase.execute({ from: '2017-01-01', to: '2017-12-31', metric: 'profit' as 'gmv', limit: 10 }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('throws ValidationError when limit is 0', async () => {
    await expect(
      useCase.execute({ from: '2017-01-01', to: '2017-12-31', metric: 'revenue', limit: 0 }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('throws ValidationError when limit exceeds 100', async () => {
    await expect(
      useCase.execute({ from: '2017-01-01', to: '2017-12-31', metric: 'revenue', limit: 101 }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('throws ValidationError when from is missing', async () => {
    await expect(
      useCase.execute({ from: '', to: '2017-12-31', metric: 'revenue', limit: 10 }),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});
