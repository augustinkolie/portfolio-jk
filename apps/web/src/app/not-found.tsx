import { NotFoundContent } from '@/components/layout/NotFoundContent';

// Adresse inconnue : la 404 globale reste légère (pas d'appel à l'API).
export default function NotFound() {
  return (
    <main id="contenu">
      <NotFoundContent />
    </main>
  );
}
