import { ArrayMaxSize, ArrayMinSize, ArrayUnique, IsArray, IsString } from 'class-validator';

/** Nouvel ordre d'affichage : la position dans le tableau devient la valeur de `order`. */
export class ReorderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @ArrayUnique()
  @IsString({ each: true })
  ids: string[];
}
