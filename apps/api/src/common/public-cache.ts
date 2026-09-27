import { Header } from '@nestjs/common';

/**
 * Réponses publiques : Next.js régénère les pages à la demande, ce cache ne sert
 * qu'aux proxys et aux appels directs. Une minute de fraîcheur, un jour de secours.
 */
export const PublicCache = (): MethodDecorator =>
  Header('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400');
