import type {
  CategoryDto,
  CourseDetailDto,
  CourseSummaryDto,
  PlanDetailDto,
  PlanSummaryDto,
  ExperienceDto,
  ExpertiseDetailDto,
  ExpertiseDto,
  Paginated,
  ProjectDetailDto,
  ProjectSummaryDto,
  SiteSettings,
} from '@btp/shared';

/**
 * Lecture de l'API côté serveur. Chaque réponse est mise en cache par Next.js
 * sous des étiquettes identiques à celles que l'API revalide (RevalidationService) :
 * une page n'est régénérée que lorsque ses données changent.
 */
const API_URL = process.env.API_URL ?? 'http://localhost:4000';

async function request<T>(path: string, tags: string[], allowNotFound: true): Promise<T | null>;
async function request<T>(path: string, tags: string[], allowNotFound?: false): Promise<T>;
async function request<T>(path: string, tags: string[], allowNotFound = false): Promise<T | null> {
  const res = await fetch(`${API_URL}${path}`, { cache: 'force-cache', next: { tags } });
  if (allowNotFound && res.status === 404) return null;
  if (!res.ok) throw new Error(`API ${path} : HTTP ${res.status}`);
  return (await res.json()) as T;
}

export interface ProjectsQuery {
  category?: string;
  year?: number;
  featured?: boolean;
  page?: number;
  limit?: number;
}

export function projectsQueryString(query: ProjectsQuery): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export const api = {
  settings: () => request<SiteSettings>('/settings/public', ['settings']),

  projects: (query: ProjectsQuery = {}) =>
    request<Paginated<ProjectSummaryDto>>(`/projects${projectsQueryString(query)}`, ['projects']),

  projectYears: () => request<number[]>('/projects/years', ['projects']),

  projectSlugs: () => request<string[]>('/projects/slugs', ['projects']),

  project: (slug: string) =>
    request<ProjectDetailDto>(`/projects/${encodeURIComponent(slug)}`, [`project:${slug}`], true),

  categories: () => request<CategoryDto[]>('/categories', ['categories']),

  expertises: () => request<ExpertiseDto[]>('/expertises', ['expertises']),

  expertise: (slug: string) =>
    request<ExpertiseDetailDto>(
      `/expertises/${encodeURIComponent(slug)}`,
      ['expertises', 'projects'],
      true,
    ),

  experiences: () => request<ExperienceDto[]>('/experiences', ['experiences']),

  courses: (query: { page?: number; limit?: number } = {}) =>
    request<Paginated<CourseSummaryDto>>(`/courses${projectsQueryString(query)}`, ['courses']),

  courseSlugs: () => request<string[]>('/courses/slugs', ['courses']),

  course: (slug: string) =>
    request<CourseDetailDto>(`/courses/${encodeURIComponent(slug)}`, [`course:${slug}`], true),

  plans: (query: { page?: number; limit?: number } = {}) =>
    request<Paginated<PlanSummaryDto>>(`/plans${projectsQueryString(query)}`, ['plans']),

  planSlugs: () => request<string[]>('/plans/slugs', ['plans']),

  plan: (slug: string) => request<PlanDetailDto>(`/plans/${encodeURIComponent(slug)}`, [`plan:${slug}`], true),
};
