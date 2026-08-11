import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { UserModule } from '../user/user.module';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Module({
  imports: [UserModule],
  controllers: [UploadController],
  providers: [JwtAuthGuard],
})
export class UploadModule {}
