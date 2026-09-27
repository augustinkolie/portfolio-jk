import argon2 from 'argon2';

// argon2id avec les paramètres par défaut de la librairie (64 Mio, 3 passes).
export function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain, { type: argon2.argon2id });
}

export async function verifyPassword(hash: string, plain: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plain);
  } catch {
    return false;
  }
}

let dummyHash: Promise<string> | undefined;

/**
 * Vérification factice quand l'email est inconnu : le temps de réponse reste identique
 * et ne révèle pas quels comptes existent.
 */
export async function burnPasswordCheck(plain: string): Promise<void> {
  dummyHash ??= hashPassword('mot-de-passe-factice-pour-egaliser-le-temps');
  await verifyPassword(await dummyHash, plain);
}
