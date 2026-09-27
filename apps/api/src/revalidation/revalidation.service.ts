import { Injectable, Logger } from '@nestjs/common';
import { AppConfig } from '../config/app-config.js';
import { PrismaService } from '../prisma/prisma.service.js';

/**
 * Étiquettes de cache partagées avec Next.js (fetch(..., { next: { tags } })) :
 * - « projects » : listes (accueil, /realisations, /expertises)
 * - « project:<slug> » : page d'un projet, liens précédent/suivant compris
 * - « categories », « expertises », « experiences », « settings »
 * - « courses » / « course:<slug> » : formations ; « plans » / « plan:<slug> » : plans de conception
 */
export const Tags = {
  projects: 'projects',
  project: (slug: string) => `project:${slug}`,
  courses: 'courses',
  course: (slug: string) => `course:${slug}`,
  plans: 'plans',
  plan: (slug: string) => `plan:${slug}`,
  categories: 'categories',
  expertises: 'expertises',
  experiences: 'experiences',
  settings: 'settings',
} as const;

const TIMEOUT_MS = 5000;

@Injectable()
export class RevalidationService {
  private readonly logger = new Logger(RevalidationService.name);

  constructor(
    private readonly config: AppConfig,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Demande à Next.js de régénérer les pages portant ces étiquettes. Un échec est
   * journalisé sans faire échouer l'action de l'administrateur : la page sera
   * régénérée à la prochaine publication.
   */
  async revalidate(tags: Iterable<string>): Promise<void> {
    const list = [...new Set(tags)];
    if (list.length === 0) return;
    try {
      const res = await fetch(`${this.config.webOrigin}/api/revalidate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-revalidate-secret': this.config.revalidateSecret,
        },
        body: JSON.stringify({ tags: list }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (error) {
      this.logger.warn(`Revalidation impossible (${list.join(', ')}) : ${String(error)}`);
    }
  }

  /** Slugs publiés dans l'ordre d'affichage : sert à retrouver les voisins précédent/suivant. */
  async publishedSlugsInOrder(): Promise<string[]> {
    const rows = await this.prisma.project.findMany({
      where: { published: true },
      orderBy: PROJECT_ORDER,
      select: { slug: true },
    });
    return rows.map((r) => r.slug);
  }

  /**
   * Étiquettes touchées par la modification d'un projet : listes, sa page, et les
   * pages voisines dont les liens précédent/suivant changent (avant et après).
   */
  projectTags(slugs: string[], before: string[], after: string[]): string[] {
    const tags = new Set<string>([Tags.projects, Tags.categories, Tags.expertises]);
    for (const slug of slugs) {
      tags.add(Tags.project(slug));
      for (const order of [before, after]) {
        const i = order.indexOf(slug);
        if (i > 0) tags.add(Tags.project(order[i - 1]));
        if (i >= 0 && i < order.length - 1) tags.add(Tags.project(order[i + 1]));
      }
    }
    return [...tags];
  }

  /** Régénère les pages d'un élément (projet, formation, plan) après un changement de ses médias. */
  async revalidateOwner(owner: { type: 'project' | 'course' | 'plan'; id: string } | null): Promise<void> {
    if (!owner) {
      // Photo sans élément : photo de profil, affichée via les paramètres.
      await this.revalidate([Tags.settings]);
      return;
    }
    if (owner.type === 'project') return this.revalidateProjectById(owner.id);
    const where = { where: { id: owner.id }, select: { slug: true, published: true } } as const;
    const item =
      owner.type === 'course' ? await this.prisma.course.findUnique(where) : await this.prisma.plan.findUnique(where);
    if (!item?.published) return;
    await this.revalidate(
      owner.type === 'course' ? [Tags.courses, Tags.course(item.slug)] : [Tags.plans, Tags.plan(item.slug)],
    );
  }

  /** Régénère les pages d'un projet après un changement de ses médias. */
  async revalidateProjectById(projectId: string | null): Promise<void> {
    if (!projectId) return;
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { slug: true, published: true },
    });
    if (project?.published) await this.revalidate([Tags.projects, Tags.project(project.slug)]);
  }
}

/** Ordre d'affichage des projets, identique partout (listes, voisins). */
export const PROJECT_ORDER = [
  { order: 'asc' as const },
  { year: 'desc' as const },
  { createdAt: 'desc' as const },
];
