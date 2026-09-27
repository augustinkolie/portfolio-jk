// Crée le compte administrateur : npm run seed:admin
// Lit ADMIN_EMAIL, ADMIN_NAME et ADMIN_PASSWORD dans apps/api/.env ou l'environnement.
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '@btp/shared';
import { isEmail } from 'class-validator';
import { loadEnvFile } from '../config/app-config.js';
import { hashPassword } from '../common/password.js';
import { createPrismaClient } from '../prisma/prisma.service.js';
import { normalizeEmail } from '../users/users.service.js';

function fail(message: string): never {
  console.error(`✗ ${message}`);
  process.exit(1);
}

async function main(): Promise<void> {
  loadEnvFile();
  const { DATABASE_URL, ADMIN_EMAIL, ADMIN_NAME, ADMIN_PASSWORD } = process.env;

  if (!DATABASE_URL) fail('DATABASE_URL est absent de apps/api/.env.');
  if (!ADMIN_EMAIL || !isEmail(ADMIN_EMAIL)) {
    fail('ADMIN_EMAIL est absent ou invalide dans apps/api/.env.');
  }
  if (!ADMIN_NAME?.trim()) fail('ADMIN_NAME est absent de apps/api/.env.');
  if (
    !ADMIN_PASSWORD ||
    ADMIN_PASSWORD.length < PASSWORD_MIN_LENGTH ||
    ADMIN_PASSWORD.length > PASSWORD_MAX_LENGTH
  ) {
    fail(
      `ADMIN_PASSWORD doit contenir entre ${PASSWORD_MIN_LENGTH} et ${PASSWORD_MAX_LENGTH} caractères.`,
    );
  }

  const prisma = createPrismaClient(DATABASE_URL);
  try {
    const email = normalizeEmail(ADMIN_EMAIL);
    if (await prisma.user.findUnique({ where: { email } })) {
      fail(
        `Un compte existe déjà pour ${email}. Pour changer son mot de passe, passez par l'admin (Compte → Mot de passe).`,
      );
    }
    await prisma.user.create({
      data: { email, name: ADMIN_NAME.trim(), passwordHash: await hashPassword(ADMIN_PASSWORD) },
    });
    console.log(`✓ Compte administrateur créé : ${email}`);
    console.log('  Retirez maintenant ADMIN_PASSWORD de apps/api/.env.');
  } finally {
    await prisma.$disconnect();
  }
}

await main();
