import { IsString, IsNumber, IsArray, MinLength, MaxLength, Min } from 'class-validator';

export class CreateMarketplaceItemDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @IsString()
  @MaxLength(50)
  category: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsString()
  @MinLength(1)
  description: string;

  @IsArray()
  @IsString({ each: true })
  imageUrls: string[];

  @IsString()
  @MaxLength(100)
  region: string;
}
