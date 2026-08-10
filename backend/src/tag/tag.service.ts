import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Tag, TagCategory } from '@prisma/client';

// 创建标签参数
interface CreateTagParams {
  name: string;
  category: TagCategory;
  color?: string;
}

// 更新标签参数
interface UpdateTagParams {
  name?: string;
  category?: TagCategory;
  color?: string;
}
@Injectable()
export class TagService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 获取所有标签
   */
  async getAllTags() {
    return this.prisma.tag.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * 按分类获取标签
   */
  async getTagsByCategory(category: TagCategory) {
    return this.prisma.tag.findMany({
      where: { category },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * 获取标签详情
   */
  async getTagById(id: number) {
    return this.prisma.tag.findUnique({
      where: { id },
    });
  }

  /**
   * 创建标签
   */
  async createTag(data: CreateTagParams) {
    return this.prisma.tag.create({
      data,
    });
  }

  /**
   * 更新标签
   */
  async updateTag(id: number, data: UpdateTagParams) {
    return this.prisma.tag.update({
      where: { id },
      data,
    });
  }

  /**
   * 删除标签
   */
  async deleteTag(id: number) {
    // 先删除菜品和标签的关联
    await this.prisma.dishTag.deleteMany({
      where: { tagId: id },
    });

    // 再删除标签
    return this.prisma.tag.delete({
      where: { id },
    });
  }
}
