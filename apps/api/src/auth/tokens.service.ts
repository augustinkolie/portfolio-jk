import { createHash, randomBytes } from 'node:crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AppConfig } from '../config/app-config.js';
import { PrismaService } from '../prisma/prisma.service.js';

export interface AccessTokenPayload {
  sub: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;
/**
 * Deux onglets de l'admin peuvent rafraîchir en même temps : un jeton révoqué depuis
 * moins de 30 s est refusé sans être considéré comme volé.
 */
const REUSE_GRACE_MS = 30_000;

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function sessionExpired(): UnauthorizedException {
  return new UnauthorizedException('Votre session a expiré. Reconnectez-vous.');
}

@Injectable()
export class TokensService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: AppConfig,
  ) {}

  get accessTokenTtlSeconds(): number {
    return this.config.jwtAccessTtlSeconds;
  }

  get refreshTokenTtlMs(): number {
    return this.config.refreshTokenTtlDays * DAY_MS;
  }

  signAccessToken(userId: string): Promise<string> {
    const payload: AccessTokenPayload = { sub: userId };
    return this.jwt.signAsync(payload);
  }

  async verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    return this.jwt.verifyAsync<AccessTokenPayload>(token);
  }

  /** Crée une session et renvoie le jeton brut, qui n'est jamais stocké tel quel. */
  async createRefreshToken(userId: string): Promise<string> {
    const raw = randomBytes(32).toString('base64url');
    const now = Date.now();
    await this.prisma.$transaction([
      // Ménage : sessions expirées ou révoquées depuis plus d'un jour.
      this.prisma.refreshToken.deleteMany({
        where: {
          userId,
          OR: [
            { expiresAt: { lt: new Date(now) } },
            { revokedAt: { lt: new Date(now - DAY_MS) } },
          ],
        },
      }),
      this.prisma.refreshToken.create({
        data: { userId, tokenHash: sha256(raw), expiresAt: new Date(now + this.refreshTokenTtlMs) },
      }),
    ]);
    return raw;
  }

  /** Échange un refresh token contre un nouveau (rotation). L'ancien devient inutilisable. */
  async rotateRefreshToken(raw: string): Promise<{ userId: string; refreshToken: string }> {
    const existing = await this.prisma.refreshToken.findUnique({ where: { tokenHash: sha256(raw) } });
    if (!existing) throw sessionExpired();

    const now = Date.now();
    if (existing.revokedAt) {
      // Réutilisation d'un jeton déjà échangé : probable vol, on ferme toutes les sessions.
      if (now - existing.revokedAt.getTime() > REUSE_GRACE_MS) {
        await this.revokeAllForUser(existing.userId);
      }
      throw sessionExpired();
    }
    if (existing.expiresAt.getTime() <= now) throw sessionExpired();

    const claimed = await this.prisma.refreshToken.updateMany({
      where: { id: existing.id, revokedAt: null },
      data: { revokedAt: new Date(now) },
    });
    if (claimed.count === 0) throw sessionExpired();

    return { userId: existing.userId, refreshToken: await this.createRefreshToken(existing.userId) };
  }

  async revokeRefreshToken(raw: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: sha256(raw), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
