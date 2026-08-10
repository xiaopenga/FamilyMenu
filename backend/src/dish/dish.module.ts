import { Module } from '@nestjs/common';
import { DishController } from './dish.controller';
import { DishService } from './dish.service';
import { PrismaService } from '../prisma.service';
import { UserModule } from '../user/user.module';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Module({
  imports: [UserModule],
  controllers: [DishController],
  providers: [DishService, PrismaService, JwtAuthGuard],
})
export class DishModule {}
