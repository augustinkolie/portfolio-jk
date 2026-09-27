import { type KeyFigure, PHONE_PATTERN, type ProfileInput, type SiteSettingsInput } from '@btp/shared';
import { applyDecorators } from '@nestjs/common';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEmail,
  IsNumber,
  IsString,
  IsUrl,
  Length,
  Matches,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Trim } from '../../common/transforms.js';

/** Adresse web facultative : chaîne vide autorisée, sinon URL complète. */
const OptionalUrl = () =>
  applyDecorators(
    Trim(),
    IsString(),
    ValidateIf((_, v) => v !== ''),
    IsUrl(
      { protocols: ['https', 'http'], require_protocol: true },
      { message: 'Adresse web invalide : elle doit commencer par https://.' },
    ),
  );

/** Téléphone facultatif : chaîne vide autorisée, sinon format guinéen ou international. */
const OptionalPhone = (label: string) =>
  applyDecorators(
    Trim(),
    IsString(),
    ValidateIf((_, v) => v !== ''),
    Matches(PHONE_PATTERN, { message: `${label} non reconnu. Exemple : +224 622 12 34 56.` }),
  );

class CompanyDto {
  @Trim()
  @IsString()
  @Length(2, 120, { message: "Le nom de l'entreprise est obligatoire." })
  name: string;

  @Trim()
  @IsString()
  @MaxLength(200, { message: 'La phrase de positionnement ne peut pas dépasser 200 caractères.' })
  tagline: string;

  @Trim()
  @IsString()
  @MaxLength(3000, { message: 'Le texte de présentation ne peut pas dépasser 3 000 caractères.' })
  description: string;
}

class KeyFigureDto implements KeyFigure {
  @Type(() => Number)
  @IsNumber({}, { message: 'Chaque chiffre clé doit avoir une valeur numérique.' })
  @Min(0)
  value: number;

  /** « ans », « m² », « km »… */
  @Trim()
  @IsString()
  @MaxLength(12)
  unit: string;

  @Trim()
  @IsString()
  @Length(2, 60, { message: 'Chaque chiffre clé doit avoir un libellé (ex. « projets livrés »).' })
  label: string;
}

class ContactDto {
  @OptionalPhone('Numéro de téléphone')
  phone: string;

  @OptionalPhone('Numéro WhatsApp')
  whatsapp: string;

  @Trim()
  @IsString()
  @ValidateIf((_, v) => v !== '')
  @IsEmail({}, { message: "L'adresse email n'est pas valide." })
  email: string;

  @Trim()
  @IsString()
  @MaxLength(300)
  address: string;

  @Trim()
  @IsString()
  @MaxLength(200)
  hours: string;

  @OptionalUrl()
  mapUrl: string;
}

class SocialDto {
  @OptionalUrl()
  facebook: string;

  @OptionalUrl()
  linkedin: string;

  @OptionalUrl()
  instagram: string;

  @OptionalUrl()
  youtube: string;
}

class ProfileDto implements ProfileInput {
  @Trim()
  @IsString()
  @MaxLength(80, { message: 'La fonction ne peut pas dépasser 80 caractères.' })
  role: string;

  @Trim()
  @IsString()
  @MaxLength(1500, { message: 'La présentation ne peut pas dépasser 1 500 caractères.' })
  bio: string;

  /** Identifiant d'un média envoyé via /admin/media, ou null pour retirer la photo. */
  @ValidateIf((_, v) => v !== null && v !== '')
  @IsString()
  photoId: string | null;
}

export class UpdateSettingsDto implements SiteSettingsInput {
  @ValidateNested()
  @Type(() => CompanyDto)
  company: CompanyDto;

  @IsArray()
  @ArrayMaxSize(4, { message: "L'accueil affiche 4 chiffres clés au plus." })
  @ValidateNested({ each: true })
  @Type(() => KeyFigureDto)
  keyFigures: KeyFigureDto[];

  @ValidateNested()
  @Type(() => ContactDto)
  contact: ContactDto;

  @ValidateNested()
  @Type(() => SocialDto)
  social: SocialDto;

  @ValidateNested()
  @Type(() => ProfileDto)
  profile: ProfileDto;
}
