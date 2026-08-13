import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class HistoryService {
  constructor(private readonly prisma: PrismaService) {}

  // 保存今日点餐到历史记录
  async saveHistory(userId: number, dishIds: number[]) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 查找今天是否已有记录
    const existing = await this.prisma.history.findFirst({
      where: {
        selectedById: userId,
        date: today,
      },
    });

    if (existing) {
      // 更新已有记录
      return this.prisma.history.update({
        where: { id: existing.id },
        data: {
          dishIds: dishIds as any,
        },
      });
    } else {
      // 创建新记录
      return this.prisma.history.create({
        data: {
          date: today,
          dishIds: dishIds as any,
          selectedById: userId,
        },
      });
    }
  }

  // 获取某月的历史记录（用于日历视图）
  async getMonthHistory(userId: number, year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    endDate.setHours(23, 59, 59, 999);

    return this.prisma.history.findMany({
      where: {
        selectedById: userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        date: 'asc',
      },
    });
  }

  // 获取某天的历史记录（含菜品详情）
  async getDayHistory(userId: number, date: string) {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const endDate = new Date(targetDate);
    endDate.setHours(23, 59, 59, 999);

    const history = await this.prisma.history.findFirst({
      where: {
        selectedById: userId,
        date: {
          gte: targetDate,
          lte: endDate,
        },
      },
    });

    if (!history) {
      return { date, dishes: [] };
    }

    // 根据 dishIds 查询菜品详情
    const dishIds = (history.dishIds as number[]) || [];
    const dishes = await this.prisma.dish.findMany({
      where: {
        id: {
          in: dishIds,
        },
      },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    return {
      date: history.date,
      dishes,
    };
  }

  // 获取最近 N 天吃过的菜品 ID
  async getRecentDishIds(userId: number, days: number = 3) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);

    const histories = await this.prisma.history.findMany({
      where: {
        selectedById: userId,
        date: {
          gte: since,
        },
      },
      select: {
        dishIds: true,
      },
    });

    // 汇总所有菜品 ID，去重
    const dishIds = new Set<number>();
    histories.forEach((h) => {
      const ids = (h.dishIds as number[]) || [];
      ids.forEach((id) => dishIds.add(id));
    });

    return Array.from(dishIds);
  }
}
