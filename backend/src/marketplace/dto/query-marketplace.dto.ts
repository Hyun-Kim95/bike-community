import { IsOptional, IsIn, IsInt, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { SaleStatus } from '../entities/marketplace-item.entity';

export class QueryMarketplaceDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 20;

  @IsOptional()
  @IsIn(['latest', 'popular'])
  sort?: 'latest' | 'popular' = 'latest';

  @IsOptional()
  category?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  region?: string;

  @IsOptional()
  @IsIn([SaleStatus.ON_SALE, SaleStatus.RESERVED, SaleStatus.SOLD])
  saleStatus?: SaleStatus;
}
