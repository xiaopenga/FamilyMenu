import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  Patch,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * 微信登录接口
   * POST /user/wechat-login
   */
  @Post('wechat-login')
  async wechatLogin(@Body() body: { code: string }) {
    const result = await this.userService.wechatLogin(body.code);
    return {
      code: 0,
      message: '登录成功',
      data: result,
    };
  }

  /**
   * 获取用户信息（需要登录）
   */
  @Get('info')
  @UseGuards(JwtAuthGuard)
  getUserInfo(@Req() req: any) {
    return {
      id: req.user.id,
      nickname: req.user.nickname,
      avatar: req.user.avatar,
      role: req.user.role,
    };
  }

  /**
   * 更新用户信息（需要登录）
   */
  @Patch('info')
  @UseGuards(JwtAuthGuard)
  updateUserInfo(
    @Req() req: any,
    @Body() body: { nickname?: string; avatar?: string },
  ) {
    return this.userService.updateUserInfo(req.user.id, body);
  }
}
