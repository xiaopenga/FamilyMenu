import { Module } from '@nestjs/common';
import { TagController } from './tag.controller';
import { TagService } from './tag.service';
import { PrismaService } from '../prisma.service';
import { UserModule } from '../user/user.module';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Module({
  imports: [UserModule],
  controllers: [TagController],
  providers: [TagService, PrismaService, JwtAuthGuard],
})
export class TagModule {}
