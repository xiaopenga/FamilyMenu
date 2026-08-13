import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { HistoryService } from './history.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('history')
@UseGuards(JwtAuthGuard)
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  // 保存今日点餐到历史记录
  @Post('save')
  async saveHistory(@Req() req: any, @Body() body: { dishIds: number[] }) {
    return this.historyService.saveHistory(req.user.id, body.dishIds);
  }

  // 获取某月的历史记录
  @Get('month')
  async getMonthHistory(
    @Req() req: any,
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    return this.historyService.getMonthHistory(
      req.user.id,
      parseInt(year, 10),
      parseInt(month, 10),
    );
  }

  // 获取某天的历史记录
  @Get('day')
  async getDayHistory(@Req() req: any, @Query('date') date: string) {
    return this.historyService.getDayHistory(req.user.id, date);
  }

  // 获取最近 3 天吃过的菜品 ID
  @Get('recent-dishes')
  async getRecentDishIds(@Req() req: any, @Query('days') days?: string) {
    const d = days ? parseInt(days, 10) : 3;
    return this.historyService.getRecentDishIds(req.user.id, d);
  }
}
