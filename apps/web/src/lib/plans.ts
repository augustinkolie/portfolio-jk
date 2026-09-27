import type { PlanSummaryDto } from '@btp/shared';

/** Informations courtes d'un plan : « Villa · R+1 · 180 m² · 4 chambres ». */
export function planMeta(p: Pick<PlanSummaryDto, 'planType' | 'levels' | 'surface' | 'bedrooms'>) {
  return [p.planType, p.levels, p.surface, p.bedrooms !== null && `${p.bedrooms} chambre${p.bedrooms > 1 ? 's' : ''}`];
}
