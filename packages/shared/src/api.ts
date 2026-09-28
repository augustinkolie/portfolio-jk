import type { MediaKind, MessageStatus, ProjectStatus } from './enums.js';

export const PAGE_SIZE = 12;
export const MAX_PAGE_SIZE = 48;

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

// ─── Médias ──────────────────────────────────────────────────────────────────

/** Largeurs générées pour chaque image (cahier des charges 6.3). */
export const IMAGE_WIDTHS = [400, 800, 1200, 1920] as const;
export const IMAGE_MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
export const IMAGE_ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'] as const;

export interface ImageSource {
  width: number;
  url: string;
}

export interface MediaDto {
  id: string;
  alt: string;
  kind: MediaKind;
  order: number;
  width: number;
  height: number;
  /** Data URL d'un aperçu flou de moins de 1 Ko. */
  blurData: string;
  sources: { avif: ImageSource[]; webp: ImageSource[] };
}

// ─── Catalogue ───────────────────────────────────────────────────────────────

export interface CategoryDto {
  id: string;
  name: string;
  slug: string;
  order: number;
  /** Projets publiés uniquement. */
  projectCount: number;
}

export interface ProjectSummaryDto {
  id: string;
  title: string;
  slug: string;
  summary: string;
  location: string;
  year: number;
  size: string | null;
  duration: string | null;
  status: ProjectStatus;
  featured: boolean;
  category: { name: string; slug: string };
  cover: MediaDto | null;
}

export interface ProjectLinkDto {
  title: string;
  slug: string;
}

export interface ProjectDetailDto extends ProjectSummaryDto {
  description: string;
  client: string | null;
  /** null si le montant n'est pas renseigné ou masqué. */
  budget: string | null;
  media: MediaDto[];
  previous: ProjectLinkDto | null;
  next: ProjectLinkDto | null;
  updatedAt: string;
}

export interface AdminProjectDto extends Omit<ProjectDetailDto, 'previous' | 'next' | 'budget' | 'category'> {
  budget: string | null;
  showBudget: boolean;
  published: boolean;
  order: number;
  category: { id: string; name: string; slug: string };
  createdAt: string;
}

export interface ExpertiseDto {
  id: string;
  name: string;
  slug: string;
  description: string;
  order: number;
  category: { id: string; name: string; slug: string } | null;
}

export interface ExpertiseDetailDto extends ExpertiseDto {
  projects: ProjectSummaryDto[];
}

export interface ExperienceDto {
  id: string;
  period: string;
  title: string;
  organization: string | null;
  location: string | null;
  description: string | null;
  order: number;
}

// ─── Paramètres du site ──────────────────────────────────────────────────────

export interface KeyFigure {
  /** Valeur numérique, sert aussi à calculer la longueur de la ligne de cote. */
  value: number;
  unit: string;
  label: string;
}

/** Présentation du dirigeant sur l'accueil. `photoId` désigne un média envoyé via /admin/media. */
export interface ProfileInput {
  /** Fonction affichée sous le nom : « Dirigeant », « Ingénieur en génie civil »… */
  role: string;
  bio: string;
  photoId: string | null;
}

export interface Profile extends ProfileInput {
  photo: MediaDto | null;
}

/** Paramètres tels que l'admin les envoie (PUT /admin/settings). */
export interface SiteSettingsInput {
  company: { name: string; tagline: string; description: string };
  keyFigures: KeyFigure[];
  contact: {
    phone: string;
    whatsapp: string;
    email: string;
    address: string;
    hours: string;
    mapUrl: string;
  };
  social: { facebook: string; linkedin: string; instagram: string; youtube: string };
  profile: ProfileInput;
}

/** Paramètres tels que l'API les renvoie : la photo du profil est résolue. */
export interface SiteSettings extends Omit<SiteSettingsInput, 'profile'> {
  profile: Profile;
}

// ─── Contact ─────────────────────────────────────────────────────────────────

/**
 * Numéro guinéen (9 chiffres, avec ou sans +224 / 00224) ou numéro international
 * au format +XXXXXXXX. Espaces, points et tirets tolérés.
 */
export const PHONE_PATTERN = /^(?:(?:\+|00)224)?[\s.-]*\d(?:[\s.-]*\d){8}$|^\+(?:[\s.-]*\d){8,15}$/;

export function normalizePhone(input: string): string {
  const digits = input.replace(/[^\d+]/g, '').replace(/^00/, '+');
  if (/^\d{9}$/.test(digits)) return `+224${digits}`;
  return digits;
}

export interface ContactRequest {
  name: string;
  phone: string;
  email?: string;
  projectType?: string;
  location?: string;
  message: string;
  /** Champ piège invisible : doit rester vide. */
  website?: string;
}

export interface ContactMessageDto {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  projectType: string | null;
  location: string | null;
  message: string;
  status: MessageStatus;
  createdAt: string;
}

/** Cloche de l'admin : ce qui attend une réponse. */
export interface NotificationItemDto {
  type: 'message' | 'enrollment';
  id: string;
  /** Nom de la personne. */
  title: string;
  /** « Inscription : AutoCAD 2D », type de projet ou début du message. */
  detail: string;
  createdAt: string;
}

export interface NotificationsDto {
  /** Messages non lus + inscriptions nouvelles. */
  total: number;
  messages: number;
  enrollments: number;
  /** Les plus récents, tous types confondus (8 au plus). */
  items: NotificationItemDto[];
}

export interface DashboardDto {
  projects: { published: number; drafts: number };
  messages: { unread: number; latest: ContactMessageDto[] };
  enrollments: { pending: number };
}
