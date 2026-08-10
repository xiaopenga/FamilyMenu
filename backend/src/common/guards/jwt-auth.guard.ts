import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { UserService } from '../../user/user.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly userService: UserService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1.获取请求对象
    const request = context.switchToHttp().getRequest(); //从执行上下文里拿到 HTTP 请求对象

    // 2.从请求头里拿 token
    const authorization: string = request.headers.authorization;
    if (!authorization) {
      throw new UnauthorizedException('请先登录');
    }

    // 3.解析token（格式是 "Bearer xxx"）
    const token = authorization.replace('Bearer ', '');
    if (!token) {
      throw new UnauthorizedException('请先登录');
    }

    try {
      // 4. 验证 token 是否有效
      const secret = process.env.JWT_SECRET as string;
      const payload = jwt.verify(token, secret) as { userId: number };

      // 5. 根据 userId 查用户信息
      const user = await this.userService.getUserById(payload.userId);
      if (!user) {
        throw new UnauthorizedException('用户不存在');
      }
      // 6. 把用户信息挂到 request 上，后面的 Controller 里直接 request.user 就能拿到当前登录的用户，不用再查一遍
      request.user = user;
      // 7. 返回 true，放行
      return true;
    } catch (error) {
      throw new UnauthorizedException('登录已过期，请重新登录');
    }
  }
}
