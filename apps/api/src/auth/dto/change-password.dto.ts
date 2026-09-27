import type { ChangePasswordRequest } from '@btp/shared';
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '@btp/shared';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class ChangePasswordDto implements ChangePasswordRequest {
  @IsString({ message: 'Le mot de passe actuel est obligatoire.' })
  @MinLength(1, { message: 'Le mot de passe actuel est obligatoire.' })
  @MaxLength(PASSWORD_MAX_LENGTH)
  currentPassword: string;

  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH, {
    message: `Le nouveau mot de passe doit contenir au moins ${PASSWORD_MIN_LENGTH} caractères.`,
  })
  @MaxLength(PASSWORD_MAX_LENGTH, {
    message: `Le nouveau mot de passe ne peut pas dépasser ${PASSWORD_MAX_LENGTH} caractères.`,
  })
  newPassword: string;
}
