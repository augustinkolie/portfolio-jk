import type { CourseFormat, CourseLevel, EnrollmentStatus } from './enums.js';
import type { MediaDto } from './api.js';

// ─── Formations ──────────────────────────────────────────────────────────────

/** Extrait vidéo : 80 Mo au plus, MP4 ou WebM déjà compressé (pas de conversion côté serveur). */
export const VIDEO_MAX_UPLOAD_BYTES = 80 * 1024 * 1024;
export const VIDEO_ACCEPTED_TYPES = ['video/mp4', 'video/webm'] as const;

export interface TeaserDto {
  url: string;
  mime: string;
  size: number;
}

export interface CourseSummaryDto {
  id: string;
  title: string;
  slug: string;
  software: string;
  level: CourseLevel;
  format: CourseFormat;
  summary: string;
  duration: string | null;
  price: string | null;
  nextSession: string | null;
  cover: MediaDto | null;
  hasTeaser: boolean;
}

export interface CourseDetailDto extends CourseSummaryDto {
  description: string;
  location: string | null;
  teaser: TeaserDto | null;
  media: MediaDto[];
  updatedAt: string;
}

export interface AdminCourseDto extends CourseDetailDto {
  published: boolean;
  order: number;
  enrollmentCount: number;
  createdAt: string;
}

export interface EnrollmentRequest {
  courseId: string;
  name: string;
  phone: string;
  email?: string;
  message?: string;
  /** Champ piège : doit rester vide. */
  website?: string;
}

export interface EnrollmentDto {
  id: string;
  course: { id: string; title: string; slug: string };
  name: string;
  phone: string;
  email: string | null;
  message: string | null;
  status: EnrollmentStatus;
  createdAt: string;
}

// ─── Plans de conception ─────────────────────────────────────────────────────

/** Dossier PDF d'un plan : 30 Mo au plus. Lu sur le site avec une liseuse intégrée. */
export const PDF_MAX_UPLOAD_BYTES = 30 * 1024 * 1024;

export interface PlanDocumentDto {
  url: string;
  name: string;
  size: number;
  /** Nombre de pages, renseigné par l'admin à l'envoi (lu dans le PDF). */
  pages: number | null;
}

export interface PlanSummaryDto {
  id: string;
  title: string;
  slug: string;
  planType: string;
  levels: string | null;
  surface: string | null;
  bedrooms: number | null;
  summary: string;
  cover: MediaDto | null;
  /** Un dossier PDF est lisible sur la page du plan. */
  hasDocument: boolean;
}

export interface PlanDetailDto extends PlanSummaryDto {
  description: string;
  document: PlanDocumentDto | null;
  media: MediaDto[];
  updatedAt: string;
}

export interface AdminPlanDto extends PlanDetailDto {
  published: boolean;
  order: number;
  createdAt: string;
}
