import { ArgumentsHost, Catch, HttpException, HttpStatus, Logger, type ExceptionFilter } from "@nestjs/common";
import type { Request, Response } from "express";

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const request = host.switchToHttp().getRequest<Request>();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const payload = exception instanceof HttpException ? exception.getResponse() : { message: "Internal server error" };
    this.logger.error(JSON.stringify({ method: request.method, path: request.originalUrl, status, error: exception instanceof Error ? exception.message : String(exception) }), exception instanceof Error ? exception.stack : undefined);
    response.status(status).json({ statusCode: status, timestamp: new Date().toISOString(), path: request.originalUrl, ...(typeof payload === "string" ? { message: payload } : payload as object) });
  }
}
