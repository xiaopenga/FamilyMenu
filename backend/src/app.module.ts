import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';
import { UserModule } from './user/user.module';
import { DishModule } from './dish/dish.module';
import { TagModule } from './tag/tag.module';
import { UploadModule } from './upload/upload.module';

@Module({
  imports: [UserModule, DishModule, TagModule, UploadModule],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
