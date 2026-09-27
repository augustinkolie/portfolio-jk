import type { ProjectSummaryDto } from '@btp/shared';

/** Nombre de colonnes des grilles de projets sur grand écran (accueil et /realisations). */
export const PROJECT_COLUMNS = 3;

/**
 * Index du projet affiché en grande tuile (2 colonnes), ou -1.
 * Une seule grande tuile, celle du premier projet « en vedette », et seulement si elle
 * ne laisse pas plus de cases vides sur la dernière ligne qu'une grille de tuiles égales :
 * 2 projets → grande + petite ; 3 projets → trois tuiles égales ; 5 projets → grande + 4 petites.
 */
export function wideTileIndex(items: ProjectSummaryDto[]): number {
  const featured = items.findIndex((p) => p.featured);
  if (featured === -1 || items.length < 2) return -1;
  const emptyCells = (cells: number) => (PROJECT_COLUMNS - (cells % PROJECT_COLUMNS)) % PROJECT_COLUMNS;
  return emptyCells(items.length + 1) <= emptyCells(items.length) ? featured : -1;
}
