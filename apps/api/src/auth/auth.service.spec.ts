import { HttpStatus, UnauthorizedException, type HttpException } from '@nestjs/common';
import { MAX_FAILED_LOGIN_ATTEMPTS } from '@btp/shared';
import { hashPassword } from '../common/password.js';
import type { User } from '../generated/prisma/client.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import type { UsersService } from '../users/users.service.js';
import { AuthService } from './auth.service.js';
import type { TokensService } from './tokens.service.js';

const PASSWORD = 'mot-de-passe-solide-2026';

async function setup() {
  const user: User = {
    id: 'u1',
    email: 'admin@exemple.gn',
    name: 'Admin',
    passwordHash: await hashPassword(PASSWORD),
    failedLoginAttempts: 0,
    lockedUntil: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const prisma = {
    user: {
      update: vi.fn(({ data }: { data: Record<string, unknown> }) => {
        const attempts = data.failedLoginAttempts;
        if (typeof attempts === 'object' && attempts !== null && 'increment' in attempts) {
          user.failedLoginAttempts += (attempts as { increment: number }).increment;
        } else if (typeof attempts === 'number') {
          user.failedLoginAttempts = attempts;
        }
        if ('lockedUntil' in data) user.lockedUntil = data.lockedUntil as Date | null;
        return Promise.resolve({ ...user });
      }),
    },
  } as unknown as PrismaService;

  const users = {
    findByEmail: vi.fn((email: string) => Promise.resolve(email === user.email ? { ...user } : null)),
    findById: vi.fn(() => Promise.resolve({ ...user })),
  } as unknown as UsersService;

  const tokens = {
    accessTokenTtlSeconds: 900,
    signAccessToken: vi.fn(() => Promise.resolve('access')),
    createRefreshToken: vi.fn(() => Promise.resolve('refresh')),
  } as unknown as TokensService;

  return { user, service: new AuthService(prisma, users, tokens) };
}

async function statusOf(promise: Promise<unknown>): Promise<number> {
  try {
    await promise;
    return 200;
  } catch (error) {
    return (error as HttpException).getStatus();
  }
}

describe('AuthService.login', () => {
  it('ouvre une session avec les bons identifiants', async () => {
    const { service } = await setup();
    const result = await service.login('admin@exemple.gn', PASSWORD);
    expect(result.response.user.email).toBe('admin@exemple.gn');
    expect(result.refreshToken).toBe('refresh');
  });

  it("refuse un email inconnu avec le même message qu'un mauvais mot de passe", async () => {
    const { service } = await setup();
    await expect(service.login('inconnu@exemple.gn', PASSWORD)).rejects.toThrow(
      new UnauthorizedException('Email ou mot de passe incorrect.'),
    );
  });

  it(`verrouille le compte à la ${MAX_FAILED_LOGIN_ATTEMPTS}e tentative échouée`, async () => {
    const { service, user } = await setup();
    for (let i = 1; i < MAX_FAILED_LOGIN_ATTEMPTS; i++) {
      expect(await statusOf(service.login(user.email, 'faux'))).toBe(HttpStatus.UNAUTHORIZED);
    }
    expect(await statusOf(service.login(user.email, 'faux'))).toBe(HttpStatus.LOCKED);
    expect(user.lockedUntil).not.toBeNull();

    // Même le bon mot de passe est refusé pendant le verrouillage.
    expect(await statusOf(service.login(user.email, PASSWORD))).toBe(HttpStatus.LOCKED);
  });

  it('remet le compteur à zéro après une connexion réussie', async () => {
    const { service, user } = await setup();
    await statusOf(service.login(user.email, 'faux'));
    expect(user.failedLoginAttempts).toBe(1);
    await service.login(user.email, PASSWORD);
    expect(user.failedLoginAttempts).toBe(0);
  });

  it('accepte de nouveau la connexion une fois le verrouillage expiré', async () => {
    const { service, user } = await setup();
    user.lockedUntil = new Date(Date.now() - 1000);
    await expect(service.login(user.email, PASSWORD)).resolves.toBeDefined();
    expect(user.lockedUntil).toBeNull();
  });
});
