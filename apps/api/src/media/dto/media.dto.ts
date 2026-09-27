import { MediaKind } from '@btp/shared';
import { IsIn, IsInt, IsOptional, IsString, Length, Min } from 'class-validator';
import { Type } from 'class-transformer';

const KINDS = Object.values(MediaKind);
const ALT_MESSAGE =
  'Le texte alternatif est obligatoire (3 à 250 caractères) : décrivez ce que montre la photo.';

export class UploadMediaDto {
  @IsString({ message: ALT_MESSAGE })
  @Length(3, 250, { message: ALT_MESSAGE })
  alt: string;

  @IsOptional()
  @IsIn(KINDS, { message: 'Type de photo inconnu (COVER, GALLERY, BEFORE ou AFTER).' })
  kind?: MediaKind;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsString()
  courseId?: string;

  @IsOptional()
  @IsString()
  planId?: string;
}

export class UpdateMediaDto {
  @IsOptional()
  @IsString({ message: ALT_MESSAGE })
  @Length(3, 250, { message: ALT_MESSAGE })
  alt?: string;

  @IsOptional()
  @IsIn(KINDS, { message: 'Type de photo inconnu (COVER, GALLERY, BEFORE ou AFTER).' })
  kind?: MediaKind;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  order?: number;
}
