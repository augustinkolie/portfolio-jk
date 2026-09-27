import { PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Length, Matches, Max, MaxLength, Min, ValidateIf } from 'class-validator';
import { EmptyToNull, Trim } from '../../common/transforms.js';

const SLUG_MESSAGE = "L'adresse de la page ne peut contenir que des minuscules, des chiffres et des tirets.";

export class CreatePlanDto {
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
  @Length(2, 60, { message: 'Indiquez le type de bâtiment (ex. « Villa », « Duplex », « Immeuble »).' })
  planType: string;

  @IsOptional()
  @EmptyToNull()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @MaxLength(30)
  levels?: string | null;

  @IsOptional()
  @EmptyToNull()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @MaxLength(40)
  surface?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @Type(() => Number)
  @IsInt({ message: 'Le nombre de chambres doit être un nombre entier.' })
  @Min(0)
  @Max(50)
  bedrooms?: number | null;

  @Trim()
  @IsString()
  @Length(10, 300, { message: 'Le résumé doit contenir entre 10 et 300 caractères.' })
  summary: string;

  @IsString()
  @MaxLength(50_000, { message: 'La description est trop longue (50 000 caractères au plus).' })
  description: string;

  @IsOptional()
  @IsBoolean()
  published?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  order?: number;
}

export class UpdatePlanDto extends PartialType(CreatePlanDto) {}
