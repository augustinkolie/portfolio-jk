// Miroir des enums Prisma, utilisables côté frontend sans dépendre de Prisma.

export const ProjectStatus = {
  DELIVERED: 'DELIVERED',
  IN_PROGRESS: 'IN_PROGRESS',
} as const;
export type ProjectStatus = (typeof ProjectStatus)[keyof typeof ProjectStatus];

export const MediaKind = {
  COVER: 'COVER',
  GALLERY: 'GALLERY',
  BEFORE: 'BEFORE',
  AFTER: 'AFTER',
} as const;
export type MediaKind = (typeof MediaKind)[keyof typeof MediaKind];

export const MessageStatus = {
  NEW: 'NEW',
  READ: 'READ',
  HANDLED: 'HANDLED',
} as const;
export type MessageStatus = (typeof MessageStatus)[keyof typeof MessageStatus];

export const CourseLevel = {
  BEGINNER: 'BEGINNER',
  INTERMEDIATE: 'INTERMEDIATE',
  ADVANCED: 'ADVANCED',
} as const;
export type CourseLevel = (typeof CourseLevel)[keyof typeof CourseLevel];

export const CourseFormat = {
  IN_PERSON: 'IN_PERSON',
  LIVE_ONLINE: 'LIVE_ONLINE',
  BOTH: 'BOTH',
} as const;
export type CourseFormat = (typeof CourseFormat)[keyof typeof CourseFormat];

export const EnrollmentStatus = {
  NEW: 'NEW',
  CONTACTED: 'CONTACTED',
  ENROLLED: 'ENROLLED',
  CANCELLED: 'CANCELLED',
} as const;
export type EnrollmentStatus = (typeof EnrollmentStatus)[keyof typeof EnrollmentStatus];

/** Libellés affichés sur le site et dans l'admin. */
export const COURSE_LEVEL_LABELS: Record<CourseLevel, string> = {
  BEGINNER: 'Débutant',
  INTERMEDIATE: 'Intermédiaire',
  ADVANCED: 'Avancé',
};

export const COURSE_FORMAT_LABELS: Record<CourseFormat, string> = {
  IN_PERSON: 'En salle',
  LIVE_ONLINE: 'En direct en ligne',
  BOTH: 'En salle ou en direct en ligne',
};

export const ENROLLMENT_STATUS_LABELS: Record<EnrollmentStatus, string> = {
  NEW: 'Nouvelle',
  CONTACTED: 'Contacté',
  ENROLLED: 'Inscrit',
  CANCELLED: 'Annulée',
};
