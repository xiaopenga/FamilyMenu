import { Module } from '@nestjs/common';
import { HistoryController } from './history.controller';
import { HistoryService } from './history.service';
import { PrismaService } from '../prisma.service';
import { UserModule } from '../user/user.module';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Module({
  imports: [UserModule],
  controllers: [HistoryController],
  providers: [HistoryService, PrismaService, JwtAuthGuard],
})
export class HistoryModule {}
