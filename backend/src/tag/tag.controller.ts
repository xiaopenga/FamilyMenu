import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TagService } from './tag.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TagCategory } from '@prisma/client';

// 创建标签 DTO
interface CreateTagDto {
  name: string;
  category: TagCategory;
  color?: string;
}

// 更新标签 DTO
interface UpdateTagDto {
  name?: string;
  category?: TagCategory;
  color?: string;
}

@Controller('tag')
export class TagController {
  constructor(private readonly tagService: TagService) {}

  /**
   * 获取所有标签（需要登录）
   */
  @Get('list')
  @UseGuards(JwtAuthGuard)
  async getAllTags(@Query('category') category?: TagCategory) {
    if (category) {
      return this.tagService.getTagsByCategory(category);
    }
    return this.tagService.getAllTags();
  }

  /**
   * 获取标签详情（需要登录）
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getTagDetail(@Param('id') id: string) {
    const tagId = parseInt(id, 10);
    return this.tagService.getTagById(tagId);
  }

  /**
   * 创建标签（需要登录）
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  async createTag(@Body() body: CreateTagDto) {
    return this.tagService.createTag(body);
  }

  /**
   * 更新标签（需要登录）
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async updateTag(@Param('id') id: string, @Body() body: UpdateTagDto) {
    const tagId = parseInt(id, 10);
    return this.tagService.updateTag(tagId, body);
  }

  /**
   * 删除标签（需要登录）
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteTag(@Param('id') id: string) {
    const tagId = parseInt(id, 10);
    return this.tagService.deleteTag(tagId);
  }
}
