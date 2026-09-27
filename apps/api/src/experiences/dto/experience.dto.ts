import { PartialType } from '@nestjs/swagger';
import { IsOptional, IsString, Length, MaxLength, ValidateIf } from 'class-validator';
import { EmptyToNull, Trim } from '../../common/transforms.js';

export class CreateExperienceDto {
  /** Texte libre : « 2008 – 2012 », « Depuis 2019 »… */
  @Trim()
  @IsString()
  @Length(2, 40, { message: 'La période est obligatoire (ex. « 2008 – 2012 »).' })
  period: string;

  @Trim()
  @IsString()
  @Length(2, 160, { message: "L'intitulé doit contenir entre 2 et 160 caractères." })
  title: string;

  @IsOptional()
  @EmptyToNull()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @MaxLength(160)
  organization?: string | null;

  @IsOptional()
  @EmptyToNull()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @MaxLength(120)
  location?: string | null;

  @IsOptional()
  @EmptyToNull()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @MaxLength(2000, { message: 'La description ne peut pas dépasser 2 000 caractères.' })
  description?: string | null;
}

export class UpdateExperienceDto extends PartialType(CreateExperienceDto) {}
