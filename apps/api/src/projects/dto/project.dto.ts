import { ProjectStatus } from '@btp/shared';
import { PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/pagination.dto.js';
import { EmptyToNull, ToBoolean, Trim } from '../../common/transforms.js';

const MAX_YEAR = new Date().getFullYear() + 5;
const YEAR_MESSAGE = `L'année doit être comprise entre 1950 et ${MAX_YEAR}.`;
const SLUG_MESSAGE = "L'adresse de la page ne peut contenir que des minuscules, des chiffres et des tirets.";

export class CreateProjectDto {
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
  @Length(10, 300, { message: 'Le résumé doit contenir entre 10 et 300 caractères.' })
  summary: string;

  @IsString()
  @MaxLength(50_000, { message: 'La description est trop longue (50 000 caractères au plus).' })
  description: string;

  @IsOptional()
  @EmptyToNull()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @MaxLength(160)
  client?: string | null;

  @Trim()
  @IsString()
  @Length(2, 120, { message: 'Le lieu est obligatoire (ex. « Kaloum, Conakry »).' })
  location: string;

  @Type(() => Number)
  @IsInt({ message: YEAR_MESSAGE })
  @Min(1950, { message: YEAR_MESSAGE })
  @Max(MAX_YEAR, { message: YEAR_MESSAGE })
  year: number;

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
  @MaxLength(60)
  size?: string | null;

  @IsOptional()
  @EmptyToNull()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @MaxLength(60)
  budget?: string | null;

  @IsOptional()
  @IsBoolean()
  showBudget?: boolean;

  @IsOptional()
  @IsIn(Object.values(ProjectStatus), { message: 'Statut inconnu (DELIVERED ou IN_PROGRESS).' })
  status?: ProjectStatus;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsBoolean()
  published?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  order?: number;

  @IsString({ message: 'Choisissez une catégorie.' })
  categoryId: string;
}

export class UpdateProjectDto extends PartialType(CreateProjectDto) {}

export class PublicProjectsQueryDto extends PaginationQueryDto {
  /** Slug de catégorie, ex. « routes-vrd ». */
  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  year?: number;

  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  featured?: boolean;
}

export class AdminProjectsQueryDto extends PaginationQueryDto {
  /** Recherche dans le titre, le lieu et le maître d'ouvrage. */
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(100)
  q?: string;

  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  published?: boolean;

  @IsOptional()
  @IsString()
  categoryId?: string;
}
