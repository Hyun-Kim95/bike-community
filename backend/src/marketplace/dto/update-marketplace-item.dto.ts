import { IsString, IsNumber, IsArray, IsOptional, IsEnum, MinLength, MaxLength, Min } from 'class-validator';
import { SaleStatus } from '../entities/marketplace-item.entity';

export class UpdateMarketplaceItemDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  category?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsString()
  @MinLength(1)
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageUrls?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(100)
  region?: string;

  @IsOptional()
  @IsEnum(SaleStatus)
  saleStatus?: SaleStatus;
}
