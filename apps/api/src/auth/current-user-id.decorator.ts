import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthenticatedRequest } from './jwt-auth.guard.js';

/** Identifiant de l'administrateur connecté (routes protégées par JwtAuthGuard uniquement). */
export const CurrentUserId = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string =>
    context.switchToHttp().getRequest<AuthenticatedRequest>().userId,
);
