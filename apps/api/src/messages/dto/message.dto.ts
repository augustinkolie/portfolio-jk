import { type ContactRequest, MessageStatus, PHONE_PATTERN } from '@btp/shared';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/pagination.dto.js';
import { EmptyToNull, Trim } from '../../common/transforms.js';

export class CreateContactMessageDto implements ContactRequest {
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
  @MaxLength(80)
  projectType?: string;

  @IsOptional()
  @EmptyToNull()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @MaxLength(120)
  location?: string;

  @Trim()
  @IsString()
  @Length(10, 5000, { message: 'Décrivez votre projet en quelques phrases (10 à 5 000 caractères).' })
  message: string;

  /** Champ piège : invisible pour un humain, rempli par les robots. */
  @IsOptional()
  @IsString()
  @MaxLength(500)
  website?: string;
}

export class MessagesQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(Object.values(MessageStatus))
  status?: MessageStatus;
}

export class UpdateMessageDto {
  @IsIn(Object.values(MessageStatus), { message: 'Statut inconnu (NEW, READ ou HANDLED).' })
  status: MessageStatus;
}
