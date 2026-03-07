import { IsString, IsIn, IsOptional, MaxLength } from 'class-validator';
import { ReportTargetType } from '../entities/report.entity';

export class CreateReportDto {
  @IsString()
  @IsIn(Object.values(ReportTargetType))
  targetType: ReportTargetType;

  @IsString()
  targetId: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  reason?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  detail?: string | null;
}
