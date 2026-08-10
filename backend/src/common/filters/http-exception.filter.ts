import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // 判断是不是 HttpException（我们自己抛的业务异常）
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse: any = exception.getResponse();

      response.status(status).json({
        code: status,
        message:
          typeof exceptionResponse === 'string'
            ? exceptionResponse
            : exceptionResponse.message,
        data: null,
      });
    } else {
      // 其他异常（比如数据库报错、代码 bug）
      console.error('服务器内部错误:', exception);

      response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        code: 500,
        message: '服务器内部错误',
        data: null,
      });
    }
  }
}
