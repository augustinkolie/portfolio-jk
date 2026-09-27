import { PartialType } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';
import { Trim } from '../../common/transforms.js';

export class CreateCategoryDto {
  @Trim()
  @IsString()
  @Length(2, 60, { message: 'Le nom de la catégorie doit contenir entre 2 et 60 caractères.' })
  name: string;
}

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
