import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { TokensService } from './tokens.service.js';

export interface AuthenticatedRequest extends Request {
  userId: string;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly tokens: TokensService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const [scheme, token] = request.headers.authorization?.split(' ') ?? [];
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Connexion requise.');
    }
    try {
      const payload = await this.tokens.verifyAccessToken(token);
      request.userId = payload.sub;
      return true;
    } catch {
      throw new UnauthorizedException('Votre session a expiré. Reconnectez-vous.');
    }
  }
}
