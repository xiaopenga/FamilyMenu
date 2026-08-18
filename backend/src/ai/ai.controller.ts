import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Delete,
  Req,
  UseGuards,
  Res,
} from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { Response } from 'express';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  // 创建新对话
  @Post('conversation')
  async createConversation(@Req() req: any) {
    return this.aiService.createConversation(req.user.id);
  }

  // 获取对话列表
  @Get('conversations')
  async getConversations(@Req() req: any) {
    return this.aiService.getConversationList(req.user.id);
  }

  // 获取对话的消息记录
  @Get('conversation/:id/messages')
  async getMessages(@Req() req: any, @Param('id') id: string) {
    return this.aiService.getConversationMessages(
      req.user.id,
      parseInt(id, 10),
    );
  }

  // 发送消息
  @Post('conversation/:id/send')
  async sendMessage(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { content: string },
  ) {
    return this.aiService.sendMessage(
      req.user.id,
      parseInt(id, 10),
      body.content,
    );
  }

  // 删除对话
  @Delete('conversation/:id')
  async deleteConversation(@Req() req: any, @Param('id') id: string) {
    return this.aiService.deleteConversation(req.user.id, parseInt(id, 10));
  }

  // 流式发送消息
  @Post('conversation/:id/stream')
  async streamMessage(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { content: string },
    @Res() res: Response,
  ) {
    return this.aiService.streamMessage(
      req.user.id,
      parseInt(id, 10),
      body.content,
      res,
    );
  }
}
