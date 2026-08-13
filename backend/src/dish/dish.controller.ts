import {
  Controller,
  Get,
  Query,
  Param,
  Post,
  Put,
  Delete,
  UseGuards,
  Req,
  Body,
} from '@nestjs/common';
import { DishService } from './dish.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Difficulty } from '@prisma/client';

// 新增菜品 DTO
interface CreateDishDto {
  name: string;
  image?: string;
  description?: string;
  ingredients?: Array<{ name: string; amount?: string }>;
  steps?: string[];
  difficulty?: Difficulty;
  cookTime?: number;
  douyinUrl?: string;
  tagIds?: number[];
}

// 更新菜品 DTO
interface UpdateDishDto {
  name?: string;
  image?: string;
  description?: string;
  ingredients?: Array<{ name: string; amount?: string }>;
  steps?: string[];
  difficulty?: Difficulty;
  cookTime?: number;
  douyinUrl?: string;
  tagIds?: number[];
}
@Controller('dish')
export class DishController {
  constructor(private readonly dishService: DishService) {}

  /**
   * 菜品列表
   */
  @Get('list')
  async getDishList(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('keyword') keyword?: string,
    @Query('tagIds') tagIds?: string,
    @Query('mealType') mealType?: string, // ← 新增
  ) {
    // 手动转数字，有默认值
    const pageNum = page ? parseInt(page, 10) : 1;
    const pageSizeNum = pageSize ? parseInt(pageSize, 10) : 10;

    // 把 tagIds字符串转换成数字数组
    // 把 tagIds 字符串转成数字数组
    const tagIdArray = tagIds
      ? tagIds
          .split(',')
          .map((id) => parseInt(id, 10))
          .filter((id) => !isNaN(id) && id > 0) // 过滤掉 NaN 和小于等于 0 的
      : undefined;

    return this.dishService.getDishList({
      page: pageNum || 1,
      pageSize: pageSizeNum || 10,
      keyword,
      tagIds: tagIdArray,
      mealType, // ← 新增
    });
  }

  /**
   * 菜品详情
   */
  @Get(':id')
  async getDishDetail(@Param('id') id: string) {
    const dishId = parseInt(id, 10);
    return this.dishService.getDishDetail(dishId);
  }

  /**
   * 新增菜品（需要登录）
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  async createDish(@Req() req: any, @Body() body: CreateDishDto) {
    return this.dishService.createDish(req.user.id, body);
  }

  /**
   * 更新菜品（需要登录）
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async updateDish(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: UpdateDishDto,
  ) {
    const dishId = parseInt(id, 10);
    return this.dishService.updataDish(req.user.id, dishId, body);
  }

  /**
   * 删除菜品（需要登录）
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteDish(@Param('id') id: string) {
    const dishId = parseInt(id, 10);
    return this.dishService.deleteDish(dishId);
  }
}
