import { IsString, IsOptional, MinLength } from 'class-validator';

export class SendMessageDto {
  @IsString()
  @MinLength(1, { message: '메시지를 입력하세요.' })
  content: string;

  @IsOptional()
  @IsString()
  imageUrl?: string | null;
}
