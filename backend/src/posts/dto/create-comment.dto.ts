import { IsString, MinLength } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @MinLength(1, { message: '댓글 내용을 입력하세요.' })
  content: string;
}
