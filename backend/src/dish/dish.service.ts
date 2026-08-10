import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Difficulty } from '@prisma/client'; // ① 导入枚举类型

// 新增菜品的参数类型
interface CreateDishParams {
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

// 更新菜品的参数类型
interface UpdateDishParams {
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

// 列表查询参数类型
interface GetDishListParams {
  page: number;
  pageSize: number;
  keyword?: string;
  tagIds?: number[];
}

@Injectable()
export class DishService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 获取菜品列表
   */
  async getDishList(params: {
    page: number;
    pageSize: number;
    keyword?: string;
    tagIds?: number[];
  }) {
    const { page, pageSize, keyword, tagIds } = params;

    // 创建查询条件
    const where: any = {};

    // 按菜名模糊搜索
    if (keyword) {
      where.name = {
        contains: keyword,
      };
    }

    // 按标签筛选
    if (tagIds && tagIds.length > 0) {
      where.tags = {
        some: {
          tagId: {
            in: tagIds,
          },
        },
      };
    }

    // 查询列表数据
    const list = await this.prisma.dish.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    // 查询总数
    const total = await this.prisma.dish.count({ where });

    return {
      list,
      total,
      page,
      pageSize,
    };
  }

  /**
   * 获取菜品详情
   */
  async getDishDetail(id: number) {
    return this.prisma.dish.findUnique({
      where: { id },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
          },
        },
      },
    });
  }

  /**
   * 新增菜品
   */
  async createDish(userId: number, data: CreateDishParams) {
    const { tagIds, ...dishData } = data;

    // 第一步：先创建菜品
    const dish = await this.prisma.dish.create({
      data: {
        ...dishData,
        createdById: userId,
      },
    });
    // 第二步：如果有标签，再添加标签关联
    if (tagIds && tagIds.length > 0) {
      await this.prisma.dishTag.createMany({
        data: tagIds.map((tagId) => ({
          dishId: dish.id,
          tagId,
        })),
      });
    }
  }

  /**
   * 更新菜品
   */
  async updataDish(userId: number, id: number, data: UpdateDishParams) {
    const { tagIds, ...dishData } = data;

    // 更新基本信息
    const dish = this.prisma.dish.update({
      where: { id },
      data: dishData,
    });

    // 如果传了 tagIds,则更新标签
    if (tagIds !== undefined) {
      // 先删掉旧标签
      await this.prisma.dishTag.deleteMany({
        where: { dishId: id },
      });

      // 再添加新标签
      if (tagIds.length > 0) {
        await this.prisma.dishTag.createMany({
          data: tagIds.map((tagId) => ({
            dishId: id,
            tagId,
          })),
        });
      }
    }
    return dish;
  }

  /**
   * 删除菜品
   */
  async deleteDish(id: number) {
    // 先删除关联标签
    await this.prisma.dishTag.deleteMany({
      where: { dishId: id },
    });

    // 删除菜品
    return this.prisma.dish.delete({
      where: { id },
    });
  }
}
