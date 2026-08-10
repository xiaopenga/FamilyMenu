import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import axios from 'axios';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 微信登录
   * @param code 前端传来的 code
   * @returns token 和用户信息
   */
  async wechatLogin(code: string) {
    // 1.code 换 openid
    const openid = await this.getOpenidByCode(code);

    // 2.用 openid 查询数据库看用户是否存在
    let user = await this.prisma.user.findUnique({
      where: { openid },
    });

    // 3.不存在则创建新用户
    if (!user) {
      user = await this.prisma.user.create({
        data: { openid },
      });
    }

    // 4.生成 JWT Token
    const token = this.generateToken(user.id);

    return {
      token,
      user: {
        id: user.id,
        nickname: user.nickname,
        avatar: user.avatar,
        role: user.role,
      },
    };
  }

  /**
   * 用 code 换取 openid
   */
  private async getOpenidByCode(code: string): Promise<string> {
    const appid = process.env.WECHAT_APPID;
    const secret = process.env.WECHAT_SECRET;

    // 调用微信 api
    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appid}&secret=${secret}&js_code=${code}&grant_type=authorization_code`;

    const response = await axios.get(url);
    const { openid, errcode, errmsg } = response.data;

    if (errcode) {
      throw new Error(`微信登录失败: ${errmsg}`);
    }

    return openid;
  }

  /**
   * 生成 JWT token
   */
  private generateToken(userId: number): string {
    const secret = process.env.JWT_SECRET as string;
    // token 有效期 7 天
    return jwt.sign({ userId }, secret, { expiresIn: '7d' });
  }

  /**
   * 根据 id 获取用户信息
   */
  async getUserById(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  /**
   * 更新用户信息
   */
  async updateUserInfo(
    userId: number,
    data: { nickname?: string; avatar?: string },
  ) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
      // 返回哪些字段
      select: {
        id: true,
        nickname: true,
        avatar: true,
        role: true,
      },
    });
  }
}
