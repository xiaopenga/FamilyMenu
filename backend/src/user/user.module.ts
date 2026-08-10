import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { PrismaService } from '../prisma.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Module({
  controllers: [UserController],
  providers: [UserService, PrismaService, JwtAuthGuard],
  exports: [UserService], // 导出 UserService，其他模块也能用
})
export class UserModule {}
