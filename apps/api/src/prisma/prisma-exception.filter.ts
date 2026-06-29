import { Catch, ExceptionFilter, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status: HttpStatus;
    let message: string;

    switch (exception.code) {
      case 'P2002':
        status = HttpStatus.CONFLICT;
        const target = exception.meta?.target as string[];
        message = `Unique constraint failed on fields: ${target.join(', ')}`;
        break;
      case 'P2025':
        status = HttpStatus.NOT_FOUND;
        message = exception.message || 'Record not found';
        break;
      default:
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        message = 'Internal server error';
        break;
    }

    response.status(status).json({
      statusCode: status,
      message,
      error: HttpStatus[status],
    });
  }
}
