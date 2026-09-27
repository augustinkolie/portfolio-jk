import { PartialType } from '@nestjs/swagger';
import { IsOptional, IsString, Length, ValidateIf } from 'class-validator';
import { EmptyToNull, Trim } from '../../common/transforms.js';

export class CreateExpertiseDto {
  @Trim()
  @IsString()
  @Length(2, 80, { message: 'Le nom du domaine doit contenir entre 2 et 80 caractères.' })
  name: string;

  @Trim()
  @IsString()
  @Length(10, 1000, { message: 'La description doit contenir entre 10 et 1 000 caractères.' })
  description: string;

  /** Catégorie dont les projets illustrent ce domaine. */
  @IsOptional()
  @EmptyToNull()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  categoryId?: string | null;
}

export class UpdateExpertiseDto extends PartialType(CreateExpertiseDto) {}
