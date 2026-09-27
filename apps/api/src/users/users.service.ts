import { Injectable } from '@nestjs/common';
import type { AdminUser } from '@btp/shared';
import { hashPassword } from '../common/password.js';
import type { User } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function toAdminUser(user: User): AdminUser {
  return { id: user.id, email: user.email, name: user.name };
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email: normalizeEmail(email) } });
  }

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async create(input: { email: string; name: string; password: string }): Promise<User> {
    return this.prisma.user.create({
      data: {
        email: normalizeEmail(input.email),
        name: input.name.trim(),
        passwordHash: await hashPassword(input.password),
      },
    });
  }

  async updatePassword(userId: string, newPassword: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await hashPassword(newPassword) },
    });
  }
}
