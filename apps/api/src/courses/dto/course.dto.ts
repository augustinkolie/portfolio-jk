import { CourseFormat, CourseLevel, EnrollmentStatus, PHONE_PATTERN, type EnrollmentRequest } from '@btp/shared';
import { PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/pagination.dto.js';
import { EmptyToNull, Trim } from '../../common/transforms.js';

const SLUG_MESSAGE = "L'adresse de la page ne peut contenir que des minuscules, des chiffres et des tirets.";

export class CreateCourseDto {
  @Trim()
  @IsString()
  @Length(3, 160, { message: 'Le titre doit contenir entre 3 et 160 caractères.' })
  title: string;

  @IsOptional()
  @Trim()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: SLUG_MESSAGE })
  @MaxLength(80)
  slug?: string;

  @Trim()
  @IsString()
  @Length(2, 60, { message: 'Indiquez le logiciel enseigné (ex. « AutoCAD »).' })
  software: string;

  @IsOptional()
  @IsIn(Object.values(CourseLevel), { message: 'Niveau inconnu.' })
  level?: CourseLevel;

  @IsOptional()
  @IsIn(Object.values(CourseFormat), { message: 'Format inconnu.' })
  format?: CourseFormat;

  @Trim()
  @IsString()
  @Length(10, 300, { message: 'Le résumé doit contenir entre 10 et 300 caractères.' })
  summary: string;

  @IsString()
  @MaxLength(50_000, { message: 'Le programme est trop long (50 000 caractères au plus).' })
  description: string;

  @IsOptional()
  @EmptyToNull()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @MaxLength(60)
  duration?: string | null;

  @IsOptional()
  @EmptyToNull()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @MaxLength(160)
  location?: string | null;

  @IsOptional()
  @EmptyToNull()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @MaxLength(60)
  price?: string | null;

  @IsOptional()
  @EmptyToNull()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @MaxLength(120)
  nextSession?: string | null;

  @IsOptional()
  @IsBoolean()
  published?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  order?: number;
}

export class UpdateCourseDto extends PartialType(CreateCourseDto) {}

export class CreateEnrollmentDto implements EnrollmentRequest {
  @IsString({ message: 'Choisissez une formation.' })
  courseId: string;

  @Trim()
  @IsString()
  @Length(2, 120, { message: 'Indiquez votre nom (2 à 120 caractères).' })
  name: string;

  @Trim()
  @IsString()
  @Matches(PHONE_PATTERN, {
    message: 'Numéro de téléphone non reconnu. Exemple : +224 622 12 34 56 ou 622 12 34 56.',
  })
  phone: string;

  @IsOptional()
  @EmptyToNull()
  @ValidateIf((_, v) => v !== null)
  @IsEmail({}, { message: "L'adresse email n'est pas valide. Laissez le champ vide si vous n'en avez pas." })
  @MaxLength(160)
  email?: string;

  @IsOptional()
  @EmptyToNull()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @MaxLength(2000, { message: 'Le message ne peut pas dépasser 2 000 caractères.' })
  message?: string;

  /** Champ piège : invisible pour un humain, rempli par les robots. */
  @IsOptional()
  @IsString()
  @MaxLength(500)
  website?: string;
}

export class EnrollmentsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(Object.values(EnrollmentStatus))
  status?: EnrollmentStatus;

  @IsOptional()
  @IsString()
  courseId?: string;
}

export class UpdateEnrollmentDto {
  @IsIn(Object.values(EnrollmentStatus), { message: 'Statut inconnu.' })
  status: EnrollmentStatus;
}
