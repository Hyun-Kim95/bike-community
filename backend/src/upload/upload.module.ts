import { Module } from '@nestjs/common';

/**
 * S3 업로드 서비스는 추후 구현.
 * - multipart/form-data 처리
 * - 이미지 리사이즈(선택)
 * - presigned URL 또는 직접 업로드
 */
@Module({
  imports: [],
  providers: [],
  exports: [],
})
export class UploadModule {}
