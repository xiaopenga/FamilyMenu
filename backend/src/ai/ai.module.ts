import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { PrismaService } from '../prisma.service';
import { UserModule } from '../user/user.module';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Module({
  imports: [UserModule],
  controllers: [AiController],
  providers: [AiService, PrismaService, JwtAuthGuard],
})
export class AiModule {}
