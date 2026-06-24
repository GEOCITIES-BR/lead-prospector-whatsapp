import type { FastifyReply, FastifyRequest } from 'fastify';
import { AppError } from '../../shared/errors/index.js';

export function errorHandler(
  error: Error & { statusCode?: number; code?: string },
  request: FastifyRequest,
  reply: FastifyReply,
): void {
  const isProduction = process.env.NODE_ENV === 'production';

  if (error instanceof AppError) {
    reply.status(error.statusCode).send({
      error: true,
      code: error.code,
      message: error.message,
    });
    return;
  }

  request.log.error({ err: error, url: request.url }, 'Erro não tratado');

  reply.status(error.statusCode || 500).send({
    error: true,
    code: error.code || 'INTERNAL_ERROR',
    message: isProduction
      ? 'Erro interno do servidor'
      : error.message || 'Erro interno do servidor',
  });
}
