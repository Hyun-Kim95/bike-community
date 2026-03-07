import { IsString, IsOptional, MaxLength, IsArray, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  nickname?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interestCategories?: string[] | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  region?: string | null;
}
