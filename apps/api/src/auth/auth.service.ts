import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { AuthResponse } from '@btp/shared';
import { LOGIN_LOCK_MINUTES, MAX_FAILED_LOGIN_ATTEMPTS } from '@btp/shared';
import { burnPasswordCheck, verifyPassword } from '../common/password.js';
import type { User } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { toAdminUser, UsersService } from '../users/users.service.js';
import { sessionExpired, TokensService } from './tokens.service.js';

export interface AuthResult {
  response: AuthResponse;
  refreshToken: string;
}

const LOCK_MS = LOGIN_LOCK_MINUTES * 60 * 1000;

function invalidCredentials(): UnauthorizedException {
  return new UnauthorizedException('Email ou mot de passe incorrect.');
}

function accountLocked(until: Date): HttpException {
  const minutes = Math.max(1, Math.ceil((until.getTime() - Date.now()) / 60_000));
  return new HttpException(
    {
      statusCode: HttpStatus.LOCKED,
      error: 'Locked',
      message: `Compte verrouillé après ${MAX_FAILED_LOGIN_ATTEMPTS} tentatives échouées. Réessayez dans ${minutes} minute${minutes > 1 ? 's' : ''}.`,
    },
    HttpStatus.LOCKED,
  );
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
    private readonly tokens: TokensService,
  ) {}

  async login(email: string, password: string): Promise<AuthResult> {
    const user = await this.users.findByEmail(email);
    if (!user) {
      await burnPasswordCheck(password);
      throw invalidCredentials();
    }

    if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
      throw accountLocked(user.lockedUntil);
    }

    if (!(await verifyPassword(user.passwordHash, password))) {
      await this.registerFailedAttempt(user.id);
      throw invalidCredentials();
    }

    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockedUntil: null },
      });
    }
    return this.startSession(user);
  }

  async refresh(rawRefreshToken: string | undefined): Promise<AuthResult> {
    if (!rawRefreshToken) throw sessionExpired();
    const { userId, refreshToken } = await this.tokens.rotateRefreshToken(rawRefreshToken);
    const user = await this.users.findById(userId);
    if (!user) throw sessionExpired();
    return { response: await this.buildResponse(user), refreshToken };
  }

  async logout(rawRefreshToken: string | undefined): Promise<void> {
    if (rawRefreshToken) await this.tokens.revokeRefreshToken(rawRefreshToken);
  }

  /** Change le mot de passe, ferme toutes les autres sessions et en ouvre une nouvelle. */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<AuthResult> {
    const user = await this.users.findById(userId);
    if (!user) throw sessionExpired();
    if (!(await verifyPassword(user.passwordHash, currentPassword))) {
      throw new BadRequestException('Le mot de passe actuel est incorrect.');
    }
    if (currentPassword === newPassword) {
      throw new BadRequestException("Le nouveau mot de passe doit être différent de l'actuel.");
    }
    await this.users.updatePassword(user.id, newPassword);
    await this.tokens.revokeAllForUser(user.id);
    return this.startSession(user);
  }

  private async registerFailedAttempt(userId: string): Promise<void> {
    // Incrément atomique : deux tentatives simultanées sont bien comptées toutes les deux.
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { failedLoginAttempts: { increment: 1 } },
    });
    if (updated.failedLoginAttempts >= MAX_FAILED_LOGIN_ATTEMPTS) {
      const lockedUntil = new Date(Date.now() + LOCK_MS);
      await this.prisma.user.update({
        where: { id: userId },
        data: { failedLoginAttempts: 0, lockedUntil },
      });
      throw accountLocked(lockedUntil);
    }
  }

  private async startSession(user: User): Promise<AuthResult> {
    const [response, refreshToken] = await Promise.all([
      this.buildResponse(user),
      this.tokens.createRefreshToken(user.id),
    ]);
    return { response, refreshToken };
  }

  private async buildResponse(user: User): Promise<AuthResponse> {
    return {
      accessToken: await this.tokens.signAccessToken(user.id),
      expiresIn: this.tokens.accessTokenTtlSeconds,
      user: toAdminUser(user),
    };
  }
}
